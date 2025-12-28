const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'API Gateway', dir: 'services/api-gateway', port: 3000 },
  { name: 'Auth Service', dir: 'services/auth-service', port: 3001 },
  { name: 'Product Service', dir: 'services/product-service', port: 3002 },
  { name: 'Cart Service', dir: 'services/cart-service', port: 3003 },
  { name: 'Order Service', dir: 'services/order-service', port: 3004 },
  { name: 'Payment Service', dir: 'services/payment-service', port: 3005 },
  { name: 'Discount Service', dir: 'services/discount-service', port: 3006 },
  { name: 'Admin Service', dir: 'services/admin-service', port: 3007 },
  { name: 'Notification Service', dir: 'services/notification-service', port: 3008 }
];

console.log('Starting all services...\n');

services.forEach(service => {
  const servicePath = path.join(__dirname, '..', service.dir);
  
  const child = spawn('npm', ['start'], {
    cwd: servicePath,
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (error) => {
    console.error(`Error starting ${service.name}:`, error);
  });

  console.log(`✓ ${service.name} starting on port ${service.port}`);
});

console.log('\nAll services started. Press Ctrl+C to stop all services.');
