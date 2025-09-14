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
        additional_info: {
          type: "string",
          description: "Additional information provided by user (GPA, experience, preferences, etc.)"
        },
        has_basic_info: {
          type: "boolean",
          description: "Whether both current major and target field are provided"
        }
      },
      required: ["current_major", "target_field", "has_basic_info"]
    };

    // 构建提示词
    const systemPrompt = `You are EduPath AI assistant. Extract information from user conversation and determine if there's enough basic information to start analysis.

Required basic information:
1. Current major/background
2. Target graduate program

If missing basic information, generate friendly follow-up questions.
If basic information is complete, prepare to start analysis.

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
    if (extractedData.has_basic_info) {
      aiReply = `Great! Analyzing the best programs for you based on your information, please wait...

🔄 Analyzing your academic background...
🔄 Matching the most suitable schools and programs...
🔄 Generating personalized application timeline...`;
    } else {
      // 生成追问
      const followUpCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: "Generate a friendly follow-up question asking for missing basic information (current major or target program). Keep it concise and friendly."
          },
          ...messages
        ]
      });
      aiReply = followUpCompletion.choices[0].message.content;
    }

    res.status(200).json({
      reply: aiReply,
      extractedProfile: extractedData,
      hasBasicInfo: extractedData.has_basic_info,
      shouldAnalyze: extractedData.has_basic_info
    });

  } catch (error) {
    console.error('❌ Chat API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
