export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    config: {
      nodeEnv: process.env.NODE_ENV,
      debug: process.env.DEBUG,
      publicDebug: process.env.NEXT_PUBLIC_DEBUG,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    }
  });
}
