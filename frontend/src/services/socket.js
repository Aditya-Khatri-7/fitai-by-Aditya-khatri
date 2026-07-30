import { io } from 'socket.io-client';

// Same-origin-as-page host so this keeps working over the LAN/mobile access
// setup (frontend on :5173, backend on :3000, both reached via the same IP) —
// mirrors why api.js uses a relative baseURL instead of a hardcoded localhost.
const SOCKET_URL = `${window.location.protocol}//${window.location.hostname}:3000`;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, transports: ['websocket', 'polling'] });
  }
  return socket;
}
