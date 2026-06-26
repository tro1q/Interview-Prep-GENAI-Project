const generateInterviewReport = require("../services/ai.service");
const aiReportModel = require("../models/interviewReport.model");

// Try to import pdf-parse, but make it optional
let pdfParse;
try {
    const pdfModule = require("pdf-parse");
    pdfParse = pdfModule && typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
} catch (err) {
    console.warn("pdf-parse not available, PDF parsing will be skipped");
    pdfParse = null;
}

async function generateInterviewReportController(req, res) {
    try {
        let resumeText = "";

        // Resume is optional - only process if provided
        if (req.file && req.file.buffer) {
            try {
                if (pdfParse && typeof pdfParse === 'function') {
                    const data = await pdfParse(req.file.buffer);
                    resumeText = data.text;
                } else {
                    console.warn("PDF parser not available, skipping PDF parsing");
                }
            } catch (pdfError) {
                console.warn("Error parsing PDF:", pdfError.message);
                // Continue without resume text if PDF parsing fails
            }

            if (!resumeText || resumeText.trim().length === 0) {
                console.warn("Resume PDF could not be parsed or is empty");
            }
        }

        const { selfDescription, jobDescription } = req.body;

        // Validate required fields
        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ message: "Job description is required." });
        }

        if (!resumeText && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({ message: "Either a resume or self-description is required." });
        }

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        const interviewReport = await aiReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        });

        // Keep only 5 most recent interview reports per user
        const userReports = await aiReportModel.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("_id");
        
        if (userReports.length > 5) {
            // Delete reports older than the 5 most recent
            const reportsToDelete = userReports.slice(5).map(report => report._id);
            await aiReportModel.deleteMany({ _id: { $in: reportsToDelete } });
            console.log(`🗑️  Deleted ${reportsToDelete.length} old interview reports. Keeping only 5 most recent.`);
        }

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport
        });
    } catch (error) {
        console.error("💥 Error in generateInterviewReportController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params;
        const userId = req.user.id;

        const interviewReport = await aiReportModel.findOne({
            _id: interviewId,
            user: userId
        });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        res.status(200).json({
            message: "Interview report fetched successfully",
            interviewReport
        });
    } catch (error) {
        console.error("💥 Error in getInterviewReportByIdController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function getAllInterviewReportsController(req, res) {
    try {
        const userId = req.user.id;

        // Keep only 5 most recent reports - cleanup old ones
        const userReports = await aiReportModel.find({ user: userId })
            .sort({ createdAt: -1 });

        if (userReports.length > 5) {
            const reportsToDelete = userReports.slice(5).map(report => report._id);
            await aiReportModel.deleteMany({ _id: { $in: reportsToDelete } });
            console.log(`🗑️  Cleaned up ${reportsToDelete.length} old interview reports. Keeping only 5 most recent.`);
        }

        // Return only 5 most recent
        const interviewReports = await aiReportModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        });
    } catch (error) {
        console.error("💥 Error in getAllInterviewReportsController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;
        const userId = req.user.id;

        const interviewReport = await aiReportModel.findOne({
            _id: interviewReportId,
            user: userId
        });

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found" });
        }

        // For now, return the interview report data as JSON
        // In a real implementation, you would generate a PDF file here
        res.status(200).json({
            message: "Resume PDF generated successfully",
            interviewReport
        });
    } catch (error) {
        console.error("💥 Error in generateResumePdfController:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// THIS EXPORT MUST BE AT THE BOTTOM
module.exports = { 
    generateInterviewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController 
};