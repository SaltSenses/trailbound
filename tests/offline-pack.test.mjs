import {test} from 'node:test';
import assert from 'node:assert/strict';
import {unpackRoute} from '../public/offline-pack.js';
const pack={format:'trailbound-offline-routes',version:1,fetchedAt:'2026-11-01T00:00:00Z',routes:{8:[[51,-115],[51.1,-115.1],[52,-116,1],[52.1,-116.1]]}};
test('offline pack preserves geometry and gaps without a live provider',()=>{const r=unpackRoute(pack,{id:8,name:'Ridge'});assert.equal(r.points.length,4);assert.equal(r.points[2].break,true);assert.equal(r.id,'osm-relation-8');});
test('offline pack rejects malformed coordinates and unsupported versions',()=>{assert.throws(()=>unpackRoute({...pack,version:2},{id:8,name:'Ridge'}));assert.throws(()=>unpackRoute({...pack,routes:{8:[[999,0],[1,1]]}},{id:8,name:'Ridge'}));assert.equal(unpackRoute(pack,{id:10,name:'Missing'}),null);});
