export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID missing" });

  try {
    const response = await fetch(`https://sangam.free.nf/TARGET/test.php?id=${id}`);
    const text = await response.text();

    let v = id;
    const match = text.match(/v=([^"&'\s]+)/);
    if (match) {
        v = match[1];
    } else if (text.trim().length > 5 && text.trim().length < 100) {
        v = text.trim();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ v });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video info" });
  }
}
