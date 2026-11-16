(function(global){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Decorative geometry only. No quantity, scale, or chart coordinate enters this field.
function field(t,band,phase,w,h,mouse,travel){
 const p=phase+travel*.11;
 let x,y;
 if(band===0){x=w*(.36+t*.94);y=h*(.235+.063*Math.sin(t*6.4-p)+.018*Math.sin(t*13+p*.6));}
 else if(band===1){x=w*(1.13-t*.73);y=h*(-.12+t*.48+.055*Math.sin(t*5.2+p*.7));}
 else{x=w*(-.17+t*.69);y=h*(.82+.11*Math.sin(t*4.1+p*.5));}
 const dx=x-mouse.x*w,dy=y-mouse.y*h,influence=Math.exp(-(dx*dx+dy*dy)/(w*w*.085));
 x+=mouse.vx*influence*34;y+=mouse.vy*influence*25+mouse.lift*18*Math.sin(t*Math.PI);
 return {x,y};
}
function attach(root,options={}){
 const viewport=!!options.viewport;
 const canvas=options.canvas||root.querySelector('[data-role="flow-canvas"]');
 const buttons=options.buttons||[root.querySelector('[data-action="flow"]')].filter(Boolean),surfaces=options.surfaces||[root];
 let ctx;try{ctx=canvas?.getContext('2d',{alpha:true,desynchronized:true});}catch{}
 if(!ctx){buttons.forEach(button=>button.hidden=true);return {toggle(){},destroy(){},getState:()=>({running:false})};}
 const reduced=global.matchMedia('(prefers-reduced-motion: reduce)');
 const mask=document.createElement('canvas'),maskCtx=mask.getContext('2d');
 let width=0,height=0,worldHeight=0,chapterSpan=1,dpr=1,frame=0,last=0,phase=0,travel=0,targetTravel=0,energy=0,direction=1;
 let paused=false,disposed=false,inView=true,dirty=true,lastPointer=null;
 const mouse={x:.76,y:.23,vx:0,vy:0,lift:0},target={x:.76,y:.23,vx:0,vy:0,lift:0};
 let colors={},introHeight=0,chapterStart=0,stages=[];
 const sculpture=options.sculpture?global.MarineParticleSculpture?.create():null;
 function buildMask(){
   const origin=root.getBoundingClientRect(),style=getComputedStyle(options.themeRoot||root);
   width=Math.round(viewport?global.innerWidth:origin.width);height=Math.round(viewport?global.innerHeight:origin.height);if(!width||!height)return;
   worldHeight=Math.round(origin.height);
   const chapters=viewport?root.querySelectorAll('section.dv-shell'):[];
   introHeight=options.intro?.getBoundingClientRect().height||0;
   chapterStart=chapters.length?chapters[0].getBoundingClientRect().top-origin.top:introHeight;
   if(sculpture)stages=surfaces.map(surface=>{
     const stage=surface.querySelector('.dv-chart-stage').getBoundingClientRect();
     return {surface,left:stage.left-origin.left,right:stage.right-origin.left,top:stage.top-origin.top};
   });
   chapterSpan=chapters.length>1?chapters[1].getBoundingClientRect().top-chapters[0].getBoundingClientRect().top:height;
   dpr=Math.min(global.devicePixelRatio||1,width<=700?1:1.5);
   for(const [c,h] of [[canvas,height],[mask,worldHeight]]){
     const w=Math.round(width*dpr),pixels=Math.round(h*dpr);
     if(c.width!==w)c.width=w;if(c.height!==pixels)c.height=pixels;
   }
   colors={bg:style.getPropertyValue('--dv-bg').trim(),surface:style.getPropertyValue('--dv-surface').trim(),primary:style.getPropertyValue('--dv-primary').trim(),accent:style.getPropertyValue('--dv-accent').trim(),ink:style.getPropertyValue('--dv-ink').trim(),secondary:style.getPropertyValue('--dv-secondary').trim()};
   maskCtx.setTransform(dpr,0,0,dpr,0,0);maskCtx.clearRect(0,0,width,worldHeight);
   maskCtx.fillStyle=colors.bg;
   const selectors='.dv-intro-title,.dv-intro-meta,.dv-intro-top,.dv-intro-explore,.dv-heading h1,.dv-heading h2,.dv-chapter-link,.dv-subtitle,.dv-header-actions,.dv-flow-toggle,.dv-toolbar,.dv-year,.dv-amount,.dv-metric,.dv-year-note:not([hidden]),.dv-chart-stage,.dv-chart-note,.dv-forms-note,.dv-policy:not([hidden]),.dv-footer,.dv-bottom:not([hidden])';
   const rects=Array.from(root.querySelectorAll(selectors),el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height);
   // A feathered surround hides the mask boundary; the opaque core guarantees clean data pixels.
   maskCtx.filter=`blur(${16*dpr}px)`;
   rects.forEach(r=>maskCtx.fillRect(r.left-origin.left-32,r.top-origin.top-32,r.width+64,r.height+64));
   maskCtx.filter='none';
   rects.forEach(r=>maskCtx.fillRect(r.left-origin.left-2,r.top-origin.top-2,r.width+4,r.height+4));
   dirty=false;
 }
 function paint(){
   if(disposed)return;
   if(dirty)buildMask();if(!width||!height)return;
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
   const mobile=width<=700,samples=mobile?30:48,strips=mobile?12:20;
   const offset=viewport?root.getBoundingClientRect().top:0;
   const journey=viewport?clamp((-offset-chapterStart)/Math.max(1,chapterSpan),0,1):0,bridge=Math.sin(Math.PI*journey)**2;
   if(sculpture){
     const a=stages[0],b=stages[1]||a;
     const anchor=a?{left:a.left+(b.left-a.left)*journey,right:a.right+(b.right-a.right)*journey,top:a.top+(b.top-a.top)*journey+offset,year:(clamp(Number(a.surface.dataset.position)||0,0,9)*(1-journey)+clamp(Number(b.surface.dataset.position)||0,0,9)*journey)/9,forms:journey}:null;
     sculpture.draw(ctx,{width,height,phase,mouse,colors,intro:clamp(-offset/Math.max(1,chapterStart),0,1),chapter:journey,energy,anchor,static:!allowed()});
   }else{
   const gradient=ctx.createLinearGradient(width*.2,0,width,height*.5);
   gradient.addColorStop(0,colors.surface);gradient.addColorStop(.3,colors.primary);gradient.addColorStop(.68,colors.accent);gradient.addColorStop(1,colors.surface);
   for(let band=0;band<3;band++){
     const points=[];
     for(let i=0;i<=samples;i++){
       const t=i/samples,a=field(t,band,phase+journey*.7,width,height,mouse,travel),b=field(t+.001,band,phase+journey*.7,width,height,mouse,travel);
       const drift=bridge*height*(band===2?-.28:.24);a.y+=drift;b.y+=drift;
       const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
       points.push({...a,nx:-dy/len,ny:dx/len,span:(mobile?15:25)*(1+.55*Math.sin(t*Math.PI)**2)*(band===1?.8:1)});
     }
     ctx.fillStyle=gradient;
     for(let strip=0;strip<strips;strip++){
       const u=strip/strips*2-1,v=(strip+1)/strips*2-1,shine=Math.max(0,Math.cos((u+.18)*Math.PI*.65))**3;
       ctx.globalAlpha=(.11+.72*shine)*(band===2?.7:1);
       ctx.beginPath();
       points.forEach((p,i)=>{const x=p.x+p.nx*p.span*u,y=p.y+p.ny*p.span*u;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
       for(let i=points.length-1;i>=0;i--){const p=points[i];ctx.lineTo(p.x+p.nx*p.span*v,p.y+p.ny*p.span*v);}
       ctx.closePath();ctx.fill();
     }
     ctx.globalAlpha=.45;ctx.strokeStyle=colors.accent;ctx.lineWidth=.8;ctx.beginPath();
     points.forEach((p,i)=>{const x=p.x+p.nx*p.span*.28,y=p.y+p.ny*p.span*.28;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
   }
   }
   ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';ctx.drawImage(mask,0,offset,width,worldHeight);ctx.globalCompositeOperation='source-over';
 }
 function allowed(){return !disposed&&!paused&&!reduced.matches&&!document.hidden&&inView&&!root.querySelector('dialog[open]');}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
 function tick(now){
   frame=0;if(!allowed()){last=0;return;}
   const interval=width<=700?50:1000/30;
   if(!last||now-last>=interval){
     const dt=last?Math.min(80,now-last):interval;last=now;
     phase+=dt*(.0003+energy*direction*.00045);energy*=Math.exp(-dt/650);
     const ease=1-Math.exp(-dt/260);travel+=(targetTravel-travel)*ease;
     for(const key of ['x','y','vx','vy','lift'])mouse[key]+=(target[key]-mouse[key])*ease;
     target.vx*=.86;target.vy*=.86;target.lift*=.97;
     paint();
   }
   frame=requestAnimationFrame(tick);
 }
 function start(){if(!frame&&allowed()){last=0;frame=requestAnimationFrame(tick);}}
 function sync(){
   stop();surfaces.forEach(surface=>surface.dataset.flowPaused=String(paused||reduced.matches));dirty=true;paint();
   buttons.forEach(button=>{if(button.dataset?.flowText)button.textContent=reduced.matches?'Static motion':paused?'Resume motion':'Pause motion';button.disabled=reduced.matches;button.setAttribute('aria-pressed',String(!paused&&!reduced.matches));button.setAttribute('aria-label',reduced.matches?'Background flow is static: reduced motion':paused?'Resume background flow':'Pause background flow');button.title=reduced.matches?'Static flow · reduced motion':paused?'Resume flow':'Pause flow';});
   start();
 }
 function move(event){
   if(event.pointerType!=='mouse'||paused||reduced.matches||!width||!height)return;
   const r=viewport?{left:0,top:0,width,height}:root.getBoundingClientRect(),x=clamp((event.clientX-r.left)/r.width,0,1),y=clamp((event.clientY-r.top)/r.height,0,1);
   if(lastPointer){target.vx=clamp((x-lastPointer.x)*25,-1,1);target.vy=clamp((y-lastPointer.y)*25,-1,1);}
   target.x=x;target.y=y;target.lift=(y-.5)*2;lastPointer={x,y};
 }
 function leave(){lastPointer=null;target.vx=target.vy=target.lift=0;}
 function pulse(event){if(allowed()&&!event.target.closest('button,a,input,select,dialog,.dv-chart-stage,.dv-years')){if(event.pointerType==='touch'){const r=viewport?{left:0,top:0}:root.getBoundingClientRect();mouse.x=target.x=(event.clientX-r.left)/width;mouse.y=target.y=(event.clientY-r.top)/height;}sculpture?.pulse();start();}}
 function timeline(event){
   const next=Number(event.detail?.progress??event.target?.dataset?.progress??root.dataset.progress)||0;
   direction=Math.sign(next-targetTravel)||direction;energy=Math.min(1,energy+.4);targetTravel=next;dirty=true;
   if(!allowed())paint();else start();
 }
 function wheel(event){if(!paused&&!reduced.matches&&!event.target.closest('dialog')){direction=Math.sign(event.deltaY)||direction;energy=Math.min(1,energy+.15);}}
 const refresh=()=>{if(disposed)return;dirty=true;if(!allowed())paint();else start();};
 const scroll=()=>{if(!allowed())paint();else start();};
 const toggle=()=>{paused=!paused;sync();};
 const resize=new ResizeObserver(refresh);
 resize.observe(root);root.querySelectorAll('.dv-chart-stage').forEach(stage=>resize.observe(stage));
 const visibility=()=>{if(document.hidden)stop();else sync();};
 const focus=()=>{if(root.querySelector('dialog[open]'))stop();else start();};
 const close=()=>{dirty=true;start();};
 let intersection;
 if(global.IntersectionObserver){intersection=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??true;if(inView)start();else stop();});intersection.observe(root);}
 root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerleave',leave);
 root.addEventListener('pointerdown',pulse,{passive:true});
 root.addEventListener('wheel',wheel,{passive:true});root.addEventListener('decade:year-change',timeline);root.addEventListener('decade:view-change',timeline);
 root.addEventListener('focusin',focus);root.addEventListener('close',close,true);
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',sync);
 const updates=['decade:filters-change','decade:data-change','decade:events-change'];updates.forEach(name=>root.addEventListener(name,refresh));
 root.addEventListener('decade:flow-toggle',toggle);
 if(viewport)global.addEventListener('scroll',scroll,{passive:true});
 sync();
 return {
   toggle,
   getState:()=>({paused,reduced:reduced.matches,running:!!frame,width,height,phase,worldHeight,sculpture:sculpture?.getState()}),
   destroy(){disposed=true;stop();sculpture?.destroy();root.removeEventListener('pointerdown',pulse);surfaces.forEach(surface=>delete surface.dataset.flowPaused);resize.disconnect();intersection?.disconnect();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',leave);root.removeEventListener('wheel',wheel);root.removeEventListener('decade:year-change',timeline);root.removeEventListener('decade:view-change',timeline);root.removeEventListener('focusin',focus);root.removeEventListener('close',close,true);updates.forEach(name=>root.removeEventListener(name,refresh));root.removeEventListener('decade:flow-toggle',toggle);if(viewport)global.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',sync);ctx.clearRect(0,0,width,height);}
 };
}
global.MarineDecadeFlow=Object.freeze({attach,field});
})(typeof window==='undefined'?globalThis:window);
