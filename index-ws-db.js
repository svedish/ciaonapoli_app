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



// ################## SQLite stuff ######################################################
// Impostiamo un process listener per chiudere la connessione al database e distruggere
// i dati ogni volta che il server termina di girare. Ascoltiamo l'evento SIGINT (Signal Interrup)
// Ossia il comando eseguito usando CTRL-C per chiudere il server.
process.on('SIGINT', () => {
    // Prima dobbiamo chiudere ogni connessione al server WebSocket se no il processo di chiusura del server resta appeso in un limbo
    wss.clients.forEach(function each(client) {
        client.close();
    });
    // Facciamo una chiusura pulita del server e da lì dentro (nella callback) chiudiamo la connessione al database
    server.close(() => {
        shutdownDB();
    });
});
// ################## SQLite stuff ######################################################



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


    // ################## SQLite stuff ######################################################
    // Quando viene stabilita una connessione al server WebSocket inseriamo nella tabella
    // visitors del database il numero di client connessi e il momento (datetime('now') 
    // è una funzione built-in) in cui avviene la connessione
    db.run(`INSERT INTO visitors (count, time) 
        VALUES (${numClients}, datetime('now'))
    `);
    // ################## SQLite stuff ######################################################

    
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


/******************* INIZIO database ************************/

// Importiamo la lireria sqlite3
const sqlite = require('sqlite3');

// E creiamo un nuovo database con l'opzione :memory: che indica che il database
// sarà interamente salvato nella RAM del sistema, non su disco.
// Consideriamo però che i dati in un database in memory sono volatili e quindi
// vengono persi quando il programma viene chiuso o2 la connesisone al database viene chiusa 
// L'alternativa è creare il database su file e quindi passare qualcosa tipo './nome.db' alla funzione
const db = new  sqlite.Database(':memory:');

// Cominciamo a lavorare sul database e facciamolo dentro il metodo serialize
// che ci assicura che i comandi che andremo a scrivere nelal callback saranno 
// eseguiti in maniera sequenziale non asincrona (quindi senza un ordine preciso)
// che altrimenti avverrebbe quando si tratta di sqlite.
db.serialize(() => {
    // Il metodo run si usa ogni volta che vogliamo eseguire un comando SQL
    // Usiamo i back ticks perchè sarà una striga multi linea per facilitarne la lettura
    // È pratica comune (non obbligatorio) scrivere i comandi SQL in maiuscole per
    // distinguerli dai dati e altri elementi della query.

    // Quindi creiamo la tabella visitors e i due fields o colonne count e time che
    // che sono un numero e un testo (in SQLite il tempo è banalmente testo).
    db.run(`
        CREATE TABLE visitors (
            count INTEGER,
            time TEXT
        )
    `);
});

// Separatamente scriviamo una funzione (per non ripeterci) che legge il numero
// dei visitatori connessi al server dal database.

function getCounts() {
    // Per ogni row o record fai qualcosa (esegui la query passata come argomento)
    // Come secondo argomento si passa una funzione callback che riceve due parametri
    // un oggetto errore, se c'è, e un oggetto che rappresenta la riga stessa restituita
    // dalla query SQL
    db.each("SELECT * FROM visitors", (err, row) => {
        console.log(row);
    });
}

// Scriviamo una funzione per chiudere la connessione con il database quando il server
// ha terminato di girare. In caso contrario la connessione al db resterebbe aperta
function shutdownDB() {
    // Ci facciamo prima dare il conto totale dei visitatori del giorno
    getCounts();
    console.log('Shutting down db');
    // E poi chiudiamo la connessione al database
    db.close();
    // Affinchè tutto questo funzioni dobbiamo cogliere il comando che chiude il server (CONTROL-C)
    // E quando registriamo questo evento chiamiamo shutdownDB() e distruggiamo i dati in memoria
    // Andiamo più su quindi e creiamo un process listener. Lo mettiamo alla fine del server
    // Subito prima dell'inizio del codice del WebSocket server.
}