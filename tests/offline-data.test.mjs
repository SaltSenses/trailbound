import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {unpackRoute} from '../public/offline-pack.js';
test('shipped offline pack covers its declared catalog entries with valid coordinates',()=>{
  const pack=JSON.parse(gunzipSync(readFileSync(new URL('../public/data/canada-routes.json.gz',import.meta.url))));
  const catalog=JSON.parse(readFileSync(new URL('../public/data/canada.json',import.meta.url)));
  const meta=JSON.parse(readFileSync(new URL('../public/data/offline-manifest.json',import.meta.url)));
  assert.equal(Object.keys(pack.routes).length,meta.available);
  for(const entry of catalog.routes){const route=unpackRoute(pack,entry);if(route)assert.ok(route.points.length>=2);else assert.ok(meta.unavailable.includes(entry.id),`Missing unreported route ${entry.id}`);}
});
