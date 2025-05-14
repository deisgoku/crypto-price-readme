// telegram/server.js
const express = require('express');
const { bot } = require('./main');

const app = express();
app.use(express.json());

app.post('/api/bot', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Telegram bot error:', err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Telegram bot is listening on port ${PORT}`);
});
