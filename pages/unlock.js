// pages/unlock.js

import { useState } from 'react';

export default function Unlock() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/unlock?username=${username}`);
      const data = await res.json();

      if (data.success) {
        setMessage("Unlock successful! You can now access the card.");
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      setMessage("Error occurred! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Unlock Access</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Twitter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Checking..." : "Unlock"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
