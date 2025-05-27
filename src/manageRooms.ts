import { getSocketUserName } from "./manageWebSocketMetadata.ts";
import { ResponseMessage } from "./types.ts";

const rooms = new Map<number, WebSocket[]>();
const roomsNames = new Map<number, (string | undefined)[]>();

export function addPlayerToRoom(code:number, ws:WebSocket, createRoom:boolean):boolean {
    if (rooms.has(code) && !createRoom) {
        rooms.get(code)?.push(ws)
        console.log('added player to room (room already existed): ', rooms)

    } else if (createRoom) {
        rooms.set(code, [ws]);
        console.log('added player to room and created room: ', rooms)

    } else {
        console.log('room doesn`t exist. player not added');
        return false;
    }
    pushRooms(code);
    return true;
}

export function removePlayerFromRoom(ws:WebSocket) {
    //search for ws
    let found:boolean = false
    for (const [key, array] of rooms) {
        if (array.includes(ws)) {
            const index:number = rooms.get(key)?.indexOf(ws) ?? -1
            rooms.get(key)?.splice(index,1)

            //delete room if now empty
            if (rooms.get(key)?.length === 0) {
                rooms.delete(key);
                console.log(`deleted room ${key}: `, rooms)
            }

            found = true
            pushRooms(key);
            break;
        }
    }
    if (!found) {
        console.log('Player wasn`t in an room')
    }
}

export function pushGameStart(host:string, playerMap: Map<string,string>) {
    
    const playersInRoom: WebSocket[] | undefined = rooms.get(getKeyOfPlayerName(host));

    playersInRoom?.forEach(player => {

        const response: ResponseMessage = {
            type: 'response',
            resource: 'game-start',
            status: 'success',
            data: playerMap.get(getSocketUserName(player)),
        }

        player.send(JSON.stringify(response));
    });
    
}

function getKeyOfPlayerName(playerName:string):number {
    let found:boolean = false
    for (const [key, array] of roomsNames) {
        if (array.includes(playerName)) {
            found = true
            return key;
        }
    }
    if (!found) {
        console.error('player who started Game wasn`t found in Map')
        return -1;
    }
    return -1;
}

function updateRoomsNames() {
    roomsNames.clear();
    for (const [roomId, sockets] of rooms.entries()) {
      const names = sockets.map(socket => getSocketUserName(socket));
      roomsNames.set(roomId, names);
    }
}

function pushRooms(room:number) {
    updateRoomsNames();
    
    const response: ResponseMessage = {
        type: 'response',
        resource: 'rooms-list',
        status: 'success',
        data: roomsNames.get(room),
    };

    rooms.get(room)?.forEach(socket => {
        socket.send(JSON.stringify(response));
    });
}