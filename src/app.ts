

import * as redis from 'socket.io-redis';
import * as socketio from 'socket.io';
import * as express from 'express';
import * as os from 'os';


const port = process.env.PORT || 3003;
const env = process.env.NODE_ENV || "development";
const redis_host = process.env.REDIS_HOST || "localhost";
const redis_port = process.env.REDIS_PORT || 6379;

const app = express();

app.set('port', port);
app.set('env', env);

const server = app.listen(app.get('port'), () => {
  console.log('Kawachat server listening on port ' + app.get('port'));
});

const io = socketio(server, {'origins': '*:*'} );

io.adapter(redis({
  host: redis_host,
  port: redis_port
}));

const escape_html = function(text = ""): string {
  return text.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
};

io.on('connection', (client) =>{
  console.log("client connected...");

  client.on("join", function(data: {frq: string, username: string}){

    console.log(data);

    console.log(`user ${data.username} on frequency ${data.frq}`);

    client.join(data.frq);
    client.emit('update', (data.username+" has joined the server on the frequency "+data.frq) );
    client.emit('host', os.hostname());

  });


  client.on("leave", function(data: {frq: string}){

    console.log('leave', data);
    client.leave(data.frq);

  });


  client.on("send", function(data){

    console.log(data);

    if(!data["msg"] || data["msg"]==="" || !data["frq"] || data["frq"]==="") return;

    //sanitize data
    data["frq"]= escape_html(data["frq"]).substring(0, 32);
    data["msg"]= escape_html(data["msg"]).substring(0, 512);

    client.to(data.frq).emit('chat', data);

  });

});
