export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Falta el parámetro 'query'" });
  }

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": "BSAfOZTrGWsNHR35T6D893FoK7A0Hc9"
      }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al contactar con Brave", detalle: error.message });
  }
}
