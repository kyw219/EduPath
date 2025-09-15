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
          description: "Any other information provided by user"
        },
        has_sufficient_info: {
          type: "boolean",
          description: "Whether all 5 core pieces of information are provided (major, target field, GPA, countries, language)"
        },
        missing_info: {
          type: "array",
          items: { 
            type: "string",
            enum: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test"]
          },
          description: "Array of missing field names from: current_major, target_field, gpa_score, preferred_countries, language_test"
        },
        needs_specialized_questions: {
          type: "boolean",
          description: "Whether specialized questions for the target field should be asked (only true if basic info is complete and no specialized info has been provided yet)"
        },
        specialized_field: {
          type: "string",
          description: "The specific field for specialized questions (cs, business, engineering, medicine, etc.)"
        },
        specialized_answers: {
          type: "object",
          description: "Answers to field-specific questions",
          properties: {
            test_score: { type: "string", description: "GRE/GMAT/MCAT/LSAT score" },
            specialization: { type: "string", description: "Specific area of interest within the field" },
            experience: { type: "string", description: "Relevant experience or projects" },
            coursework: { type: "string", description: "Relevant courses or academic preparation" },
            skills: { type: "string", description: "Technical skills or tools" }
          }
        },
        is_responding_to_specialized: {
          type: "boolean", 
          description: "Whether user is responding to specialized questions (any response after specialized questions were asked)"
        },
        ready_to_analyze: {
          type: "boolean",
          description: "Whether user wants to proceed with analysis (said 'analyze', 'start', 'go', etc.)"
        }
      },
      required: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test", "has_sufficient_info", "missing_info", "needs_specialized_questions", "is_responding_to_specialized", "ready_to_analyze"]
    };

    // 构建提示词
    const systemPrompt = `You are EduPath AI assistant. Extract information from user conversation and determine analysis readiness.

BASIC REQUIRED INFORMATION (must have all 5):
1. Current major/background (field: current_major)
2. Target graduate program field (field: target_field)  
3. GPA or average grade (field: gpa_score)
4. Preferred countries/regions (field: preferred_countries)
5. Language test status (field: language_test)

SPECIALIZED QUESTIONS (optional, field-specific):
- Computer Science: GRE score, programming languages, CS specialization, projects, math courses
- Business: GMAT/GRE score, work experience, career goals, leadership experience, business courses
- Engineering: GRE score, engineering branch, math/physics courses, lab experience, software tools
- Medicine: MCAT score, clinical experience, research experience, pre-med courses, medical specialization
- Sciences: GRE score, science specialization, research experience, lab skills, math background
- Public Health: GRE score, statistics courses, field experience, PH specialization, undergraduate background
- Arts & Humanities: GRE score, portfolio/writing samples, languages, specialization, research experience
- Social Sciences: GRE score, research methods, fieldwork experience, specialization, quantitative skills
- Education: GRE score, teaching experience, education specialization, age group preference, education courses
- Law: LSAT score, legal experience, law specialization, writing experience, undergraduate background

LOGIC:
- Set has_sufficient_info = true only if ALL 5 basic pieces are provided
- Set needs_specialized_questions = true if: basic info is complete AND target field matches any major field (cs, business, engineering, medicine, sciences, public_health, arts, social_sciences, education, law) AND no specialized questions have been asked yet
- Set specialized_field to the detected field, mapping user input to standard fields:
  * "computer science", "cs", "software engineering", "data science" → "cs"
  * "business", "mba", "business administration", "management" → "business"  
  * "engineering", "mechanical engineering", "electrical engineering", etc. → "engineering"
  * "medicine", "medical", "pre-med", "healthcare" → "medicine"
  * "biology", "chemistry", "physics", "mathematics" → "sciences"
  * "public health", "epidemiology", "health policy" → "public_health"
  * "literature", "history", "philosophy", "art" → "arts"
  * "psychology", "sociology", "political science" → "social_sciences"
  * "education", "teaching", "pedagogy" → "education"
  * "law", "legal studies", "jurisprudence" → "law"
- Extract any specialized answers provided in specialized_answers object
- Set is_responding_to_specialized = true if user is responding after specialized questions were shown (any message that provides specialized info or says they want to skip/proceed)
- Set ready_to_analyze = true ONLY if: (user explicitly wants to start analysis AND has answered at least one specialized question) OR user says they want to skip specialized questions

IMPORTANT: 
- Use empty string "" for missing information
- For missing_info array, use exact field names: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test"]

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
    } else if (extractedData.has_sufficient_info && extractedData.needs_specialized_questions) {
      // 基础信息完整，触发专业特定问题
      const specializedQuestions = getSpecializedQuestions(extractedData.specialized_field);
      
      if (specializedQuestions) {
        const questionsList = specializedQuestions.questions
          .map((q, i) => `${i + 1}. ${q}`)
          .join('\n');
          
        aiReply = `Excellent! I have your basic information.

I'd love to know a bit more about your ${extractedData.target_field} background:

🎯 ${specializedQuestions.title} (optional):
${questionsList}

You can answer as many or as few as you'd like.
If you provide additional details later, I can always update your analysis for better matches! 🚀`;
      } else {
        aiReply = `Perfect! I have all the essential information. Starting analysis now... 🔄`;
      }
    } else if (extractedData.has_sufficient_info && extractedData.ready_to_analyze && extractedData.is_responding_to_specialized) {
      // 用户明确要求分析且已回答专业问题
      aiReply = `Perfect! Starting analysis... 🔄`;
    } else if (extractedData.has_sufficient_info && extractedData.is_responding_to_specialized && !extractedData.ready_to_analyze) {
      // 用户回答了专业问题但没有明确要求分析
      aiReply = `Excellent! Thank you for providing those additional details about your ${extractedData.target_field} background.

I now have a comprehensive understanding of your profile:
• Academic Background: ${extractedData.current_major}
• Target Program: ${extractedData.target_field}
• GPA: ${extractedData.gpa_score}
• Language Score: ${extractedData.language_test}
• Preferred Countries: ${extractedData.preferred_countries?.join(', ')}

With this information, I can provide you with highly personalized school recommendations and create a detailed application timeline.

When you're ready to see your analysis results, just say "start analysis" or "analyze"! 🚀`;
    } else if (extractedData.has_sufficient_info && !extractedData.needs_specialized_questions && !extractedData.ready_to_analyze) {
      // 用户提供了基本信息，但专业不需要特殊问题，且没有明确要求分析
      aiReply = `Perfect! I have all the essential information I need:

• Academic Background: ${extractedData.current_major}
• Target Program: ${extractedData.target_field}
• GPA: ${extractedData.gpa_score}
• Language Score: ${extractedData.language_test}
• Preferred Countries: ${extractedData.preferred_countries?.join(', ')}

I'm ready to analyze 50+ programs and create your personalized recommendations!

Just say "start analysis" or "analyze" when you're ready! 🎯`;
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
      shouldAnalyze: extractedData.has_sufficient_info && (
        (extractedData.ready_to_analyze && extractedData.is_responding_to_specialized) || 
        !extractedData.needs_specialized_questions
      )
    });

  } catch (error) {
    console.error('❌ Chat API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
