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

/** Begin websocket */

