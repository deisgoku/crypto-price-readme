// api/bot.js

const { bot } = require('../telegram/main');

const handler = async (req, res) => {
  if (req.method === 'HEAD') {
   
    res.status(200).end();
    return;
  }

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
};

module.exports = handler;

// biar bisa disable bodyParser di Next.js
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
