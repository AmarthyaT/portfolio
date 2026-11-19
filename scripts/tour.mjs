/**
 * Dev-only visual tour: scrolls through the page and saves viewport shots,
 * then dumps each Field substrate to its own PNG.
 */
import { writeFile } from 'node:fs/promises';

const PORT = Number(process.env.CDP_PORT ?? 9333);
const OUT = process.env.SHOT_DIR ?? 'shots';

const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = tabs.find((t) => t.type === 'page' && t.url.includes('127.0.0.1'));
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
const evaluate = (expression) => send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });

await send('Page.enable');

const sections = [
  ['tour-hero', '#top'],
  ['tour-work', '#work'],
  ['tour-method', '#method'],
  ['tour-lab', '#lab'],
  ['tour-elsewhere', '#elsewhere'],
  ['tour-contact', '#contact'],
];

for (const [name, selector] of sections) {
  await evaluate(`window.scrollTo({ top: ${selector === '#top' ? 0 : `document.querySelector('${selector}').offsetTop - 72`}, behavior: 'instant' })`);
  await wait(950);
  const png = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(name);
}

// substrate plates, at native canvas resolution
await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
await wait(700);

const ids = ['rag', 'llama', 'qwen', 'tb', 'transit', 'sweety', 'butterfly'];
for (const topo of ids) {
  await evaluate(`document.querySelector('[data-topo="${topo}"]').click()`);
  await wait(1250);
  const res = await evaluate(`document.querySelector('#field-canvas').toDataURL('image/png')`);
  const dataUrl = res.result?.result?.value ?? '';
  if (!dataUrl.startsWith('data:image/png')) {
    console.log(`skip ${topo}`);
    continue;
  }
  await writeFile(`${OUT}/field-${topo}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log(`field-${topo}`);
}

ws.close();
