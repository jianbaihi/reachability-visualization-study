/* Visible instruction reading is separate from the task phase clock. */
window.createInstructionsReadingGate = (session,persist) => {
  const announcementHost=document.querySelector('#instructions-reading-announcement'),button=document.querySelector('#tutorial [data-next="part-a"]');
  const exempt=!['questionnaire-v1.1.0','questionnaire-v1.1.1'].includes(session.questionnaireVersion)||['part-a','previs','completion'].includes(session.currentStep)||Object.keys(session.tasks||{}).length>0;
  let active=false,start=null,total=Math.max(0,Math.min(10000,Number(session.instructions_read_visible_ms)||0));
  let completed=exempt||session.instructions_read_gate_completed===true,lastAnnouncement='';
  const current=()=>Math.min(10000,total+(start===null?0:performance.now()-start));
  const commit=()=>{total=current();start=null;if(total>=10000)completed=true;if(!exempt){session.instructions_read_visible_ms=total;session.instructions_read_gate_completed=completed;persist();}};
  const render=()=>{const ms=current();if(ms>=10000&&!completed){commit();}button.disabled=!completed;const seconds=Math.ceil((10000-ms)/1000);button.textContent=completed?'我已了解，开始任务 →':`请先阅读（${seconds} 秒）`;const announcement=completed&&!exempt?'已可以开始任务':'';if(lastAnnouncement!==announcement){announcementHost.textContent=announcement;lastAnnouncement=announcement;}};
  const visible=()=>active&&document.visibilityState==='visible'&&document.querySelector('#tutorial-title').getClientRects().length&&document.querySelector('.instructions-description').getClientRects().length;
  const reconcile=()=>{commit();if(visible()&&!completed)start=performance.now();render();};
  document.addEventListener('visibilitychange',reconcile);window.addEventListener('pagehide',commit);
  setInterval(()=>{if(active){render();if(!exempt){session.instructions_read_visible_ms=current();session.instructions_read_gate_completed=completed;persist();}}},250);
  return {allows:()=>completed,setPage(page){commit();active=page==='tutorial';if(visible()&&!completed)start=performance.now();render();}};
};
