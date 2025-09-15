import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages' });
    }

    // 定义信息提取的JSON Schema
    const extractionSchema = {
      type: "object",
      properties: {
        current_major: {
          type: "string",
          description: "User's current major/academic background"
        },
        target_field: {
          type: "string", 
          description: "User's target graduate program field"
        },
        gpa_score: {
          type: "string",
          description: "User's GPA or average grade (e.g., 3.5/4.0, 85/100, or 'not provided')"
        },
        preferred_countries: {
          type: "array",
          items: { type: "string" },
          description: "List of preferred countries/regions for study"
        },
        language_test: {
          type: "string",
          description: "TOEFL/IELTS score or status (e.g., 'TOEFL 100', 'IELTS 7.5', 'planning to take', 'not taken')"
        },
        additional_info: {
          type: "string",
          description: "Any other information provided by user"
        },
        has_sufficient_info: {
          type: "boolean",
          description: "Whether all 5 core pieces of information are provided (major, target field, GPA, countries, language)"
        },
        missing_info: {
          type: "array",
          items: { type: "string" },
          description: "List of missing information categories"
        }
      },
      required: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test", "has_sufficient_info", "missing_info"]
    };

    // 构建提示词
    const systemPrompt = `You are EduPath AI assistant. Extract information from user conversation and determine if there's enough information to start analysis.

Required information for analysis:
1. Current major/background
2. Target graduate program field
3. GPA or average grade
4. Preferred countries/regions
5. Language test status (TOEFL/IELTS score or plan)

Set has_sufficient_info to true only if ALL 5 pieces of information are provided.
List any missing categories in missing_info array.

Please extract information and return in JSON format.`;

    // 调用OpenAI进行信息提取
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "user_info_extraction",
          schema: extractionSchema
        }
      }
    });

    const extractedData = JSON.parse(completion.choices[0].message.content);

    // 生成AI回复
    let aiReply;
    
    // 如果是第一条消息，显示欢迎信息
    if (messages.length === 1 && messages[0].role === 'user') {
      aiReply = `Hi! Welcome to EduPath AI! 👋

I need these details to recommend the best schools for you:

1. What's your current major/background?
2. What graduate program are you targeting?
3. What's your GPA or average grade?
4. Do you have TOEFL/IELTS scores?
5. Which countries interest you for studying?

The more detailed your information, the more precise my recommendations will be 🎯

Please share all this information at once!`;
    } else if (extractedData.has_sufficient_info) {
      // 构建信息确认
      let confirmation = "Perfect! I have all the information I need:\n";
      if (extractedData.current_major) confirmation += `- Current major: ${extractedData.current_major}\n`;
      if (extractedData.target_field) confirmation += `- Target program: ${extractedData.target_field}\n`;
      if (extractedData.gpa_score) confirmation += `- GPA: ${extractedData.gpa_score}\n`;
      if (extractedData.language_test) confirmation += `- Language test: ${extractedData.language_test}\n`;
      if (extractedData.preferred_countries && extractedData.preferred_countries.length > 0) {
        confirmation += `- Preferred countries: ${extractedData.preferred_countries.join(', ')}\n`;
      }
      
      aiReply = confirmation + "\nNow starting to analyze schools suitable for you.";
    } else {
      // 构建已获得信息的确认
      let confirmation = "";
      if (extractedData.current_major && extractedData.target_field) {
        confirmation = `Got it! Your current major is ${extractedData.current_major} and you're targeting ${extractedData.target_field} programs.\n\n`;
      } else if (extractedData.current_major) {
        confirmation = `Got it! Your current major is ${extractedData.current_major}.\n\n`;
      } else if (extractedData.target_field) {
        confirmation = `Got it! You're targeting ${extractedData.target_field} programs.\n\n`;
      }
      
      // 添加已有的其他信息
      if (extractedData.gpa_score) {
        confirmation += `Your GPA is ${extractedData.gpa_score}. `;
      }
      if (extractedData.language_test) {
        confirmation += `Your language test score is ${extractedData.language_test}. `;
      }
      if (extractedData.preferred_countries && extractedData.preferred_countries.length > 0) {
        confirmation += `You're interested in studying in ${extractedData.preferred_countries.join(', ')}. `;
      }
      if (confirmation.includes('Your GPA') || confirmation.includes('Your language') || confirmation.includes('You\'re interested')) {
        confirmation += "\n\n";
      }
      
      // 智能追问缺失信息
      const missing = extractedData.missing_info || [];
      let followUp = "I still need a few more details:\n\n";
      let questionNumber = 1;
      
      if (missing.includes('current_major')) {
        followUp += `${questionNumber}. What's your current major/background?\n`;
        questionNumber++;
      }
      if (missing.includes('target_field')) {
        followUp += `${questionNumber}. What graduate program are you targeting?\n`;
        questionNumber++;
      }
      if (missing.includes('gpa_score')) {
        followUp += `${questionNumber}. What's your GPA or average grade?\n`;
        questionNumber++;
      }
      if (missing.includes('language_test')) {
        followUp += `${questionNumber}. Do you have TOEFL/IELTS scores?\n`;
        questionNumber++;
      }
      if (missing.includes('preferred_countries')) {
        followUp += `${questionNumber}. Which countries interest you for studying?\n`;
        questionNumber++;
      }
      
      followUp += "\nOnce I have these details, I can give you perfect recommendations! 😊";
      
      aiReply = confirmation + followUp;
    }

    res.status(200).json({
      reply: aiReply,
      extractedProfile: extractedData,
      hasBasicInfo: extractedData.has_sufficient_info,
      shouldAnalyze: extractedData.has_sufficient_info
    });

  } catch (error) {
    console.error('❌ Chat API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
