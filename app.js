const http = require('http');

http.createServer(function(req,res) {
	res.write("On thw way to being a full stack engineer");
	res.end();
}
).listen(3000);

console.log("Server started on port 3000");
console.log("Cloned repo 2");