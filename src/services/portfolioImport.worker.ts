import { parsePortfolio } from './portfolioImport';

self.onmessage = (event: MessageEvent<ArrayBuffer>) => {
  try { self.postMessage({ holdings: parsePortfolio(event.data) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Unable to read portfolio file.' }); }
};
