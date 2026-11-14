import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { htmlFiles, securityPolicy } from './sync-security-policy.mjs';
import { inquiryPayload, sendInquiry } from '../inquiry-delivery.mjs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

// Exercise the real GA4 and Meta renderers with hostile external labels. No API calls.
const marker = '<img src=x onerror="window.__attack=1"> & \'quoted\'';
const nodes = new Map();
const node = id => {
  if (!nodes.has(id)) nodes.set(id, {innerHTML:'',textContent:'',className:'',hidden:false,dataset:{days:'30'},style:{},listeners:{},
    addEventListener(event, fn) { this.listeners[event] = fn; }, classList:{add(){},remove(){}}});
  return nodes.get(id);
};
let completion;
const mockDocument = {getElementById:node,querySelector:()=>node('range'),querySelectorAll:()=>[],body:{classList:{add(){},remove(){}}}};
const sandbox = {
  document:mockDocument,Intl,Date,Number,String,Math,Boolean,Promise,Error,setInterval,clearInterval,
  window:{WECO_ADMIN_CONFIG:{propertyId:'local',googleClientId:'local',metaAppId:'local',metaAdAccountId:'local'},google:{accounts:{oauth2:{}}},FB:{}},
  google:{accounts:{oauth2:{initTokenClient(options){
    assert.equal(options.scope,'https://www.googleapis.com/auth/analytics.readonly');
    return {requestAccessToken(){completion=options.callback({access_token:'LOCAL_ONLY'});}};
  }}}},
  FB:{login(callback){callback({authResponse:true});},api(path,method,params,callback){callback({data:[{campaign_name:marker,spend:'1',impressions:'2',clicks:'1',actions:[]}]});}},
  fetch:async()=>({ok:true,json:async()=>({rows:[{dimensionValues:[{value:marker}],metricValues:[{value:'1'},{value:'1'},{value:'1'}]}]})})
};
vm.runInNewContext(read('admin/admin.js'),sandbox);
await node('authBtn').listeners.click(); await completion;
await node('metaAuthBtn').listeners.click();
for (const id of ['trendChart','sourceChart','pageTable','deviceLegend','metaCampaignTable']) {
  const html=node(id).innerHTML;
  assert.ok(!html.includes('<img'),`${id}: external data must not create HTML elements`);
  assert.ok(html.includes('&lt;img'),`${id}: preserve the literal label as text`);
  assert.ok(html.includes('&amp;'));
}
console.log('PASS: hostile GA4 and Meta labels are escaped in all external-data HTML renderers (mocked).');

// Browser guard: success-only cooldown, cross-form in-flight lock, retry after failure,
// shared browser timestamp and operation when browser storage is unavailable.
const memory=new Map();
let clock=Date.parse('2026-11-15T00:00:00Z');
function makeGuard(blocked=false) {
  class Clock extends Date {static now(){return clock;}}
  const context={window:{},WeakMap,Date:Clock,Number,Math,String,localStorage:{
    getItem(key){if(blocked)throw Error('blocked');return memory.get(key)||null;},
    setItem(key,value){if(blocked)throw Error('blocked');memory.set(key,value);}
  }};
  vm.runInNewContext(read('inquiry-guard.js'),context);
  const trap={value:''};
  return {api:context.window.WECO_FORM_GUARD,trap,container:{querySelector:()=>trap}};
}
const a=makeGuard(), b={querySelector:()=>({value:''})};
const guard=a.api.attach(a.container), second=a.api.attach(b);
assert.equal(guard.begin().allowed,true);
assert.equal(second.begin().code,'busy');
guard.release();
assert.equal(guard.begin().allowed,true,'failure release must allow retry');
guard.accepted(); guard.release();
assert.equal(second.check().code,'cooldown');
const reload=makeGuard();
assert.equal(reload.api.attach(reload.container).check().code,'cooldown');
assert.deepEqual([...memory.keys()],['weco_inquiry_accepted_at_v1']);
assert.match([...memory.values()][0],/^\d+$/,'only a timestamp may be persisted');
clock+=60001;
assert.equal(second.check().allowed,true);
a.trap.value='bot';
assert.equal(guard.begin().code,'honeypot');
assert.equal(second.begin().allowed,true,'trap must not lock other forms');second.release();
const denied=makeGuard(true), deniedGuard=denied.api.attach(denied.container);
assert.equal(deniedGuard.begin().allowed,true);deniedGuard.accepted();deniedGuard.release();
assert.equal(deniedGuard.check().code,'cooldown','in-memory protection works without storage');
console.log('PASS: honeypot, in-flight lock, success-only 60-second cooldown and blocked-storage behavior.');

const valid=inquiryPayload({name:'보안 검사',phone:'01000000000',message:'mock only',leadContext:{}});
let calls=0;
const transport=async()=>{calls++;return {ok:true,json:async()=>({success:'true'})};};
await sendInquiry(valid,undefined,transport);
assert.equal(calls,1);
for (const invalid of [{_honey:'bot'},{연락처:'not a phone'},{이름:'x'.repeat(51)},{문의내용:'x'.repeat(2001)}]) {
  await assert.rejects(sendInquiry({...valid,...invalid},undefined,transport));
}
assert.equal(calls,1,'invalid fields must never reach transport');
await assert.rejects(sendInquiry(valid,undefined,async()=>({ok:true,json:async()=>({success:false})})));
console.log('PASS: invalid phone, excessive field lengths, bot trap and provider rejection do not become successful inquiries.');

// Actual brand-discovery transport wrapper, all network operations mocked.
for (const [blocked,ok,success] of [[false,true,true],[false,true,false],[false,false,false],[true,true,true]]) {
  let sendCount=0,accepted=0,released=0;
  const listeners={};
  const guard={check:()=>({allowed:!blocked}),begin:()=>({allowed:!blocked,message:'blocked'}),honeypot:()=>'',accepted(){accepted++;},release(){released++;}};
  const email={value:'fixture@example.invalid'};
  const status={textContent:''};
  const card={querySelector:selector=>selector==='[data-client-email]'?{}:status};
  const doc={documentElement:{},querySelector:selector=>selector==='.contact-card'?card:selector==='[data-client-email] input'?email:null,
    addEventListener:(name,callback)=>{listeners[name]=callback;}};
  const ctx={document:doc,window:{WECO_FORM_GUARD:{attach:()=>guard},fetch:async()=>{sendCount++;return new Response(JSON.stringify({success}),{status:ok?200:400});}},
    MutationObserver:class{observe(){}},HTMLInputElement:class{},FormData,File,Response,Promise,Error,Date,JSON,Object,String,Array,
    sessionStorage:{setItem(){},removeItem(){}}};
  vm.runInNewContext(read('brand-discovery/assets/client-email-delivery.js'),ctx);
  listeners.DOMContentLoaded();
  // Read the existing input through the real click listener before transport.
  listeners.click({target:{closest:()=>({})},preventDefault(){},stopImmediatePropagation(){}});
  const body=new FormData();body.set('브랜드명','local fixture');
  const request=ctx.window.fetch('https://formsubmit.co/ajax/storm2119@gmail.com',{method:'POST',body});
  if(blocked)await assert.rejects(request);else await request;
  assert.equal(sendCount,blocked?0:1);
  assert.equal(accepted,!blocked&&ok&&success?1:0);
  assert.equal(released,blocked?0:1);
  assert.equal(body.get('_honey'),'');
  assert.equal(body.get('고객 이메일'),'fixture@example.invalid');
}
console.log('PASS: brand-discovery honors guard, retains email delivery and only records provider-confirmed acceptance.');

for (const file of htmlFiles) {
  const html=readFileSync(file,'utf8');
  const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
  assert.equal(policy,securityPolicy(html,file.includes('/admin/')),file);
  assert.ok(html.indexOf('Content-Security-Policy')<html.search(/<script\b/i)||!/<script\b/i.test(html));
  assert.match(policy,/script-src-attr 'none'/);
  assert.doesNotMatch(policy,/unsafe-eval|frame-ancestors/,'do not use eval or pretend meta can set frame-ancestors');
  assert.doesNotMatch(html,/\son(?:error|click|load)\s*=/i);
  assert.match(html,/name="referrer" content="strict-origin-when-cross-origin"/);
  for (const form of html.matchAll(/<form\b[\s\S]*?<\/form>/gi)) assert.match(form[0],/name="_honey"/);
  if(/id="inquiryForm"|id="quick-consult"/.test(html)) assert.match(html,/src="inquiry-guard\.js\?v=1"/);
}
console.log(`PASS: ${htmlFiles.length} CSP policies, inline hashes, referrer controls and inquiry honeypots; no production traffic sent.`);
