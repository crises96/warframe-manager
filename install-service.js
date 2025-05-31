const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'Warframe Manager',
  description: 'Servicio para la aplicación Warframe Manager',
  script: path.join(__dirname, 'server.js'),
  env: {
    name: "NODE_ENV",
    value: "production"
  }
});

svc.on('install', () => {
  svc.start();
  console.log('Servicio instalado y ejecutándose');
});

svc.on('error', (err) => {
  console.error('Error:', err);
});

svc.install();