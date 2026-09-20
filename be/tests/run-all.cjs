const { spawnSync } = require('node:child_process');
const path = require('node:path');

const tests = [
  'auth.integration.cjs',
  'catalog.integration.cjs',
  'product.integration.cjs',
  'cart-favorites.integration.cjs',
  'orders.integration.cjs',
  'payments.integration.cjs',
  'promotions.integration.cjs',
  'reviews.integration.cjs',
  'notifications-socket.integration.cjs',
  'inventory.integration.cjs',
  'dashboard.integration.cjs',
  'security-validation.integration.cjs',
];

for (const test of tests) {
  console.log(`\n=== ${test} ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, test)], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`\nPASS: ${tests.length} integration test suites`);
