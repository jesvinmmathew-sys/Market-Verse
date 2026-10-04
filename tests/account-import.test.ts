import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { parsePortfolio, MAX_IMPORT_BYTES } from '../src/services/portfolioImport';
import { accountStorage, selectVerifiedAccount, clearAccountData, accountRequest } from '../src/services/accountStorage';

class MemoryStorage {
  data = new Map<string, string>();
  get length() { return this.data.size; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
}

test('A → guest → B → A isolates data and rejects stale async writes', () => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true });
  localStorage.setItem('marketverse_custom_portfolio', 'unowned legacy data');
  selectVerifiedAccount({ id: 'a' });
  const a = accountStorage();
  assert.equal(a.getItem('marketverse_custom_portfolio'), null);
  a.setItem('portfolio', 'a holdings'); a.setItem('chat', 'a conversation');
  const pending = accountRequest();
  selectVerifiedAccount(null);
  assert.equal(pending.signal.aborted, true);
  pending.release();
  assert.equal(accountStorage().getItem('portfolio'), null);
  accountStorage().setItem('portfolio', 'guest holdings');
  selectVerifiedAccount({ id: 'b' });
  const b = accountStorage();
  assert.equal(b.getItem('portfolio'), null);
  b.setItem('portfolio', 'b holdings');
  a.setItem('portfolio', 'late a completion');
  assert.equal(b.getItem('portfolio'), 'b holdings');
  selectVerifiedAccount({ id: 'a' });
  assert.equal(accountStorage().getItem('portfolio'), 'a holdings');
  assert.equal(accountStorage().getItem('chat'), 'a conversation');
  a.setItem('portfolio', 'stale completion after return');
  assert.equal(accountStorage().getItem('portfolio'), 'a holdings');
  clearAccountData();
  assert.equal(accountStorage().getItem('chat'), null);
  selectVerifiedAccount(null);
  assert.equal(accountStorage().getItem('portfolio'), null);
  assert.equal(localStorage.getItem('marketverse_custom_portfolio'), 'unowned legacy data');
});

const workbook = (rows: any[][], bookType: XLSX.BookType = 'xlsx'): ArrayBuffer => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'Portfolio');
  return XLSX.write(book, { type: 'array', bookType });
};

for (const type of ['xlsx', 'xls', 'csv'] as const) {
  test(`${type.toUpperCase()} imports preserve reordered columns and normalize symbols`, () => {
    const holdings = parsePortfolio(workbook([['Average Price', 'Symbol', 'Quantity'], [1200, 'tcs', 5], [250, 'M&M', 2]], type));
    assert.deepEqual(holdings, [{ symbol: 'TCS', shares: 5, avgBuyPrice: 1200 }, { symbol: 'M&M', shares: 2, avgBuyPrice: 250 }]);
  });
}
test('headerless imports and preamble rows remain supported', () => {
  assert.equal(parsePortfolio(workbook([['TCS', 5, 1200]]))[0].symbol, 'TCS');
  assert.equal(parsePortfolio(workbook([['Portfolio export'], [], ['Symbol', 'Shares', 'Buy Price'], ['INFY', 3, 200]]))[0].symbol, 'INFY');
});
test('oversized, empty, excessive-row and invalid-value imports are rejected', () => {
  assert.throws(() => parsePortfolio(new ArrayBuffer(MAX_IMPORT_BYTES + 1)), /2 MB/);
  assert.throws(() => parsePortfolio(new ArrayBuffer(0)), /nonempty/);
  assert.throws(() => parsePortfolio(workbook([['Symbol', 'Quantity', 'Price'], ...Array.from({ length: 104 }, () => ['TCS', 1, 10])])), /100/);
  assert.throws(() => parsePortfolio(workbook([['<img>', 1, 10], ['TCS', -1, 10], ['INFY', 'Infinity', 1]])), /No valid holdings/);
});


test('fallback operations remain bound to their initiating account', async () => {
  const { getAccountEpoch, assertAccountEpoch } = await import('../src/services/accountStorage');
  selectVerifiedAccount({ id: 'a' });
  const operation = getAccountEpoch();
  selectVerifiedAccount({ id: 'b' });
  assert.throws(() => assertAccountEpoch(operation), /Account changed/);
  selectVerifiedAccount(null);
});

test('chat history filters cards and bounds long conversations', async () => {
  const { boundedChatHistory } = await import('../src/services/chatHistory');
  const input = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: 'x'.repeat(5000) }));
  input.push({ role: 'model', text: '' });
  const result = boundedChatHistory(input);
  assert.ok(result.length <= 12);
  assert.ok(result.every(x => x.text.length > 0 && x.text.length <= 4000));
  assert.ok(result.reduce((n, x) => n + x.text.length, 0) <= 16000);
});
