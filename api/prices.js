export default async function handler(req, res) {
  const coin = req.query.coin || "bitcoin";

  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
    const data = await response.json();
    const price = data[coin].usd.toLocaleString();

    res.status(200).json({
      schemaVersion: 1,
      label: coin.toUpperCase(),
      message: `$${price}`,
      color: "blue",
    });
  } catch (error) {
    res.status(500).json({
      schemaVersion: 1,
      label: coin.toUpperCase(),
      message: "error",
      color: "red",
    });
  }
}
