import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeFeatures,catalogFeatures} from '../public/map-view.js';
test('map route layers preserve disconnected segments and lon/lat order',()=>{const geo=routeFeatures([{id:'x',name:'Trail',points:[{lat:51,lon:-115},{lat:52,lon:-116},{lat:55,lon:-120,break:true},{lat:56,lon:-121}]}]);assert.equal(geo.features.length,2);assert.deepEqual(geo.features[0].geometry.coordinates, [[-115,51],[-116,52]]);assert.equal(geo.features[1].properties.id,'x');});
test('map pins use actual indexed centres and route identifiers',()=>{const f=catalogFeatures([{id:5,name:'Ridge',lat:50,lon:-110}]).features[0];assert.deepEqual(f.geometry.coordinates,[-110,50]);assert.equal(f.properties.id,5);assert.equal(routeFeatures([]).features.length,0);});
