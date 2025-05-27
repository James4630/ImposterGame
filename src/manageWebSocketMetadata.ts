const socketMetadata = new Map<WebSocket, { userName: string}>();

export function setSocketUserName(ws:WebSocket, name: string) {
    socketMetadata.set(ws, { userName: name});
}

export function getSocketUserName(ws:WebSocket):string {
    return(socketMetadata.get(ws)?.userName ?? 'undefined');
}