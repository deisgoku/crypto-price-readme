import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamic import supaya PlanetBackground gak SSR (karena pake WebGL)
const PlanetBackground = dynamic(() => import('../components/PlanetBackground'), {
  ssr: false,
});

export default function Unlock() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: '' });

  const handleUnlock = async () => {
    if (!username) {
      return setPopup({ show: true, message: 'Please enter a Twitter username!' });
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/follow-check', { username });
      const data = res.data;

      if (data.status === 'newly_verified') {
        setPopup({ show: true, message: 'Verification successful! Feature unlocked. Thank you!' });
      } else if (data.status === 'already_verified') {
        setPopup({
          show: true,
          message: "You've already followed and unlocked this feature. Thanks for the support!",
        });
      } else {
        setPopup({ show: true, message: 'Verification failed. Please try again.' });
      }
    } catch (err) {
      setPopup({ show: true, message: 'Something went wrong. Please try again later.' });
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Unlock Card | Crypto Price Readme</title>
        <meta
          name="description"
          content="Unlock exclusive GitHub README crypto cards by following our Twitter."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Unlock Card | Crypto Price Readme" />
        <meta
          property="og:description"
          content="Unlock exclusive GitHub README crypto cards by following our Twitter."
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="relative w-full min-h-screen flex items-center justify-center text-white overflow-hidden">
        <PlanetBackground />

        <div className="z-10 text-center px-4 max-w-md">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Card Readme Unlocker</h1>
          <p className="mb-6 text-gray-300">
            Welcome! Follow our Twitter to unlock exclusive GitHub README features.
          </p>

          <input
            type="text"
            placeholder="Your Twitter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 text-black rounded-md mb-4 focus:outline-none"
          />

          <button
            onClick={handleUnlock}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </div>

        {popup.show && (
          <div className="absolute top-20 bg-black bg-opacity-80 text-white px-6 py-4 rounded-lg shadow-lg z-20 max-w-sm w-full mx-auto animate-fade-in">
            <p className="mb-2">{popup.message}</p>
            <button
              onClick={() => setPopup({ show: false, message: '' })}
              className="text-sm underline hover:text-blue-400"
            >
              Close
            </button>
          </div>
        )}

        <div className="absolute bottom-2 text-xs text-gray-400 z-10 text-center w-full">
          "We appreciate every follow. You make open source brighter."
        </div>
      </div>
    </>
  );
}
