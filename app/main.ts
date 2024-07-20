import * as net from "net";

interface StringHashmap {
    [key: string]: string;
  }
let myHashmap: StringHashmap = {};
const server: net.Server = net.createServer((connection: net.Socket) => {
    

    connection.on("data", (data) => {
        const args = data.toString().split(`\r\n`);
        const cmd = args[2].toLowerCase();        
        if (cmd === 'ping') {
            connection.write('+PONG\r\n');
        } else if (cmd === 'echo') {
            const txt = args[4];
            connection.write(`$${txt.length}\r\n${txt}\r\n`);
        } else if(cmd === 'set') {
            const key = args[4];
            const value = args[6];
            myHashmap[key] = value;
            connection.write("+OK\r\n");
        } else if(cmd === 'get') {
            const key = args[4];            
            connection.write(`+${myHashmap[key] || '' }\r\n`);
        }
    })
  });

server.listen(6379, "127.0.0.1");

