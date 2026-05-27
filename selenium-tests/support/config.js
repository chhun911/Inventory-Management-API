import 'dotenv/config';

export const config = {
  baseUrl: (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  apiUrl: (process.env.API_URL || 'http://localhost:3000/api').replace(/\/$/, ''),
  browser: (process.env.BROWSER || 'chrome').toLowerCase(),
  headless: (process.env.HEADLESS || 'true').toLowerCase() !== 'false',
  implicitWaitMs: 500,
  defaultTimeoutMs: 8000,
};
