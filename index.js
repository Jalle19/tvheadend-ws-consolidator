const fs = require('fs')
const YAML = require('yaml')
const WebSocket = require('ws');

const configuration = YAML.parse(fs.readFileSync('./config.yml', 'utf8'))
const wss = new WebSocket.Server({
  host: configuration.websocket.listenAddress,
  port: configuration.websocket.listenPort
});

console.log(`Listening for WebSocket connections on ws://${configuration.websocket.listenAddress}:${configuration.websocket.listenPort}`);

configuration.servers.forEach(server => {
  const ws = new WebSocket(`ws://${server.username}:${server.password}@${server.hostname}:${server.port}/comet/ws`, ['tvheadend-comet']);

  ws.on('open', () => {
    console.log(`Connected to server "${server.name}" at ${server.hostname}`);
  });

  ws.on('message', (data) => {
    const rawMessage = JSON.parse(data);

    rawMessage.messages.forEach((message) => {
      if (configuration.messages.includes(message.notificationClass)) {
        const serverMessage = JSON.stringify({
          server: server.name,
          message: message
        });

        console.log(`Broadcasting ${serverMessage} to all connected clients`);

        wss.clients.forEach((client) => {
          client.send(serverMessage);
        });
      }
    });
  });
});
