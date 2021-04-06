import express from 'express'
import axios from 'axios'
import cron from 'node-cron'
import { createServer } from 'http'
import { Server, Socket } from "socket.io"

import cors from 'cors'

let count   = 0
let clients = {}
let swaps   = {}
let channel = { id: '', task: []}

const app = express();
app.use(cors({
    origin: true,
    credentials: true
}));

const port = 3443;

const httpServer = createServer(app)

const wss = new Server(httpServer, { cors: { origin: '*' } })

async function getLastMinute(resolution: string, fsym: string, tsym: string) {
  return await axios.post('https://api.swaps.vision/data/v1/lastchandle', {
    "exchange": "Balancer",
    "fsym": fsym,
    "tsym": tsym,
    "toTs": Date.now(),
    "resolution": resolution,
    "orderdirection": "DESC",
    "limit": 1
  })
  .then(function (response) {
    /*console.log({
      "exchange": "Balancer",
      "fsym": fsym,
      "tsym": tsym,
      "toTs": Date.now(),
      "limit": 1
    }, response.data)*/
    return response.data.Data[0];
  })
  .catch(function (error) {
    console.log(error);
  });
}


wss.on('connection', (socket: Socket) => {
  console.log(`${socket.id} is connected`)
});

wss.on("connection", function(ws: Socket) {
  
    ws.on("SubAdd", function(data: any) {
        swaps[data] = {created : new Date()}
        const _data = data && data.subs[0].split('~')
        if (_data[0] === "3") {
         console.log('Websocket Snapshot load event complete')
         return;
        }
        console.log("websocket connection SubAdd:", data)

        console.log(`### sending data is working ---`, `0~${_data[1]}~${_data[2]}~${_data[3]}~${'sv'}~${'bsv-v1'}~${new Date().getTime()/1000}~${0}~${0}`)
        channel = {id: `0~${_data[1]}~${_data[2]}~${_data[3]}~${'sv'}~${'bsv-v1'}`, task: []}
        //ws.send(`0~${_data[1]}~${_data[2]}~${_data[3]}~${'sv'}~${'bsv-v1'}~${new Date().getTime()}~${45511}~${15}`)

        // Schedule tasks to be run on the server.
        const task = cron.schedule('* * * * *', function() {
          console.log(`############## Syncing Chart Prices - ${new Date()}################`)
          if (channel) {
            const _data = channel.id.split('~')
            getLastMinute(data.subs[1], _data[2],_data[3]).then(result => {
            console.log(result)   
            ws.send(`0~${_data[1]}~${_data[2]}~${_data[3]}~${data.subs[0]}~${result.price}~${new Date(result.tb).getTime()/1000}~${result.volume}~${result.close}`)
            })
          }
          
        })
        channel.task.push(task)
    })

    ws.on("SubRemove", function(data: any) {
      swaps[data] = {created : new Date()}
      console.log("websocket connection SubRemove:", data)
      channel.task.map(channel_job => {
        channel_job.stop()
      })
  })

    ws.on("close", function() {
        console.log("websocket connection close")
        channel.task.map(channel_job => {
          channel_job.stop()
        })
    })
})

app.get('/', (req, res) => {
  res.send('The sedulous hyena ate the antelope!')
})

/*app.listen( (port: number, err: Error) => {
    if (err) {
      return console.error(err)
    }
    console.log(`WS Server running on port ${port}.`)
  })*/

httpServer.listen(port);
console.log(`WS Server running on port ${port}.`)

// minimal version of `import { useServer } from 'graphql-ws/lib/use/ws';`

/*import ws from 'ws'; // yarn add ws
import { makeServer } from 'graphql-ws';
import { schema } from '../schema/welcome';

// make
const server = makeServer({ schema });
const port = 3443;

// create websocket server
const wsServer = new ws.Server({
  port: port,
  path: '/socket.io',
});
console.log(`WS Server running on port ${port}.`)

// implement
wsServer.on('connection', (socket: any, request: any) => {
  // a new socket opened, let graphql-ws take over
  const closed = server.opened(
    {
      protocol: socket.protocol, // will be validated
      send: (data) =>
        new Promise((resolve, reject) => {
          socket.send(data, (err: Error) => (err ? reject(err) : resolve()));
        }), // control your data flow by timing the promise resolve
      close: (code, reason) => socket.close(code, reason), // there are protocol standard closures
      onMessage: (cb) =>
        socket.on('message', async (event: any) => {
          try {
            // wait for the the operation to complete
            // - if init message, waits for connect
            // - if query/mutation, waits for result
            // - if subscription, waits for complete
            await cb(event.toString());
          } catch (err) {
            // all errors that could be thrown during the
            // execution of operations will be caught here
            socket.close(1011, err.message);
          }
        }),
    },
    // pass values to the `extra` field in the context
    { socket, request },
  );

  // notify server that the socket closed
  socket.once('close', (code: any, reason: any) => closed(code, reason));
});
*/