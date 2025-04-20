import { useState } from "react";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!username.trim()) {
      alert("Please enter your Twitter username first!");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/add-follower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setStatus(data.status); // "already_verified" or "newly_verified"
      } else {
        alert("Failed to verify. " + (data.error || ""));
      }
    } catch (err) {
      setLoading(false);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome Web3 Builder!</h1>
        <p style={styles.subtext}>
          Make sure you've followed my Twitter:{" "}
          <a href="https://x.com/Deisgoku" target="_blank" style={styles.link}>
            @Deisgoku
          </a>
        </p>
        <p style={styles.label}>Enter your Twitter username:</p>
        <input
          type="text"
          placeholder="e.g. satoshinakamoto"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleUnlock} style={styles.button} disabled={loading}>
          {loading ? "Unlocking..." : "Unlock"}
        </button>

        {status === "newly_verified" && (
          <p style={styles.success}>
            Thanks! You’re verified now. Access granted.
          </p>
        )}
        {status === "already_verified" && (
          <p style={styles.success}>
            Welcome back! You’re already verified.
          </p>
        )}

        <blockquote style={styles.quote}>
          “Appreciation in Web3 is crucial — it keeps us connected and
          respectful of each other’s work.”
        </blockquote>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#0d1117",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, #1f6feb55, transparent 70%), radial-gradient(circle at bottom right, #58a6ff22, transparent 70%)",
    zIndex: 0,
    animation: "bgPulse 10s ease-in-out infinite",
  },
  card: {
    position: "relative",
    background: "#161b22",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)",
    zIndex: 1,
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  heading: {
    fontSize: "1.8rem",
    marginBottom: "1rem",
  },
  subtext: {
    marginBottom: "1rem",
  },
  label: {
    textAlign: "left",
    marginBottom: "0.25rem",
    fontWeight: "bold",
    color: "#c9d1d9",
  },
  input: {
    width: "100%",
    padding: "0.6rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: "1px solid #30363d",
    backgroundColor: "#0d1117",
    color: "#fff",
  },
  button: {
    width: "100%",
    padding: "0.6rem",
    background: "#238636",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s",
  },
  success: {
    color: "#3fb950",
    marginTop: "1rem",
    fontWeight: "bold",
  },
  quote: {
    marginTop: "2rem",
    fontStyle: "italic",
    color: "#8b949e",
    fontSize: "0.95rem",
  },
  link: {
    color: "#58a6ff",
    textDecoration: "underline",
  },
};
