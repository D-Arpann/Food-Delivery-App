import { useState } from 'react'
import WebPage from './components/WebPage'
import LoginPopup from './components/LoginPopup'

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <>
      <WebPage onOpenLogin={() => setIsLoginOpen(true)} />
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
