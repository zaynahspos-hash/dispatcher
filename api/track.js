/**
 * Serverless high-fidelity PostEx Tracking Proxy
 * Endpoints: GET /api/track?cn=... or POST /api/track { trackingNumber }
 * Connects directly to https://postex.pk/api/tracking-order (same backend used by postex.pk/tracking)
 * Eliminates browser CORS blocks and sync lag from merchant integration API
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const trackingNumber =
    req.query?.trackingNumber ||
    req.query?.cn ||
    req.body?.trackingNumber ||
    req.body?.cn ||
    '';

  const cleanCN = String(trackingNumber).trim();
  if (!cleanCN) {
    return res.status(400).json({
      statusCode: '400',
      statusMessage: 'Tracking number is missing'
    });
  }

  try {
    const postexRes = await fetch('https://postex.pk/api/tracking-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ trackingNumber: cleanCN })
    });

    if (!postexRes.ok) {
      return res.status(postexRes.status).json({
        statusCode: String(postexRes.status),
        statusMessage: `PostEx responded with status ${postexRes.status}`
      });
    }

    const data = await postexRes.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('[API /api/track Error]', err);
    return res.status(500).json({
      statusCode: '500',
      statusMessage: err.message || 'Server error while fetching tracking status'
    });
  }
}
