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

    // 简化的信息提取JSON Schema
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
          description: "TOEFL/IELTS score or status (e.g., 'TOEFL 100', 'IELTS 7.5', or empty string if not mentioned)"
        },
        additional_info: {
          type: "string",
          description: "Any other relevant information (GRE/GMAT/LSAT scores, work experience, projects, etc.)"
        },
        has_sufficient_info: {
          type: "boolean",
          description: "Whether there is enough information to provide school recommendations (at least major, target field, and GPA)"
        },
        needs_specialized_questions: {
          type: "boolean",
          description: "Always set to false - we skip specialized questions"
        },
        is_responding_to_specialized: {
          type: "boolean",
          description: "Always set to false"
        },
        ready_to_analyze: {
          type: "boolean", 
          description: "Set to true if has_sufficient_info is true"
        },
        should_reanalyze: {
          type: "boolean",
          description: "Whether new information was provided that would change previous recommendations"
        },
        missing_info: {
          type: "array",
          items: { type: "string" },
          description: "List of important missing information that would improve recommendations"
        }
      },
      required: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test", "additional_info", "has_sufficient_info", "needs_specialized_questions", "is_responding_to_specialized", "ready_to_analyze", "should_reanalyze", "missing_info"]
    };

    // 智能信息提取提示词
    const systemPrompt = `You are EduPath AI assistant. Extract and update user information from conversation.

EXTRACT INFORMATION:
1. Current major/background → current_major
2. Target graduate program → target_field  
3. GPA/grades → gpa_score
4. Countries of interest → preferred_countries
5. Language test scores (TOEFL/IELTS) → language_test
6. Additional info (GRE/GMAT/LSAT, work experience, projects, research) → additional_info

DECISION LOGIC:
- Set has_sufficient_info = true if you have at least: current_major, target_field, and gpa_score
- Set should_start_analysis = true if basic info is complete and user hasn't been analyzed yet
- Set should_reanalyze = true if user provided significant NEW information after previous analysis
- Set needs_specialized_questions = false (we skip specialized questions)
- Set is_responding_to_specialized = false
- Set ready_to_analyze = true if has_sufficient_info is true

EXAMPLES:
- User: "1. economics 2. mba 3. 3.9 4. 103 5. us" → has_sufficient_info: true, should_start_analysis: true
- User: "I also have GMAT 720" (after analysis) → should_reanalyze: true
- User: "My work experience is 3 years in consulting" → should_reanalyze: true

Always extract ALL information from conversation history, not just the latest message.

Return JSON format with all required fields.`;

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

    // 专业特定问题模板
    const getSpecializedQuestions = (field) => {
      const questionSets = {
        cs: {
          title: "CS Specialization Questions",
          questions: [
            "What's your GRE General score?",
            "Which programming languages are you proficient in?",
            "What CS area interests you most?",
            "Do you have any programming projects, internships, or research experience?",
            "Have you taken advanced math courses?"
          ]
        },
        business: {
          title: "Business Specialization Questions", 
          questions: [
            "What's your GMAT or GRE score?",
            "How many years of work experience do you have?",
            "What's your career goal?",
            "Do you have leadership, management, or team project experience?",
            "Have you taken business courses?"
          ]
        },
        engineering: {
          title: "Engineering Specialization Questions",
          questions: [
            "What's your GRE General score?", 
            "Which engineering field interests you?",
            "Have you completed Calculus I-III, Linear Algebra, and Physics courses?",
            "Do you have laboratory or hands-on engineering project experience?",
            "Are you familiar with engineering software?"
          ]
        },
        medicine: {
          title: "Medicine Specialization Questions",
          questions: [
            "What's your MCAT score?",
            "Do you have clinical experience?", 
            "Do you have medical research experience or publications?",
            "Have you completed pre-med requirements?",
            "Which medical field interests you?"
          ]
        },
        sciences: {
          title: "Sciences Specialization Questions",
          questions: [
            "What's your GRE General score?",
            "Which science field interests you?",
            "Do you have research experience or publications?", 
            "Do you have laboratory skills or wet lab experience?",
            "Have you completed advanced math courses?"
          ]
        },
        public_health: {
          title: "Public Health Specialization Questions",
          questions: [
            "What's your GRE General score?",
            "Have you taken statistics or research methods courses?",
            "Do you have healthcare, NGO, or community service experience?",
            "Which public health area interests you?", 
            "What's your undergraduate background?"
          ]
        },
        arts: {
          title: "Arts & Humanities Specialization Questions",
          questions: [
            "What's your GRE General score?",
            "Do you have a portfolio, writing samples, or creative works?",
            "Do you speak multiple languages or have cultural studies background?",
            "Which area interests you?",
            "Do you have research, thesis, or academic writing experience?"
          ]
        },
        social_sciences: {
          title: "Social Sciences Specialization Questions", 
          questions: [
            "What's your GRE General score?",
            "Have you taken statistics, research methods, or data analysis courses?",
            "Do you have fieldwork, survey, or community research experience?",
            "Which area interests you?",
            "Are you comfortable with quantitative analysis?"
          ]
        },
        education: {
          title: "Education Specialization Questions",
          questions: [
            "What's your GRE General score?",
            "Do you have teaching, tutoring, or training experience?",
            "Which education area interests you?",
            "Which age group do you prefer?",
            "Have you taken education courses?"
          ]
        },
        law: {
          title: "Law Specialization Questions",
          questions: [
            "What's your LSAT score?",
            "Do you have legal experience?",
            "Which law area interests you?",
            "Do you have strong writing or debate experience?",
            "What's your undergraduate major?"
          ]
        }
      };
      
      return questionSets[field] || null;
    };

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
      // 有足够信息，直接开始分析或重新分析
      if (extractedData.should_reanalyze) {
        aiReply = `Great! I've updated your profile with the new information. Let me re-analyze and find better matches for you... 🔄`;
      } else {
        // 显示当前信息并开始分析
        let profileSummary = `Perfect! I have your information:\n\n`;
        if (extractedData.current_major) profileSummary += `• Academic Background: ${extractedData.current_major}\n`;
        if (extractedData.target_field) profileSummary += `• Target Program: ${extractedData.target_field}\n`;
        if (extractedData.gpa_score) profileSummary += `• GPA: ${extractedData.gpa_score}\n`;
        if (extractedData.language_test) profileSummary += `• Language Score: ${extractedData.language_test}\n`;
        if (extractedData.preferred_countries && extractedData.preferred_countries.length > 0) {
          profileSummary += `• Preferred Countries: ${extractedData.preferred_countries.join(', ')}\n`;
        }
        if (extractedData.additional_info) profileSummary += `• Additional Info: ${extractedData.additional_info}\n`;
        
        profileSummary += `\nStarting analysis now... 🔄`;
        aiReply = profileSummary;
      }
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
      
      // 添加已有的其他信息（只显示已提供的信息）
      if (extractedData.gpa_score && extractedData.gpa_score.trim() !== '') {
        confirmation += `Your GPA is ${extractedData.gpa_score}. `;
      }
      if (extractedData.language_test && extractedData.language_test.trim() !== '') {
        confirmation += `Your language test score is ${extractedData.language_test}. `;
      }
      if (extractedData.preferred_countries && extractedData.preferred_countries.length > 0 && extractedData.preferred_countries[0] !== '') {
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
      shouldAnalyze: extractedData.has_sufficient_info,
      shouldReanalyze: extractedData.should_reanalyze || false
    });

  } catch (error) {
    console.error('❌ Chat API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
