//oak: http server middleware needed for managing routes
import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { send } from "jsr:@oak/oak/send";
import { RequestMessage, ResponseMessage } from "./types.ts";
import { generateCode } from "./manageGameCodes.ts";
import { removeCode } from "./manageGameCodes.ts";
import { addPlayerToRoom, removePlayerFromRoom, pushGameStart } from "./manageRooms.ts";
import { addSocket } from "./WebSocketStorage.ts";
import { setSocketUserName } from "./manageWebSocketMetadata.ts";
import { genUUID } from "./generateUUID.ts";


const app = new Application();
const router = new Router();


const categoryFilesMap = new Map<string, string[]>([
  ['filme', ['filme.txt']],
  ['unterhaltung', ['maerchen.txt', 'personen.txt']],
  ['allgemein', ['allgemein1.txt', 'allgemein2.txt']]
]);


//serve static html
app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;
  try {
    await send(ctx, path, {
      root: `${Deno.cwd()}/src/public`,
      index: "index.html",
    });
  } catch {
    await next();
  }
});


//websocket
router.get("/ws", async (ctx) => {
  if (!ctx.isUpgradable) {
    ctx.response.status = 400;
    ctx.response.body = "WebSocket upgrade required";
    return;
  }

  // Upgrade the connection
  const socket = await ctx.upgrade();
  addSocket(genUUID(), socket);
  console.log("WebSocket connection established");

  // Setup event handlers
  socket.onopen = () => {
    console.log("Client connected");
  };

  socket.onmessage = (event) => {
    const msg = typeof event.data === 'string' ? event.data : 'unknown data type';
    console.log("Received:", msg);

      try {
        const message: RequestMessage = JSON.parse(msg);

        if (message.type === "request" && message.resource === "game-code") {

          //store clients user name
          const playerName = message.name;
          setSocketUserName(socket, playerName);

          const code = generateCode(socket)

          const response: ResponseMessage = {
            type: "response",
            resource: "game-code",
            status: "success",
            data: { code: code },
          };

          socket.send(JSON.stringify(response));
          console.log('Sent Game Code: ', JSON.stringify(response))

          addPlayerToRoom(code, socket, true);
        }

        if (message.type === "request" && message.resource === "join-game") {
          console.log(message)

          const gameCode = typeof message.payload === 'number' ? message.payload : -1;

          const playerName = message.name;
          setSocketUserName(socket, playerName);

          removePlayerFromRoom(socket);
          
          const success = addPlayerToRoom(gameCode, socket, false);
          if (success) {

            const response: ResponseMessage = {
              type: "response",
              resource: "join-game",
              status: "success",
            };
  
            socket.send(JSON.stringify(response));
            console.log('Sent: ', JSON.stringify(response));

          } else {

            const response: ResponseMessage = {
              type: "response",
              resource: "join-game",
              status: "error",
              error: "Code nicht gefunden!"
            };
  
            socket.send(JSON.stringify(response));
            console.log('Sent: ', JSON.stringify(response));

          }

        }

        if (message.type === "request" && message.resource === "choose-word") {

          const selectedCats:string[] = Array.isArray(message.payload) ? message.payload : [];

          let content: string = '';
          let allWords:string = 'no category selected';

          selectedCats.forEach(category => {
            categoryFilesMap.get(category)?.forEach(fileName => {
              const path = new URL(`./wordlists/${fileName}`, import.meta.url).pathname;
              const file = Deno.readTextFileSync(path);
              content = content + '\n' + file;
            });
            allWords = allWords + '\n' + content;
          });
          const words:string[] = allWords.split(/\r?\n/).filter(line => line.length > 0);

          const word: string = words[Math.floor(Math.random() * words.length)]

          const response: ResponseMessage = {
            type: "response",
            resource: "choose-word",
            status: "success",
            data: word,
          }
          socket.send(JSON.stringify(response));

          console.log(`Sent word ${word}: `, response);
        }

        if (message.type === "request" && message.resource === "game-start") {
          const payloadMap: Map<string,string> = new Map(message.payload as [string, string][]);
          pushGameStart(message.name, payloadMap)
        }

      } catch (err) {
        console.error("Error processing message:", err);
      }
    
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
    removeCode(socket);
    removePlayerFromRoom(socket);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };
});


app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening on http://localhost:8080");
app.listen({ port: 8080 });