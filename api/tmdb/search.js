// Vercel Serverless Function: TMDB Search Proxy
// Keeps TMDB_API_KEY secure on the server

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, page = 1 } = req.query;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(200).json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('Server Configuration Error: TMDB_API_KEY is not set');
    return res.status(500).json({
      error: 'TMDB API key is not configured on the server. Please set TMDB_API_KEY in environment variables.'
    });
  }

  try {
    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('query', query.trim());
    url.searchParams.set('page', String(page));
    url.searchParams.set('include_adult', 'false');
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

    // Cache successful search results for 1 hour at edge, 24h stale-while-revalidate
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  } catch (err) {
    console.error('TMDB Search Proxy Error:', err);
    return res.status(500).json({ error: 'Failed to fetch search results from TMDB' });
  }
}
