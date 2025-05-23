

export default function PrivacyPolicy() {
  const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME;

  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <img src="/icon.png" alt="Logo" width="100" />
        <h1>CRYPTO MARKET CARD</h1>
        <h2>Privacy Policy</h2>
      </div>

      <p>
        At Market Assistant Bot, accessible via{' '}
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{botUsername}
        </a>{' '}
        on Telegram, user privacy is our top priority.
      </p>

      <p>
        This Privacy Policy document outlines the types of information collected,
        used, and protected by the bot.
      </p>

      <h3>1. Information We Collect</h3>
      <p>
        The bot does not store any personal data permanently. All data is used
        only during the active session of interaction.
      </p>

      <h3>2. How We Use the Information</h3>
      <p>
        The data is used to operate bot features such as market analysis,
        group management, and automated responses.
      </p>

      <h3>3. Contact Us</h3>
      <p>
        If you have any questions, feel free to reach out via Telegram:{' '}
        <a
          href="https://t.me/deisgoku"
          target="_blank"
          rel="noopener noreferrer"
        >
          @deisgoku
        </a>
      </p>

      <p className="privacy-updated">
        Last updated: May 23, 2025
      </p>
    </div>
  );
}
