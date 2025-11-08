import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import HomePage from './pages/Home'
import ChatPage from './pages/Chat'

const GlobalNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="global-nav">
      <button type="button" className="global-nav__brand" onClick={() => navigate('/')}
      >
        <span className="brand-mark" aria-hidden="true">
          🛡️
        </span>
        <span className="brand-name">SecureSBU</span>
      </button>

      <nav aria-label="주요 메뉴" className="global-nav__links">
        <button
          type="button"
          className={`global-nav__link ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          Overview
        </button>
        <button type="button" className="global-nav__link">
          Policies
        </button>
        <button type="button" className="global-nav__link">
          Training
        </button>
        <button type="button" className="global-nav__link">
          Support
        </button>
      </nav>

      <div className="global-nav__cta">
        <button type="button" className="nav-chat-button" onClick={() => navigate('/chat')}>
          Open Chat
        </button>
        <div className="avatar-badge" aria-hidden="true">
          A
        </div>
      </div>
    </header>
  )
}

const App = () => {
  return (
    <div className="app-frame">
      <GlobalNav />
      <main className="app-stage">
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