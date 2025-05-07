// api/bot.js
const { bot } = require('../telegram/bot');

module.exports = {
  config: {
    api: {
      bodyParser: false, 
    },
  },

  default: async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        await bot.handleUpdate(update);
        res.status(200).end();
      } catch (err) {
        console.error('Error handling update:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  },
};
