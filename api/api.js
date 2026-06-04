export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID missing" });

  try {
    const response = await fetch(`https://sangam.free.nf/TARGET/api.php?id=${id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://sangam.free.nf/"
      }
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(data);
    } catch (parseError) {
      console.error("JSON Parse Error. Response was:", text);
      res.status(500).json({ error: "Invalid JSON from source API", raw: text });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data", details: error.message });
  }
}
