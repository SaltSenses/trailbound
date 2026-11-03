import {canBeginHike} from './tct.js';
import {routeSummary,filterTrails,durationLabel,trailKey} from './trail-presentation.js';
import {loadOfflinePack} from './offline-pack.js';
import {bboxOf,overlaps,inBounds,previewGeometry,hasCoordinates} from './discovery.js';

const fc=features=>({type:'FeatureCollection',features});
export function attachMapDiscovery(map,lib,{getCatalog,loadTrail,openDestination,pickDestination,getFavorites=()=>new Set(),toggleFavorite=async()=>{},refreshCatalog=()=>{}}){
  const el=id=>document.getElementById(id);
  let pack=null,summaries=new Map(),metrics=new Map(),listMode='view',clusterItems=[],page=0,picking=false,shownAll=[];
  const bounds=()=>{const b=map.getBounds();return {west:b.getWest(),east:b.getEast(),south:b.getSouth(),north:b.getNorth()};};
  const visible=()=>{const b=bounds();return getCatalog().filter(r=>r.bounds?overlaps(r.bounds,b):summaries.has(r.id)?overlaps(summaries.get(r.id),b):inBounds(r.lon,r.lat,b));};
  function focusTrail(r){if(r.points||pack?.routes[r.id]){const b=new lib.LngLatBounds();(r.points?r.points.map(p=>[p.lat,p.lon]):pack.routes[r.id]).forEach(p=>b.extend([p[1],p[0]]));map.fitBounds(b,{padding:45,maxZoom:15});}else map.flyTo({center:[r.lon,r.lat],zoom:12});}
  function render(){refreshCatalog();
    shownAll=listMode==='cluster'?clusterItems:visible();const query=el('map-trail-search').value.trim().toLowerCase();const center=map.getCenter();const matches=filterTrails(shownAll.map(r=>({...r,summary:r.summary||(r.points?routeSummary(r.points):metrics.get(r.id)),offline:Boolean(r.points||pack?.routes[r.id])})),{query,maxKm:Number(el('map-distance-filter').value),maxHours:Number(el('map-time-filter').value),availability:el('map-availability-filter').value,order:el('map-sort').value,center:{lat:center.lat,lon:center.lng},favorites:getFavorites()});
    page=Math.min(page,Math.max(0,Math.ceil(matches.length/20)-1));
    el('map-results-heading').textContent=`${matches.length.toLocaleString()} routes & paths ${listMode==='cluster'?'in selected cluster':'in viewed area'}`;
    el('map-results-note').textContent=pack?'Time baseline: 4 km/h + breaks. Unknown ascent is not a low-ascent claim.':'Loading route previews. Pins show approximate route centres.';
    el('map-trail-results').replaceChildren();
    for(const r of matches.slice(page*20,page*20+20)){
      const row=document.createElement('div');row.className='map-result-row';
      const top=document.createElement('div');top.className='trail-card-top';const badge=document.createElement('span');badge.className='availability-badge';badge.textContent=r.offline?'IN OFFLINE PACK':'NOT IN PACK';
      const favorite=document.createElement('button');favorite.className='favorite-control';const favored=getFavorites().has(trailKey(r.id));favorite.textContent=favored?'♥':'♡';favorite.setAttribute('aria-label',`${favored?'Remove':'Save'} ${r.name} ${favored?'from':'as'} favorite`);favorite.setAttribute('aria-pressed',String(favored));favorite.onclick=async()=>{favorite.disabled=true;try{await toggleFavorite(trailKey(r.id));render();}catch(error){el('map-results-note').textContent='Favorite could not be saved: '+error.message;}finally{favorite.disabled=false;}};top.append(badge,favorite);
      const title=document.createElement('strong');title.textContent=r.name;const note=document.createElement('small');note.textContent=r.operator||'Community-mapped route';const facts=document.createElement('p');facts.className='trail-facts';facts.textContent=r.collection&&!canBeginHike(r)?`${r.summary?.km?.toFixed(1)||'—'} km · ${r.collection.kind} · View/export only`:r.summary?`${r.summary.km.toFixed(1)} km · ${durationLabel(r.summary.baselineHours)}${r.summary.distanceOnly?' distance-only':''} · ${r.summary.ascentLabel}`:'Route metrics loading…';
      const actions=document.createElement('div');actions.className='actions';const open=document.createElement('button');open.textContent='Trail details';open.onclick=()=>loadTrail(r.id);const show=document.createElement('button');show.textContent='Show on map';show.className='secondary';show.onclick=()=>focusTrail(r);actions.append(open,show);row.append(top,title,note,facts,actions);el('map-trail-results').append(row);
    }
    if(!matches.length){const p=document.createElement('p');p.textContent='No indexed hikes here. Zoom out or choose All Canada. Coverage is incomplete.';el('map-trail-results').append(p);}
    el('map-list-prev').disabled=page===0;el('map-list-next').disabled=(page+1)*20>=matches.length;el('map-list-page').textContent=matches.length?`${page*20+1}–${Math.min((page+1)*20,matches.length)} of ${matches.length}`:'0 results';
  }
  let tctSignature='';function refresh(){const tct=getCatalog().filter(r=>r.collection?.id==='trans-canada-trail');const signature=tct.map(r=>r.id).join(',');if(signature!==tctSignature){tctSignature=signature;map.getSource('tct-overview').setData(fc(tct.flatMap(r=>previewGeometry(r.id,r.points.map(p=>[p.lat,p.lon,...(p.break?[1]:[])]),600))));}if(pack){const routes=visible();map.getSource('network-preview').setData(fc(map.getZoom()>=7?routes.slice(0,120).flatMap(r=>r.points?previewGeometry(r.id,r.points.map(p=>[p.lat,p.lon,...(p.break?[1]:[])])):pack.routes[r.id]?previewGeometry(r.id,pack.routes[r.id]):[]):[]));}render();}
  map.addSource('tct-overview',{type:'geojson',data:fc([])});map.addLayer({id:'tct-lines',type:'line',source:'tct-overview',paint:{'line-color':'#326ca7','line-width':['interpolate',['linear'],['zoom'],3,1.2,12,3],'line-opacity':0.85}},'trail-clusters');map.on('click','tct-lines',e=>{if(!picking)loadTrail(Number(e.features[0].properties.id));});
  map.addSource('network-preview',{type:'geojson',data:fc([])});
  map.addLayer({id:'network-halo',type:'line',source:'network-preview',paint:{'line-color':'#fff','line-width':5,'line-opacity':0.8}},'trail-clusters');
  map.addLayer({id:'network-lines',type:'line',source:'network-preview',paint:{'line-color':'#146c42','line-width':2.5}},'trail-clusters');
  for(const [id,color] of [['destination','#7954a1'],['staging','#247cb2']]){map.addSource(id,{type:'geojson',data:fc([])});map.addLayer({id:`${id}-pins`,type:'circle',source:id,paint:{'circle-color':color,'circle-radius':9,'circle-stroke-color':'#fff','circle-stroke-width':2}});}
  async function clusterClick(e){if(picking)return;try{const f=e.features[0],leaves=await map.getSource('catalog').getClusterLeaves(f.properties.cluster_id,f.properties.point_count,0);const ids=new Set(leaves.map(x=>Number(x.properties.id)));clusterItems=getCatalog().filter(r=>ids.has(r.id));listMode='cluster';page=0;render();el('map-results-heading').focus();}catch{el('map-results-note').textContent='Could not read this cluster. Move the map and try again.';}}
  map.on('click','trail-clusters',clusterClick);
  map.on('click','trail-pins',e=>{if(!picking)loadTrail(Number(e.features[0].properties.id));});
  map.on('click','network-lines',e=>{if(!picking&&!map.queryRenderedFeatures(e.point,{layers:['trail-clusters','trail-pins','destination-pins']}).length)loadTrail(Number(e.features[0].properties.id));});
  map.on('click','destination-pins',e=>{if(!picking)openDestination(e.features[0].properties.id);});
  // DOM buttons make cluster counts keyboard/screen-reader accessible as well
  // as avoiding a dependency on downloaded glyph fonts for the numbers.
  const clusterMarkers=new Map();
  const destinationMarkers=new Map();
  if(map.getLayer('cluster-count'))map.setLayoutProperty('cluster-count','visibility','none');
  function updateClusterButtons(){
    const visible=new Map(map.queryRenderedFeatures({layers:['trail-clusters']}).map(f=>[f.properties.cluster_id,f]));
    for(const [id,marker] of clusterMarkers)if(!visible.has(id)){marker.remove();clusterMarkers.delete(id);}
    for(const [id,feature] of visible)if(!clusterMarkers.has(id)){const button=document.createElement('button');button.className='map-cluster-button';button.textContent=feature.properties.point_count_abbreviated;button.setAttribute('aria-label',`Show ${feature.properties.point_count} routes and paths in cluster`);button.onclick=e=>{e.stopPropagation();clusterClick({features:[feature]});};clusterMarkers.set(id,new lib.Marker({element:button}).setLngLat(feature.geometry.coordinates).addTo(map));}
  }
  map.on('idle',updateClusterButtons);
  map.on('click',e=>{if(picking){picking=false;el('map-pick-destination').textContent='Choose destination on map';pickDestination({lat:e.lngLat.lat,lon:e.lngLat.lng});}});
  map.on('moveend',()=>{if(listMode==='view')page=0;refresh();});
  for(const id of ['map-distance-filter','map-time-filter','map-availability-filter','map-sort'])el(id).onchange=()=>{page=0;render();};el('map-reset-filters').onclick=()=>{el('map-trail-search').value='';for(const id of ['map-distance-filter','map-time-filter'])el(id).value='Infinity';el('map-availability-filter').value='all';el('map-sort').value='near';page=0;render();};
  el('map-trail-search').oninput=()=>{page=0;render();};el('map-list-prev').onclick=()=>{page--;render();};el('map-list-next').onclick=()=>{page++;render();};el('map-view-list').onclick=()=>{listMode='view';page=0;render();};
  el('map-zoom-group').onclick=()=>{if(!shownAll.length)return;const b=new lib.LngLatBounds();shownAll.forEach(r=>b.extend([r.lon,r.lat]));map.fitBounds(b,{padding:50,maxZoom:13});};
  el('map-tct').onclick=()=>{listMode='view';page=0;el('map-trail-search').value='';el('map-availability-filter').value='tct';for(const id of ['map-distance-filter','map-time-filter'])el(id).value='Infinity';const data=getCatalog().filter(r=>r.collection?.id==='trans-canada-trail');if(!data.length)return;const b=new lib.LngLatBounds();for(const r of data){b.extend([r.bounds.west,r.bounds.south]);b.extend([r.bounds.east,r.bounds.north]);}map.fitBounds(b,{padding:40});render();};
  el('map-all-canada').onclick=()=>map.fitBounds([[-141,41],[-52,83]],{padding:40});el('map-alberta').onclick=()=>map.fitBounds([[-120.2,48.9],[-110,60]],{padding:40});
  el('map-pick-destination').onclick=()=>{picking=!picking;el('map-pick-destination').textContent=picking?'Click map to set destination…':'Choose destination on map';map.getCanvas().style.cursor=picking?'crosshair':'';};
  loadOfflinePack().then(data=>{pack=data;summaries=new Map(Object.entries(data.routes).map(([id,p])=>[Number(id),bboxOf(p)]));metrics=new Map(Object.entries(data.routes).map(([id,coords])=>[Number(id),routeSummary(coords.map(p=>({lat:p[0],lon:p[1],...(p[2]?{break:true}:{})})))]));refresh();}).catch(()=>{el('map-results-note').textContent='Route preview pack unavailable; pins and indexed hike list still work.';});
  refresh();
  return {refresh,setDestinations(data){
    const located=data.filter(hasCoordinates);map.getSource('destination').setData(fc(located.map(d=>({type:'Feature',properties:{id:d.id,name:d.name},geometry:{type:'Point',coordinates:[d.lon,d.lat]}}))));
    const ids=new Set(located.map(d=>d.id));for(const [id,marker] of destinationMarkers)if(!ids.has(id)){marker.remove();destinationMarkers.delete(id);}
    for(const d of located)if(!destinationMarkers.has(d.id)){const button=document.createElement('button');button.className='map-destination-button';button.textContent='◇';button.title=d.name;button.setAttribute('aria-label',`Open destination ${d.name}`);button.onclick=e=>{e.stopPropagation();if(picking){picking=false;el('map-pick-destination').textContent='Choose destination on map';pickDestination({lat:d.lat,lon:d.lon});}else openDestination(d.id);};destinationMarkers.set(d.id,new lib.Marker({element:button}).setLngLat([d.lon,d.lat]).addTo(map));}
  },setStaging(data){map.getSource('staging').setData(fc(data.map(d=>({type:'Feature',properties:{id:d.id,name:d.name},geometry:{type:'Point',coordinates:[d.lon,d.lat]}}))));},focusPlace(p,zoom=12){map.flyTo({center:[p.lon,p.lat],zoom});}};
}
