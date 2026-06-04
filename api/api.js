export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID missing" });

  try {
    const response = await fetch(`https://sangam.free.nf/TARGET/api.php?id=${id}`);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
