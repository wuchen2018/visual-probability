(()=>{
  const wide=matchMedia('(min-width:960px)'),panes=[...document.querySelectorAll('.lab-workspace>.lab-workspace-controls')];
  let timer;
  const update=()=>{
    for(const pane of panes){
      const value=String(wide.matches&&pane.scrollHeight>pane.clientHeight);
      if(pane.dataset.scrollable!==value)pane.dataset.scrollable=value;
    }
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(update,60)};
  const observer=new ResizeObserver(update);
  for(const pane of panes){
    observer.observe(pane);for(const child of pane.children)observer.observe(child);
    pane.addEventListener('toggle',update,true);
    new MutationObserver(schedule).observe(pane,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','open']});
  }
  addEventListener('resize',schedule);addEventListener('load',schedule);wide.addEventListener('change',schedule);update();
})();
