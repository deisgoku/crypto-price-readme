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
    try {
      const res = await fetch("/api/add-follower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok && data.status) {
        setStatus(data.status);
      } else {
        alert("Unexpected error occurred. Please try again.");
      }
    } catch (err) {
      alert("An error occurred. Check console for details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <h1 style={styles.heading}>Unlock Web3 Tools</h1>
        <p style={styles.subtext}>
          Follow{" "}
          <a href="https://x.com/Deisgoku" target="_blank" style={styles.link}>
            @Deisgoku
          </a>{" "}
          and enter your Twitter username below:
        </p>

        <input
          type="text"
          placeholder="e.g. vitalikbuterin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleUnlock} style={styles.button} disabled={loading}>
          {loading ? "Unlocking..." : "Unlock"}
        </button>

        {status === "newly_verified" && (
          <p style={styles.success}>
            You're verified! Welcome aboard.
          </p>
        )}
        {status === "already_verified" && (
          <p style={styles.notice}>
            You're already verified.
          </p>
        )}
        {status === "error" && (
          <p style={styles.error}>
            Something went wrong. Try again later.
          </p>
        )}
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
  },
  success: {
    color: "#3fb950",
    marginTop: "1rem",
    fontWeight: "bold",
  },
  notice: {
    color: "#d29922",
    marginTop: "1rem",
    fontWeight: "bold",
  },
  error: {
    color: "#f85149",
    marginTop: "1rem",
    fontWeight: "bold",
  },
  link: {
    color: "#58a6ff",
    textDecoration: "underline",
  },
};
