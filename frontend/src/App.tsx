import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type Sender = 'user' | 'bot'

type Message = {
  id: string
  sender: Sender
  text: string
}

const BOT_NAME = 'Hackerton Bot'

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

const createBotResponse = (message: string): string => {
  const normalized = message.toLowerCase()

  if (normalized.includes('hi') || normalized.includes('hello')) {
    return 'Hello! Feel free to ask me anything.'
  }

  if (normalized.includes('feature') || normalized.includes('what can')) {
    return 'This frontend demo lets you draft messages and preview the conversation flow.'
  }

  if (normalized.includes('sample')) {
    return 'Try a request like "Summarize this data" to see how a real chatbot could respond.'
  }

  if (normalized.includes('help')) {
    return 'Type in the task or question you need help with, and I will generate a response.'
  }

  return 'Great question! When connected to a real backend or AI model, the chatbot can give richer, tailored answers.'
}

function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  const canSend = useMemo(() => input.trim().length > 0 && !isWaiting, [input, isWaiting])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isWaiting])

  const pushMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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

    setTimeout(() => {
      pushMessage({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: createBotResponse(trimmed),
      })
      setIsWaiting(false)
    }, 700)
  }

  const handleQuickReply = (reply: string) => {
    setInput(reply)
  }

  return (
    <div className="App">
      <div className="chat-container">
        <header className="chat-header">
          <div>
            <h1>Hackerton Assistant</h1>
            <p>Chatbot frontend demo built with React & Vite</p>
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
      </div>
    </div>
  )
}

export default App
