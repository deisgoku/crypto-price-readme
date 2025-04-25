export default function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="text-align: center; margin: 0;">Crypto-Readme Card Feature</h2>
          <h3 style="text-align: center; margin: 5px 0 20px 0;">V. 1.5.6 (PRO)</h3>
          <table style="width: 100%; border: 2px solid black; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="border: 1px solid black; padding: 8px;">Available Theme</th>
                <th style="border: 1px solid black; padding: 8px;">Available Style</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style="border: 1px solid black; padding: 5px;">dark</td><td style="border: 1px solid black; padding: 5px;">Modern</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">dracula</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">nord</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">monokai</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">palenight</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">gruvbox</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">ayu</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">flux</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">light</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">solarized</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">material</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">nighttowl</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">codedark</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">tokyonight</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">onedark</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
              <tr><td style="border: 1px solid black; padding: 5px;">other</td><td style="border: 1px solid black; padding: 5px;">available soon</td></tr>
            </tbody>
          </table>
        </div>
      </foreignObject>
    </svg>
  `);
}
