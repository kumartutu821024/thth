export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID missing" });

  try {
    const response = await fetch(`https://sangam.free.nf/TARGET/api.php?id=${id}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://sangam.free.nf/",
        "Cache-Control": "no-cache"
      }
    });

    const text = await response.text();

    // Check if the response is actually JSON or the 'Javascript Required' error page
    if (text.includes("document.cookie") || text.includes("Checking your browser")) {
       return res.status(503).json({
         error: "API provider is blocking the request with a Javascript challenge.",
         hint: "InfinityFree often blocks server-side requests. Consider moving api.php to a professional host like Hostinger or a VPS."
       });
    }

    try {
      const data = JSON.parse(text);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(data);
    } catch (parseError) {
      res.status(500).json({ error: "API returned invalid JSON", raw: text.substring(0, 500) });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to connect to API", details: error.message });
  }
}
