import React, { useState } from "react";
import toast from "react-hot-toast";

export default function Unlock() {
  const [username, setUsername] = useState("");
  const [verified, setVerified] = useState(false);

  const handleUnlock = () => {
    if (!username) {
      toast.error("Please enter your Twitter username!");
      return;
    }
    setVerified(true);
    toast.success("You're verified! Welcome aboard.");
  };

  return (
    <div className="unlock-wrapper">
      <div className="unlock-card">
        <h1 className="title">Unlock Web3 Tools</h1>
        
        <p className="subtitle">
          Follow <a href="https://twitter.com/Deisgoku" target="_blank" rel="noopener noreferrer" className="link">@Deisgoku</a> and enter your Twitter username below:
        </p>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="@yourhandle"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
          />
        </div>

        <div className="form-group">
          <button onClick={handleUnlock} className="button">
            Unlock
          </button>
        </div>

        {verified && (
          <p className="success-text">You're verified! Welcome aboard.</p>
        )}
      </div>
    </div>
  );
}
