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

    // 简化的信息提取Schema
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
          description: "User's GPA or average grade (e.g., 3.5/4.0, 85/100, or empty string if not provided)"
        },
        preferred_countries: {
          type: "array",
          items: { type: "string" },
          description: "List of preferred countries/regions for study"
        },
        language_test: {
          type: "string",
          description: "TOEFL/IELTS score or status (e.g., 'TOEFL 100', 'IELTS 7.5', 'planning to take', or empty string if not mentioned)"
        },
        additional_info: {
          type: "string",
          description: "Any other relevant information like GRE scores, work experience, projects, etc."
        },
        has_enough_info: {
          type: "boolean",
          description: "Whether there is enough information to start analysis (at least major, target field, and one of: GPA, language test, or countries)"
        },
        should_reanalyze: {
          type: "boolean",
          description: "Whether user provided new information that requires reanalysis (user said they have additional info like GRE scores, new experiences, etc.)"
        }
      },
      required: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test", "additional_info", "has_enough_info", "should_reanalyze"]
    };

    // 简化的提示词
    const systemPrompt = `You are EduPath AI assistant. Extract information from user conversation and determine if analysis can start.

INFORMATION TO EXTRACT:
1. Current major/background 
2. Target graduate program field
3. GPA or average grade
4. Preferred countries/regions for study
5. Language test status (TOEFL/IELTS)
6. Additional information (GRE/GMAT scores, work experience, projects, etc.)

DECISION LOGIC:
- Set has_enough_info = true if user provided at least: major + target field + (GPA OR language test OR countries)
- Set should_reanalyze = true if user mentions having additional information or updates to their profile

SIMPLE RULES:
- If user says "I have GPA 3.5, want to study CS in US" → has_enough_info = true
- If user later says "I also have GRE 320" → should_reanalyze = true
- Use empty string "" for missing information
- Be flexible with information extraction - users may provide info in any format

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
    console.log('🔍 GPT提取的数据:', JSON.stringify(extractedData, null, 2));

    // 生成AI回复 - 极简版本
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
    } else if (extractedData.has_enough_info && !extractedData.should_reanalyze) {
      // 有足够信息，直接开始分析
      aiReply = `Perfect! I have enough information to analyze your profile. Starting analysis now... 🔄`;
    } else if (extractedData.should_reanalyze) {
      // 用户提供了新信息，需要重新分析
      aiReply = `Got your additional information! Updating your analysis... 🔄`;
    } else {
      // 信息不足，智能追问
      const missing = [];
      if (!extractedData.current_major || extractedData.current_major.trim() === '') missing.push('current major');
      if (!extractedData.target_field || extractedData.target_field.trim() === '') missing.push('target program');
      if (!extractedData.gpa_score || extractedData.gpa_score.trim() === '') missing.push('GPA');
      if (!extractedData.language_test || extractedData.language_test.trim() === '') missing.push('language test score');
      if (!extractedData.preferred_countries || extractedData.preferred_countries.length === 0) missing.push('preferred countries');

      let confirmation = "";
      if (extractedData.current_major && extractedData.current_major.trim() !== '') {
        confirmation += `✓ Current major: ${extractedData.current_major}\n`;
      }
      if (extractedData.target_field && extractedData.target_field.trim() !== '') {
        confirmation += `✓ Target program: ${extractedData.target_field}\n`;
      }
      if (extractedData.gpa_score && extractedData.gpa_score.trim() !== '') {
        confirmation += `✓ GPA: ${extractedData.gpa_score}\n`;
      }
      if (extractedData.language_test && extractedData.language_test.trim() !== '') {
        confirmation += `✓ Language test: ${extractedData.language_test}\n`;
      }
      if (extractedData.preferred_countries && extractedData.preferred_countries.length > 0) {
        confirmation += `✓ Preferred countries: ${extractedData.preferred_countries.join(', ')}\n`;
      }

      if (confirmation) {
        confirmation = "Got it! Here's what I have:\n\n" + confirmation + "\n";
      }

      aiReply = confirmation + `I still need: ${missing.join(', ')}\n\nOnce I have these details, I can give you perfect recommendations! 😊`;
    }

    res.status(200).json({
      reply: aiReply,
      extractedProfile: extractedData,
      hasBasicInfo: extractedData.has_enough_info,
      shouldAnalyze: extractedData.has_enough_info || extractedData.should_reanalyze
    });

  } catch (error) {
    console.error('❌ Chat API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}