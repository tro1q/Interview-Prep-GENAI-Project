const Groq = require("groq-sdk");
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

// GROQ API configuration
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Rate limiter for GROQ API (30 requests per minute limit)
class RateLimiter {
    constructor(maxRequests = 30, timeWindow = 60000) { // 30 requests per 60 seconds
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requestTimestamps = [];
    }

    async waitIfNeeded() {
        const now = Date.now();
        // Remove timestamps older than the time window
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < this.timeWindow
        );

        if (this.requestTimestamps.length >= this.maxRequests) {
            // Calculate how long to wait
            const oldestRequest = this.requestTimestamps[0];
            const waitTime = this.timeWindow - (now - oldestRequest) + 100; // +100ms buffer
            
            console.log(`⏳ Rate limit approaching (${this.requestTimestamps.length}/${this.maxRequests}). Waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            return this.waitIfNeeded(); // Recursive check after waiting
        }

        this.requestTimestamps.push(now);
        console.log(`📊 Request ${this.requestTimestamps.length}/${this.maxRequests} in current minute`);
    }
}

const rateLimiter = new RateLimiter(15, 60000); // 15 requests per minute

// Generate dynamic interview questions based on extracted keywords
function generateDynamicQuestions(jobDescription, skillGaps, selectedSkillGaps) {
    const lines = jobDescription.split('\n').filter(l => l.trim());
    
    // Extract key responsibilities/requirements from job description
    const keyPhrases = [];
    lines.forEach(line => {
        if (line.toLowerCase().includes('responsible') || 
            line.toLowerCase().includes('require') || 
            line.toLowerCase().includes('must') ||
            line.toLowerCase().includes('should')) {
            keyPhrases.push(line.substring(0, 100));
        }
    });

    // Generate custom technical questions based on job description
    const customTechQuestions = [];
    
    if (keyPhrases.length > 0) {
        customTechQuestions.push({
            question: `Describe how you would handle the main responsibilities mentioned in this job description`,
            intention: "Assess understanding of core job requirements",
            answer: `Reference specific responsibilities: ${keyPhrases.slice(0, 2).join('; ')}. Explain your approach, experience, and specific examples.`
        });
    }
    
    // Add skill-specific questions
    if (selectedSkillGaps.length > 0) {
        customTechQuestions.push({
            question: `How would you develop proficiency in ${selectedSkillGaps.map(s => s.skill).slice(0, 2).join(' and ')}?`,
            intention: "Test problem-solving and learning ability",
            answer: "Describe your approach to learning: resources, practice methods, timeline, and how you'd apply knowledge."
        });
    }

    return customTechQuestions;
}

// Generate dynamic preparation plan based on job description
function generateDynamicPreparationPlan(jobTitle, skillGaps, selectedSkillGaps) {
    const focusAreas = Array.from(skillGaps).slice(0, 3);
    const topSkillGaps = selectedSkillGaps.map(s => s.skill).slice(0, 2);
    
    return [
        {
            day: 1,
            focus: `Understand Role & Master Critical Skills: ${jobTitle.substring(0, 40)}`,
            tasks: [
                `Deep dive: Re-read job description and identify 3-5 core competencies`,
                `Study these key areas: ${topSkillGaps.join(', ') || 'role-specific requirements'}`,
                `Find resources: courses, articles, documentation specific to this role`,
                `Create a personalized learning timeline with milestones`
            ]
        },
        {
            day: 2,
            focus: `Hands-On Practice & Build Experience`,
            tasks: [
                `Complete practical exercises or small projects relevant to the job`,
                `Simulate real-world scenarios specific to this role`,
                `Document what you learn and challenges you overcome`,
                `Prepare 2-3 examples of successfully applying these skills`
            ]
        },
        {
            day: 3,
            focus: `Mock Interviews & Refinement`,
            tasks: [
                `Practice answering technical questions about your skill gaps`,
                `Prepare STAR method responses for behavioral questions`,
                `Record yourself answering questions and review`,
                `Get feedback from peers or mentors on your responses`
            ]
        }
    ];
}
function generateSmartMockData(jobDescription, resume = "", selfDescription = "") {
    // Extract the job title from description
    const jobTitle = jobDescription.split('\n')[0] || "Interview Preparation Plan";
    
    // Extract key topics/requirements from job description (top 3-5 lines)
    const jobLines = jobDescription.split('\n').filter(line => line.trim().length > 0);
    const keyRequirements = jobLines.slice(0, 5).join(' ');
    
    // Extract skills from text by looking for skill keywords
    function extractSkills(text) {
        const skillMap = {
            'react': ['react', 'reactjs', 'react.js'],
            'vue': ['vue', 'vuejs', 'vue.js'],
            'angular': ['angular', 'angularjs'],
            'javascript': ['javascript', 'js', 'node', 'nodejs'],
            'typescript': ['typescript', 'ts'],
            'python': ['python', 'py'],
            'java': ['java'],
            'csharp': ['c#', 'csharp', '.net'],
            'sql': ['sql', 'mysql', 'postgresql', 'database'],
            'mongodb': ['mongodb', 'nosql', 'mongo'],
            'docker': ['docker', 'container'],
            'kubernetes': ['kubernetes', 'k8s'],
            'aws': ['aws', 'amazon', 's3', 'ec2', 'lambda'],
            'gcp': ['gcp', 'google cloud', 'bigquery'],
            'clinical': ['clinical', 'patient', 'medical'],
            'hipaa': ['hipaa', 'compliance', 'privacy'],
            'marketing': ['marketing', 'brand', 'campaign', 'seo'],
            'sales': ['sales', 'business development', 'crm'],
            'finance': ['finance', 'accounting', 'budget'],
            'communication': ['communication', 'communication skills'],
            'leadership': ['leadership', 'leader', 'team lead'],
            'git': ['git', 'github', 'gitlab'],
            'security': ['security', 'guard', 'surveillance', 'patrol', 'night watch'],
            'emergency': ['emergency', 'crisis', 'incident', 'safety'],
            'customer_service': ['customer service', 'customer support', 'customer facing', 'hospitality'],
            'logistics': ['logistics', 'warehouse', 'inventory', 'supply chain'],
            'healthcare': ['healthcare', 'nursing', 'medical assistant', 'hospital'],
            'hr': ['hr', 'human resources', 'recruiting', 'hiring'],
            'operations': ['operations', 'operational', 'operational management']
        };
        
        const textLower = text.toLowerCase();
        const foundSkills = new Set();
        
        for (const [skill, keywords] of Object.entries(skillMap)) {
            if (keywords.some(kw => textLower.includes(kw))) {
                foundSkills.add(skill);
            }
        }
        
        return foundSkills;
    }

    // Get candidate's skills from resume + self description
    const candidateSkills = extractSkills(resume + " " + selfDescription);
    
    // Get required skills from job description
    const requiredSkills = extractSkills(jobDescription);
    
    // Find skill gaps (required but not have)
    const skillGaps = new Set([...requiredSkills].filter(s => !candidateSkills.has(s)));
    
    // Find matched skills (both have and required)
    const matchedSkills = new Set([...requiredSkills].filter(s => candidateSkills.has(s)));
    
    console.log(`👤 Candidate skills: ${Array.from(candidateSkills).join(', ') || 'none detected'}`);
    console.log(`📋 Required skills: ${Array.from(requiredSkills).join(', ') || 'none detected'}`);
    console.log(`❌ Missing skills: ${Array.from(skillGaps).join(', ') || 'none - perfect match!'}`);
    console.log(`✅ Matched skills: ${Array.from(matchedSkills).join(', ') || 'none'}`);

    // Question bank - focused on skills the candidate LACKS
    const questionsBySkill = {
        react: [
            { question: "How would you optimize React component rendering?", intention: "Test React performance knowledge", answer: "Discuss React.memo, useMemo, useCallback, and proper dependency arrays" },
            { question: "Explain React hooks and when to use them", intention: "Assess hooks knowledge", answer: "Cover useState, useEffect, useContext, custom hooks, and their lifecycle" }
        ],
        vue: [
            { question: "How do you manage state in Vue applications?", intention: "Test Vue state management", answer: "Discuss props, emits, provide/inject, Vuex, or Pinia patterns" }
        ],
        javascript: [
            { question: "Explain JavaScript closures and scope", intention: "Test JS fundamentals", answer: "Discuss lexical scope, function scope, block scope, and closure examples" },
            { question: "What's the difference between async/await and promises?", intention: "Assess async knowledge", answer: "Compare syntax, error handling, readability, and use cases" }
        ],
        typescript: [
            { question: "Why use TypeScript over JavaScript?", intention: "Test TypeScript knowledge", answer: "Discuss type safety, IDE support, compile-time errors, code maintainability" },
            { question: "How do you define complex types in TypeScript?", intention: "Assess type system knowledge", answer: "Cover interfaces, types, unions, generics, and type guards" }
        ],
        python: [
            { question: "Explain Python decorators and their use cases", intention: "Test Python advanced features", answer: "Discuss function wrapping, syntax, common decorators, and custom decorators" }
        ],
        sql: [
            { question: "How do you optimize SQL queries?", intention: "Test database optimization", answer: "Discuss indexes, query plans, joins, and avoiding N+1 queries" },
            { question: "What's the difference between INNER JOIN and LEFT JOIN?", intention: "Assess SQL knowledge", answer: "Explain join types, use cases, and performance considerations" }
        ],
        mongodb: [
            { question: "How do you design schemas in MongoDB?", intention: "Test NoSQL design", answer: "Discuss embedding vs referencing, denormalization, and indexing" }
        ],
        docker: [
            { question: "What are Docker images and containers?", intention: "Test Docker fundamentals", answer: "Explain layering, Dockerfile, image building, and container lifecycle" }
        ],
        kubernetes: [
            { question: "What are Kubernetes pods and deployments?", intention: "Test K8s fundamentals", answer: "Explain pod scheduling, deployments, replicas, and rolling updates" }
        ],
        aws: [
            { question: "Explain the main AWS services for web applications", intention: "Test AWS knowledge", answer: "Discuss EC2, S3, RDS, Lambda, CloudFront, and when to use each" }
        ],
        clinical: [
            { question: "How do you ensure patient safety?", intention: "Test clinical protocols", answer: "Discuss procedures, double-checks, documentation, and error reporting" }
        ],
        hipaa: [
            { question: "How do you handle patient confidentiality?", intention: "Test privacy knowledge", answer: "Discuss HIPAA rules, access controls, secure storage, and breach protocols" }
        ],
        marketing: [
            { question: "How do you measure marketing campaign success?", intention: "Test analytics skills", answer: "Discuss KPIs, ROI, conversion rates, A/B testing, and attribution" }
        ],
        sales: [
            { question: "How do you approach prospecting?", intention: "Test sales methodology", answer: "Discuss research, targeting, outreach, and qualification strategies" }
        ],
        finance: [
            { question: "How do you ensure accuracy in financial records?", intention: "Test attention to detail", answer: "Describe verification processes, reconciliation, audit procedures, controls" }
        ],
        security: [
            { question: "How do you handle an emergency or suspicious activity during your shift?", intention: "Test incident response and protocols", answer: "Describe immediate actions, notification procedures, documentation, and how you prioritize safety" },
            { question: "What are the key responsibilities of a security/night guard?", intention: "Assess job knowledge", answer: "Discuss patrol routines, monitoring, access control, incident response, and reporting" },
            { question: "How do you stay alert during long night shifts?", intention: "Test awareness and discipline", answer: "Discuss fatigue management, breaks, alertness techniques, and preventive measures" }
        ],
        emergency: [
            { question: "Describe how you would respond to a medical emergency", intention: "Test emergency procedures", answer: "Discuss first aid knowledge, calling emergency services, crowd control, and documentation" },
            { question: "How would you handle an aggressive or hostile person?", intention: "Test conflict de-escalation", answer: "Discuss calm communication, personal safety awareness, retreat if necessary, and when to call authorities" }
        ],
        customer_service: [
            { question: "How do you handle difficult customer situations?", intention: "Test problem-solving and patience", answer: "Discuss active listening, empathy, finding solutions, and maintaining professionalism" },
            { question: "Tell me about a time you improved customer satisfaction", intention: "Test initiative and service mindset", answer: "Use STAR method, focus on understanding customer needs and going above expectations" }
        ],
        logistics: [
            { question: "How would you organize and manage inventory efficiently?", intention: "Test organizational skills", answer: "Discuss tracking systems, rotation methods, safety protocols, and minimizing loss" },
            { question: "How do you handle time-sensitive shipments or deliveries?", intention: "Test priority management", answer: "Discuss time management, communication, accuracy, and contingency planning" }
        ],
        healthcare: [
            { question: "What is the importance of patient confidentiality?", intention: "Test privacy awareness", answer: "Discuss HIPAA basics, secure information handling, and ethical responsibilities" },
            { question: "How do you provide compassionate care to patients?", intention: "Test empathy and bedside manner", answer: "Discuss active listening, patience, dignity, and emotional support" }
        ],
        hr: [
            { question: "How do you approach recruiting and assessing candidates?", intention: "Test hiring judgment", answer: "Discuss job requirements matching, interview techniques, soft skills assessment, and bias awareness" },
            { question: "How would you handle a workplace conflict?", intention: "Test conflict resolution", answer: "Discuss mediation, documentation, fairness, policy adherence, and resolution focus" }
        ],
        operations: [
            { question: "How do you prioritize multiple tasks with tight deadlines?", intention: "Test time management", answer: "Discuss prioritization frameworks, resource allocation, communication, and flexibility" },
            { question: "Describe your approach to process improvement", intention: "Test initiative and efficiency", answer: "Discuss identifying bottlenecks, proposing solutions, testing, and measuring results" }
        ]
    };

    // Skill gap bank - what they need to learn
    const skillGapsBySkill = {
        react: [{ skill: "React Performance Optimization", severity: "high" }, { skill: "React Hooks Mastery", severity: "high" }],
        vue: [{ skill: "Vue 3 Composition API", severity: "high" }],
        javascript: [{ skill: "Async/Await Patterns", severity: "high" }],
        typescript: [{ skill: "Advanced Type System", severity: "high" }],
        python: [{ skill: "Advanced Python Features", severity: "high" }],
        sql: [{ skill: "Query Optimization", severity: "high" }, { skill: "Complex Joins", severity: "high" }],
        mongodb: [{ skill: "MongoDB Schema Design", severity: "high" }],
        docker: [{ skill: "Docker Best Practices", severity: "high" }],
        kubernetes: [{ skill: "Kubernetes Deployment", severity: "high" }],
        aws: [{ skill: "AWS Security Best Practices", severity: "high" }],
        clinical: [{ skill: "Clinical Protocols", severity: "high" }],
        hipaa: [{ skill: "HIPAA Compliance", severity: "high" }],
        marketing: [{ skill: "Marketing Analytics", severity: "high" }],
        sales: [{ skill: "Sales Methodology", severity: "high" }],
        finance: [{ skill: "Financial Modeling", severity: "high" }],
        security: [
            { skill: "Security Protocols and Procedures", severity: "high" },
            { skill: "Incident Response", severity: "high" },
            { skill: "Surveillance Equipment Operation", severity: "medium" }
        ],
        emergency: [
            { skill: "Emergency Response Procedures", severity: "high" },
            { skill: "First Aid/CPR Certification", severity: "high" },
            { skill: "De-escalation Techniques", severity: "high" }
        ],
        customer_service: [
            { skill: "Communication Skills", severity: "high" },
            { skill: "Problem Solving", severity: "high" },
            { skill: "Conflict Resolution", severity: "medium" }
        ],
        logistics: [
            { skill: "Inventory Management", severity: "high" },
            { skill: "Organization and Planning", severity: "high" },
            { skill: "Time Management", severity: "high" }
        ],
        healthcare: [
            { skill: "Patient Care Procedures", severity: "high" },
            { skill: "Medical Terminology", severity: "high" },
            { skill: "Compliance and Safety", severity: "high" }
        ],
        hr: [
            { skill: "Recruitment and Interviewing", severity: "high" },
            { skill: "Employment Law Knowledge", severity: "high" },
            { skill: "Conflict Resolution", severity: "high" }
        ],
        operations: [
            { skill: "Process Optimization", severity: "high" },
            { skill: "Project Management", severity: "high" },
            { skill: "Data Analysis and Metrics", severity: "medium" }
        ]
    };

    // Generate questions based on MISSING skills
    let selectedTechQuestions = [];
    for (const gap of skillGaps) {
        if (questionsBySkill[gap]) {
            selectedTechQuestions.push(...questionsBySkill[gap]);
        }
    }

    // If no gaps, ask general questions
    if (selectedTechQuestions.length === 0) {
        selectedTechQuestions = [
            { question: "Tell me about your most challenging project", intention: "Assess experience", answer: "Use STAR: Situation, Task, Action, Result. Be specific with examples" },
            { question: "How do you approach learning new technologies?", intention: "Test learning ability", answer: "Discuss resources, practice, and hands-on projects" }
        ];
    }

    // Generate skill gaps based on MISSING skills
    let selectedSkillGaps = [];
    for (const gap of skillGaps) {
        if (skillGapsBySkill[gap]) {
            selectedSkillGaps.push(...skillGapsBySkill[gap]);
        }
    }

    // If no gaps, candidate is a perfect match
    if (selectedSkillGaps.length === 0) {
        selectedSkillGaps = [
            { skill: "Continuous Learning", severity: "low" },
            { skill: "Staying Updated with Industry Trends", severity: "low" }
        ];
    }

    // Calculate match score percentage
    const matchScore = requiredSkills.size > 0 
        ? Math.round((matchedSkills.size / requiredSkills.size) * 100)
        : 50;

    console.log(`📊 Match Score: ${matchScore}% (${matchedSkills.size}/${requiredSkills.size} required skills matched)`);
    
    // Get dynamic questions based on job description
    const dynamicTechQuestions = generateDynamicQuestions(jobDescription, skillGaps, selectedSkillGaps);
    
    // Combine dynamic questions with skill-based ones
    const techQuestionsToUse = dynamicTechQuestions.length > 0 
        ? [...dynamicTechQuestions, ...selectedTechQuestions.slice(0, 2)]
        : selectedTechQuestions;
    
    // Get dynamic preparation plan
    const dynamicPrepPlan = generateDynamicPreparationPlan(jobTitle, skillGaps, selectedSkillGaps);
    
    return {
        matchScore,
        title: jobTitle,
        technicalQuestions: techQuestionsToUse.slice(0, Math.min(3, techQuestionsToUse.length)),
        behavioralQuestions: [
            {
                question: "Tell me about a time you successfully learned a new skill or tool required for a job",
                intention: "Assess learning ability and adaptability",
                answer: "Use STAR method. Describe what you learned, resources used, timeline, and how you applied it to succeed"
            },
            {
                question: "Describe how you approach working in a team and handling conflicts",
                intention: "Evaluate teamwork and communication skills",
                answer: "Discuss collaboration approach, communication methods, how you handle disagreements, and examples of teamwork success"
            }
        ],
        skillGaps: selectedSkillGaps.slice(0, Math.min(3, selectedSkillGaps.length)),
        preparationPlan: dynamicPrepPlan
    };
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        // For development/testing when API quota is exceeded, use mock data
        const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
        
        console.log("🔍 USE_MOCK_DATA env var:", process.env.USE_MOCK_DATA);
        console.log("🔍 USE_MOCK_DATA boolean:", USE_MOCK_DATA);
        console.log("🔍 GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
        
        if (USE_MOCK_DATA) {
            console.log("📋 Using mock data for interview report...");
            return generateSmartMockData(jobDescription, resume, selfDescription);
        }
        
        console.log("🚀 GROQ API will be called (USE_MOCK_DATA is disabled)");

        // Extract the job title and key requirements from job description
        const jobLines = jobDescription.split('\n').filter(l => l.trim());
        const jobTitle = jobLines[0] || "Position";
        
        // Identify what type of job this is (tech, healthcare, logistics, etc.)
        const jobDescLower = jobDescription.toLowerCase();
        const isTechJob = jobDescLower.includes('develop') || jobDescLower.includes('software') || 
                         jobDescLower.includes('engineer') || jobDescLower.includes('javascript') || 
                         jobDescLower.includes('typescript') || jobDescLower.includes('react') ||
                         jobDescLower.includes('code') || jobDescLower.includes('programming');
        const isHealthcare = jobDescLower.includes('medical') || jobDescLower.includes('nursing') || 
                            jobDescLower.includes('hospital') || jobDescLower.includes('patient') ||
                            jobDescLower.includes('clinical') || jobDescLower.includes('healthcare');
        const isLabJob = jobDescLower.includes('lab') || jobDescLower.includes('laboratory') || 
                        jobDescLower.includes('analysis') || jobDescLower.includes('specimen') ||
                        jobDescLower.includes('testing');
        const isSecurityJob = jobDescLower.includes('security') || jobDescLower.includes('guard') || 
                             jobDescLower.includes('patrol') || jobDescLower.includes('surveillance');
        const isLogistics = jobDescLower.includes('logistics') || jobDescLower.includes('warehouse') || 
                           jobDescLower.includes('inventory') || jobDescLower.includes('supply chain');
        const isCustomerService = jobDescLower.includes('customer') || jobDescLower.includes('support') || 
                                 jobDescLower.includes('service') || jobDescLower.includes('hospitality');
        
        // Build role-specific context
        let roleContext = "";
        if (isLabJob) {
            roleContext = "This is a LAB ASSISTANCE role. Focus questions on: lab safety, specimen handling, equipment operation, lab procedures, quality control, and documentation. Do NOT ask tech questions like TypeScript, JavaScript, React, etc.";
        } else if (isHealthcare) {
            roleContext = "This is a HEALTHCARE role. Focus questions on: patient care, medical protocols, HIPAA compliance, bedside manner, and clinical procedures. Do NOT ask tech questions.";
        } else if (isSecurityJob) {
            roleContext = "This is a SECURITY/GUARD role. Focus questions on: security protocols, incident response, surveillance, emergency procedures, and vigilance. Do NOT ask tech questions.";
        } else if (isLogistics) {
            roleContext = "This is a LOGISTICS role. Focus questions on: inventory management, supply chain, organization, time management, and safety. Do NOT ask tech questions.";
        } else if (isCustomerService) {
            roleContext = "This is a CUSTOMER SERVICE role. Focus questions on: communication, problem-solving, conflict resolution, and customer satisfaction. Do NOT ask tech questions.";
        } else if (isTechJob) {
            roleContext = "This is a TECHNOLOGY role. Only ask about programming languages, frameworks, and tools that are EXPLICITLY mentioned in the job description. Do NOT add generic tech questions like TypeScript, JavaScript, or React unless mentioned.";
        }
        
        const prompt = `You are an expert recruiter and interview coach. Generate a detailed interview report for a candidate.

${roleContext}

CANDIDATE PROFILE:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}

JOB REQUIREMENTS:
${jobDescription}

CRITICAL INSTRUCTIONS:
1. Analyze this SPECIFIC job description carefully
2. Extract ONLY the skills and requirements mentioned in this job description
3. Create questions about skills EXPLICITLY mentioned - NO generic tech questions
4. Calculate MATCH SCORE based on how well candidate's skills fit THIS JOB
5. Identify skill gaps - what THIS JOB requires that candidate LACKS

STRICT RULES:
- Do NOT mention TypeScript, JavaScript, React, Python, Java, etc. unless they appear in the job description above
- Do NOT include generic tech questions if this is not a tech job
- Questions must be role-specific and relevant to the job description provided
- If job mentions "lab work" - ask about lab procedures, NOT programming
- If job mentions "security" - ask about security protocols, NOT coding
- If job mentions "customer service" - ask about communication, NOT tech
- Match Score = (skills candidate HAS that job requires / total skills job requires) * 100

Generate the response in this EXACT JSON format:
{
    "matchScore": <number 0-100 based on ONLY skills mentioned in job description>,
    "title": "${jobTitle}",
    "technicalQuestions": [
        {
            "question": "<question about skills FROM THIS JOB DESCRIPTION>",
            "intention": "<why asking and what skill it tests>",
            "answer": "<detailed answer - 3-4 sentences with examples>"
        }
    ],
    "behavioralQuestions": [
        {
            "question": "<behavioral question specific to THIS JOB>",
            "intention": "<what this reveals>",
            "answer": "<STAR method answer - 3-4 sentences>"
        }
    ],
    "skillGaps": [
        {
            "skill": "<required skill from THIS JOB that candidate lacks>",
            "severity": "<high|medium|low>"
        }
    ],
    "preparationPlan": [
        {
            "day": 1,
            "focus": "<focus for THIS JOB>",
            "tasks": ["<task1>", "<task2>", "<task3>"]
        },
        {
            "day": 2,
            "focus": "<focus for THIS JOB>",
            "tasks": ["<task1>", "<task2>", "<task3>"]
        },
        {
            "day": 3,
            "focus": "<focus for THIS JOB>",
            "tasks": ["<task1>", "<task2>", "<task3>"]
        }
    ]
}`;

        console.log("🚀 Calling GROQ API using Groq SDK...");
        
        // Wait if approaching rate limit (30 requests/minute)
        await rateLimiter.waitIfNeeded();
        
        const response = await groq.chat.completions.create({
            model: "mixtral-8x7b-32768",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 3000  // ✅ Increased for more detailed responses
        });

        const text = response.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            console.warn("⚠️  No JSON found in GROQ response, falling back to mock data");
            throw new Error("No JSON found in response");
        }

        const result = JSON.parse(jsonMatch[0]);
        console.log("✅ Successfully received GROQ response");
        console.log("📝 Job Title:", result.title);
        console.log("📊 Match Score:", result.matchScore);
        console.log("📝 Tech Questions received:", result.technicalQuestions?.length || 0);
        console.log("❓ First tech question:", result.technicalQuestions?.[0]?.question || "None");
        console.log("⚠️  Skill Gaps:", result.skillGaps?.length || 0);

        // Validate and ensure all required fields
        if (!result.matchScore || result.matchScore < 0 || result.matchScore > 100) {
            console.warn(`⚠️  Invalid match score: ${result.matchScore}, using 50`);
            result.matchScore = 50;
        }

        if (!Array.isArray(result.technicalQuestions) || result.technicalQuestions.length === 0) {
            console.warn("⚠️  No technical questions received");
            result.technicalQuestions = [];
        }

        if (!Array.isArray(result.behavioralQuestions) || result.behavioralQuestions.length === 0) {
            console.warn("⚠️  No behavioral questions received");
            result.behavioralQuestions = [];
        }

        if (!Array.isArray(result.skillGaps) || result.skillGaps.length === 0) {
            console.warn("⚠️  No skill gaps received, generating default ones");
            result.skillGaps = [
                { skill: "Role-specific competencies", severity: "high" },
                { skill: "Experience with tools/frameworks mentioned in job", severity: "medium" }
            ];
        }

        if (!Array.isArray(result.preparationPlan) || result.preparationPlan.length === 0) {
            console.warn("⚠️  No preparation plan received");
            result.preparationPlan = [];
        }

        // Ensure all required fields have default values
        return {
            matchScore: result.matchScore || 50,
            title: result.title || "Interview Preparation Plan",
            technicalQuestions: result.technicalQuestions || [],
            behavioralQuestions: result.behavioralQuestions || [],
            skillGaps: result.skillGaps || [],
            preparationPlan: result.preparationPlan || []
        };
    } catch (error) {
        console.error("❌ Error in generateInterviewReport:", error.message);
        console.error("Full error:", error);
        console.error("Error status:", error.status);
        
        // Check for various error conditions to determine if we should fallback
        const isRateLimit = error.status === 429 || 
                           error.message?.includes("rate") ||
                           error.message?.includes("429") ||
                           error.message?.includes("quota");
        
        const isAuthError = error.status === 401 || 
                           error.status === 403 ||
                           error.message?.includes("unauthorized") ||
                           error.message?.includes("invalid");
        
        const shouldFallback = isRateLimit || isAuthError || error.status >= 400;
        
        if (shouldFallback) {
            console.warn("⚠️  GROQ API error detected, falling back to smart mock data...");
            console.warn("💡 Check your GROQ API key at https://console.groq.com");
            console.warn("📊 Error:", error.message);
            console.warn("🔄 Using generateSmartMockData as fallback");
            
            return generateSmartMockData(jobDescription, resume, selfDescription);
        }
        
        throw error;
    }
}

module.exports = generateInterviewReport 


