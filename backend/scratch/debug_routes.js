const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const app = require('../src/app'); // Fixed path

function printRoutes(stack, prefix = '') {
  stack.forEach((middleware) => {
    if (middleware.route) {
      // Route middleware
      const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
      console.log(`${methods} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Nested router
      const newPrefix = prefix + (middleware.regexp.source
        .replace('^\\/', '')
        .replace('\\/?(?=\\/|$)', '')
        .replace('\\/', '/')
        .replace('^', '')
        .replace('\\$', '')
        .replace('\\/', '/')
        .replace('\\', ''));
      printRoutes(middleware.handle.stack, newPrefix);
    }
  });
}

console.log('--- Registered Routes ---');
try {
  printRoutes(app._router.stack);
} catch (e) {
  console.log('Error printing routes, possibly complex structure:', e.message);
}
process.exit(0);
