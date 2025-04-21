import { useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import bgAnimation from '../public/bg-lottie.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function Unlock() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '' })

  const handleUnlock = async () => {
    if (!username.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/follow-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await res.json()
      console.log('Response:', data)

      if (data.status === 'already_verified') {
        setPopup({
          show: true,
          message: "You've already followed and unlocked this feature. Thanks for the support!",
        })
      } else if (data.status === 'newly_verified') {
        setPopup({
          show: true,
          message: "You're verified now! Welcome onboard!",
        })
      } else {
        setPopup({
          show: true,
          message: 'Something went wrong. Please try again later.',
        })
      }
    } catch (err) {
      console.error('Unlock error:', err)
      setPopup({
        show: true,
        message: 'Error verifying user. Please check your connection.',
      })
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Card Readme Unlocker</title>
      </Head>
      <div className="unlock-container">
        <div className="lottie-bg">
          <Lottie animationData={bgAnimation} loop autoplay />
        </div>

        <h1>Card Readme Unlocker</h1>
        <p>Welcome guys,</p>
        <p>
          Make sure you’ve followed me on Twiter {' '}
          <img
            src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png"
            alt="X Logo"
            width={16}
            height={16}
            style={{ display: 'inline-block', margin: '0 4px' }}
          />
          —{' '}
          <a href="https://x.com/Deisgoku" target="_blank" rel="noopener noreferrer">
            Visit x.com/Deisgoku
          </a>
        </p>

        <div>
          <label htmlFor="username">Enter your Twitter username:</label>
          <br />
          <input
            type="text"
            id="username"
            className="unlock-input"
            placeholder="e.g. vitalikbuterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className="unlock-button" onClick={handleUnlock} disabled={loading}>
            {loading ? <span className="loader"></span> : 'Unlock'}
          </button>
        </div>

        <blockquote style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
          "In the world of Web3, appreciating others’ work is a way of saying thank you.
          Following helps us stay connected and build together."
        </blockquote>

        {popup.show && (
          <div className="verify-box">
            <button className="close-btn" onClick={() => setPopup({ show: false, message: '' })}>
              ×
            </button>
            <p>{popup.message}</p>
          </div>
        )}
      </div>
    </>
  )
}
