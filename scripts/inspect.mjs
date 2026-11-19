/**
 * Dev-only inspector: talks to headless Chrome over CDP.
 * Usage: node scripts/inspect.mjs "<js expression>" [screenshotPath]
 */
const PORT = Number(process.env.CDP_PORT ?? 9222);

const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = tabs.find((t) => t.type === 'page' && t.url.includes('4321'));
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

const expression = process.argv[2] ?? 'document.title';
const res = await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
});

if (res.result?.exceptionDetails) {
  console.error(JSON.stringify(res.result.exceptionDetails, null, 2));
} else {
  console.log(JSON.stringify(res.result?.result?.value, null, 2));
}

const shot = process.argv[3];
if (shot) {
  const png = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(shot, Buffer.from(png.result.data, 'base64'));
  console.log(`saved ${shot}`);
}

ws.close();
