import { isFollower, addFollower } from "@/lib/follow-check";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Invalid username" });
  }

  try {
    // Cek apakah username sudah di-list (misalnya via Redis)
    const alreadyFollower = await isFollower(username);

    if (alreadyFollower) {
      return res.status(200).json({ success: true, verified: true });
    }

    // Jika belum, tambahkan ke Redis atau list follower
    await addFollower(username);

    return res.status(200).json({ success: true, verified: false });
  } catch (err) {
    console.error("Add follower error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
