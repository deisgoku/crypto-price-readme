import { addFollower } from "../lib/follow-check.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Invalid username" });
  }

  try {
    const result = await addFollower(username);

    if (result.status === "error") {
      return res.status(500).json({ success: false, error: "Could not verify" });
    }

    return res.status(200).json({ success: true, status: result.status });
  } catch (err) {
    console.error("Add follower error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
