const express = require('express');
const app = express();
const port = 8021;
const utils = require('./utils');
const net = require('net');
const commandutile = require('./command');
const fs = require('fs');
const filePath = 'data.txt';

// Define the IP address and port to listen on
const IP_ADDRESS = '115.245.218.52'; 
const PORT = 8021;




const server = net.createServer((socket) => {
    console.log('Client connected!');

   

   const command = '0x4001'; // PID for latitude
    const long = '' 
    // socket.write("0xF1 0x00");
    // socket.write('0x2802');
    socket.write(command);
    // Handle data received from the client
    socket.on('data', (data) => {
       
        commandutile.encodeOBD(data);
       console.log(data);
       console.log('Received data from client:', data);

        // const request = data; // Replace with your actual request data
        // const hexString = '0x4001';
        // const rawHex = Buffer.from(hexString, 'hex');
        // socket.write(rawHex); // Send the request to the device
        // Echo back the received data to the client
     
    });



    // const command = 'AT+STATUS\r\n';
    socket.write(command);

    // Handle client disconnection
    socket.on('end', () => {
        console.log('Client disconnected!');
    });
});


server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});