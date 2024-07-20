import * as net from 'net';
import {argv} from "node:process";
import RedisParser from 'redis-parser';

let PORT = 6379;
let role = 'master';
let master = {
  port: 0,
  host: '',
}
if (argv[2] && argv[2].includes('port')) {
  PORT = Number(argv[3])
}
if (argv[4] && argv[4].includes('replicaof')) {
  role = 'slave';
 let masterInfo = argv[5].split(' ');
 master.host = masterInfo[0];
 master.port = +masterInfo[1];
}
enum CommonResponseCommand {
  Pong = 'PONG',
}

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!');
const server: net.Server = net.createServer((connection: net.Socket) => {
  const values = new Map();

  const connectionParser = new RedisParser({
    returnReply: (reply: string[]) => {
      console.log('Received command:', JSON.stringify(reply));
      const [command, ...args] = reply;
      switch (command.toLowerCase()) {
        case 'ping':
          connection.write(encodeRedisResponse(CommonResponseCommand.Pong));
          break;
        case 'echo':
          connection.write(`$${args[0].length}\r\n${args[0]}\r\n`);
          break;
        case 'set':
          values.set(args[0], args[1]);          
          connection.write('+OK\r\n');
          if (args[2].toUpperCase() === "PX") {
            setTimeout(()=> {
              values.delete(args[0]);
            }, +args[3])
          }
          break;
        case 'get':
          const value = values.get(args[0]);
          connection.write(
            `$${value ? value.length + '\r\n' + value : '-1'}\r\n`
          );
          break;
        case 'info':
            const info = `role:${role}`;
            connection.write(`$${info.length}\r\n${info}\r\n`);
        default:
          connection.write(`-ERR unknown command ${command}\r\n`);
          break;
      }
    },
    returnError: (error: unknown) => {
      console.error('Error', error);
    },
    returnFatalError: (error: unknown) => {
      console.error('Fatal Error', error);
    },
  });
  connection.on('data', async (data: Buffer) => {
    connectionParser.execute(data);
  });
});
server.listen(PORT, '127.0.0.1');
function encodeRedisResponse(command: string) {
  return `+${command}\r\n`;
}