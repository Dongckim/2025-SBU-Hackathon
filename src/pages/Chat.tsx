import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import '../App.css'
import ReportModal, { type ReportDialogContext } from '../components/ReportModal'

type Sender = 'user' | 'bot'

type Message = {
  id: string
  sender: Sender
  text: string
  isSuspicious?: boolean
}

const BOT_NAME = 'SBUH Helper'
const API_BASE_URL = import.meta.env.VITE_NEURALSEEK_API_BASE ?? ''
const API_KEY = import.meta.env.VITE_NEURALSEEK_API_KEY ?? ''

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

function Chat() {
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

    if (!API_BASE_URL) {
      setErrorMessage('NeuralSeek API endpoint is not configured. Please set VITE_NEURALSEEK_API_BASE.')
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

      setErrorMessage(null)
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

  useEffect(() => {
    const handleExternalReport = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ReportDialogContext> | undefined>).detail
      setReportContext({
        flaggedMessage: detail?.flaggedMessage ?? 'Manual report from navigation bar',
        reason: detail?.reason ?? 'User opened report dialog from the navigation.',
        issueType: detail?.issueType,
        ticketId: detail?.ticketId,
        timestamp: detail?.timestamp,
        details: detail?.details,
      })
      setReportModalOpen(true)
    }

    window.addEventListener('secureSBU:openReport', handleExternalReport)
    return () => window.removeEventListener('secureSBU:openReport', handleExternalReport)
  }, [])

  return (
    <div className="App">
      <div className="chat-container">
        <header className="chat-header">
          <div>
            <h1>SBUH Helper</h1>
            <p>Your AI assistant to help with SBUH policies, compliance, and clinical guidelines.</p>
          </div>
          <span className="status-indicator">
            <span className={`status-dot ${isWaiting ? 'busy' : 'ready'}`} />
            {isWaiting ? 'Generating reply...' : 'Ready'}
          </span>
        </header>

        <main className="chat-body">
          <ul className="message-list" aria-live="polite">
            {messages.map((message) => (
              <li key={message.id} className={`message ${message.sender}`}>
                <div className="avatar" aria-hidden="true">
                  {message.sender === 'bot' ? '🤖' : '🧑'}
                </div>
                <div className="bubble">
                  {message.sender === 'bot' && <span className="sender-label">{BOT_NAME}</span>}
                  <p>{message.text}</p>
                  {message.sender === 'bot' && message.isSuspicious && (
                    <button
                      type="button"
                      className="report-message-button"
                      onClick={() => {
                        setReportContext({ flaggedMessage: message.text });
                        setReportModalOpen(true);
                      }}
                      aria-label="Report this message"
                    >
                      🚨 Report
                    </button>
                  )}
                </div>
              </li>
            ))}

            {isWaiting && (
              <li className="message bot typing">
                <div className="avatar" aria-hidden="true">
                  🤖
                </div>
                <div className="bubble">
                  <span className="sender-label">{BOT_NAME}</span>
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </li>
            )}
            <div ref={scrollAnchorRef} />
          </ul>
        </main>

        <footer className="chat-footer">
          <div className="quick-replies" role="list">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                role="listitem"
                className="quick-reply"
                onClick={() => handleQuickReply(reply)}
                disabled={isWaiting}
              >
                {reply}
              </button>
            ))}
          </div>

          <form className="chat-input" onSubmit={handleSubmit}>
            <input
              type="text"
              ref={inputRef}
              placeholder="Type your message..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isWaiting}
              aria-label="Message input"
            />
            <button type="submit" disabled={!canSend}>
              Send
            </button>
          </form>
        </footer>
        {errorMessage && (
          <div role="alert" className="error-banner">
            {errorMessage}
          </div>
        )}
      </div>
      <ReportModal
        isOpen={reportModalOpen}
        onClose={handleReportClose}
        context={reportContext}
      fallbackTitle="Suspicious report submitted from chatbot"
      successButtonLabel="Back to Chat"
      />
    </div>
  )
}

export default Chat