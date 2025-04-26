import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Copy } from "lucide-react";
import Turnstile from "react-turnstile";

export default function UnlockPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");

  const handleUnlock = async () => {
    if (!username.trim()) {
      toast.error("Please enter your Twitter username.");
      return;
    }

    if (username.includes("@")) {
      toast.error("Don't include '@' in your username.");
      return;
    }

    if (!token) {
      toast.error("Please complete the CAPTCHA first.");
      return;
    }

    setLoading(true);

    try {
      const checkRes = await fetch("/api/follow-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, token }),
      });

      const { status } = await checkRes.json();

      if (status === "already_verified" || status === "newly_verified") {
        await fetch("/api/add-follower", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        toast.success(`Welcome, @${username}! Unlock Success.`);
        
        setUrl(
          `https://crypto-price-on.vercel.app/api/card?user=${username}&model=modern&theme=dark&coin=5&category=layer-1`
        );
      } else {
        toast.error("Verification failed. Please make sure you've followed us.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("URL copied!");
  };

  const handleCopyHtml = () => {
    if (!url) return;
    const html = `<img src="${url}" alt="Crypto Card" />`;
    navigator.clipboard.writeText(html);
    toast.success("HTML copied!");
  };

  return (
    <div className="unlock-wrapper min-h-screen flex justify-center items-center p-4 bg-black">
      <div className="unlock-card bg-[#1e1e1e] p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white text-center mb-4">Unlock Card Tools</h1>

        <p className="text-center text-gray-300 mb-6">
          Follow{" "}
          <a
            href="https://twitter.com/Deisgoku"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            @Deisgoku
          </a>{" "}
          and enter your Twitter username below:
        </p>

        <div className="form-group mb-4">
          <input
            type="text"
            placeholder="e.g. vitalikbutterin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* CAPTCHA */}
        <div className="form-group flex justify-center my-4">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setToken(token)}
            className="rounded-md scale-90 shadow-sm"
          />
        </div>

        <div className="form-group">
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Unlocking...
              </>
            ) : (
              "Unlock"
            )}
          </button>
        </div>

        {url && (
          <>
            <div className="mt-6 px-4">
              <h2 className="text-white font-semibold mb-2 text-center">Your Card URL:</h2>
              <div className="bg-gray-800 text-white text-sm p-4 rounded-md break-words text-center w-full overflow-x-auto">
                {url}
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 px-4">
              <button
                onClick={handleCopyUrl}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Copy className="h-5 w-5" />
                Copy URL
              </button>

              <button
                onClick={handleCopyHtml}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Copy className="h-5 w-5" />
                Copy HTML
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
