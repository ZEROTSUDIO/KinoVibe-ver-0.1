// Vercel Serverless Function: TMDB Movie Details Proxy
// Keeps TMDB_API_KEY secure on the server

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'Valid numeric movie ID is required' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('Server Configuration Error: TMDB_API_KEY is not set');
    return res.status(500).json({
      error: 'TMDB API key is not configured on the server. Please set TMDB_API_KEY in environment variables.'
    });
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}`);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('language', 'en-US');

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `TMDB upstream error: ${response.statusText}`
      });
    }

    const data = await response.json();

    // Cache movie details for 1 day at edge (movie details rarely change)
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(data);
  } catch (err) {
    console.error('TMDB Details Proxy Error:', err);
    return res.status(500).json({ error: 'Failed to fetch movie details from TMDB' });
  }
}
