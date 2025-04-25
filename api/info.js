const cardInfo = require("../lib/settings/data/info");

module.exports = (req, res) => {
  // Membagi themes menjadi dua kolom
  const halfLength = Math.ceil(cardInfo.themes.length / 2);
  const firstColumn = cardInfo.themes.slice(0, halfLength);
  const secondColumn = cardInfo.themes.slice(halfLength);

  // Membuat baris untuk kolom pertama
  const firstColumnRows = firstColumn.map((theme, index) => {
    // Mengatur warna zebra (setiap baris ganjil dan genap)
    const rowClass = index % 2 === 0 ? 'even' : 'odd';
    return `
      <tr class="${rowClass}">
        <td style="border: 1px solid black; padding: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">${theme}</td>
        <td style="border: 1px solid black; padding: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">${cardInfo.styles[theme]}</td>
      </tr>`;
  }).join("");

  // Membuat baris untuk kolom kedua
  const secondColumnRows = secondColumn.map((theme, index) => {
    // Mengatur warna zebra (setiap baris ganjil dan genap)
    const rowClass = index % 2 === 0 ? 'even' : 'odd';
    return `
      <tr class="${rowClass}">
        <td style="border: 1px solid black; padding: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">${theme}</td>
        <td style="border: 1px solid black; padding: 5px; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">${cardInfo.styles[theme]}</td>
      </tr>`;
  }).join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="text-align: center; margin: 0;">Crypto-Readme Card Feature</h2>
          <h3 style="text-align: center; margin: 5px 0 20px 0;">V. ${cardInfo.version}</h3>
          <style>
            /* Gaya zebra striping */
            .even {
              background-color: #f9f9f9;
            }
            .odd {
              background-color: #ffffff;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              padding: 8px;
              border: 1px solid black;
              box-shadow: 2px 2px 5px rgba(0,0,0,0.1); /* Border shadow */
            }
            th {
              background-color: #f4f4f4;
            }
          </style>
          <table>
            <thead>
              <tr>
                <th colspan="2" style="text-align: center;">Available Theme (Column 1)</th>
                <th colspan="2" style="text-align: center;">Available Theme (Column 2)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="2">
                  <table style="width: 100%; border: 0; font-size: 14px;">
                    ${firstColumnRows}
                  </table>
                </td>
                <td colspan="2">
                  <table style="width: 100%; border: 0; font-size: 14px;">
                    ${secondColumnRows}
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </foreignObject>
    </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
};
