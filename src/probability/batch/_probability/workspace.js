(()=>{
  const wide=matchMedia('(min-width:960px)'),boards=[...document.querySelectorAll('.lab-workspace')];
  let timer;const feedbacks=[];
  function arrange(){
    for(const board of boards){
      const controls=board.querySelector(':scope>.lab-workspace-controls'),stage=board.querySelector(':scope>.lab-workspace-stage');
      if(!controls||!stage)continue;
      const c=controls.getBoundingClientRect().height,s=stage.getBoundingClientRect().height;
      board.classList.remove('lab-workspace--sticky-controls','lab-workspace--sticky-stage');
      if(wide.matches){const pinStage=s<c;board.classList.add(pinStage?'lab-workspace--sticky-stage':'lab-workspace--sticky-controls');stage.style.top=pinStage?Math.min(16,innerHeight-s-16)+'px':''}
    }
    for(const {panel,output} of feedbacks){const hidden=!!panel.closest('[hidden]')||!panel.getClientRects().length;if(output.hidden!==hidden)output.hidden=hidden}
  }
  // A full, explicitly named result beside mobile controls avoids blind button presses.
  for(const board of boards){
    for(const panel of board.querySelectorAll('.lab-workspace-controls .operate-panel')){
      if(!panel.querySelector('button,input,select'))continue;
      if(panel.querySelector('.operate-panel')||panel.matches('#step-navigation,#lesson-actions,#playback-settings,#experiment-actions,.transient-panel'))continue;
      const selector=panel.closest('[data-feedback]')?.dataset.feedback||board.dataset.feedback;
      if(!selector)continue;
      const sources=[...new Set(selector.split(',').flatMap(part=>[...document.querySelectorAll(part.trim())]))];if(!sources.length)continue;
      const output=document.createElement('div');output.className='lab-mobile-feedback';output.setAttribute('role','status');panel.after(output);
      feedbacks.push({panel,output});
      let last;const update=()=>{const html=sources.map(source=>'<div>'+source.innerHTML+'</div>').join('');if(last===html)return;last=html;output.innerHTML=html;for(const n of output.querySelectorAll('[id]'))n.removeAttribute('id')};
      update();const observer=new MutationObserver(update);for(const source of sources)observer.observe(source,{childList:true,subtree:true,characterData:true});
    }
  }
  // Keep the named probability and both positive counts visible above Bayes' full flow.
  for(const board of boards.filter(n=>n.dataset.desktopFeedback)){
    const source=document.querySelector(board.dataset.desktopFeedback),stage=board.querySelector('.lab-workspace-stage');
    if(!source||!stage)continue;
    const output=document.createElement('div');output.className='lab-desktop-feedback result';output.setAttribute('role','status');stage.prepend(output);
    let last;const update=()=>{
      if(output.hidden!==source.hidden)output.hidden=source.hidden;
      const html=source.innerHTML;if(last===html)return;last=html;output.innerHTML=html;for(const n of output.querySelectorAll('[id]'))n.removeAttribute('id');
    };
    update();new MutationObserver(update).observe(source,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
  }
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(arrange,100)};
  for(const slot of document.querySelectorAll('[data-mobile-content]')){
    const homes=[...document.querySelectorAll(slot.dataset.mobileContent)].map(node=>{const item=node.closest('.linked-output')||node,home=document.createComment('desktop position');item.before(home);return {item,home}});
    const place=()=>{for(const {item,home}of homes)if(wide.matches)home.after(item);else slot.append(item)};
    place();wide.addEventListener('change',place);
  }
  addEventListener('resize',schedule);addEventListener('load',schedule);
  for(const board of boards){new ResizeObserver(schedule).observe(board);new MutationObserver(schedule).observe(board,{attributes:true,attributeFilter:['hidden'],subtree:true})}
  arrange();
})();
