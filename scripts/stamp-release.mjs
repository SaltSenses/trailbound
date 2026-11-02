import {readFile,writeFile} from 'node:fs/promises';
const url=new URL('../public/sw.js',import.meta.url);
const release=process.env.GITHUB_SHA;
if(!release||!/^[a-f0-9]{40}$/.test(release))throw Error('GITHUB_SHA must be a full commit SHA');
const source=await readFile(url,'utf8');
await writeFile(url,source.replace(/const CACHE='[^']+';/,`const CACHE='trailbound-${release}';`));
console.log(`Prepared offline release ${release.slice(0,7)}`);
