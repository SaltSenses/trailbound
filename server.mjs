import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('./public/',import.meta.url);
const types={html:'text/html',js:'text/javascript',css:'text/css',svg:'image/svg+xml',webmanifest:'application/manifest+json'};
http.createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.includes('..'))throw Error();const file=new URL('.'+(path==='/'?'/index.html':path),root);if(!fileURLToPath(file).startsWith(fileURLToPath(root)))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':types[file.pathname.split('.').pop()]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(4387,'127.0.0.1',()=>console.log('Trailbound: http://localhost:4387'));

