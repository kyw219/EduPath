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
      aiReply = `Hello! I'm here to help you find the perfect graduate programs. 🎓

Please tell me about:

🎓 **Your Background:**
• Current major/field of study
• GPA or average grade

🎯 **Your Goals:**  
• Target graduate field
• Preferred countries (US, UK, Canada, etc.)

📝 **Language Tests:**
• TOEFL/IELTS score (or if you plan to take one)

Share all these details in your next message, and I'll find the best programs for you! ✨`;
    } else if (extractedData.has_sufficient_info) {
      aiReply = `Perfect! I have all the information I need. Analyzing the best programs for you...

🔄 Analyzing your academic background...
🔄 Matching the most suitable schools and programs...
🔄 Generating personalized application timeline...`;
    } else {
      // 智能追问缺失信息
      const missing = extractedData.missing_info || [];
      aiReply = "Thanks for the information! I just need a few more details:\n\n";
      
      if (missing.includes('current_major')) {
        aiReply += "🎓 What's your current major/field of study?\n";
      }
      if (missing.includes('target_field')) {
        aiReply += "🎯 Which field do you want to study in graduate school?\n";
      }
      if (missing.includes('gpa_score')) {
        aiReply += "📊 What's your GPA or average grade?\n";
      }
      if (missing.includes('preferred_countries')) {
        aiReply += "🌍 Which countries interest you for studying?\n";
      }
      if (missing.includes('language_test')) {
        aiReply += "📝 Do you have TOEFL/IELTS scores or plan to take one?\n";
      }
      
      aiReply += "\nOnce I have these details, I can give you perfect recommendations! 😊";
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
