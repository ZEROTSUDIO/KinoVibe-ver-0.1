// API Health check endpoint

export default function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    version: '0.2.0',
    timestamp: new Date().toISOString()
  });
}
