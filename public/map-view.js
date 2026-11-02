import {offlineStyle} from './regions.js';
import {attachMapDiscovery} from './map-discovery.js';
// Live basemap rendering is isolated from local route storage and recording.
const LIBRARY='./vendor/';
export function routeFeatures(routes){
  return {type:'FeatureCollection',features:routes.flatMap(r=>{
    const segments=[];let segment=[];
    for(const p of r.points){if(p.break&&segment.length){if(segment.length>1)segments.push(segment);segment=[];}segment.push([p.lon,p.lat]);}
    if(segment.length>1)segments.push(segment);
    return segments.map(coordinates=>({type:'Feature',properties:{id:r.id,name:r.name},geometry:{type:'LineString',coordinates}}));
  })};
}
export function catalogFeatures(catalog){return {type:'FeatureCollection',features:catalog.map(r=>({type:'Feature',properties:{id:r.id,name:r.name},geometry:{type:'Point',coordinates:[r.lon,r.lat]}}))};}
let libraryPromise;
function loadLibrary(){
  if(window.maplibregl)return Promise.resolve(window.maplibregl);
  if(!libraryPromise)libraryPromise=new Promise((resolve,reject)=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href=LIBRARY+'maplibre-gl.css';document.head.append(css);
    const script=document.createElement('script');script.src=LIBRARY+'maplibre-gl.js';script.onload=()=>resolve(window.maplibregl);script.onerror=()=>{libraryPromise=null;script.remove();reject(Error('Map renderer could not load. Check your internet connection.'));};document.head.append(script);
  });
  return libraryPromise;
}
export function createTrailMap({loadTrail,beginRoute,onError,openDestination=()=>{},pickDestination=()=>{},getFavorites=()=>new Set(),toggleFavorite=async()=>{}}){
  let map,lib,ready=false,opening,catalog=[],routes=[],selected=null,position,marker,terrain=false,terrainFailed=false,explorer=null,destinations=[],staging=[],pendingPlace=null,regions=[],offlineMode=false,lastView=null;
  try{offlineMode=localStorage.getItem('trailbound-map-mode')==='offline';lastView=JSON.parse(localStorage.getItem('trailbound-map-view')||'null');if(lastView&&(!Array.isArray(lastView.center)||lastView.center.length!==2||!lastView.center.every(Number.isFinite)||!Number.isFinite(lastView.zoom)))lastView=null;}catch{}
  const el=id=>document.getElementById(id);
  const status=text=>{el('map-status').textContent=text;};
  const apply=()=>{if(!ready)return;map.getSource('catalog').setData(catalogFeatures(catalog));map.getSource('saved-routes').setData(routeFeatures(routes));map.getSource('selected-route').setData(routeFeatures(selected?[selected]:[]));};
  const fit=()=>{if(!ready||!selected)return;const bounds=new lib.LngLatBounds();selected.points.forEach(p=>bounds.extend([p.lon,p.lat]));map.fitBounds(bounds,{padding:55,maxZoom:15,duration:900});};
  const dropdown=()=>{const select=el('map-route-select'),value=select.value;select.replaceChildren(new Option('Choose a saved route…',''));routes.forEach(r=>select.add(new Option(r.name,r.id)));select.value=selected?.id||value;};
  function mode(is3D){if(!ready)return;if(offlineMode&&is3D){status('Offline regional maps are 2D; 3D elevation still requires internet.');return;}terrain=is3D;terrainFailed=false;map.setTerrain(is3D?{source:'elevation',exaggeration:1.2}:null);map.setLayoutProperty('terrain-shade','visibility',is3D?'visible':'none');map.easeTo({pitch:is3D?65:0,bearing:is3D?-20:0,duration:800});el('map-2d').setAttribute('aria-pressed',String(!is3D));el('map-3d').setAttribute('aria-pressed',String(is3D));el('terrain-map').dataset.mode=is3D?'3d':'2d';status(is3D?'3D terrain enabled · elevation tiles stream online · relief exaggerated 1.2×':'2D map · drag to pan, scroll or pinch to zoom');}
  async function open(){
    if(map){map.resize();return;}
    if(opening)return opening;
    opening=(async()=>{try{
      status('Loading interactive map…');if(!navigator.onLine)offlineMode=true;lib=await loadLibrary();
      map=new lib.Map({container:'terrain-map',style:offlineMode?offlineStyle(regions):'https://tiles.openfreemap.org/styles/bright',center:lastView?.center||[-115.4,53.2],zoom:lastView?.zoom||5.5,maxZoom:18,maxPitch:80,attributionControl:true});
      map.addControl(new lib.NavigationControl({visualizePitch:true}),'top-right');map.addControl(new lib.FullscreenControl(),'top-right');map.addControl(new lib.ScaleControl({unit:'metric'}));
      const locate=new lib.GeolocateControl({positionOptions:{enableHighAccuracy:true},trackUserLocation:true,showAccuracyCircle:true});map.addControl(locate,'top-right');
      map.on('load',()=>{
        if(!offlineMode){map.addSource('elevation',{type:'raster-dem',url:'https://tiles.mapterhorn.com/tilejson.json',encoding:'terrarium',tileSize:512,attribution:'Terrain: <a href="https://mapterhorn.com/attribution" target="_blank">Mapterhorn</a>'});
        map.addSource('elevation-shade',{type:'raster-dem',url:'https://tiles.mapterhorn.com/tilejson.json',encoding:'terrarium',tileSize:512});
        const firstLabel=map.getStyle().layers.find(layer=>layer.type==='symbol')?.id;
        map.addLayer({id:'terrain-shade',type:'hillshade',source:'elevation-shade',layout:{visibility:'none'},paint:{'hillshade-exaggeration':0.45,'hillshade-shadow-color':'#4c5841','hillshade-highlight-color':'#fff6d9'}},firstLabel);}
        map.addSource('catalog',{type:'geojson',data:catalogFeatures(catalog),cluster:true,clusterRadius:45,clusterMaxZoom:10});
        map.addLayer({id:'trail-clusters',type:'circle',source:'catalog',filter:['has','point_count'],paint:{'circle-color':'#174f40','circle-radius':['step',['get','point_count'],21,30,27,100,33],'circle-stroke-color':'#fff9dc','circle-stroke-width':3}});
        if(!offlineMode)map.addLayer({id:'cluster-count',type:'symbol',source:'catalog',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Regular'],'text-size':14,'text-allow-overlap':true},paint:{'text-color':'#ffffff'}});
        map.addLayer({id:'trail-pins',type:'circle',source:'catalog',filter:['!', ['has','point_count']],paint:{'circle-color':'#bf6e31','circle-radius':7,'circle-stroke-color':'#fff','circle-stroke-width':2}});
        map.addSource('saved-routes',{type:'geojson',data:routeFeatures(routes)});map.addLayer({id:'saved-lines',type:'line',source:'saved-routes',paint:{'line-color':'#3e806b','line-width':3}});
        map.addSource('selected-route',{type:'geojson',data:routeFeatures(selected?[selected]:[])});map.addLayer({id:'selected-halo',type:'line',source:'selected-route',paint:{'line-color':'#fff9e6','line-width':9}});map.addLayer({id:'selected-line',type:'line',source:'selected-route',paint:{'line-color':'#ed6a26','line-width':5}});
        if(offlineMode)map.on('click',e=>{const feature=map.queryRenderedFeatures(e.point,{layers:['offline-places','offline-paths','offline-roads','offline-land']}).find(f=>f.properties.name);if(feature)new lib.Popup().setLngLat(e.lngLat).setText(feature.properties.name).addTo(map);});
        map.on('moveend',()=>{const c=map.getCenter();try{localStorage.setItem('trailbound-map-view',JSON.stringify({center:[c.lng,c.lat],zoom:map.getZoom()}));}catch{}});
        ready=true;apply();status(offlineMode?'Offline regional basemap · downloaded areas only · no terrain contours':'2D map ready · select a trail marker or a saved route');el('map-2d').disabled=false;el('map-3d').disabled=offlineMode;el('map-fit').disabled=!selected;if(selected)fit();if(position)setPosition(position);explorer=attachMapDiscovery(map,lib,{getCatalog:()=>catalog,loadTrail,openDestination,pickDestination,getFavorites,toggleFavorite});explorer.setDestinations(destinations);explorer.setStaging(staging);if(pendingPlace){explorer.focusPlace(pendingPlace);pendingPlace=null;}
        for(const layer of ['trail-clusters','trail-pins']){map.on('mouseenter',layer,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',layer,()=>map.getCanvas().style.cursor='');}
        map.on('sourcedata',e=>{if(e.sourceId==='elevation'&&e.isSourceLoaded&&terrain){el('terrain-map').dataset.terrainLoaded='true';status('3D elevation loaded · drag to explore terrain · relief exaggerated 1.2×');}});
      });
      map.on('error',e=>{if(e.sourceId==='elevation'&&terrain&&!terrainFailed){terrainFailed=true;mode(false);status('Elevation tiles unavailable. Returned to 2D; try 3D again when online.');}else if(!ready)status('Map data is still loading or unavailable. Saved route geometry remains available in Your library.');});
    }catch(err){status(err.message+' Saved routes still work in Your library.');onError(err.message);map?.remove();map=null;}finally{opening=null;}})();return opening;
  }
  function selectRoute(route,focus=true){selected=route;dropdown();apply();el('map-selected').textContent=route?`Selected: ${route.name}`:'Select a route to highlight its path.';el('map-begin').disabled=!route;el('map-fit').disabled=!ready||!route;if(ready&&focus)fit();}
  function setPosition(p){position=p;if(!ready)return;if(!marker)marker=new lib.Marker({color:'#2873ae'}).setLngLat([p.lon,p.lat]).addTo(map);else marker.setLngLat([p.lon,p.lat]);}
  el('map-2d').onclick=()=>mode(false);el('map-3d').onclick=()=>mode(true);el('map-fit').onclick=fit;el('map-begin').onclick=()=>{if(selected)beginRoute(selected);};el('map-route-select').onchange=e=>selectRoute(routes.find(r=>r.id===e.target.value)||null);
  window.addEventListener('offline',()=>switchBase(true));
  window.addEventListener('online',()=>{if(map){map.triggerRepaint();status('Connection restored. Move or zoom the map to load tiles.');}});
  function switchBase(offline){offlineMode=offline;try{localStorage.setItem('trailbound-map-mode',offline?'offline':'online');}catch{}if(map){const c=map.getCenter();lastView={center:[c.lng,c.lat],zoom:map.getZoom()};map.remove();map=null;ready=false;explorer=null;marker=null;}return open();}
  return {open,setRegions(data){const changed=regions.map(r=>r.id+':'+r.fetchedAt).join('|')!==data.map(r=>r.id+':'+r.fetchedAt).join('|');regions=data;if(changed&&offlineMode&&map)switchBase(true);},useOffline:()=>switchBase(true),useOnline:()=>switchBase(false),getBounds(){if(!ready)throw Error('Wait for the map to load.');const b=map.getBounds();return {west:b.getWest(),east:b.getEast(),south:b.getSouth(),north:b.getNorth()};},showRegion(r){const b=r.bounds;lastView={center:[(b.west+b.east)/2,(b.south+b.north)/2],zoom:12};try{localStorage.setItem('trailbound-map-view',JSON.stringify(lastView));}catch{}if(map)map.fitBounds([[b.west,b.south],[b.east,b.north]],{padding:30});},refreshDiscovery(){explorer?.refresh();},setCatalog(data){catalog=data;apply();explorer?.refresh();},setRoutes(data){routes=data;dropdown();apply();},selectRoute,setPosition,setDestinations(data){destinations=data;explorer?.setDestinations(data);},setStaging(data){staging=data;explorer?.setStaging(data);},focusPlace(p,zoom=12){if(explorer)explorer.focusPlace(p,zoom);else{pendingPlace=p;open();}}};
}
