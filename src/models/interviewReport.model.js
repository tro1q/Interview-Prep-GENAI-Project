const mongoose = require("mongoose")

const technicalQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true,"Technical question is required"]
    },
    intention: {
        type: String,
        required: [true,"Intention is required"]
    },
    answer: {
        type: String,
        required: [true,"Answer is required"]
    }
}, { _id: false })

const behavioralQuestionsSchema = new mongoose.Schema({ // FIX: behavioral
     question: {
        type: String,
        required: [true,"Behavioral question is required"]
    },
    intention: {
        type: String,
        required: [true,"Intention is required"]
    },
    answer: {
        type: String,
        required: [true,"Answer is required"]
    }
}, { _id: false })

const skillsSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true,"Skill is required"]
    },
    severity: {
        type: String,
        enum: ["low","medium","high"],
        required: [true,"Severity is required"]
    }
}, { _id: false })

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true,"Day is required"]
    },
    focus: {
        type: String,
        required: [true,"Focus is required"]
    },
    tasks: [{ // FIX: tasks (plural)
        type: String,
        required: [true,"Task is required"]
    }]
}, { _id: false }) 

const aiReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [true,"Job description is required"]
    },
    resume: {
        type: String
    },
    selfDescription: {
        type: String
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    technicalQuestions: [technicalQuestionsSchema],
    behavioralQuestions: [behavioralQuestionsSchema], // FIX: behavioral
    skillGaps: [skillsSchema], // FIX: skillGaps (plural)
    preparationPlan: [preparationPlanSchema],

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", 
    },
    title: {
        type: String,
        default: "Target Role Interview Plan" // FIX: No longer strictly required!
    }
}, {
    timestamps: true
})

const interviewReportModel = mongoose.model("aiReport", aiReportSchema)

module.exports = interviewReportModel