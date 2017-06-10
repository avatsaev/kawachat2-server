"use strict";
const socketio = require("socket.io");
const express = require("express");
const os = require("os");
const port = process.env.PORT || 3003;
const env = process.env.NODE_ENV || "development";
const app = express();
app.set('port', port);
app.set('env', env);
const router = express.Router(); // get an instance of the express Router
router.get('/', (req, res) => {
    res.json({ health: 'OK' });
});
router.get('/stats', (req, res) => {
    res.json({
        clientsCount: io.engine.clientsCount,
        roomsCount: Object.keys(io.sockets.adapter.rooms).length,
    });
});
app.use('/', router);
const server = app.listen(app.get('port'), () => {
    console.log('Kawachat server listening on port ' + app.get('port'));
});
const io = socketio(server, { 'origins': '*:*' });
const escape_html = function (text = "") {
    return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
};
io.on('connection', (client) => {
    console.log("client connected...");
    client.on("join", function (data) {
        console.log(data);
        console.log(`user ${data.username} on frequency ${data.frq}`);
        client.join(data.frq);
        client.emit('update', (data.username + " has joined the server on the frequency " + data.frq));
        client.emit('host', os.hostname());
    });
    client.on("leave", function (data) {
        console.log('leave', data);
        client.leave(data.frq);
    });
    client.on("send", function (data) {
        console.log(data);
        if (!data["msg"] || data["msg"] === "" || !data["frq"] || data["frq"] === "")
            return;
        //sanitize data
        data["frq"] = escape_html(data["frq"]).substring(0, 32);
        data["msg"] = escape_html(data["msg"]).substring(0, 512);
        client.to(data.frq).emit('chat', data);
    });
});
