// Runtime environment config — overwritten by nginx entrypoint in production.
// In local dev this file is served as-is by ng serve.
window.__env = {
  apiUrl: 'http://localhost:3000/api',
  sentryDsn: '',
};
