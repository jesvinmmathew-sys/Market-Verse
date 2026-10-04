/** Keep recent textual conversation within the server's bounded input contract. */
export function boundedChatHistory(history: { role: string; text: string }[]) {
  const result: { role: string; text: string }[] = [];
  let remaining = 16000;
  for (const entry of [...history].reverse()) {
    if (entry.role !== 'user' && entry.role !== 'model') continue;
    const text = entry.text.trim().slice(-Math.min(4000, remaining));
    if (!text) continue;
    result.unshift({ role: entry.role, text });
    remaining -= text.length;
    if (result.length === 12 || remaining === 0) break;
  }
  return result;
}
