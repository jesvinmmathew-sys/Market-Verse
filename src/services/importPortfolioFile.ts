// Keep parsing off the UI thread and terminate expensive/corrupt imports.
export function importPortfolioFile(file: File, signal: AbortSignal): Promise<import('./portfolioImport').ImportedHolding[]> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('Import cancelled'));
    if (!file.size || file.size > 2 * 1024 * 1024 || !/\.(csv|xlsx|xls)$/i.test(file.name)) return reject(new Error('Choose a CSV, XLS, or XLSX file no larger than 2 MB.'));
    let settled = false;
    const worker = new Worker(new URL('./portfolioImport.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => { settled = true; clearTimeout(timer); worker.terminate(); signal.removeEventListener('abort', abort); };
    const fail = (message: string) => { cleanup(); reject(new Error(message)); };
    const abort = () => fail('Import cancelled');
    const timer = setTimeout(() => fail('Import timed out. Try a smaller or simpler workbook.'), 5000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => fail('Unable to read portfolio file.');
    worker.onmessage = event => {
      if (event.data.error) return fail(event.data.error);
      cleanup(); resolve(event.data.holdings);
    };
    file.arrayBuffer().then(bytes => { if (!settled && !signal.aborted) worker.postMessage(bytes, [bytes]); }).catch(() => fail('Unable to read portfolio file.'));
  });
}
