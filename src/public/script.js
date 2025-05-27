const players = []
let onlinePlayers = []
let imposters = 1
let gameCode
let playerName
let rooms
let isHost = false;
const settings = new Map([
    ['hint', true],
    ['teaming', true],
    ['definition', true]
]);

const selectedCategories = ['filme', 'unterhaltung', 'allgemein',];


//upgrade to websocket
const ws = new WebSocket(`ws://${location.host}/ws`);

ws.onopen = () => {
    console.log('connected!')
}

ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    console.log("Response from server:", response);

    if (response.type == "response" && response.resource == "game-code") {
        console.log('recieved game code: ', response.data.code);
        gameCode = response.data.code;
        document.getElementById('codeDisplay').textContent = `Code: ${gameCode}`
    }

    if (response.type == "response" && response.resource == "rooms-list") {
        rooms = response.data;
        console.log('recieved rooms-list: ', rooms);
        onlinePlayers = rooms;
        console.log('players in room: ', onlinePlayers)
        renderOnlinePlayerList();
    }
    
    if (response.type == "response" && response.resource == "join-game") {
        if (response.status == "success") {
            console.log("successfully joined room")
        } else {
            showPreMenu();
            console.log(response.error)

            setTimeout(() => {
                globalThis.alert(response.error);
            }, 20);
            
        }
    }

    if (response.type == "response" && response.resource == "choose-word") {
        const word = response.data;
        console.log('Recieved the Word: ', word)

        const allPlayers = players.concat(onlinePlayers);

        const imposterList = []
        let player;

        for (let i = 0; i < imposters; i++) {
            do {
                player = allPlayers[Math.floor(Math.random()*allPlayers.length)];
            } while (imposterList.includes(player));
            imposterList.push(player)
        }

        const playerMap = new Map();
        allPlayers.forEach(player => {
            if (!imposterList.includes(player)) {
                playerMap.set(player, word)
            } else {
                playerMap.set(player, 'Imposter')
            }
        });

        renderGame(playerMap);

        requestGameStart(playerMap);

    }

    if (response.type == "response" && response.resource == "game-start" && !isHost) {
        const playerMap = new Map();
        playerMap.set(playerName, response.data)
        renderGame(playerMap);
    }

};

function requestGameCode() {
    //request fame code
    const request = {
        type: "request",
        resource: "game-code",
        name: playerName,
    };
    ws.send(JSON.stringify(request));
}

function requestGameStart(playerMap) {
    //start Game
    const request = {
        type: "request",
        resource: "game-start",
        name: playerName,
        payload: [...playerMap],
    };
    ws.send(JSON.stringify(request));
}


//code

export function joinGame() {
    do {
        playerName = prompt('Name').trim()
    } while (playerName == "");

    if (!playerName) {
        return;
    }
    document.getElementById('playerName').textContent = playerName

    do {
        gameCode = Number(prompt('Code:'))
    } while (isNaN(gameCode));

    if (!gameCode) {
        return;
    }

    document.getElementById('codeDisplay').textContent = `Code: ${gameCode}`

    document.getElementById("title").innerHTML = "Online Spiel"
    document.getElementById("startButton").classList.add('hidden')
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("pre-menu").style.display = "none"
    document.getElementById("onlinePlayerListContainer").style.display = "flex"
    document.getElementById("codeDisplay").style.display = "flex"
    document.getElementById("playerName").style.display = "block"
    document.getElementById("startButton").onclick = showMenu

    const request = {
        type: "request",
        resource: "join-game",
        name: playerName,
        payload: gameCode,
    }
    ws.send(JSON.stringify(request))
}

function backToLobby() {
    document.getElementById("gameContainer").classList.add('hidden');
    document.getElementById('codeDisplay').textContent = `Code: ${gameCode}`
    document.getElementById("title").innerHTML = "Online Spiel"
    document.getElementById("startButton").classList.add('hidden')
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("pre-menu").style.display = "none"
    document.getElementById("onlinePlayerListContainer").style.display = "flex"
    document.getElementById("codeDisplay").style.display = "flex"
    document.getElementById("playerName").style.display = "block"

    if (isHost) {
        document.getElementById("startButton").classList.remove('hidden');
        document.getElementById("startButton").textContent = 'Start';
        document.getElementById("startButton").onclick = startGame;
    }
}

export function showPlayers() {
    renderPlayerList()
    document.getElementById("title").innerHTML = "Spieler"
    document.getElementById("startButton").innerHTML = "Fertig"
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("playerListContainer").style.display = "flex"
    document.getElementById("startButton").disabled = false;
    document.getElementById("startButton").onclick = showMenu
}

export function showOnlinePlayers() {
    renderOnlinePlayerList()
    while(!playerName || playerName.trim() == "") {
        playerName = prompt('Dein Name')
    }
    if (!gameCode) {
        requestGameCode()
    }
    document.getElementById("playerName").textContent = playerName
    document.getElementById("title").innerHTML = "Online Spieler"
    document.getElementById("startButton").innerHTML = "Fertig"
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("codeDisplay").style.display = "flex"
    document.getElementById("playerName").style.display = "block"
    document.getElementById("onlinePlayerListContainer").style.display = "flex"
    document.getElementById("startButton").disabled = false;
    document.getElementById("startButton").onclick = showMenu
}

export function showImposter() {
    renderImposterList()
    document.getElementById("title").innerHTML = "Imposter"
    document.getElementById("startButton").innerHTML = "Fertig"
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("imposterListContainer").style.display = "flex"
    document.getElementById("startButton").disabled = false;
    document.getElementById("startButton").onclick = showMenu
}

export function showMenu() {
    document.getElementById("title").innerHTML = "Imposter"
    document.getElementById("startButton").innerHTML = "Start"
    document.getElementById("menu-buttons").style.display = "flex"
    document.getElementById("codeDisplay").style.display = "none"
    document.getElementById("playerName").style.display = "none"
    document.getElementById("playerListContainer").style.display = "none"
    document.getElementById("onlinePlayerListContainer").style.display = "none"
    document.getElementById("pre-menu").style.display = "none"
    document.getElementById("categoryContainer").style.display = "none"
    document.getElementById("imposterListContainer").style.display = "none"
    document.getElementById("startButton").classList.remove('hidden');
    document.getElementById("settingsContainer").classList.add('hidden');
    document.getElementById("gameContainer").classList.add('hidden');
    document.getElementById("startButton").disabled = true;
    document.getElementById("startButton").onclick = startGame

    if (players.length > 0 || onlinePlayers.length > 0 && imposters > 0) {
        document.getElementById("startButton").disabled = false;
    }
}

export function showSettings() {
    document.getElementById("title").innerHTML = "Einstellungen";
    document.getElementById("startButton").innerHTML = "Fertig";
    document.getElementById("menu-buttons").style.display = "none";
    document.getElementById("settingsContainer").classList.remove('hidden');
    document.getElementById("startButton").disabled = false;
    document.getElementById("startButton").onclick = showMenu;
}

function showPreMenu() {
    document.getElementById("title").innerHTML = "Imposter"
    document.getElementById("startButton").classList.add('hidden')
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("pre-menu").style.display = "flex"
    document.getElementById("codeDisplay").style.display = "none"
    document.getElementById("playerName").style.display = "none"
    document.getElementById("startButton").onclick = showMenu
}

let i = 0;
function renderGame(playerMap) {
    console.log('render Game with List: ', playerMap);
    document.getElementById("onlinePlayerListContainer").style.display = "none"
    document.getElementById("title").innerHTML = "Imposter"
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("gameContainer").classList.remove('hidden');
    document.getElementById("playerName").style.display = "none"
    document.getElementById("startButton").classList.remove('hidden');

    if (players.length > 0) {
        if (playerName) {
            players.push(playerName);
        }
        i = 0;
        nextPlayer(playerMap);
        document.getElementById("startButton").textContent = "Weiter"
        document.getElementById("startButton").onclick = () => nextPlayer(playerMap);
    } else {
        document.getElementById("word").textContent = playerMap.get(playerName);

        renderWordNote(playerMap.get(playerName));

        document.getElementById("currentPlayer").textContent = playerName
        document.getElementById("startButton").textContent = "Fertig"
        if (isHost) {
            document.getElementById("startButton").onclick = showMenu;
        } else {
            document.getElementById("startButton").onclick = backToLobby;
        }
    }
}

function nextPlayer(playerMap) {
    console.log(i)
    document.getElementById("currentPlayer").textContent = players[i];
    document.getElementById("word").textContent = playerMap.get(players[i]);

    renderWordNote(playerMap.get(players[i]));
    
    i++
    if (i >= players.length) {
        document.getElementById("startButton").textContent = "Fertig";
        document.getElementById("startButton").onclick = showMenu;
        i = 0;
    }
}

function renderWordNote(player) {
    document.getElementById('hint').classList.add('hidden');
    document.getElementById('teaming').classList.add('hidden');
    if (player == 'Imposter') {
        document.getElementById('definition').classList.add('hidden');
        if (settings.get('hint')) {
            document.getElementById('hint').classList.remove('hidden');
        }
        if (settings.get('teaming')) {
            document.getElementById('teaming').classList.remove('hidden');
        }
    } else {
        document.getElementById('hint').classList.add('hidden');
        document.getElementById('teaming').classList.add('hidden');
        if (settings.get('definition')) {
            document.getElementById('definition').classList.remove('hidden');
        } else {
            document.getElementById('definition').classList.add('hidden');
        }
    }
}

export function showCategories() {
    updateCategories()
    document.getElementById("title").innerHTML = "Kategorie"
    document.getElementById("startButton").innerHTML = "Fertig"
    document.getElementById("menu-buttons").style.display = "none"
    document.getElementById("categoryContainer").style.display = "flex"
    document.getElementById("startButton").disabled = false;
    document.getElementById("startButton").onclick = showMenu
}

export function toggleSetting(setting) {
    settings.set(setting, !settings.get(setting))
    const icon = settings.get(setting) ? 'check_box' : 'check_box_outline_blank';
    document.getElementById(`${setting}CheckBox`).textContent = icon;
}

export function selectImposter(i) {
    imposters = i
    showMenu()
    renderImposterCount()
}

export function selectCategory(category) {
    if (!selectedCategories.includes(category)) {
        selectedCategories.push(category);
    } else {
        selectedCategories.splice(selectedCategories.indexOf(category), 1)
    }
    updateCategories()
}

function updateCategories() {
    let icon;

    icon = selectedCategories.includes('filme') ? 'check_box' : 'check_box_outline_blank';
    document.getElementById('filmeCheckBox').textContent = icon

    icon = selectedCategories.includes('unterhaltung') ? 'check_box' : 'check_box_outline_blank';
    document.getElementById('unterhaltungCheckBox').textContent = icon

    icon = selectedCategories.includes('allgemein') ? 'check_box' : 'check_box_outline_blank';
    document.getElementById('allgemeinCheckBox').textContent = icon
}

export function renderImposterCount() {
    document.getElementById('imposter').innerHTML = `Imposter: ${imposters}`
}

function renderImposterList() {
    const ul = document.getElementById('imposterList')
    ul.innerHTML = ''
    for (let i = 1; i <= (players.length + onlinePlayers.length); i++) {
        const button = document.createElement('button')
        button.innerHTML = `<button onclick="selectImposter(${i})">${i}</button>`
        button.textContent = i
        button.addEventListener('click', () => selectImposter(i))
        ul.appendChild(button)
    }
}

export function addPlayer() {
    const name = prompt('Name')
    players.push(name)
    renderPlayerList()
}

function renderPlayerList() {
    const ul = document.getElementById('playerList')
    ul.innerHTML = ''
    
    players.forEach((player,i) => {
        const li = document.createElement('li')
        li.innerHTML = `<span id="listText">${player}</span><button id="listButton" onclick="deletePlayer('${i}')">X</button>`
        ul.appendChild(li)
      })
}

function renderOnlinePlayerList() {
    const ul = document.getElementById('onlinePlayerList')
    ul.innerHTML = ''
    
    onlinePlayers.forEach((player) => {
        const li = document.createElement('li')
        li.innerHTML = `<span id="listText">${player}</span>`
        ul.appendChild(li)
      })
}

export function deletePlayer(i) {
    const _x = players.splice(i,1)
    renderPlayerList()
}



export function startGame() {

    isHost = true;
    
    const request = {
        type: "request",
        resource: "choose-word",
        name: playerName,
        payload: selectedCategories,
    };

    ws.send(JSON.stringify(request));

}


//add eventListeners for swiping on element 'overlay'
const overlay = document.getElementById('overlay');
let startY = 0;
let currentY = 0;
let dragging = false;
let maxDistance = overlay.clientHeight * 0.8;

overlay.addEventListener('pointerdown', e => {
  dragging = true;
  startY = e.clientY;
  maxDistance = overlay.clientHeight * 0.8;
  overlay.style.transition = 'none';
  overlay.setPointerCapture(e.pointerId);
});

overlay.addEventListener('pointermove', e => {
  if (!dragging) return;
  currentY = e.clientY - startY;
  // only allow upward drag
  const translateY = Math.min(0, Math.max(currentY, -maxDistance));
  overlay.style.transform = `translateY(${translateY}px)`;
});

overlay.addEventListener('pointerup', e => {
  dragging = false;
  overlay.releasePointerCapture(e.pointerId);
  overlay.style.transition = 'transform 0.3s ease';
  overlay.style.transform = `translateY(0)`;
});

overlay.addEventListener('pointercancel', () => {
  dragging = false;
  overlay.style.transition = 'transform 0.3s ease';
  overlay.style.transform = 'translateY(0)';
});







//export the functions to the html
globalThis.showCategories = showCategories;
globalThis.showMenu = showMenu;
globalThis.showPlayers = showPlayers;
globalThis.showOnlinePlayers = showOnlinePlayers;
globalThis.showImposter = showImposter;
globalThis.addPlayer = addPlayer;
globalThis.deletePlayer = deletePlayer;
globalThis.startGame = startGame;
globalThis.selectCategory = selectCategory;
globalThis.renderImposterCount = renderImposterCount;
globalThis.selectImposter = selectImposter;
globalThis.joinGame = joinGame;
globalThis.showSettings = showSettings;
globalThis.toggleSetting = toggleSetting;