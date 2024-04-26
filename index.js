const net = require('net');

// Define the IP address and port to listen on
const IP_ADDRESS = '115.245.218.52'; // Use '0.0.0.0' to listen on all available network interfaces
const PORT = 8012;

// Create a TCP server
const server = net.createServer((socket) => {
    // Connection callback - this function is called whenever a new client connects
    console.log('Client connected');

    // Handle incoming data from the client
    socket.on('data', (data) => {
        console.log('Received data:', data.toString());
    });

    // Handle client disconnection
    socket.on('end', () => {
        console.log('Client disconnected');
    });
});

// Start listening for connections
server.listen(PORT, IP_ADDRESS, () => {
    console.log(`Server listening on ${IP_ADDRESS}:${PORT}`);
});
