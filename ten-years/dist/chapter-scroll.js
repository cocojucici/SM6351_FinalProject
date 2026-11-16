(function(global){
'use strict';
function create(){
 const reduced=global.matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,active=false;
 function cancel(){if(frame)global.cancelAnimationFrame(frame);frame=0;active=false;}
 function to(element){
  cancel();
  const start=global.scrollY,end=Math.max(0,Math.min(start+element.getBoundingClientRect().top,document.documentElement.scrollHeight-global.innerHeight));
  if(reduced.matches||Math.abs(end-start)<1){global.scrollTo({top:end,behavior:'instant'});return;}
  const duration=Math.min(940,640+Math.abs(end-start)*.18);let began;
  active=true;
  function tick(now){
   if(began===undefined)began=now;
   const t=Math.min(1,(now-began)/duration),ease=t*t*t*(10+t*(-15+6*t));
   global.scrollTo({top:start+(end-start)*ease,behavior:'instant'});
   if(t<1)frame=global.requestAnimationFrame(tick);else{frame=0;active=false;}
  }
  frame=global.requestAnimationFrame(tick);
 }
 const key=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancel();};
 const inputs=['wheel','touchstart','pointerdown','resize'];
 inputs.forEach(name=>global.addEventListener(name,cancel,{passive:true,capture:true}));
 global.addEventListener('keydown',key,true);reduced.addEventListener('change',cancel);
 return {to,cancel,getState:()=>({active}),destroy(){cancel();inputs.forEach(name=>global.removeEventListener(name,cancel,true));global.removeEventListener('keydown',key,true);reduced.removeEventListener('change',cancel);}};
}
global.MarineChapterScroll=Object.freeze({create});
})(window);
