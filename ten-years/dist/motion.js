(function(global){
'use strict';
const clamp=(n,min=0,max=20)=>Math.max(min,Math.min(max,n));
const smooth=n=>{const t=clamp(n,0,1);return t*t*t*(t*(t*6-15)+10);};
function resetPhase(t){
 const out=1-smooth(t/.42),incoming=smooth((t-.58)/.42);
 return {opacity:out+incoming,offset:t<.5?-10*(1-out):10*(1-incoming)};
}
// Shared, reversible choreography; only the chart layer moves, never its data scale.
function sceneState(blend,reduced=false){
 const b=clamp(blend,0,1);
 return {annualOpacity:reduced?1-b:1-smooth(b/.85),formsOpacity:reduced?b:smooth((b-.15)/.85),annualOffset:reduced?0:-8*b,formsOffset:reduced?0:8*(1-b)};
}
function yearFocus(position,reduced=false){
 const fraction=position-Math.floor(position),pulse=reduced?0:Math.sin(Math.PI*fraction)**2;
 return {opacity:1-.22*pulse,offset:2*pulse};
}
function frame(progress,reduced=false){
 const p=clamp(progress),t=clamp((p-9)/2,0,1),view=p<10?'annual':'forms';
 const local=p<=9?p:p>=11?p-11:view==='annual'?9:0;
 const position=reduced?Math.round(local):local;
 const reset=resetPhase(t);
 return {progress:p,view,position,year:2015+Math.round(position),blend:reduced?(view==='forms'?1:0):smooth(t),transitioning:p>9&&p<11,yearOpacity:reduced?1:reset.opacity,yearOffset:reduced?0:reset.offset,contextOpacity:reduced?1:1-smooth(t/.32)+smooth((t-.68)/.32)};
}
const progressFor=(view,year)=>clamp(Math.round(year)-2015,0,9)+(view==='forms'?11:0);
// Hit testing uses the rendered axis bounds, not interpolated trade quantities.
const nearestYear=(x,width)=>2015+Math.round(clamp((x-42)/Math.max(1,width-64)*9,0,9));
// On release, complete a scene transition rather than stopping in its invisible middle.
const settled=(p,direction=1)=>p>9&&p<11?(p<10||(p===10&&direction<0)?9:11):Math.round(clamp(p));
function valueAt(series,position){
 const base=Math.min(9,Math.floor(position)),fraction=position-base,a=series[base]?.value??null,b=series[Math.min(9,base+1)]?.value??null;
 return fraction<.0001?a:fraction>.9999?b:a!==null&&b!==null?a+(b-a)*fraction:null;
}
// Fade isolated/missing-edge observations without inventing a zero-weight endpoint.
function barState(series,position,reduced=false){
 const selected=Math.round(position),actual=series[selected]?.value??null;
 if(actual===null)return {value:null,opacity:0};
 if(reduced)return {value:actual,opacity:1};
 const value=valueAt(series,position);
 if(value!==null)return {value,opacity:1};
 const fraction=position-Math.floor(position);
 const opacity=selected===Math.floor(position)?smooth((.5-fraction)*2):smooth((fraction-.5)*2);
 return {value:actual,opacity};
}
global.MarineDecadeMotion=Object.freeze({clamp,smooth,resetPhase,sceneState,yearFocus,frame,progressFor,nearestYear,settled,valueAt,barState});
})(typeof window==='undefined'?globalThis:window);
