// From the repository root, after mvn package: node --test tests/backend-contract.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

test('existing UI contract against a local mock Qwen, including shutdown', { timeout: 65000 }, async t => {
  let payload, upstreamCode = 200;
  const calls = [];
  const mock = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = JSON.parse(Buffer.concat(chunks));
    calls.push({model: data.model, key: req.headers.authorization, body: data});
    assert.equal(req.url, '/chat/completions');
    res.writeHead(data.model === 'unavailable' ? 429 : upstreamCode, {'Content-Type':'application/json'});
    res.end(JSON.stringify({choices: [{message: {content: typeof payload === 'string' ? payload : JSON.stringify(payload)}}]}));
  });
  await new Promise(r => mock.listen(0, '127.0.0.1', r));
  t.after(() => { mock.closeAllConnections(); mock.close(); });
  const work = await mkdtemp(join(tmpdir(), 'hyle-contract-'));
  const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : 'java';
  const child = spawn(java, ['-jar', resolve('target/hyle.jar')], {cwd: work, windowsHide:true, env:{
    ...process.env, HOST:'127.0.0.1', PORT:'0', CLEAR_READING_AUTO_OPEN:'0', CLEAR_READING_AUTO_STOP:'1',
    CLEAR_READING_REQUIRE_PERSONAL_KEY:'0', DASHSCOPE_API_KEY:'sk-synthetic-server',
    DASHSCOPE_BASE_URL:'http://127.0.0.1:'+mock.address().port, DASHSCOPE_MODEL:'translate',
    DASHSCOPE_CONTEXT_MODEL:'context', DASHSCOPE_ANALYSIS_MODELS:'unavailable,analysis'
  }});
  const exited = once(child, 'exit');
  t.after(async () => { if (child.exitCode === null) child.kill(); await exited; await rmdir(work); });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  let port;
  for (let i=0; i<200 && !port && child.exitCode === null; i++) {
    await delay(100);
    port = output.match(/Tomcat started on port (\d+)/)?.[1];
  }
  assert.ok(port, 'Java server did not start: '+output);
  const base = 'http://127.0.0.1:'+port;
  const status = await (await fetch(base+'/api/status')).json();
  assert.equal(status.credentialSource, 'server');
  assert.equal(status.autoStop,true);
  const page = await (await fetch(base+'/')).text();
  assert.match(page, /<div id="app">/);
  const assets = [...page.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(m => m[1]);
  assert.ok(assets.some(p => p.endsWith('.js')) && assets.some(p => p.endsWith('.css')));
  for (const file of assets) assert.equal((await fetch(base+file)).status,200);
  assert.equal((await fetch(base+'/.env.local')).status,404);
  const post = async (route, body, headers={}) => {
    const response = await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
    return {status:response.status,data:await response.json()};
  };
  payload = {translation:'水葫芦'};
  const selection = {text:'water hyacinth', context:'The water hyacinth floats.'};
  assert.equal((await post('translate',selection)).data.translation,'水葫芦');
  assert.equal(calls.at(-1).model,'context');
  assert.equal((await post('translate',selection)).data.cached,true);
  assert.equal((await post('translate',selection,{'X-Clear-Reading-API-Key':'sk-synthetic-personal'})).data.cached,false);
  assert.equal(calls.at(-1).key,'Bearer sk-synthetic-personal');
  assert.equal((await post('translate',selection,{Origin:'https://example.org'})).status,403);
  assert.equal((await post('translate',{text:'x'.repeat(20001)})).status,413);
  assert.equal((await post('translate',{})).status,400);
  payload = '河水上涨了。';
  assert.equal((await post('standalone-translate',{text:'The river rose.'})).data.translation,payload);
  assert.equal(calls.at(-1).body.translation_options.target_lang,'Chinese');
  payload = {word:'bank',meanings:[{partOfSpeech:'n.',senses:[{meaning:'河岸',example:'On the bank.'}]}]};
  assert.equal((await post('standalone-translate',{text:'bank'})).data.entry.meanings[0].senses[0].meaning,'河岸');
  payload = {meaning:'河岸',reason:'地理语境'};
  const explanation = await post('explain-word',{word:'bank',context:'a river bank'});
  assert.equal(explanation.data.explanation.meaning,'河岸');
  assert.equal(explanation.data.model,'analysis');
  assert.ok(calls.some(c => c.model === 'unavailable'));
  payload = {mainStructure:'主谓',clauses:[],grammarPoints:['一般过去时']};
  assert.equal((await post('analyze-sentence',{sentence:'The river rose.'})).data.analysis.mainStructure,'主谓');
  payload = {title:'Rivers',blocks:[{type:'paragraph',text:'Rivers rise.'}]};
  assert.equal((await post('analyze-article',{text:'Rivers\nRivers rise.'})).data.title,'Rivers');
  assert.equal((await post('analyze-article',{text:'Different article.'})).status,422);
  upstreamCode = 401;
  assert.equal((await post('translate',{text:'a new request'})).status,502);
  const first = new AbortController(), last = new AbortController();
  for (const controller of [first,last]) {
    const stream = await fetch(base+'/api/session',{signal:controller.signal});
    assert.match(stream.headers.get('content-type'),/text\/event-stream/);
    const reader = stream.body.getReader();
    let event = '';
    while (!event.includes('\n\n')) {
      const chunk = await reader.read();
      assert.equal(chunk.done, false);
      event += new TextDecoder().decode(chunk.value);
    }
    assert.match(event,/connected/);
  }
  first.abort();
  await delay(10000);
  assert.equal((await fetch(base+'/api/status')).status,200);
  last.abort();
  const deadline = AbortSignal.timeout(18000);
  while (child.exitCode === null && !deadline.aborted) await delay(150);
  assert.equal(child.exitCode,0,'last closed tab should stop the app');
});
