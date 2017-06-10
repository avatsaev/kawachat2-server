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
    res.json(getServerStats());
});
router.get('/room/:frq/stats', (req, res) => {
    if (io.sockets.adapter.rooms[req.params.frq]) {
        res.json({
            frq: req.params.frq,
            clientsCount: io.sockets.adapter.rooms[req.params.frq].length
        });
    }
    else {
        res.status(404);
    }
});
app.use('/', router);
const server = app.listen(app.get('port'), () => {
    console.log('Kawachat server listening on port ' + app.get('port'));
});
const io = socketio(server, { 'origins': '*:*' });
const escapeHtml = (text = "") => {
    return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
};
io.on('connection', (client) => {
    console.log("client connected...");
    client.on("join", (data) => {
        console.log(data);
        console.log(`user ${data.username} on frequency ${data.frq}`);
        client.join(data.frq);
        client.to(data.frq).emit('frqUpdate', getFrqStats(data.frq));
        io.emit('statsUpdate', getServerStats());
    });
    client.on("leave", (data) => {
        console.log('leave', data);
        client.leave(data.frq);
        client.to(data.frq).emit('frqUpdate', getFrqStats(data.frq));
        io.emit('statsUpdate', getServerStats());
    });
    client.on("send", (data) => {
        console.log(data);
        if (!data["msg"] || data["msg"] === "" || !data["frq"] || data["frq"] === "")
            return;
        //sanitize data
        data["frq"] = escapeHtml(data["frq"]).substring(0, 32);
        data["msg"] = escapeHtml(data["msg"]).substring(0, 512);
        client.to(data.frq).emit('chat', data);
    });
    client.on('disconnect', () => {
        // TODO: optimize
        Object.keys(io.sockets.adapter.rooms).map(frq => {
            io.to(frq).emit('frqUpdate', {
                frq: frq,
                clientsCount: Object.keys(io.sockets.adapter.rooms[frq].sockets).length
            });
        });
    });
    client.emit('host', os.hostname());
});
function getServerStats() {
    return {
        clientsCount: io.engine.clientsCount,
        roomsCount: Object.keys(io.sockets.adapter.rooms).length - (io.engine.clientsCount)
    };
}
function getFrqStats(frq) {
    return {
        frq: frq,
        clientsCount: io.sockets.adapter.rooms[frq] ? io.sockets.adapter.rooms[frq].length : 0
    };
}
