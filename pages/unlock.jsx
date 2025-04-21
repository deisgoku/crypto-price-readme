import { useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import Redis from 'ioredis'

const redis = new Redis(process.env.NEXT_PUBLIC_REDIS_URL) // Upstash Redis URL

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
import bgAnimation from '../public/bg-lottie.json'

export default function Unlock() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [popup, setPopup] = useState({ show: false, message: '' })

  const handleUnlock = async () => {
    if (!username.trim()) {
      setPopup({ show: true, message: 'Please input your username first' })
      return
    }

    setLoading(true)

    try {
      const exists = await fetch(`/api/follow-check?username=${username}`)
      const result = await exists.json()

      if (result.exists) {
        setPopup({ show: true, message: 'Username already exists!' })
      } else {
        await fetch(`/api/follow-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        })
        setPopup({ show: true, message: "You're newest and verified okay 👌" })
      }
    } catch (error) {
      setPopup({ show: true, message: 'Something went wrong!' })
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
          Make sure you’ve followed me on X{' '}
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

        <div className="unlock-form">
          <label htmlFor="username">Enter your Twitter username:</label>
          <input
            type="text"
            id="username"
            className="unlock-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. vitalikbuterin"
          />
          <button className="unlock-button" onClick={handleUnlock} disabled={loading}>
            {loading ? <span className="loader"></span> : 'Unlock'}
          </button>
        </div>

        {popup.show && (
          <div className="popup-box">
            <p>{popup.message}</p>
            <button className="close-btn" onClick={() => setPopup({ show: false, message: '' })}>
              ×
            </button>
          </div>
        )}

        <blockquote style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
          "In the world of Web3, appreciating others’ work is a way of saying thank you.
          Following helps us stay connected and build together."
        </blockquote>

        <style jsx>{`
          .unlock-form {
            position: relative;
            margin-top: 1rem;
            text-align: center;
          }

          .popup-box {
            position: absolute;
            top: 60%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #111;
            color: #fff;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10;
            animation: fadeIn 0.3s ease-in-out;
          }

          .popup-box p {
            margin: 0 0 0.5rem;
          }

          .close-btn {
            background: transparent;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -60%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}</style>
      </div>
    </>
  )
}
