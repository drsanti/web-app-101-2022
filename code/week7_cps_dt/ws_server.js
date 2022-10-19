
const WebSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer(function (request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.end();
});
server.listen(3033, function () {
	console.log((new Date()) + ' Server is listening on port 3033');
});

let wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});
function originIsAllowed(origin) {
	return true;
}

let clientConns = [];

wsServer.on('request', function (request) {
	if (!originIsAllowed(request.origin)) {
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}

	let connection = request.accept(null, request.origin);
	console.log((new Date()) + ' Connection accepted.');

	if (clientConns.indexOf(connection) < 0) {
		clientConns.push(connection);
	}

	connection.on('message', function (message) {
		if (message.type === 'utf8') {
			processAndRespond(connection, message.utf8Data);
		}
	});
	connection.on('close', function (reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});

});

const processAndRespond = (con, msg) => {
	let sp = msg.split(": ");
	if (sp.length > 1 && sp[0] === "ok") {
		sp = sp[1].split(",");
		if (sp.length > 1) {
			["psw", "adc", "led"].map((v, i) => {
				if (sp[0] == v) {
					console.log(`type: ${sp[0]}, id: ${sp[1]}, value: ${sp[2]}`);
					clientConns.forEach(c => {
						c.send(JSON.stringify({ type: sp[0], id: sp[1], value: sp[2] }));
					});
				}
			});
		}
	}
}
