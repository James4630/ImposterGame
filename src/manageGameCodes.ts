const codesInUse = new Set();
const codesToSocketMap = new Map<WebSocket, number>();

export function generateCode(ws: WebSocket): number {
    let code: number;
    do {
        code = Math.floor(Math.random() * 10_000);
    } while (codesInUse.has(code));
    codesInUse.add(code);
    codesToSocketMap.set(ws, code)
    return code;
}

export function removeCode(ws:WebSocket) {
    codesInUse.delete(codesToSocketMap.get(ws))
    codesToSocketMap.delete(ws)
}