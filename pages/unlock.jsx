import { useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import bgAnimation from '../public/bg-lottie.json'

// Simulasi pengecekan Redis (ganti dengan real fetch ke API jika sudah live)
const mockRedis = ['deisgoku', 'vitalik']

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

export default function Unlock() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showBox, setShowBox] = useState(false)

  const handleUnlock = async () => {
    if (!username.trim()) {
      setMessage('Please input your username first')
      setShowBox(true)
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)

      if (mockRedis.includes(username.toLowerCase())) {
        setMessage('Username already exist!')
      } else {
        setMessage('You are newest and verified 👌')
      }

      setShowBox(true)
    }, 2000)
  }

  return (
    <>
      <Head>
        <title>Unlock | Card Readme</title>
      </Head>
      <div className="unlock-wrapper">
        <Lottie animationData={bgAnimation} loop autoplay className="unlock-bg" />
        <div className="unlock-content">
          <h1>Card Readme Unlocker</h1>
          <p>Welcome guys,</p>
          <p>
            Make sure you’ve followed me on X{' '}
            <img
              src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png"
              alt="X Logo"
              width={16}
              height={16}
              style={{ display: 'inline-block', margin: '0 4px' }}
            /> —{' '}
            <a href="https://x.com/Deisgoku" target="_blank" rel="noopener noreferrer">
              Visit x.com/Deisgoku
            </a>
          </p>

          <div className="unlock-form">
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

          {showBox && (
            <div className="verify-box">
              <button className="close-btn" onClick={() => setShowBox(false)}>
                ×
              </button>
              <p>{message}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
