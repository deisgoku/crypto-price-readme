import { useState } from 'react';
import Head from 'next/head';

export default function UnlockPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState('');

  const showPopup = (message) => {
    setPopup(message);
    setTimeout(() => setPopup(''), 4000);
  };

  const handleUnlock = async () => {
    const uname = username.trim();
    if (!uname) {
      showPopup('Please enter your Twitter username first.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/follow-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname }),
      });
      const result = await res.json();

      if (result.exists) {
        showPopup(`Welcome back, @${uname}! You've already unlocked the card.`);
      } else {
        const res2 = await fetch('/api/add-follower', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uname }),
        });
        const result2 = await res2.json();
        if (result2.success) {
          showPopup(`Success! Thanks for unlocking, @${uname}. Enjoy your card.`);
        } else {
          showPopup('Something went wrong. Please try again.');
        }
      }
    } catch (err) {
      showPopup('Server error. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Card Readme Unlocker</title>
      </Head>
      <div className="unlock-container">
        <div className="unlock-card">
          <h1 className="text-3xl font-bold mb-4">Card Readme Unlocker</h1>
          <p className="mb-6">Follow on Twitter to unlock the crypto card!</p>
          <input
            type="text"
            placeholder="Your Twitter username"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            onClick={handleUnlock}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
            disabled={loading}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
          <p className="text-sm text-gray-400 mt-4 italic">
            “We appreciate your support in growing open crypto tools.”
          </p>
        </div>

        {popup && (
          <div className="unlock-popup">
            <span>{popup}</span>
          </div>
        )}
      </div>
    </>
  );
}
