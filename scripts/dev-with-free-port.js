const net = require('net');
const { spawn } = require('child_process');

const START_PORT = parseInt(process.env.PORT || '9003', 10);
const MAX_TRIES = 50;

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + MAX_TRIES; port++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${startPort}-${startPort + MAX_TRIES}`);
}

(async () => {
  const port = await findFreePort(START_PORT);
  if (port !== START_PORT) {
    console.log(`Port ${START_PORT} is in use, using next available port ${port} instead.`);
  }

  const child = spawn(
    'next',
    ['dev', '--turbopack', '-p', String(port)],
    { stdio: 'inherit', shell: true }
  );

  child.on('exit', (code) => process.exit(code ?? 0));
})();
