// api/bot.js
const { bot } = require('../telegram/bot');

module.exports = {
  config: {
    api: {
      bodyParser: false, 
    },
  },

  default: function handler(req, res) {
    if (req.method === 'POST') {
      bot.handleUpdate(req.body, res);
    } else {
      res.status(405).send('Method Not Allowed');
    }
  },
};
