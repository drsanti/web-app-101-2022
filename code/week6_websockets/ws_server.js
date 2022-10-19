// 1) Install node.js
// 2) Install websocket module -> npm install websocket

// Client Example:
/* 
<html>
<head>
	<title>WebSocket Client</title>
</head>
<body>
	<progress id="pg" value="32" max="100"></progress>
	<script>
		const pg = document.getElementById("pg");
		const ws = new WebSocket("ws://127.0.0.1:9099", "realtime");
		ws.onopen = function (event) {
			console.log("Connected")
		}

		ws.onmessage = function (message) {
			const data = JSON.parse(message.data);
			pg.value = data.value;
		}

		setInterval(() => {
			ws.send("get-sensor-3")
		}, 1000);

		// // // CODE CODE CODE

	</script >
</body >
</html >
*/

const WebSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer(function (request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.end();
});
server.listen(9099, function () {
	console.log((new Date()) + ' Server is listening on port 9099');
});

let wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});
function originIsAllowed(origin) {
	return true;
}

wsServer.on('request', function (request) {
	if (!originIsAllowed(request.origin)) {
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}

	let connection = request.accept('realtime', request.origin);

	console.log((new Date()) + ' Connection accepted.');
	connection.on('message', function (message) {
		if (message.type === 'utf8') {
			processAndRespond(connection, message.utf8Data);
		}
		else if (message.type === 'binary') {
			console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
			connection.sendBytes(message.binaryData);
		}
	});
	connection.on('close', function (reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});
});

const processAndRespond = (con, msg) => {
	const generate = (type) => {
		let x = Math.random();
		if (type === 1) {
			return x > 0.5;
		}
		else if (type === 2) {
			return (Math.random()).toFixed(3);
		}
		else if (type === 3) {
			return (Math.random() * 100).toFixed(3);
		}
	}
	const response = (conn, data, type) => {
		console.log(`Response: ${data}`);
		conn.send(JSON.stringify({ type: type, value: data }));
	}
	const generateAndResponse = (conn, type) => {
		response(conn, generate(type), type);
	}
	console.log(`Request:  ${msg}`);
	if (msg.indexOf("get-sensor-") === 0) {
		try {
			generateAndResponse(con, Number(msg.substring(msg.length - 1)));
		} catch (ex) {
			console.error(ex);
		}
	}
}