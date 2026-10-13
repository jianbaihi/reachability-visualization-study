const fs=require('fs'),path=require('path'),assert=require('assert').strict,cp=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.EVIDENCE_DIR || path.join(root,'output/playwright'),base=process.env.CANDIDATE_URL || 'http://127.0.0.1:8021/experiment.html';
const current='reachability_questionnaire_session_v1_0_1',old='reachability_questionnaire_session_v1_0_0';
fs.mkdirSync(out,{recursive:true});
(async()=>{
const {auditParticipantCopy}=await import(path.join(root,'research-tools/audit-participant-copy.mjs'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:1000}}),initialPage=await ctx.newPage();let p=initialPage;let scans=[],fixtures={};
p.on('pageerror',e=>console.log('PAGEERROR',e.message));
async function scan(label){const r=await p.evaluate(auditParticipantCopy);assert.equal(r.pass,true,JSON.stringify(r.findings));scans.push({label,...r});}
async function session(key){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);}
async function start(){await p.goto(base);await scan('welcome');await p.locator('[data-next=background]').first().click();await p.locator('#background-continue').click();await scan('background-validation');for(const name of ['education_level','discipline_group','gis_experience','visualization_experience'])await p.locator(`select[data-field="${name}"]`).selectOption({index:1});await p.locator('#background-continue').click();await scan('instructions');await p.locator('[data-next="part-a"]').click();}
async function active(){await p.locator('#ready:not([disabled])').waitFor();await scan('ready');await p.locator('#ready').click();await p.locator('#submit-answer').waitFor();}
async function answer(i,key){await p.locator('#submit-answer').click();await scan(`T${i}-validation`);const s=await session(key),t=s.taskInstances[`T${i}`];if(i===3||i===4)await p.locator(`input[name=ring][value="${t.target_ring}"]`).check();else{const ids=i===1?t.valid_place_ids.slice(0,3):t.correct_place_ids;for(const id of ids)await p.locator(`[data-place-id="${id}"]`).press('Enter');}await scan(`T${i}-answer`);}
async function complete(key,legacy=false){
for(let i=1;i<=5;i++){await active();await answer(i,key);if(legacy&&(i===3||i===5)){fixtures[`T${i}`]=await session(key);fs.writeFileSync(path.join(out,`legacy-T${i}.json`),JSON.stringify(fixtures[`T${i}`],null,2));}await p.locator('#submit-answer').click();await scan(`T${i}-submitted`);await p.locator('#ready').click();}
for(let group=0;group<3;group++){await p.locator('[data-previs-item]').first().waitFor();await p.locator('[data-previs-image=category]').click();await scan(`previs-${group+1}-category`);await p.locator('[data-previs-image=time]').click();await scan(`previs-${group+1}-time`);const inputs=await p.locator('[data-previs-item]').count();for(let j=0;j<inputs;j++)await p.locator('[data-previs-item]').nth(j).locator('input[value="4"]').check();if(legacy&&group===1){fixtures.PREVis=await session(key);fs.writeFileSync(path.join(out,'legacy-PREVis.json'),JSON.stringify(fixtures.PREVis,null,2));}if(group<2)await p.locator('#previs-next').click();else{if(legacy)await p.locator('#previs-submit').click();else{const d=p.waitForEvent('download');await p.locator('#previs-submit').click();await (await d).saveAs(path.join(out,'new.xlsx'));}}}
await scan('completion');const download=p.waitForEvent('download');await p.locator('#download-results').click();await(await download).saveAs(path.join(out,legacy?'legacy.xlsx':'new-redownload.xlsx'));
if(legacy){fixtures.Complete=await session(key);fs.writeFileSync(path.join(out,'legacy-Complete.json'),JSON.stringify(fixtures.Complete,null,2));}
}
await start();await complete(current);assert.equal((await session(current)).questionnaireVersion,'questionnaire-v1.0.1');await p.screenshot({path:path.join(out,'chrome-completion.png'),fullPage:true});
// A separate original-code run generates genuine v1.0.0 fixtures with unchanged task generator.
await p.evaluate(()=>localStorage.clear());
const originalJs=cp.execFileSync('git',['show','questionnaire-v1.0.0:assets/experiment.js'],{cwd:root,encoding:'utf8'});
await p.route('**/assets/experiment.js*',route=>route.fulfill({body:originalJs,contentType:'application/javascript'}));
// Original visible copy is not part of the candidate audit.
const candidateScan=scan;scan=async()=>{};
await start();await complete(old,true);scan=candidateScan;await p.unroute('**/assets/experiment.js*');
let restores=[];
for(const [name,before] of Object.entries(fixtures)){
const restoreContext=await browser.newContext({acceptDownloads:true});p=await restoreContext.newPage();await p.addInitScript(({old,before})=>{localStorage.setItem(old,JSON.stringify(before));},{old,before});await p.goto(base);
if(name==='T3'||name==='T5')await p.locator('#submit-answer').waitFor();else await p.locator(name==='PREVis'?'#previs-form':'#download-results').waitFor();
await scan(`legacy-${name}`);const after=await session(old);for(const k of ['participantId','taskSeed','questionnaireVersion','taskInstances','tasks','previs','currentTaskId'])assert.deepEqual(after[k],before[k],`${name}:${k}`);
if(name==='T3'||name==='T5'){assert.deepEqual(after.activeTask.selected,before.activeTask.selected);assert.deepEqual(after.activeTask.target,before.activeTask.target);assert.equal(after.activeTask.taskStartIso,before.activeTask.taskStartIso);}
assert.equal(await p.evaluate(k=>localStorage.getItem(k),current),null);
if(name==='T3'||name==='T5'){await p.locator('#submit-answer').click();assert.ok((await session(old)).tasks[name]);}
if(name==='PREVis'){await p.locator('#previs-next').click();assert.equal((await session(old)).previsGroupIndex,2);}
if(name==='Complete'){const d=p.waitForEvent('download');await p.locator('#download-results').click();await(await d).saveAs(path.join(out,'legacy-restored.xlsx'));}
restores.push({name,pass:true});}
// Priority when both keys exist.
const newer={...fixtures.Complete,participantId:'NEW-PRIORITY',questionnaireVersion:'questionnaire-v1.0.1'};
await p.evaluate(({current,newer})=>localStorage.setItem(current,JSON.stringify(newer)),{current,newer});await p.reload();assert.equal((await session(current)).participantId,'NEW-PRIORITY');
fs.writeFileSync(path.join(out,'audit-results.json'),JSON.stringify({browser:'Chrome',newE2E:'PASS',restores,priority:'PASS',scans},null,2));console.log(JSON.stringify({newE2E:'PASS',restores,scanCount:scans.length}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
