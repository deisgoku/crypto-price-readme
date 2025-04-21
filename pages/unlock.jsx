import { useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import bgAnimation from '../public/bg-lottie.json';

export default function Unlock() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '' });

  const handleUnlock = async () => {
    if (username.trim() === '') {
      return setPopup({ show: true, message: 'Please input your username first' });
    }

    setLoading(true);
    try {
      const res = await fetch('/api/follow-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();

      if (data.exists) {
        setPopup({ show: true, message: 'Username already exist!' });
      } else {
        setPopup({ show: true, message: 'You are newest and verified okay 👌' });
      }
    } catch (err) {
      setPopup({ show: true, message: 'Something went wrong!' });
    } finally {
      setLoading(false);
    }
  };

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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button className="unlock-button" onClick={handleUnlock} disabled={loading}>
            {loading ? <span className="loader"></span> : 'Unlock'}
          </button>
        </div>

        {popup.show && (
          <div className="verify-box" style={{ marginTop: '1rem' }}>
            <button className="close-btn" onClick={() => setPopup({ ...popup, show: false })}>
              ×
            </button>
            <p>{popup.message}</p>
          </div>
        )}

        <blockquote style={{ marginTop: '1.5rem', fontStyle: 'italic' }}>
          "In the world of Web3, appreciating others’ work is a way of saying thank you.
          Following helps us stay connected and build together."
        </blockquote>
      </div>
    </>
  );
}
