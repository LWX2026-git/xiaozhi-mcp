const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 配置
const API_BASE = 'https://liuwenxuan3dp.ct.ws/chat/xzapi.php';
const TOKEN = '1ee0c4cd550d539fdeb46135a30f38d6ea93e1615b3ff8f9781cfb297b7ca824';
const USERNAME = '刘文轩的3D打印';
const PASSWORD = 'liuwenxuan3dp-2026@Lwx';
const ROOM = '00f736cc';

app.get('/', (req, res) => {
  res.json({
    name: 'Xiaozhi MCP Server',
    version: '1.0',
    status: 'running'
  });
});

wss.on('connection', (ws) => {
  console.log('Connected');
  
  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      
      if (msg.method === 'initialize') {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'chatroom-mcp', version: '1.0' }
          }
        }));
      }
      else if (msg.method === 'tools/list') {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            tools: [{
              name: 'send_chat_message',
              description: 'Send message to chatroom',
              inputSchema: {
                type: 'object',
                properties: { message: { type: 'string' } },
                required: ['message']
              }
            }]
          }
        }));
      }
      else if (msg.method === 'tools/call') {
        const toolName = msg.params && msg.params.name ? msg.params.name : '';
        const args = msg.params && msg.params.arguments ? msg.params.arguments : {};
        let resultText = '';
        
        if (toolName === 'send_chat_message') {
          const message = args.message ? encodeURIComponent(args.message) : '';
          const url = API_BASE + '?action=ai_chat&message=' + message + '&token=' + TOKEN + '&username=' + encodeURIComponent(USERNAME) + '&password=' + encodeURIComponent(PASSWORD) + '&room=' + ROOM;
          
          try {
            const resp = await fetch(url);
            const data = await resp.json();
            resultText = data.result ? data.result : 'Failed';
          } catch (e) {
            resultText = 'Error: ' + e.message;
          }
        }
        
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            content: [{ type: 'text', text: resultText }],
            isError: false
          }
        }));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
