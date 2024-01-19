const express = require('express'); //Includiamo express
const server = require('http').createServer(); // Creiamo il server
const app = express(); // Creiamo una app Express

// A seguire creiamo una route per tutte le richieste che arrivano a '/'
app.get('/', function(req, res) {
		// E rispondiamo inviando un file index.html (che scriveremo dopo) che si trtova nella root che è la directory corrente
    res.sendFile('index.html', {root: __dirname});
});

// Poi facciamo in moodo che il server risponda alle richieste sempre con la app Express creata sopra
server.on('request', app);
// E mettiamo il server in ascolto sulla porta 3000 facendogli produrre una conferma a schermo
server.listen(3000, function() { console.log('Server started on port 3000'); });




/******************* INIZIO WebSocket ************************/

// Includiamo la libreria ws e ad essa chiediamo un server
const WebSocketServer = require('ws').Server;

// Creiamo una nuova istanza di WebSocketServer e indichiamo come server il server Node creato prima
const wss = new WebSocketServer({server: server});

// Vogliamo fare qualcosa quando il WebSocket si connette quindi creiamo una funzione connection a cui passiamo 
wss.on('connection', function connection(ws) {
    
    // Raccogliamo il numero di client connessi e lo mostriamo in console
	const numClients = wss.clients.size;
    console.log('Clients connected', numClients);
	
    // Usando la funzione broadcast annunciamo a tutti i clients quanti visitatori attivi ci sono
    wss.broadcast(`Current visitors: ${numClients}`);

    // Inviamo al client un messaggio di benvenuto, verificando prima che lo stato della sua singola connessione sia OPEN
    if (ws.readyState === ws.OPEN) { 
        ws.send('Welcome to my server');
    }

    
    // Gestiamo infine il caso in cui una singola connesisone venga chiusa
    ws.on('close', function close() {
        wss.broadcast(`Current visitors: ${numClients}`);
        console.log('A client has disconnected')
    });

});

// Questa è la funzione di broadcast che invia dati a tutti i client connessi, usa un forEach in modo da inviare ciò che deve inviare a tutti in una volta
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
}