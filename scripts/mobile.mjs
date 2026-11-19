/**
 * Dev-only mobile capture: emulates a 390 × 844 viewport and shoots each section,
 * plus the head and figure of every case file.
 */
import { writeFile } from 'node:fs/promises';

const PORT = Number(process.env.CDP_PORT ?? 9333);
const OUT = process.env.SHOT_DIR ?? 'shots';
const BASE = process.env.SITE ?? 'http://127.0.0.1:4321';

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
const evaluate = (expression) =>
  send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });

const shoot = async (file) => {
  const png = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${OUT}/${file}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(file);
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});

const sections = [
  ['m-hero', 0],
  ['m-work', '#work'],
  ['m-method', '#method'],
  ['m-lab', '#lab'],
  ['m-elsewhere', '#elsewhere'],
  ['m-contact', '#contact'],
];

await send('Page.navigate', { url: `${BASE}/` });
await wait(1600);

for (const [name, target] of sections) {
  const top = target === 0 ? 0 : `document.querySelector('${target}').offsetTop - 56`;
  await evaluate(`window.scrollTo({ top: ${top}, behavior: 'instant' })`);
  await wait(900);
  await shoot(name);
}

const cases = [
  ['verdict', '/work/verdict'],
  ['tb', '/work/tb-amr'],
  ['transit', '/work/karnataka-transit'],
  ['sweety', '/work/sweety'],
];

for (const [name, path] of cases) {
  await send('Page.navigate', { url: `${BASE}${path}` });
  await wait(1500);
  await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
  await wait(400);
  await shoot(`m-case-${name}-head`);

  await evaluate(
    `window.scrollTo({ top: document.querySelector('.cplate').offsetTop - 70, behavior: 'instant' })`
  );
  await wait(600);
  await shoot(`m-case-${name}-figure`);
}

ws.close();
