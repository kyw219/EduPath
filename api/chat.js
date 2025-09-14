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
          description: "用户当前的专业背景"
        },
        target_field: {
          type: "string", 
          description: "用户想申请的目标专业"
        },
        additional_info: {
          type: "string",
          description: "用户提供的其他相关信息(GPA、经验、偏好等)"
        },
        has_basic_info: {
          type: "boolean",
          description: "是否包含专业和目标专业两个基础信息"
        }
      },
      required: ["current_major", "target_field", "has_basic_info"]
    };

    // 构建提示词
    const systemPrompt = `你是EduPath AI助手。从用户对话中提取信息，判断是否有足够的基础信息开始分析。

基础信息要求：
1. 当前专业背景
2. 目标申请专业

如果缺少基础信息，生成友好的追问。
如果有基础信息，准备开始分析。

请提取信息并返回JSON格式。`;

    // 调用OpenAI进行信息提取
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      aiReply = `好的！正在基于你的信息分析最适合的项目，请稍等...

🔄 正在分析你的学术背景...
🔄 匹配最适合的学校和项目...
🔄 生成个性化申请时间线...`;
    } else {
      // 生成追问
      const followUpCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: "生成友好的追问，询问缺失的基础信息（当前专业或目标专业）。保持简洁友好。"
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
