import {validateRoute} from './core.js';
export function unpackRoute(pack,entry){
  if(pack?.format!=='trailbound-offline-routes'||pack.version!==1)throw Error('Unsupported offline route pack.');
  const coordinates=pack.routes?.[entry.id];if(!coordinates)return null;
  return validateRoute({id:`osm-relation-${entry.id}`,name:entry.name,kind:'route',created:pack.fetchedAt,points:coordinates.map(p=>({lat:p[0],lon:p[1],...(p[2]?{break:true}:{})}))});
}
let packPromise;
export async function loadPackedRoute(entry){
  if(!packPromise)packPromise=fetch('./data/canada-routes.json.gz').then(async r=>{if(!r.ok)throw Error('Offline route pack unavailable');const bytes=new Uint8Array(await r.arrayBuffer());if(bytes[0]!==31||bytes[1]!==139)return JSON.parse(new TextDecoder().decode(bytes));if(!('DecompressionStream' in globalThis))throw Error('This browser needs gzip decompression support. Use a current Chrome or Edge release.');return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();}).catch(err=>{packPromise=null;throw err;});
  return unpackRoute(await packPromise,entry);
}
