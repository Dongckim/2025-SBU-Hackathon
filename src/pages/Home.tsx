import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

const SECURITY_TIPS = [
  "Always verify the sender's email address before clicking links.",
  'Lock unattended workstations within 60 seconds to protect PHI.',
  'Report lost or stolen devices to Security within 15 minutes.',
  'Store PHI only in encrypted, hospital-approved systems.',
]

type HomePageProps = {
  userName?: string
}

type ReportIssueType = 'phishing' | 'strange-login' | 'lost-device'

type ReportDialogContext = {
  flaggedMessage: string
  reason?: string
  issueType?: ReportIssueType
  ticketId?: string
  timestamp?: string
  details?: string
}

type ReportModalProps = {
  isOpen: boolean
  onClose: () => void
  context: ReportDialogContext | null
}

type ReportSubmission = {
  issueType: ReportIssueType
  ticketId: string
  timestamp: string
}

const ISSUE_OPTIONS: Array<{
  type: ReportIssueType
  icon: string
  title: string
  description: string
}> = [
  {
    type: 'phishing',
    icon: '📧',
    title: 'Phishing Email',
    description: 'Suspicious emails requesting personal information or credentials.',
  },
  {
    type: 'strange-login',
    icon: '🔐',
    title: 'Strange Login Attempt',
    description: 'Unexpected login alerts or account access from unknown devices.',
  },
  {
    type: 'lost-device',
    icon: '📱',
    title: 'Lost or Stolen Device',
    description: 'Company or hospital devices that are missing or stolen.',
  },
]

const ISSUE_LABELS: Record<ReportIssueType, string> = {
  phishing: 'Phishing Email',
  'strange-login': 'Strange Login Attempt',
  'lost-device': 'Lost or Stolen Device',
}

const formatTimestamp = (value?: string) => {
  if (value && value.trim().length > 0) {
    return value
  }

  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const generateTicketId = () => {
  const now = new Date()
  const randomSegment = Math.random().toString(36).slice(2, 6).toUpperCase()
  const dateSegment = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`
  return `SBU-${dateSegment}-${randomSegment}`
}

const ReportModal = ({ isOpen, onClose, context }: ReportModalProps) => {
  const [selectedIssue, setSelectedIssue] = useState<ReportIssueType | null>(null)
  const [details, setDetails] = useState<string>('')
  const [mode, setMode] = useState<'form' | 'success'>('form')
  const [submission, setSubmission] = useState<ReportSubmission | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedIssue(null)
      setDetails('')
      setMode('form')
      setSubmission(null)
      return
    }

    const defaultIssue = context?.issueType ?? null
    setSelectedIssue(defaultIssue)

    if (context?.details) {
      setDetails(context.details)
    } else {
      setDetails('')
    }
    setMode('form')
    setSubmission(null)
  }, [context?.details, context?.flaggedMessage, context?.issueType, context?.reason, isOpen])

  if (!isOpen) {
    return null
  }

  const canSubmit = Boolean(selectedIssue) && details.trim().length > 0

  const handleSubmit = () => {
    if (!selectedIssue) {
      return
    }

    setSubmission({
      issueType: selectedIssue,
      ticketId: context?.ticketId ?? generateTicketId(),
      timestamp: formatTimestamp(context?.timestamp),
    })
    setMode('success')
  }

  return (
    <div className="report-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="report-modal"
        role="document"
        aria-labelledby="report-modal-heading"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="report-close-button" onClick={onClose} aria-label="Close">
          ×
        </button>

        {mode === 'form' ? (
          <>
            <header className="report-modal-header">
              <div className="report-modal-icon">🚨</div>
              <div>
                <h2 id="report-modal-heading">Report Suspicious Activity</h2>
                <p className="report-modal-subtitle">
                  Help us keep the hospital secure by reporting any suspicious activity.
                </p>
              </div>
            </header>

            <div className="report-modal-content">
              <p className="report-modal-label">What type of issue are you reporting?</p>

              <div className="report-option-list">
                {ISSUE_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    className={`report-option ${selectedIssue === option.type ? 'selected' : ''}`}
                    onClick={() => setSelectedIssue(option.type)}
                  >
                    <span className="report-option-icon">{option.icon}</span>
                    <span className="report-option-text">
                      <span className="report-option-title">{option.title}</span>
                      <span className="report-option-description">{option.description}</span>
                    </span>
                  </button>
                ))}
              </div>

              {selectedIssue && (
                <div className="report-details">
                  <label className="report-modal-label" htmlFor="report-details-textarea">
                    Please provide details (paste email subject and content)
                  </label>
                  <textarea
                    id="report-details-textarea"
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    placeholder="Include any details that will help our security team investigate."
                  />
                </div>
              )}
            </div>

            <footer className="report-modal-actions">
              <button type="button" className="report-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="report-primary" onClick={handleSubmit} disabled={!canSubmit}>
                Submit Report
              </button>
            </footer>
          </>
        ) : (
          submission && (
            <div className="report-success">
              <div className="report-success-icon">✅</div>
              <h2 id="report-modal-heading">Report Submitted Successfully</h2>
              <p className="report-success-message">
                Thank you. The Security Operations team has received your report and will begin an
                investigation promptly.
              </p>

              <div className="report-summary">
                <div className="report-summary-row">
                  <span>Type of Issue</span>
                  <span>{ISSUE_LABELS[submission.issueType]}</span>
                </div>
                <div className="report-summary-row">
                  <span>Ticket ID</span>
                  <span>{submission.ticketId}</span>
                </div>
                <div className="report-summary-row">
                  <span>Timestamp</span>
                  <span>{submission.timestamp}</span>
                </div>
              </div>

              <button type="button" className="report-success-button" onClick={onClose}>
                Back to Chat
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

const HomePage = ({ userName = 'Alex' }: HomePageProps) => {
  const navigate = useNavigate()
  const tipOfTheDay = useMemo(
    () => SECURITY_TIPS[Math.floor(Math.random() * SECURITY_TIPS.length)],
    [],
  )
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportContext, setReportContext] = useState<ReportDialogContext | null>(null)

  const handleReportClose = () => {
    setReportModalOpen(false)
    setReportContext(null)
  }

  const openReportModal = () => {
    setReportContext({
      flaggedMessage: 'Manual report from dashboard',
      reason: 'User manually opened report dialog from dashboard.',
    })
    setReportModalOpen(true)
  }

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
            <button type="button" className="secondary-action" onClick={openReportModal}>
              <span aria-hidden="true">🚨</span>
              Report Suspicious Activity
            </button>
          </div>

          <section className="home-demo">
            <h2 className="home-demo-title">Demo checklist</h2>
            <ol>
              <li>Show NeuralSeek answering PHI email policy questions with citations.</li>
              <li>Escalate a suspicious message through the report workflow.</li>
              <li>Finish with proactive coaching using the daily security tip.</li>
            </ol>
          </section>
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

      <ReportModal isOpen={reportModalOpen} onClose={handleReportClose} context={reportContext} />
    </div>
  )
}

export default HomePage
