import { useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
import bgAnimation from '../public/bg-lottie.json'

export default function Unlock() {
  const [loading, setLoading] = useState(false)
  const [showBox, setShowBox] = useState(false)

  const handleUnlock = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setShowBox(true)
    }, 2000) // 2 detik delay
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

        <div>
          <label htmlFor="username">Enter your Twitter username:</label>
          <br />
          <input
            type="text"
            id="username"
            className="unlock-input"
            placeholder="e.g. vitalikbuterin"
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
            <p>You're verified 👌</p>
          </div>
        )}
      </div>
    </>
  )
}
