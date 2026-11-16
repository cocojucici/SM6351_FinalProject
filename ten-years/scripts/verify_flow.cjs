const assert=require('assert/strict');require('../dist/flow.js');const F=globalThis.MarineDecadeFlow;
for(const [w,h] of [[1280,720],[375,667],[320,568]])for(let band=0;band<3;band++)for(let i=0;i<=100;i++){
 const p=F.field(i/100,band,i*.1,w,h,{x:.9,y:.2,vx:1,vy:-1,lift:1},20);
 assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(Math.abs(p.x)<2*w&&Math.abs(p.y)<2*h);
}
const emitter=()=>({listeners:new Map(),addEventListener(k,f){this.listeners.set(k,f);},removeEventListener(k,f){if(this.listeners.get(k)===f)this.listeners.delete(k);}});
const operations=[],maskRects=[];
const context=()=>new Proxy({createLinearGradient:()=>({addColorStop(){}}),fillRect:(...r)=>maskRects.push(r),drawImage:()=>operations.push('mask')},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{if(k==='globalCompositeOperation')operations.push(v);o[k]=v;return true;}});
const ctx=context(),maskCtx=context(),canvas={getContext:()=>ctx},button={setAttribute(){}};
const stage={getBoundingClientRect:()=>({left:50,top:250,width:1178,height:300})};
const root={...emitter(),dataset:{progress:'0'},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720}),querySelector:s=>s==='[data-role="flow-canvas"]'?canvas:s==='[data-action="flow"]'?button:s==='.dv-chart-stage'?stage:null,querySelectorAll:()=>[stage]};
const reduced={...emitter(),matches:false};let next=0;const jobs=new Map();
globalThis.matchMedia=()=>reduced;globalThis.devicePixelRatio=2;
globalThis.getComputedStyle=()=>({getPropertyValue:k=>({'--dv-ink':'#c9ccd1','--dv-secondary':'#06619b','--dv-bg':'#010206','--dv-surface':'#042156','--dv-primary':'#1745a4','--dv-accent':'#1899c5'})[k]});
globalThis.document={...emitter(),hidden:false,createElement:()=>({getContext:()=>maskCtx})};
globalThis.ResizeObserver=class{observe(){}disconnect(){}};
globalThis.requestAnimationFrame=f=>{jobs.set(++next,f);return next;};globalThis.cancelAnimationFrame=id=>jobs.delete(id);
const flow=F.attach(root);assert.equal(flow.getState().running,true);assert.equal(canvas.width,1920,'desktop DPR is capped at 1.5');
assert.ok(maskRects.some(r=>JSON.stringify(r)===JSON.stringify([48,248,1182,304])),'an opaque mask covers the full data stage');
assert.ok(operations.includes('destination-out')&&operations.includes('mask'));
for(let i=0;i<3;i++){const callbacks=[...jobs.values()];jobs.clear();callbacks.forEach(f=>f(34*(i+1)));assert.equal(jobs.size,1);}
flow.toggle();assert.equal(jobs.size,0);assert.equal(root.dataset.flowPaused,'true');
flow.toggle();assert.equal(jobs.size,1);
reduced.matches=true;reduced.listeners.get('change')();assert.equal(jobs.size,0);assert.equal(button.disabled,true);
reduced.matches=false;reduced.listeners.get('change')();assert.equal(jobs.size,1);
document.hidden=true;document.listeners.get('visibilitychange')();assert.equal(jobs.size,0);
document.hidden=false;document.listeners.get('visibilitychange')();assert.equal(jobs.size,1);
flow.destroy();assert.equal(jobs.size,0);for(const obj of [root,document,reduced])assert.equal(obj.listeners.size,0);
console.log('PASS: finite fluid geometry; reading-area masking; capped resolution; one animation frame; pause/resume; reduced motion; background-tab suspension and cleanup.');
// A shared viewport field retains its phase while the document mask follows both chapters.
let offset=0;globalThis.innerWidth=1280;globalThis.innerHeight=720;
const globalEvents=emitter();globalThis.addEventListener=globalEvents.addEventListener.bind(globalEvents);globalThis.removeEventListener=globalEvents.removeEventListener.bind(globalEvents);
const chapterA={dataset:{}},chapterB={dataset:{}},buttonB={setAttribute(){}};
const sharedRoot={...root,...emitter(),getBoundingClientRect:()=>({left:0,top:offset,width:1280,height:1500}),querySelectorAll:s=>s==='section.dv-shell'?[{getBoundingClientRect:()=>({top:offset})},{getBoundingClientRect:()=>({top:offset+780})}]:[{getBoundingClientRect:()=>({left:50,top:offset+250,width:1178,height:300})}]};
const shared=F.attach(sharedRoot,{viewport:true,canvas,buttons:[button,buttonB],surfaces:[chapterA,chapterB],themeRoot:root});
assert.equal(shared.getState().worldHeight,1500);assert.equal(canvas.height,1080,'canvas remains viewport sized');
const callbacks=[...jobs.values()];jobs.clear();callbacks.forEach(f=>f(100));const before=shared.getState().phase;
offset=-390;globalEvents.listeners.get('scroll')();assert.equal(shared.getState().phase,before,'scroll does not reset or replace the flow clock');assert.equal(jobs.size,1);
shared.toggle();assert.equal(chapterA.dataset.flowPaused,'true');assert.equal(chapterB.dataset.flowPaused,'true');assert.equal(jobs.size,0);
shared.destroy();assert.equal(globalEvents.listeners.size,0);
console.log('PASS: one persistent viewport flow across both chapters; document-sized reading mask; shared pause and cleanup.');
// Opening and inter-chapter gaps must not push the settled current into the plot.
let captured;
globalThis.MarineParticleSculpture={create:()=>({draw(_ctx,frame){captured=frame;},pulse(){},getState:()=>({}),destroy(){}})};
const surface=(top,position)=>({dataset:{position:String(position)},getBoundingClientRect:()=>({top:offset+top}),querySelector:()=>({getBoundingClientRect:()=>({left:50,right:1230,top:offset+top+240,width:1180,height:300})})});
const sa=surface(780,0),sb=surface(1560,8);
const storyRoot={...sharedRoot,...emitter(),getBoundingClientRect:()=>({left:0,top:offset,width:1280,height:2280}),querySelectorAll:s=>s==='section.dv-shell'?[sa,sb]:[sa.querySelector()]};
offset=0;const story=F.attach(storyRoot,{viewport:true,canvas,sculpture:true,intro:{getBoundingClientRect:()=>({height:720})},surfaces:[sa,sb],buttons:[button]});
assert.equal(captured.intro,0);story.toggle();offset=-780;globalEvents.listeners.get('scroll')();assert.equal(captured.intro,1);assert.equal(captured.chapter,0);assert.equal(captured.anchor.top,240);
offset=-1560;globalEvents.listeners.get('scroll')();assert.equal(captured.chapter,1);assert.equal(captured.anchor.top,240);assert.equal(captured.anchor.year,8/9);assert.equal(captured.anchor.forms,1);
story.destroy();assert.equal(jobs.size,0);
console.log('PASS: particle current follows actual chart bounds and selected year, with exact landing across opening/chapter gaps.');
