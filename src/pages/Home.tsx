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

type ReportIssueType = 'phishing' | 'strange-login' | 'lost-device' | 'terror-threat'

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
  {
    type: 'terror-threat',
    icon: '🚨',
    title: 'Terror Threat',
    description: 'Potential terror threats or suspicious activities requiring immediate attention.',
  },
]

const ISSUE_LABELS: Record<ReportIssueType, string> = {
  phishing: 'Phishing Email',
  'strange-login': 'Strange Login Attempt',
  'lost-device': 'Lost or Stolen Device',
  'terror-threat': 'Terror Threat',
}

const generateTicketId = () => {
  const now = new Date()
  const randomSegment = Math.random().toString(36).slice(2, 6).toUpperCase()
  const dateSegment = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`
  return `SBU-${dateSegment}-${randomSegment}`
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

const REPORT_API_URL = import.meta.env.VITE_REPORT_API_URL ?? ''

const ReportModal = ({ isOpen, onClose, context }: ReportModalProps) => {
  const [selectedIssue, setSelectedIssue] = useState<ReportIssueType | null>(null)
  const [details, setDetails] = useState<string>('')
  const [mode, setMode] = useState<'form' | 'success'>('form')
  const [submission, setSubmission] = useState<ReportSubmission | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedIssue(null)
      setDetails('')
      setMode('form')
      setSubmission(null)
      setIsSubmitting(false)
      setSubmitError(null)
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
    setIsSubmitting(false)
    setSubmitError(null)
  }, [context?.details, context?.flaggedMessage, context?.issueType, context?.reason, isOpen])

  if (!isOpen) {
    return null
  }

  const canSubmit = Boolean(selectedIssue) && details.trim().length > 0 && !isSubmitting

  const handleSubmit = async () => {
    if (!selectedIssue || !context || isSubmitting) {
      return
    }

    if (!REPORT_API_URL) {
      setSubmitError('Report API endpoint is not configured. Please set VITE_REPORT_API_URL.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const fallbackTicketId = context.ticketId ?? generateTicketId()
    const fallbackTimestamp = formatTimestamp(context.timestamp)

    const payload = {
      issue_type: selectedIssue,
      title:
        (context.flaggedMessage?.length ?? 0) > 0
          ? context.flaggedMessage.slice(0, 140)
          : 'Suspicious report submitted from dashboard',
      description: details.trim(),
    }

    try {
      const response = await fetch(REPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorPayload = ''
        try {
          errorPayload = await response.text()
        } catch (readError) {
          console.error('Home report: failed to read error body', readError)
        }

        const trimmed = errorPayload.trim()
        const friendlyError =
          trimmed.length > 0 ? trimmed : `Report submission failed with status ${response.status}`
        throw new Error(friendlyError)
      }

      let data: Record<string, unknown> | null = null
      try {
        data = (await response.json()) as Record<string, unknown>
      } catch {
        data = null
      }

      const apiTicketId =
        data && typeof data.ticket_id === 'string' ? data.ticket_id.trim() : ''
      const ticketId =
        (apiTicketId.length > 0 && apiTicketId) || fallbackTicketId

      const apiTimestamp =
        data && typeof data.created_at === 'string' ? data.created_at.trim() : ''
      const timestamp =
        (apiTimestamp.length > 0 && apiTimestamp) || fallbackTimestamp

      setSubmission({
        issueType: selectedIssue,
        ticketId,
        timestamp: formatTimestamp(timestamp),
      })
      setMode('success')
    } catch (error) {
      console.error('Home report: failed to submit', error)
      const message = error instanceof Error ? error.message : 'Failed to submit the report. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
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
                    disabled={isSubmitting}
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
                    wrap="soft"
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            {submitError && <p className="report-error-message">{submitError}</p>}

            <footer className="report-modal-actions">
              <button type="button" className="report-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="button" className="report-primary" onClick={handleSubmit} disabled={!canSubmit}>
                {isSubmitting ? 'Submitting…' : 'Submit Report'}
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
                Back to Dashboard
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
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportContext, setReportContext] = useState<ReportDialogContext | null>(null)

  const openReportModal = () => {
    setReportContext({
      flaggedMessage: 'Manual report from dashboard',
      reason: 'User manually opened report dialog from dashboard.',
    })
    setIsReportOpen(true)
  }

  const closeReportModal = () => {
    setIsReportOpen(false)
    setReportContext(null)
  }

  useEffect(() => {
    const handleGlobalReport = (event: Event) => {
      const detail = (event as CustomEvent<ReportDialogContext>).detail
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
            <button type="button" className="secondary-action" onClick={openReportModal}>
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

      <ReportModal isOpen={isReportOpen} onClose={closeReportModal} context={reportContext} />
    </div>
  )
}

export default HomePage
