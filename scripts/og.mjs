/**
 * Dev-only: render /og at 1200 × 630 and write public/og.png.
 */
import { writeFile } from 'node:fs/promises';

const PORT = Number(process.env.CDP_PORT ?? 9333);
const BASE = process.env.SITE ?? 'http://127.0.0.1:4322';

const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = tabs.find((t) => t.type === 'page');
if (!page) {
  console.error('no page');
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
await new Promise((resolve) => ws.addEventListener('open', resolve));

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const next = ++id;
    pending.set(next, resolve);
    ws.send(JSON.stringify({ id: next, method, params }));
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1200,
  height: 630,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: `${BASE}/og` });
await wait(1800);

const png = await send('Page.captureScreenshot', { format: 'png' });
await writeFile('public/og.png', Buffer.from(png.result.data, 'base64'));
console.log('public/og.png');

ws.close();
