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
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in add-follower API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
