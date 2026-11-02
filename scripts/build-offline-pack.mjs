import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {relationPoints} from '../public/catalog.js';
const catalog=JSON.parse(await readFile(new URL('../public/data/canada.json',import.meta.url),'utf8'));
const query='[out:json][timeout:180];area["ISO3166-1"="CA"][admin_level=2]->.ca;rel(area.ca)[type=route][route~"^(hiking|foot|walking)$"];out geom;';
const response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{headers:{'User-Agent':'Trailbound/0.4 (https://github.com/SaltSenses/trailbound)'},signal:AbortSignal.timeout(210000)});
if(!response.ok)throw Error('Map data request failed: '+response.status);
const data=await response.json();if(data.remark)throw Error(data.remark);
const wanted=new Set(catalog.routes.map(r=>r.id)),routes={},unavailable=[];
for(const rel of data.elements){if(!wanted.has(rel.id))continue;try{const points=relationPoints(rel);if(points.length<2||points.length>100000)throw Error('Invalid route size');routes[rel.id]=points.map(p=>[+p.lat.toFixed(6),+p.lon.toFixed(6),...(p.break?[1]:[])]);}catch{unavailable.push(rel.id);}}
const pack={format:'trailbound-offline-routes',version:1,source:'OpenStreetMap contributors',license:'ODbL-1.0',fetchedAt:new Date().toISOString(),routes,unavailable};
const output=JSON.stringify(pack),compressed=gzipSync(output,{level:9});await writeFile(new URL('../public/data/canada-routes.json.gz',import.meta.url),compressed);
await writeFile(new URL('../public/data/offline-manifest.json',import.meta.url),JSON.stringify({available:Object.keys(routes).length,unavailable,fetchedAt:pack.fetchedAt,compressedBytes:compressed.length,source:pack.source,license:pack.license}));
console.log(JSON.stringify({available:Object.keys(routes).length,unavailable:unavailable.length,bytes:Buffer.byteLength(output)}));
