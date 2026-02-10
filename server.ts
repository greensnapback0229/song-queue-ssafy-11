import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // noServer 모드로 생성 - upgrade 이벤트를 직접 핸들링
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WebSocket>();

  // 현재 세션의 댓글을 메모리에 보관 (노래 완료 시 초기화)
  let sessionComments: Array<{ type: string; nickname: string; content: string; timestamp: number }> = [];

  // /ws 경로만 WebSocket으로 처리 (Next.js 내부 WS와 충돌 방지)
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '/', `http://${hostname}:${port}`);

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Next.js 내부 WebSocket 등 다른 요청은 무시
      socket.destroy();
    }
  });

  // 30초마다 ping으로 연결 유지 (nginx 타임아웃 방지)
  const pingInterval = setInterval(() => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    // 새 클라이언트에게 기존 댓글 히스토리 전송
    if (sessionComments.length > 0) {
      ws.send(JSON.stringify({ type: 'history', comments: sessionComments }));
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'comment') {
          // 메모리에 저장
          sessionComments.push(data);
          // 모든 클라이언트에게 브로드캐스트
          const msg = JSON.stringify(data);
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(msg);
            }
          });
        } else if (data.type === 'clear_comments') {
          // 노래 완료 시 댓글 초기화
          sessionComments = [];
        }
      } catch (err) {
        console.error('Invalid WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket running on same port`);
  });
});
