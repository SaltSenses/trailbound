import {distance,validPoint} from './core.js';

export function findTrails(routes, query='', region='all') {
  const boxes={BC:[48,-139,60,-114],AB:[49,-120,60,-110],SK:[49,-110,60,-101],MB:[49,-102,60,-89],ON:[41,-95,57,-74],QC:[45,-80,63,-57],ATL:[43,-68,61,-52],NORTH:[60,-141,84,-52]};
  const q=query.trim().toLocaleLowerCase();
  const box=boxes[region];
  return routes.filter(r=>(!q||`${r.name} ${r.localName} ${r.operator}`.toLocaleLowerCase().includes(q))&&(!box||(r.lat>=box[0]&&r.lat<=box[2]&&r.lon>=box[1]&&r.lon<=box[3])));
}

// Relation members are not necessarily ordered or connected. Join matching
// endpoints; preserve disconnected pieces rather than drawing invented links.
export function relationPoints(relation) {
  const segments=(relation.members||[]).filter(m=>m.type==='way'&&m.geometry?.length>=2&&!['alternate','excursion'].includes(m.role)).map(m=>m.geometry.map(p=>({lat:p.lat,lon:p.lon})).filter(validPoint)).filter(s=>s.length>=2);
  if(!segments.length)throw Error('No usable route geometry was returned.');
  const remaining=segments.slice(),points=remaining.shift().slice();
  while(remaining.length){
    const end=points.at(-1);let index=remaining.findIndex(s=>distance(end,s[0])<2||distance(end,s.at(-1))<2);
    if(index<0){const next=remaining.shift();points.push({...next[0],break:true},...next.slice(1));continue;}
    const next=remaining.splice(index,1)[0];if(distance(end,next.at(-1))<2)next.reverse();points.push(...next.slice(1));
    if(points.length>100000)throw Error('This route is too large for the offline viewer.');
  }
  return points;
}
