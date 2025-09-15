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
          description: "Whether specialized questions for the target field should be asked"
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
        ready_to_analyze: {
          type: "boolean",
          description: "Whether user wants to proceed with analysis (said 'analyze', 'start', 'go', etc.)"
        }
      },
      required: ["current_major", "target_field", "gpa_score", "preferred_countries", "language_test", "has_sufficient_info", "missing_info", "needs_specialized_questions", "ready_to_analyze"]
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
- Set needs_specialized_questions = true if basic info is complete and target field matches major fields
- Set specialized_field to the detected field (cs, business, engineering, medicine, sciences, public_health, arts, social_sciences, education, law)
- Extract any specialized answers provided in specialized_answers object
- Set ready_to_analyze = true if user explicitly wants to start analysis (says "analyze", "start", "go", etc.)

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
            "What's your GRE General score? (e.g., 329, 318, or planning to take)",
            "Which programming languages are you proficient in? (Python, Java, C++, JavaScript, etc.)",
            "What CS area interests you most? (AI/ML, Software Engineering, Data Science, Cybersecurity, HCI)",
            "Do you have any programming projects, internships, or research experience?",
            "Have you taken advanced math courses? (Linear Algebra, Statistics, Discrete Math)"
          ]
        },
        business: {
          title: "Business Specialization Questions", 
          questions: [
            "What's your GMAT or GRE score? (e.g., GMAT 720, GRE 325, or planning to take)",
            "How many years of work experience do you have? (0-2, 3-5, 5+ years)",
            "What's your career goal? (Consulting, Finance, Tech, Entrepreneurship, Management)",
            "Do you have leadership, management, or team project experience?",
            "Have you taken business courses? (Finance, Marketing, Operations, Strategy)"
          ]
        },
        engineering: {
          title: "Engineering Specialization Questions",
          questions: [
            "What's your GRE General score? (e.g., 328, 324, or planning to take)", 
            "Which engineering field interests you? (Mechanical, Chemical, Civil, Biomedical, Electrical)",
            "Have you completed Calculus I-III, Linear Algebra, and Physics courses?",
            "Do you have laboratory or hands-on engineering project experience?",
            "Are you familiar with engineering software? (CAD, MATLAB, Python, Simulink)"
          ]
        },
        medicine: {
          title: "Medicine Specialization Questions",
          questions: [
            "What's your MCAT score? (e.g., 515, 520, or planning to take)",
            "Do you have clinical experience? (Hospital volunteering, shadowing, internships)", 
            "Do you have medical research experience or publications?",
            "Have you completed pre-med requirements? (Biology, Chemistry, Physics, Organic Chemistry)",
            "Which medical field interests you? (Internal Medicine, Surgery, Pediatrics, Psychiatry, Research)"
          ]
        },
        sciences: {
          title: "Sciences Specialization Questions",
          questions: [
            "What's your GRE General score? (e.g., 314, 318, or planning to take)",
            "Which science field interests you? (Chemistry, Biology, Physics, Mathematics)",
            "Do you have research experience or publications?", 
            "Do you have laboratory skills or wet lab experience?",
            "Have you completed advanced math courses? (Calculus, Statistics, Linear Algebra)"
          ]
        },
        public_health: {
          title: "Public Health Specialization Questions",
          questions: [
            "What's your GRE General score? (e.g., 310, 315, or planning to take)",
            "Have you taken statistics or research methods courses?",
            "Do you have healthcare, NGO, or community service experience?",
            "Which public health area interests you? (Epidemiology, Health Policy, Global Health, Biostatistics)", 
            "What's your undergraduate background? (Biology, Psychology, Social Sciences, Pre-med)"
          ]
        },
        arts: {
          title: "Arts & Humanities Specialization Questions",
          questions: [
            "What's your GRE General score? (e.g., 310, 315, or planning to take)",
            "Do you have a portfolio, writing samples, or creative works?",
            "Do you speak multiple languages or have cultural studies background?",
            "Which area interests you? (Literature, History, Philosophy, Art History, Cultural Studies)",
            "Do you have research, thesis, or academic writing experience?"
          ]
        },
        social_sciences: {
          title: "Social Sciences Specialization Questions", 
          questions: [
            "What's your GRE General score? (e.g., 315, 320, or planning to take)",
            "Have you taken statistics, research methods, or data analysis courses?",
            "Do you have fieldwork, survey, or community research experience?",
            "Which area interests you? (Psychology, Sociology, Political Science, Anthropology, Economics)",
            "Are you comfortable with quantitative analysis? (SPSS, R, Python for data analysis)"
          ]
        },
        education: {
          title: "Education Specialization Questions",
          questions: [
            "What's your GRE General score? (e.g., 300, 310, or planning to take)",
            "Do you have teaching, tutoring, or training experience?",
            "Which education area interests you? (Curriculum Design, Educational Psychology, Administration, Special Education)",
            "Which age group do you prefer? (Early Childhood, K-12, Higher Education, Adult Learning)",
            "Have you taken education courses? (Child Development, Learning Theory, Classroom Management)"
          ]
        },
        law: {
          title: "Law Specialization Questions",
          questions: [
            "What's your LSAT score? (e.g., 165, 170, or planning to take)",
            "Do you have legal experience? (Internships, paralegal work, legal research)",
            "Which law area interests you? (Corporate Law, Criminal Law, International Law, Human Rights)",
            "Do you have strong writing or debate experience?",
            "What's your undergraduate major? (Any field is acceptable for law school)"
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
    } else if (extractedData.has_sufficient_info && extractedData.needs_specialized_questions && !extractedData.ready_to_analyze) {
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
    } else if (extractedData.has_sufficient_info) {
      // 准备开始分析或已有专业信息
      const hasSpecializedInfo = extractedData.specialized_answers && 
        Object.values(extractedData.specialized_answers).some(val => val && val.trim() !== '');
      
      if (hasSpecializedInfo) {
        aiReply = `Excellent! I can analyze with what we have!
If you provide additional details later, I can always update your analysis for better matches! 🚀`;
      } else {
        aiReply = `Perfect! Starting analysis... 🔄`;
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
      shouldAnalyze: extractedData.has_sufficient_info && (extractedData.ready_to_analyze || !extractedData.needs_specialized_questions)
    });

  } catch (error) {
    console.error('❌ Chat API错误:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
