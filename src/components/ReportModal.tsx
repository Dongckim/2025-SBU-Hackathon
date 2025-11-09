import { useEffect, useState } from 'react'
import '../App.css'

export type ReportIssueType = 'phishing' | 'strange-login' | 'lost-device' | 'terror-threat'

export type ReportDialogContext = {
  flaggedMessage: string
  reason?: string
  issueType?: ReportIssueType
  ticketId?: string
  timestamp?: string
  details?: string
}

type ReportSubmission = {
  issueType: ReportIssueType
  ticketId: string
  timestamp: string
}

type ReportModalProps = {
  isOpen: boolean
  onClose: () => void
  context: ReportDialogContext | null
  fallbackTitle?: string
  successButtonLabel?: string
}

const REPORT_API_URL = import.meta.env.VITE_REPORT_API_URL ?? ''

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

const truncateTitle = (value: string, fallback: string) => {
  const source = value.trim().length > 0 ? value : fallback
  return source.length > 140 ? `${source.slice(0, 137)}…` : source
}

const ReportModal = ({
  isOpen,
  onClose,
  context,
  fallbackTitle = 'Suspicious report submitted from dashboard',
  successButtonLabel = 'Back',
}: ReportModalProps) => {
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

    setSelectedIssue(context?.issueType ?? null)
    setDetails(context?.details ?? '')
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

    try {
      const response = await fetch(REPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issue_type: selectedIssue,
          title: truncateTitle(context.flaggedMessage ?? '', fallbackTitle),
          description: details.trim(),
        }),
      })

      if (!response.ok) {
        let errorPayload = ''
        try {
          errorPayload = await response.text()
        } catch {
          // ignore
        }
        const trimmed = errorPayload.trim()
        const message = trimmed.length > 0 ? trimmed : `Failed to submit report (${response.status}).`
        throw new Error(message)
      }

      let data: Record<string, unknown> | null = null
      try {
        data = (await response.json()) as Record<string, unknown>
      } catch {
        data = null
      }

      const apiTicketId = data && typeof data.ticket_id === 'string' ? data.ticket_id.trim() : ''
      const ticketId = (apiTicketId.length > 0 && apiTicketId) || fallbackTicketId

      const apiTimestamp = data && typeof data.created_at === 'string' ? data.created_at.trim() : ''
      const timestamp = (apiTimestamp.length > 0 && apiTimestamp) || fallbackTimestamp

      setSubmission({
        issueType: selectedIssue,
        ticketId,
        timestamp: formatTimestamp(timestamp),
      })
      setMode('success')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to submit the report. Please try again shortly.'
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
                Thank you. The Security Operations team has received your report and will begin an investigation
                promptly.
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
                {successButtonLabel}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default ReportModal

