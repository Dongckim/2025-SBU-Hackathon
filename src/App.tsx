<<<<<<< HEAD
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
=======
import { useEffect, useMemo, useRef, useState } from 'react'
>>>>>>> 2141ecc (frontend test)
import './App.css'
import HomePage from './pages/Home'
import ChatPage from './pages/Chat'

<<<<<<< HEAD
const GlobalNav = () => {
  const navigate = useNavigate()
=======
type Sender = 'user' | 'bot'

type Message = {
  id: string
  sender: Sender
  text: string
  isSuspicious?: boolean
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
    icon: '',
    title: 'Terror Threat',
    description: 'Potential terror threats or suspicious activities requiring immediate attention.',
  },
]

const ISSUE_LABELS: Record<ReportIssueType, string> = {
  'phishing': 'Phishing Email',
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

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(REPORT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issue_type: ISSUE_LABELS[selectedIssue],
          title:
            (context.flaggedMessage?.length ?? 0) > 0
              ? context.flaggedMessage.slice(0, 140)
              : 'Suspicious report submitted from chatbot',
          description: details.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Report submission failed with status ${response.status}`)
      }

      let data: Record<string, unknown> | null = null
      try {
        const parsed = (await response.json()) as Record<string, unknown>
        data = parsed
      } catch {
        data = null
      }

      const apiTicketId =
        data && typeof data.ticket_id === 'string' ? data.ticket_id.trim() : ''
      const ticketId =
        (apiTicketId.length > 0 && apiTicketId) ||
        context.ticketId ||
        generateTicketId()

      const apiTimestamp =
        data && typeof data.created_at === 'string' ? data.created_at.trim() : ''
      const timestamp =
        (apiTimestamp.length > 0 && apiTimestamp) ||
        (context.timestamp ?? '') ||
        formatTimestamp()

      setSubmission({
        issueType: selectedIssue,
        ticketId,
        timestamp: formatTimestamp(timestamp),
      })
      setMode('success')
    } catch (error) {
      console.error('Failed to submit report', error)
      setSubmitError('Failed to submit the report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
>>>>>>> 2141ecc (frontend test)

  return (
    <header className="global-nav">
      <button type="button" className="global-nav__brand" onClick={() => navigate('/')}
      >
        <span className="brand-mark" aria-hidden="true">
          🛡️
        </span>
        <span className="brand-name">SecureSBU</span>
      </button>


      <div className="global-nav__cta">
        <button type="button" className="nav-chat-button" onClick={() => navigate('/chat')}>
          Open Chat
        </button>
<<<<<<< HEAD
        <div className="avatar-badge" aria-hidden="true">
          A
        </div>
=======

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
                    wrap="soft"
                  />
                </div>
              )}
            </div>

            {submitError && <p className="report-error-message">{submitError}</p>}

            <footer className="report-modal-actions">
              <button type="button" className="report-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                className="report-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
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
                Back to Chat
              </button>
            </div>
          )
        )}
>>>>>>> 2141ecc (frontend test)
      </div>
    </header>
  )
}

<<<<<<< HEAD
const App = () => {
  const location = useLocation()
  const isChatRoute = location.pathname.startsWith('/chat')
  const stageClassName = isChatRoute ? 'app-stage chat-stage' : 'app-stage'
=======
const BOT_NAME = 'Hackerton Bot'
const API_BASE_URL = 'https://stagingapi.neuralseek.com/v1/stony36'
const API_KEY = import.meta.env.VITE_NEURALSEEK_API_KEY ?? 'e24f8a05-e4fe85b2-3e859a20-6186b503'
const REPORT_API_URL = import.meta.env.VITE_REPORT_API_URL ?? '/api/reports'

const initialMessages: Message[] = [
  {
    id: 'welcome',
    sender: 'bot',
    text: 'Hi there! Welcome to the Hackerton chatbot demo. How can I help you today?',
  },
]

const quickReplies: string[] = [
  'What can this chatbot do?',
  'What can I try right now?',
  'Show me a sample answer',
]

function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportContext, setReportContext] = useState<ReportDialogContext | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !isWaiting, [input, isWaiting])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isWaiting])

  const handleReportClose = () => {
    setReportModalOpen(false)
    setReportContext(null)
  }

  const pushMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const buildLastTurn = (history: Message[]) => {
    const lastUser = [...history].reverse().find((item) => item.sender === 'user')
    const lastBot = [...history].reverse().find((item) => item.sender === 'bot')

    if (lastUser && lastBot) {
      return [
        {
          input: lastUser.text,
          response: lastBot.text,
        },
      ]
    }

    return []
  }

  const resolveBotText = (payload: unknown): string => {
    if (!payload) {
      return ''
    }

    if (typeof payload === 'string') {
      return payload
    }

    const maybeObject = payload as Record<string, unknown>

    const candidates = [
      maybeObject.answer,
      maybeObject.response,
      maybeObject.output,
      Array.isArray((payload as { outputs?: string[] }).outputs)
        ? ((payload as { outputs?: string[] }).outputs ?? []).join('\n')
        : undefined,
      Array.isArray(maybeObject.sourceParts) && maybeObject.sourceParts.length > 0
        ? (maybeObject.sourceParts as unknown[])
          .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
          .join('\n')
        : undefined,
      maybeObject.rendered,
      maybeObject.text,
      maybeObject.data,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate
      }
    }

    const choiceContent =
      (maybeObject.choices &&
        Array.isArray(maybeObject.choices) &&
        (maybeObject.choices[0] as { message?: { content?: string } })?.message?.content) ||
      ''

    if (typeof choiceContent === 'string' && choiceContent.trim().length > 0) {
      return choiceContent
    }

    return JSON.stringify(payload, null, 2)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = input.trim()

    if (!trimmed || isWaiting) {
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    }

    pushMessage(userMessage)
    setInput('')
    setIsWaiting(true)

    const historySnapshot = [...messages, userMessage]
    const payload = {
      ntl: '',
      agent: 'ChatBot2',
      params: [
        {
          name: 'userInput',
          value: trimmed,
        },
      ],
      options: {
        streaming: false,
        llm: '',
        user_id: '',
        timeout: 600000,
        temperatureMod: 1,
        toppMod: 1,
        freqpenaltyMod: 1,
        minTokens: 0,
        maxTokens: 10000,
        lastTurn: buildLastTurn(historySnapshot),
        returnVariables: false,
        returnVariablesExpanded: false,
        returnRender: false,
        returnSource: true,
        maxRecursion: 10,
      },
    }

    try {
      const response = await fetch(`${API_BASE_URL}/maistro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      var botReply = resolveBotText(data) + '\"}' || 'The service returned an empty response.'
      var isSuspicious = false;

      try {
        const parsed = JSON.parse(botReply);
        botReply = parsed.response;
        isSuspicious = parsed.suspicious;
      }
      catch {
        console.log('bot reply is not JSON')
      }

      pushMessage({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        isSuspicious: isSuspicious
      })

      if (isSuspicious) {
        console.log('this is definitely sus not gonna lie')
      }

      setErrorMessage(null)

      // No longer automatically trigger report modal for suspicious messages
      // Keep the console log for debugging purposes
      if (isSuspicious) {
        console.log('Suspicious message detected')
      }
    } catch (error) {
      console.error(error)
      const fallbackText =
        'Sorry, I could not reach NeuralSeek right now. Please try again in a moment.'

      pushMessage({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: fallbackText,
      })
      setErrorMessage('Failed to fetch a response from NeuralSeek.')
    } finally {
      setIsWaiting(false)
      // Focus the input field after all state updates are complete
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }

  const handleQuickReply = (reply: string) => {
    setInput(reply)
  }
>>>>>>> 2141ecc (frontend test)

  return (
    <div className="app-frame">
      <GlobalNav />
      <main className={stageClassName}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App