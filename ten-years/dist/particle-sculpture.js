(function(global){
'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
// A decorative torus-knot surface, independent of trade data and chart coordinates.
function shape(u,v,time){
 const a=u*TAU,r=1+.32*Math.cos(3*a+time*.3)+.09*Math.sin(a*5-time*.8),b=a*2;
 const tube=.25+.085*Math.sin(5*a+time);
 return {x:(r+tube*Math.cos(v))*Math.cos(b),y:(r+tube*Math.cos(v))*Math.sin(b)*.76,z:.48*Math.sin(3*a+time*.3)+tube*Math.sin(v)};
}
function create(){
 let particles=[],count=0,sprite=null,burst=0;
 function init(mobile,colors){
  const next=mobile?1800:5400,lanes=mobile?18:36,steps=next/lanes;
  if(count!==next){count=next;particles=Array.from({length:count},(_,i)=>({u:((i%steps)+hash(i+1)*.3)/steps,v:Math.floor(i/steps)/lanes*TAU+hash(i+419)*.035,size:hash(i+952),ox:0,oy:0,vx:0,vy:0}));}
  if(!sprite){
   sprite=document.createElement('canvas');sprite.width=sprite.height=48;
   const c=sprite.getContext('2d'),g=c.createRadialGradient(24,24,0,24,24,24);
   g.addColorStop(0,colors.ink);g.addColorStop(.09,colors.ink);g.addColorStop(.22,colors.accent);g.addColorStop(.5,colors.secondary+'88');g.addColorStop(1,'transparent');
   c.fillStyle=g;c.fillRect(0,0,48,48);
  }
 }
 function draw(ctx,{width:w,height:h,phase,mouse,colors,intro,chapter,energy,anchor,static:still}){
  const mobile=w<=700;init(mobile,colors);
  const exit=intro*intro*(3-2*intro),bridge=Math.sin(Math.PI*chapter)**2;
  const cx=w*((mobile?.53:.67)*(1-exit)+(mobile?.88:.84)*exit);
  const cy=h*((mobile?.35:.48)*(1-exit)+(.22+bridge*.35)*exit);
  const scale=(Math.min(w*(mobile?.32:.275),h*.43))*(1-exit)+Math.min(w*.16,h*.23)*(1+bridge*.6)*exit;
  const turn=phase*.25+chapter*.8,ct=Math.cos(turn),st=Math.sin(turn);
  const tilt=-.35+(mouse.y-.5)*.16,ca=Math.cos(tilt),sa=Math.sin(tilt),dt=still?0:1;
  const scatter=Math.sin(Math.PI*intro)**2*.85+bridge*.28;
  const cloud=[];
  for(let i=0;i<count;i++){
   const p=particles[i],q=shape(p.u,p.v,phase*.35);
   let x=q.x*ct+q.z*st,z=q.z*ct-q.x*st,y=q.y*ca-z*sa;z=q.y*sa+z*ca;
   const s=1+scatter*(.4+p.size*2);
   x=x*s+scatter*Math.sin(p.u*TAU*3+phase)*.45;y=y*s;
   const perspective=3.8/(3.8-z);
   const heroX=cx+x*scale*perspective,heroY=cy+y*scale*perspective;
   // The same strands unfold into a current just outside the reading area.
   const stream=anchor||{left:w*.05,right:w*.96,top:h*.3,year:.5,forms:chapter};
   const streamX=stream.left+p.u*(stream.right-stream.left);
   const lane=Math.floor(i/(mobile?100:150))%3-1;
   const streamY=stream.top-42+Math.sin(p.u*TAU*.9-phase*.6)*10+Math.sin(p.v)*5+lane*stream.forms*9;
   const px=heroX*(1-exit)+streamX*exit,py=heroY*(1-exit)+streamY*exit;
   const focus=Math.exp(-Math.pow((p.u-stream.year)/.16,2));
   const dx=px+p.ox-mouse.x*w,dy=py+p.oy-mouse.y*h,dist=Math.hypot(dx,dy),radius=mobile?65:125;
   if(!still){
    const force=Math.max(0,1-dist/radius),inv=1/Math.max(1,dist);
    const push=force*(1+Math.hypot(mouse.vx,mouse.vy)*4+burst*14);
    p.vx+=(dx*inv*push-dy*inv*force*.7-p.ox*.018)*dt;
    p.vy+=(dy*inv*push+dx*inv*force*.7-p.oy*.018)*dt;
    p.vx*=.9;p.vy*=.9;p.ox=clamp(p.ox+p.vx,-160,160);p.oy=clamp(p.oy+p.vy,-160,160);
   }
   cloud.push({x:px+p.ox*(1-exit*.8),y:py+p.oy*(1-exit*.8),z,size:(.42+Math.pow(p.size,5)*1.05)*perspective*(mobile?.9:1)*(1-exit*.2),alpha:clamp(.55+z*.3,.2,.95)*(1-exit*.65+exit*focus*.35)});
  }
  if(!still)burst*=.88;
  // Sparse hairlines bind the points into silk, without an embossed sphere texture.
  const steps=mobile?100:150;
  ctx.strokeStyle=colors.accent;ctx.lineWidth=mobile?.35:.45;
  for(let lane=0;lane<(mobile?18:36);lane+=3){
   ctx.globalAlpha=(.12+Math.max(0,Math.sin(lane+phase))*.07)*(1-exit*.55);
   ctx.beginPath();let previous;
   for(let j=0;j<steps;j+=2){const p=cloud[lane*steps+j];if(previous&&Math.hypot(p.x-previous.x,p.y-previous.y)<scale*.2)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);previous=p;}
   ctx.stroke();
  }
  cloud.sort((a,b)=>a.z-b.z);
  for(const p of cloud){ctx.globalAlpha=p.alpha;const size=p.size*4;ctx.drawImage(sprite,p.x-size/2,p.y-size/2,size,size);}
  ctx.globalAlpha=1;
 }
 return {draw,pulse(){burst=1;},getState:()=>({count,burst,maxDisplacement:particles.reduce((m,p)=>Math.max(m,Math.hypot(p.ox,p.oy)),0)}),destroy(){particles=[];sprite=null;count=0;}};
}
global.MarineParticleSculpture=Object.freeze({create,shape});
})(typeof window==='undefined'?globalThis:window);
