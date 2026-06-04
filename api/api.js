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
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

    const text = await response.text();

    if (text.includes("document.cookie") || text.includes("Checking your browser") || text.includes("Javascript Required")) {
       return res.status(503).json({
         error: "API provider (InfinityFree) is blocking Vercel.",
         hint: "InfinityFree doesn't allow server-side data fetching. Please move api.php to Hostinger or any paid hosting."
       });
    }

    try {
      const data = JSON.parse(text);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(data);
    } catch (parseError) {
      res.status(500).json({ error: "API returned non-JSON response", preview: text.substring(0, 200) });
    }
  } catch (error) {
    res.status(500).json({ error: "Connection Failed", details: error.message });
  }
}
