const net = require('net');

const client = new net.Socket();

client.connect(8021, '115.245.218.52', () => {
    console.log('Connected to server');
    client.write('Hello, server! Love, Client.');
});

client.on('data', (data) => {
    console.log('Received: ' + data);
    client.destroy(); // kill client after server's response
});

client.on('close', () => {
    console.log('Connection closed');
});

client.on('error', (err) => {
    console.error('Client error:', err.message);
});
