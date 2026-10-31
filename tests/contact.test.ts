import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleContact, validateFields, validEmail, type ContactEnv, type ContactDatabase } from '../functions/api/contact.ts';
const fields = { name: 'Test Person', email: 'test@kunde.test', company: 'Eksempel AS', message: 'Dette er syntetiske testopplysninger.', website: '' };
function setup() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync('migrations/0001_contact_rate_limits.sql', 'utf8'));
  const db: ContactDatabase = { prepare(query) {
    let args: (string|number)[] = [];
    return { bind(...values) { args=values; return this; }, async first<T>() { return (sql.prepare(query).get(...args) ?? null) as T|null; }, async run() { return sql.prepare(query).run(...args); } };
  } };
  const env:ContactEnv={CONTACT_DB:db,CONTACT_ORIGIN:'https://sikt.test',CONTACT_FROM:'web@sikt.test',CONTACT_TO:'kontakt@sikt.test',RESEND_API_KEY:'re_test_synthetic',RATE_LIMIT_SECRET:'synthetic-test-secret-with-more-than-32-characters'};
  let calls = 0;
  const runtime={now:()=>1_800_000_000_000,fetch:(async()=>{calls++;return Response.json({id:'synthetic-only'});}) as typeof fetch};
  return {env, runtime, sql, calls:()=>calls};
}
function req(data:unknown=fields, headers:Record<string,string>={}) { return new Request('https://sikt.test/api/contact', {method:'POST',headers:{Origin:'https://sikt.test','CF-Connecting-IP':'192.0.2.4',Accept:'application/json','Content-Type':'application/json',...headers},body:JSON.stringify(data)}); }

test('validation rejects injection, wrong types, honeypot and oversized message',()=>{
  assert.equal(validEmail('a@example.test\r\nBcc: victim@x.test'),false);
  assert.ok(validateFields({...fields,name:'Test\nBcc: x',company:[],website:'bot',message:'x'.repeat(4001)}).errors.name);
  assert.ok(validateFields({...fields,website:'bot'}).errors.website);
  assert.ok(validateFields({...fields,message:42}).errors.message);
  assert.equal(Object.keys(validateFields(fields).errors).length,0);
});
test('successful delivery uses fixed sender and validated reply-to; does not store content',async()=>{
  const s=setup(); let sent:Record<string,unknown>={};
  s.runtime.fetch=(async(url,init)=>{assert.equal(url,'https://api.resend.com/emails');sent=JSON.parse(String(init?.body));assert.ok(new Headers(init?.headers).get('Idempotency-Key'));return Response.json({id:'synthetic'});}) as typeof fetch;
  const response=await handleContact(req(),s.env,s.runtime);
  assert.equal(response.status,200);assert.equal(sent.reply_to,fields.email);assert.equal(sent.from,s.env.CONTACT_FROM);assert.deepEqual(sent.to,[s.env.CONTACT_TO]);
  const row=s.sql.prepare('SELECT * FROM contact_rate_limits').get()!;
  assert.deepEqual(Object.keys(row).sort(),['attempts','expires_at','key']);assert.match(String(row.key),/^[a-f0-9]{64}$/);
  assert.equal(response.headers.get('cache-control'),'no-store');assert.ok(response.headers.get('content-security-policy'));s.sql.close();
});
test('atomic D1 SQL admits exactly five concurrent attempts and blocks the rest',async()=>{
  const s=setup();const results=await Promise.all(Array.from({length:10},()=>handleContact(req(),s.env,s.runtime)));
  assert.equal(results.filter(r=>r.status===200).length,5);assert.equal(results.filter(r=>r.status===429).length,5);assert.equal(s.calls(),5);
  assert.ok(results.find(r=>r.status===429)?.headers.get('retry-after'));s.sql.close();
});
test('unconfigured, untrusted origin and missing trusted IP fail closed',async()=>{
  const s=setup();assert.equal((await handleContact(req(),{},s.runtime)).status,503);
  assert.equal((await handleContact(req(fields,{Origin:'https://evil.test'}),s.env,s.runtime)).status,403);
  assert.equal((await handleContact(req(fields,{'CF-Connecting-IP':''}),s.env,s.runtime)).status,503);assert.equal(s.calls(),0);s.sql.close();
});
test('database failure never sends mail',async()=>{
  const s=setup();s.sql.close();assert.equal((await handleContact(req(),s.env,s.runtime)).status,503);assert.equal(s.calls(),0);
});
test('provider failure and invalid provider success are not reported as delivery',async()=>{
  for(const provider of [new Response('bad',{status:500}),Response.json({}),Response.json({id:5})]){
    const s=setup();s.runtime.fetch=(async()=>provider) as typeof fetch;
    assert.equal((await handleContact(req(),s.env,s.runtime)).status,502);s.sql.close();
  }
});
test('native form redirects only to fixed pages after success or validation error',async()=>{
  const s=setup();let request=req(fields,{Accept:'text/html','Content-Type':'application/x-www-form-urlencoded'});
  request=new Request(request,{body:new URLSearchParams(fields).toString()});
  const ok=await handleContact(request,s.env,s.runtime);assert.equal(ok.status,303);assert.equal(ok.headers.get('location'),'/takk/');
  const fail=await handleContact(req({...fields,email:'bad'},{Accept:'text/html'}),s.env,s.runtime);assert.equal(fail.headers.get('location'),'/kontakt-feil/?kode=validation');s.sql.close();
});
test('duplicate fields, huge bodies and unsupported media do not reach mail provider',async()=>{
  const s=setup();const cases=[
    new Request(req(),{headers:{Origin:'https://sikt.test','CF-Connecting-IP':'192.0.2.4',Accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body:'name=a&name=b'}),
    req({...fields,message:'x'.repeat(66000)}),
    req(fields,{'Content-Type':'text/plain'}),
  ];
  for(const request of cases) assert.equal((await handleContact(request,s.env,s.runtime)).status,400);
  assert.equal(s.calls(),0);s.sql.close();
});
test('expired counters are cleaned and a later window is available',async()=>{
  const s=setup();await handleContact(req(),s.env,s.runtime);s.runtime.now=()=>1_800_000_900_000;
  assert.equal((await handleContact(req(),s.env,s.runtime)).status,200);
  assert.equal(s.sql.prepare('SELECT count(*) AS count FROM contact_rate_limits').get()!.count,1);s.sql.close();
});
test('non POST requests are rejected without provider access',async()=>{
  const s=setup();const response=await handleContact(new Request('https://sikt.test/api/contact'),s.env,s.runtime);
  assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'POST');assert.equal(s.calls(),0);s.sql.close();
});
