// api/brave.js

export default async function handler(req, res) {
  const { q } = req.query;

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5`, {
      headers: {
         "Accept": "application/json",
      "X-Subscription-Token": "BSAfOZTrGWsNHR35T6D893FoK7A0Hc9"
      }
    });

    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener resultados" });
  }
}
