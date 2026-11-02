import {validateRoute,stats} from './core.js';
export function normalizeBackup(data){if(data?.format!=='trailbound-native')return data;if(data.version!==1||!Array.isArray(data.tracks)||data.tracks.length>10000)throw Error('Invalid native track backup.');for(const t of data.tracks)if(!Array.isArray(t.points))throw Error('Invalid native track points.');return {format:'trailbound',version:1,routes:data.tracks.filter(t=>t.points.length>=2).map(validateRoute),plans:[]};}

export function nativeSessionView(active,now=Date.now()){
 if(!active)return {distance:'0.00',elapsed:'—',accuracy:'—',status:'Ready. Start a background recording to request Android location permission.',fix:'No active recording.'};
 const points=active.points||[],last=points.at(-1),seconds=Math.max(0,Math.floor((now-active.started)/1000));
 const age=Number.isFinite(last?.time)?Math.max(0,Math.floor((now-last.time)/1000)):null;
 return {distance:stats(points).km.toFixed(2),elapsed:Number.isFinite(seconds)?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'—',accuracy:Number.isFinite(last?.accuracy)?`±${Math.round(last.accuracy)} m`:'—',status:`${active.name}: ${points.length} GPS points saved by Android.`,fix:age===null?'Waiting for the first accurate GPS fix. Keep location enabled and move outdoors.':`Last saved fix ${age} seconds ago.${age>60?' No recent fix: check location and the recording notification.':''}`};
}
