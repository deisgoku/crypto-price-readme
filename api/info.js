const cardInfo = require("../lib/settings/data/info");

module.exports = (req, res) => {
  const tableRows = cardInfo.themes.map(theme => {
    return `
      <tr>
        <td style="border: 1px solid black; padding: 5px;">${theme}</td>
        <td style="border: 1px solid black; padding: 5px;">${cardInfo.styles[theme]}</td>
      </tr>`;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="text-align: center; margin: 0;">Crypto-Readme Card Feature</h2>
          <h3 style="text-align: center; margin: 5px 0 20px 0;">V. ${cardInfo.version}</h3>
          <table style="width: 100%; border: 2px solid black; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="border: 1px solid black; padding: 8px;">Available Theme</th>
                <th style="border: 1px solid black; padding: 8px;">Available Style</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </foreignObject>
    </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
};
