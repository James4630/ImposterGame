export const socketUUIDMap = new Map<string, WebSocket>();
export const UUIDsocketMap = new Map<WebSocket, string>();

export function addSocket(uuid:string, socket: WebSocket) {
  socketUUIDMap.set(uuid, socket);
  UUIDsocketMap.set(socket, uuid);
};

export function getSocket(uuid:string) {
  return(socketUUIDMap.get(uuid));
};

export function getSocketUUID(socket:WebSocket) {
  return(UUIDsocketMap.get(socket));
}