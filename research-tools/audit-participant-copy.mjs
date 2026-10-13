// Audit rendered participant copy only; do not scan variable names, data attributes or research exports.
export function auditParticipantCopy() {
  const forbidden=/冻结刺激|正式刺激|刺激图|\b(?:Frozen|stimulus|formal|POI|condition|dataset|manifest|P35|P65|P85)\b|candidate\s+pool|task\s+seed|normal\s+font|large\s+font/i;
  const excluded=node=>node.closest('script,style,[hidden],[aria-hidden="true"]')||getComputedStyle(node).display==='none'||getComputedStyle(node).visibility==='hidden';
  const visible=node=>{for(let n=node;n&&n.nodeType===1;n=n.parentElement)if(excluded(n))return false;return true;};
  const findings=[],samples=[];
  const check=(node,kind,value)=>{if(!value?.trim())return;samples.push(value.trim());if(forbidden.test(value))findings.push({kind,value:value.trim(),element:node.id||node.tagName});};
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const text=walker.currentNode;if(visible(text.parentElement))check(text.parentElement,'text',text.textContent);}
  for(const node of document.querySelectorAll('*')){
    if(!visible(node))continue;
    for(const attr of ['aria-label','aria-description','alt','title','placeholder'])check(node,attr,node.getAttribute(attr));
    for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (node.getAttribute(attr)||'').split(/\s+/)){const ref=document.getElementById(id);if(ref)check(node,attr,ref.textContent);}
  }
  return {pass:findings.length===0,findings,text:samples.join('\n')};
}
// Usage: import this function and run page.evaluate(auditParticipantCopy) at each screen,
// including validation states, legends, PREVis switches and completion.

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const {readFileSync}=await import('node:fs');
  const reportPath=process.argv[2] || 'output/playwright/audit-results.json';
  const report=JSON.parse(readFileSync(reportPath,'utf8'));
  if(!Array.isArray(report.scans)||!report.scans.length)throw new Error('No rendered DOM snapshots in report');
  const failures=report.scans.filter(scan=>!scan.pass||scan.findings.length);
  const allText=report.scans.map(scan=>scan.text).join('\n');
  const required=['可达性地图','地图','地点','步行时间范围','地点类别','评论数量'];
  const missing=required.filter(term=>!allText.includes(term));
  console.log(JSON.stringify({pass:!failures.length&&!missing.length,snapshots:report.scans.length,failures,missing,attributes:['aria-label','aria-description','alt','title','placeholder','aria-labelledby','aria-describedby']},null,2));
  if(failures.length||missing.length)process.exitCode=1;
}
