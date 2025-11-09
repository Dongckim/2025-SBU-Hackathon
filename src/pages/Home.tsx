import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import ReportModal, { type ReportDialogContext } from '../components/ReportModal'

const SECURITY_TIPS = [
  "Always verify the sender's email address before clicking links.",
  'Lock unattended workstations within 60 seconds to protect PHI.',
  'Report lost or stolen devices to Security within 15 minutes.',
  'Store PHI only in encrypted, hospital-approved systems.',
  // "Familiarize yourself with the SBUH Corporate Compliance Code of Conduct.",
  // "Participate in annual compliance training to stay updated on policies.",
  // "If you have compliance concerns, report them to your supervisor or the Chief Compliance Officer.",
  "Always safeguard Protected Health Information (PHI) to comply with HIPAA regulations.",
  // "Do not accept gifts of cash or cash equivalents, regardless of value.",
  // "Only accept items of nominal value (under $15) that cannot be construed as influencing your decisions.",
  "Use secure methods to communicate sensitive information, such as encrypted emails.",
  "Properly dispose of documents containing PHI to prevent unauthorized access.",
  "Ensure that only authorized personnel have access to sensitive areas and information.",
  // "Disclose any potential conflicts of interest to maintain transparency.",
  // "Be vigilant against fraud, waste, and abuse in healthcare practices.",
  // "Adhere to ethical standards in research to avoid misconduct like fabrication or plagiarism.",
  "Create strong, unique passwords for all accounts and change them regularly.",
  "Enable two-factor authentication for additional security on sensitive accounts.",
  "Be cautious of phishing attempts and verify the identity of unknown contacts.",
  // "Familiarize yourself with emergency procedures for reporting security breaches.",
  // "Ensure that all contractors and vendors comply with SBUH’s Code of Conduct.",
  // "Participate in regular audits to ensure compliance with policies and procedures.",
]

type HomePageProps = {
  userName?: string
}

const HomePage = ({ userName = 'Alex' }: HomePageProps) => {
  const navigate = useNavigate()
  const tipOfTheDay = useMemo(
    () => SECURITY_TIPS[Math.floor(Math.random() * SECURITY_TIPS.length)],
    [],
  )
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportContext, setReportContext] = useState<ReportDialogContext | null>(null)

  useEffect(() => {
    const handleGlobalReport = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ReportDialogContext> | undefined>).detail
      setReportContext({
        flaggedMessage: detail?.flaggedMessage ?? 'Manual report from navigation bar',
        reason: detail?.reason ?? 'User opened report dialog from the navigation.',
        issueType: detail?.issueType,
        timestamp: detail?.timestamp,
        ticketId: detail?.ticketId,
        details: detail?.details,
      })
      setIsReportOpen(true)
    }

    window.addEventListener('secureSBU:openReport', handleGlobalReport)
    return () => window.removeEventListener('secureSBU:openReport', handleGlobalReport)
  }, [])

  return (
    <div className="home-shell">
      <div className="home-card">
        <main className="home-main">
          <section className="home-hero">
            <span className="home-eyebrow">Security briefing prep</span>
            <h1 className="home-title">Welcome back, {userName}!</h1>
            <p className="home-subtitle">
              Prep the Hoffmann CSO briefing with SecureSBU. Ask policy questions, rehearse incident
              response playbooks, and route suspicious activity to security in a single click.
            </p>
          </section>

          <section className="tip-card" aria-label="Today&apos;s security tip">
            <div className="tip-icon" aria-hidden="true">
              🔐
            </div>
            <div>
              <span className="tip-eyebrow">Today&apos;s Security Tip</span>
              <p className="tip-text">{tipOfTheDay}</p>
            </div>
          </section>

          <div className="home-actions">
            <button type="button" className="primary-action" onClick={() => navigate('/chat')}>
              <span aria-hidden="true">❓</span>
              Ask a Policy Question
            </button>
            <button type="button" className="secondary-action" onClick={() => setIsReportOpen(true)}>
              <span aria-hidden="true">🚨</span>
              Report Suspicious Activity
            </button>
          </div>

        </main>

        <footer className="home-footer">
          <button type="button" className="link-button">
            Help Center
          </button>
          <span aria-hidden="true">•</span>
          <button type="button" className="link-button">
            IT Support
          </button>
        </footer>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        context={reportContext}
        fallbackTitle="Suspicious report submitted from dashboard"
        successButtonLabel="Back to Dashboard"
      />
    </div>
  )
}

export default HomePage
