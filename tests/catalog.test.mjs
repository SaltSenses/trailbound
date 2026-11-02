import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findTrails,relationPoints} from '../public/catalog.js';
test('catalog search supports accents, operators and bounded regions',()=>{const r=[{name:'Sentier Québec',localName:'Sentier Québec',operator:'Parc',lat:47,lon:-71},{name:'Ridge',lat:51,lon:-115}];assert.equal(findTrails(r,'québec').length,1);assert.equal(findTrails(r,'parc').length,1);assert.equal(findTrails(r,'','AB')[0].name,'Ridge');});
test('joins reversed members without inventing connections',()=>{const p=relationPoints({members:[{type:'way',geometry:[{lat:1,lon:1},{lat:1,lon:2}]},{type:'way',geometry:[{lat:1,lon:3},{lat:1,lon:2}]},{type:'way',geometry:[{lat:5,lon:5},{lat:5,lon:6}]}]});assert.deepEqual(p[2],{lat:1,lon:3});assert.equal(p[3].break,true);assert.equal(p.length,5);});
test('empty or unusable geometry is rejected',()=>{assert.throws(()=>relationPoints({members:[]}));});
