// JELIAN FT POSTS · /api/yt?id=VIDEO_ID
// Trae la miniatura de un video de YouTube para usarla de portada (el navegador no puede
// pedirla directo por CORS). Solo acepta un id de 11 caracteres y solo habla con img.youtube.com.
module.exports = async function handler(req, res) {
  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) { res.status(400).send('id invalido'); return; }
  const tryUrl = async (name) => {
    const r = await fetch('https://img.youtube.com/vi/' + id + '/' + name + '.jpg');
    // YouTube devuelve una imagen gris diminuta (120x90) cuando maxres no existe
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > 2500 ? buf : null;
  };
  try {
    const buf = (await tryUrl('maxresdefault')) || (await tryUrl('sddefault')) || (await tryUrl('hqdefault'));
    if (!buf) { res.status(404).send('sin miniatura'); return; }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).send('no se pudo traer la miniatura');
  }
};
