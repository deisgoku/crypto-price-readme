import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch("/api/add-follower", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        setUnlocked(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6">
      <Card className="w-full max-w-md text-white border border-sky-800 bg-[#0f172a]/80 shadow-xl">
        <CardContent className="py-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Unlock Access</h1>
          <p className="text-sm mb-3 text-center">
            Please visit my Twitter profile first:
            <br />
            <a
              href="https://x.com/Deisgoku"
              target="_blank"
              className="text-sky-400 hover:underline"
            >
              @Deisgoku
            </a>
          </p>
          <p className="text-sm italic text-center mb-4">
            Make sure you've followed the account before unlocking.
          </p>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Enter your Twitter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-black"
            />
            <Button onClick={handleUnlock} disabled={loading || unlocked}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : unlocked ? (
                "Unlocked!"
              ) : (
                "Unlock"
              )}
            </Button>
          </div>
          <blockquote className="text-xs text-center mt-6 text-slate-400 italic">
            “Appreciating Web3 creations is essential. It keeps us connected and respectful in this decentralized journey.”
          </blockquote>
        </CardContent>
      </Card>
    </main>
  );
}
