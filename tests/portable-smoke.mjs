// Windows: node tests/portable-smoke.mjs <freshly extracted package directory>
// Do not run against a directory containing someone's personal settings.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

assert.ok(process.platform === 'win32' && process.argv[2], 'Expected an extracted Windows portable folder.');
const cwd = resolve(process.argv[2]);
for (const file of ['.env', '.env.local', 'node.exe', 'server.mjs']) assert.ok(!existsSync(join(cwd, file)), file);
const sys = process.env.SystemRoot;
const child = spawn(join(sys,'System32','cmd.exe'), ['/d','/c','START-HYLE.cmd'], {
  cwd, windowsHide:true, stdio:['ignore','pipe','pipe'],
  env:{ SystemRoot:sys, TEMP:process.env.TEMP, TMP:process.env.TEMP, PATH:join(sys,'System32'),
    HOST:'127.0.0.1', PORT:'0', CLEAR_READING_AUTO_OPEN:'0', CLEAR_READING_AUTO_STOP:'1' }
});
const exited = once(child,'exit');
let output = '';
child.stdout.on('data', b => {output += b}); child.stderr.on('data', b => {output += b});
try {
  let port;
  for (let i=0; i<200 && !port && child.exitCode === null; i++) {
    await delay(100); port = output.match(/Tomcat started on port (\d+)/)?.[1];
  }
  assert.ok(port, 'Launcher did not start the bundled server: ' + output);
  const base = 'http://127.0.0.1:'+port;
  const status = await (await fetch(base+'/api/status')).json();
  assert.equal(status.autoStop,true); assert.equal(status.credentialSource,'none');
  const html = await (await fetch(base)).text();
  assert.match(html, /<div id="app">/);
  const js = html.match(/src="(\/assets\/[^"]+\.js)"/)[1];
  assert.equal((await fetch(base+js)).status,200);
  const controller = new AbortController();
  const stream = await fetch(base+'/api/session',{signal:controller.signal});
  assert.match(stream.headers.get('content-type'), /text\/event-stream/);
  await stream.body.getReader().read(); controller.abort();
  for(let i=0; i<220 && child.exitCode === null; i++) await delay(100);
  assert.equal(child.exitCode,0,'Closing the page should stop START-HYLE.cmd and Java.');
  console.log('PASS: extracted START-HYLE.cmd serves Vue with bundled Java, no system Java/Node/Key, then stops on disconnect.');
} finally {
  if (child.exitCode === null) child.kill();
  await exited;
}
