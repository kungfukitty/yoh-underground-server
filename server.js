import cors from 'cors';

const allowedOrigins = new Set([
  'http://www.yohunderground.fun',
  'https://www.yohunderground.fun',
  // add more origins if needed
]);

const dynamicCorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      // Reflect the exact origin back in Access-Control-Allow-Origin header
      return callback(null, origin);
    }

    // Origin not allowed
    return callback(new Error('CORS policy does not allow access from this origin'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies and auth headers to be sent
  optionsSuccessStatus: 204, // For legacy browsers support
};

export default dynamicCorsOptions;
