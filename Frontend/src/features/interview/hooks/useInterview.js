import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context.jsx"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setReport(null)  // ✅ CLEAR old report immediately
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            console.log("🔍 API Response received:", response)
            console.log("📝 Technical Questions:", response.interviewReport?.technicalQuestions)
            console.log("📊 Match Score:", response.interviewReport?.matchScore)
            console.log("⚠️ Skill Gaps:", response.interviewReport?.skillGaps)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.error("❌ Error generating report:", error)
            setReport(null)  // ✅ Clear on error too
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport  // ✅ moved inside try
        } catch (error) {
            console.log(error)
            return null                       // ✅ fallback
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports  // ✅ moved inside try
        } catch (error) {
            console.log(error)
            setReports([])                    // ✅ set empty on failure
            return []                         // ✅ fallback
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else if (reports.length === 0) {
            getReports()
        }
    }, [interviewId, reports.length])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }
}