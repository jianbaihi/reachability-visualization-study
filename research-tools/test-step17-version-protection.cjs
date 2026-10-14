const fs=require('fs'),path=require('path'),assert=require('assert').strict;
const root=path.resolve(__dirname,'..'),out=process.env.EVIDENCE_DIR||path.join(root,'output/playwright/step17'),base=process.env.CANDIDATE_URL||'http://127.0.0.1:8037/experiment.html',copy=JSON.parse(fs.readFileSync(path.join(root,'research-tools/fixtures/step17/instruction-copy.json')));
const fixtureRoot=path.join(root,'research-tools/fixtures/step17');
const frozen=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'frozen-v1.1.0-complete.json'))),candidate=JSON.parse(fs.readFileSync(path.join(out,'new-complete.json')));
const keyFor=v=>'reachability_questionnaire_session_'+v.replace('questionnaire-','').replaceAll('.','_');
(async()=>{let browser,sid;const mode=process.argv[2]||'chrome';const results=[];
try{
let p;
async function req(method,endpoint,body){const j=await(await fetch('http://127.0.0.1:4445/session/'+sid+endpoint,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})).json();if(j.value?.error)throw Error(JSON.stringify(j.value));return j.value;}
if(mode==='chrome'){const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});p=await browser.newPage();}else{const j=await(await fetch('http://127.0.0.1:4445/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capabilities:{alwaysMatch:{browserName:'safari'}}})})).json();sid=j.value.sessionId;assert(sid);}
const exec=async(fn,arg)=>mode==='chrome'?p.evaluate(fn,arg):req('POST','/execute/sync',{script:'return ('+fn.toString()+')(arguments[0]);',args:[arg]});
const goto=async(url=base)=>mode==='chrome'?p.goto(url):req('POST','/url',{url});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn){for(let i=0;i<100;i++){if(await exec(fn))return;await pause(100)}throw Error('wait '+fn)}
await goto();await wait(()=>window.questionnaireRuntimeInitialized);
for(const version of ['questionnaire-v1.0.0','questionnaire-v1.0.1','questionnaire-v1.1.0','questionnaire-v1.1.1']){
 const old=version.includes('v1.0.'),original=old?JSON.parse(fs.readFileSync(path.join(root,'research-tools/fixtures/legacy-v1/legacy-T3.json'))):JSON.parse(JSON.stringify(version.endsWith('1.1.1')?candidate:frozen));
 const fixture={...original,questionnaireVersion:version,status:'in-progress',currentStep:'tutorial'},key=keyFor(version);
 await goto(base.replace('experiment.html','index.html'));
 await exec(({key,fixture})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(fixture));},{key,fixture});await goto();await wait(()=>window.questionnaireRuntimeInitialized&&!document.querySelector('#tutorial').classList.contains('hidden'));
 assert.equal(await exec(()=>document.querySelector('.instructions-description').textContent),version.endsWith('1.1.1')?copy.new:copy.frozen);
 const after=await exec(key=>JSON.parse(localStorage.getItem(key)),key);
 for(const field of ['questionnaireVersion','participantId','taskSeed','taskInstances','tasks','previs','releaseChannel'])assert.deepEqual(after[field],fixture[field],version+'/'+field);
 assert.equal(await exec(()=>localStorage.getItem('reachability_questionnaire_session_v1_1_1')!==null),version.endsWith('1.1.1'));
 results.push({version,originalFrozenCopy:!version.endsWith('1.1.1'),candidateCopy:version.endsWith('1.1.1'),participantSeedAnswersInstancesPreserved:true});
 if(version.endsWith('1.1.1'))for(const [width,height] of [[1280,720],[1280,900],[1440,900],[1470,956]]){
  if(mode==='chrome')await p.setViewportSize({width,height});else {await req('POST','/window/rect',{width,height});const size=await exec(()=>({width:innerWidth,height:innerHeight}));await req('POST','/window/rect',{width:width+(width-size.width),height:height+(height-size.height)});}
  await pause(250);
  const layout=await exec(()=>{const n=document.querySelector('.instructions-description'),b=document.querySelector('#tutorial [data-next=part-a]');b.scrollIntoView({block:'end',behavior:'instant'});const r=b.getBoundingClientRect(),s=getComputedStyle(n);return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,paragraphs:document.querySelectorAll('.instructions-description').length,br:n.querySelectorAll('br').length,font:s.fontSize,lineHeight:s.lineHeight,overflowY:getComputedStyle(document.body).overflowY,paragraphHeight:n.getBoundingClientRect().height,buttonVisible:r.top>=0&&r.bottom<=innerHeight+1,buttonDisabled:b.disabled,warningDisplay:getComputedStyle(document.querySelector('#tutorial'),'::after').display};});
  assert.equal(layout.paragraphs,1);assert.equal(layout.br,0);assert(layout.scrollWidth<=layout.width);assert(layout.buttonVisible);assert.equal(layout.font,'16px');assert.equal(layout.warningDisplay,'none');
  await exec(()=>window.scrollTo(0,0));await pause(150);
  const name=mode+'-instructions-'+width+'x'+height+'.png';if(mode==='chrome')await p.screenshot({path:path.join(out,name),fullPage:true});else fs.writeFileSync(path.join(out,name),Buffer.from(await req('GET','/screenshot'),'base64'));
  if(mode==='safari'){await exec(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await pause(500);const hit=await exec(()=>{const b=document.querySelector('#tutorial [data-next=part-a]'),r=b.getBoundingClientRect();return {rect:r.toJSON(),height:innerHeight,hit:b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};});assert(hit.hit,JSON.stringify(hit));fs.writeFileSync(path.join(out,name.replace('.png','-button.png')),Buffer.from(await req('GET','/screenshot'),'base64'));}results.push({layout,screenshot:name});
 }
}
for(const stage of ['part-a','previs','completion']){
 const fixture={...frozen,status:stage==='completion'?'completed':'in-progress',currentStep:stage,currentTaskId:'T3',activeTask:null};const key=keyFor(fixture.questionnaireVersion);
 await goto(base.replace('experiment.html','index.html'));await exec(({key,fixture})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(fixture));},{key,fixture});await goto();await wait(()=>window.questionnaireRuntimeInitialized);
 if(stage==='part-a')await wait(()=>!!document.querySelector('.visual>svg [data-place-id]'));if(stage==='previs')await wait(()=>!!document.querySelector('[data-previs-item]'));
 const after=await exec(key=>JSON.parse(localStorage.getItem(key)),key);for(const field of ['questionnaireVersion','participantId','taskSeed','taskInstances','tasks','previs','releaseChannel'])assert.deepEqual(after[field],fixture[field],stage+'/'+field);
 if(stage==='completion'){
  const source=`await QuestionnaireStartup.loadGroup('export');const bytes=await SurveyXlsxExporter.createWorkbookBytes(JSON.parse(localStorage.getItem('${key}')),QUESTIONNAIRE_CONTENT_V2,{},XLSX,JSZip);let s='';for(const byte of bytes)s+=String.fromCharCode(byte);return btoa(s);`;
  const b64=mode==='chrome'?await p.evaluate('(async()=>{'+source+'})()'):await req('POST','/execute/async',{script:'const done=arguments[arguments.length-1];(async()=>{'+source+'})().then(done).catch(e=>done({error:e.message}));',args:[]});assert.equal(typeof b64,'string');fs.writeFileSync(path.join(out,'v1.1.0-'+mode+'-restored.xlsx'),Buffer.from(b64,'base64'));
 }
 results.push({version:'questionnaire-v1.1.0',restoredStage:stage,originalMetadataTasksAnswersPreserved:true});
}
fs.writeFileSync(path.join(root,'release-audit/'+(process.env.AUDIT_PREFIX||'step17')+'-'+mode+'-protection.json'),JSON.stringify({pass:true,results},null,2));console.log(mode+' copy/version/layout PASS');
}finally{if(browser)await browser.close();if(sid)await fetch('http://127.0.0.1:4445/session/'+sid,{method:'DELETE'}).catch(()=>{})}
})().catch(e=>{console.error(e);process.exit(1)});
