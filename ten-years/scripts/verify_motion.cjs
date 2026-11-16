const assert=require('assert/strict');
require('../dist/motion.js');const M=globalThis.MarineDecadeMotion;
for(let p=0;p<=20;p+=.025){
 const f=M.frame(p);assert.ok(f.year>=2015&&f.year<=2024);assert.ok(f.position>=0&&f.position<=9);assert.ok(f.blend>=0&&f.blend<=1);
 if(p>9&&p<11)assert.ok(f.position===9||f.position===0);
 assert.ok(Math.abs(M.frame(20-(20-p)).blend-f.blend)<1e-10);
}
assert.equal(M.frame(9).year,2024);assert.equal(M.frame(11).year,2015);
assert.equal(M.frame(10).yearOpacity,0);assert.equal(M.frame(10).blend,.5);
assert.equal(M.frame(9.9,true).blend,0);assert.equal(M.frame(10.1,true).blend,1);
for(const view of ['annual','forms'])for(let year=2015;year<=2024;year++){
 const f=M.frame(M.progressFor(view,year));assert.equal(f.view,view);assert.equal(f.year,year);
}
assert.equal(M.settled(10,-1),9);assert.equal(M.settled(10,1),11);assert.equal(M.frame(5.7,true).position,6);
assert.equal(M.settled(9.8),9);assert.equal(M.settled(10.2),11);
const series=Array.from({length:10},(_,i)=>({value:i===9?1313:null}));
assert.equal(M.valueAt(series,8.5),null);assert.equal(M.valueAt(series,9),1313);
assert.equal(M.valueAt([{value:0},{value:10}],.5),5);
console.log('PASS: reversible two-scene progress; valid years; transition fade and release; view/year mapping; missing intervals vs zero; isolated final point.');

// The reset has an invisible plateau: the year never changes while visible.
for(const p of [9.84,9.9,10,10.1,10.16])assert.ok(M.frame(p).yearOpacity<1e-12);
for(let t=0;t<=1;t+=.01){
 const a=M.resetPhase(t),b=M.resetPhase(1-t);
 assert.ok(Math.abs(a.opacity-b.opacity)<1e-10);
 assert.ok(a.opacity>=0&&a.opacity<=1);
}
assert.equal(M.smooth(0),0);assert.equal(M.smooth(1),1);
assert.ok(M.frame(9.3).yearOffset<0);assert.ok(M.frame(10.7).yearOffset>0);
console.log('PASS: zero-opacity reset plateau, reversible year drift and smooth scene envelope.');
// Bars keep missing distinct from zero, including an isolated last-year report.
assert.deepEqual(M.barState(series,8.75),{value:1313,opacity:.5});
assert.deepEqual(M.barState(series,8.25),{value:null,opacity:0});
assert.deepEqual(M.barState(series,9),{value:1313,opacity:1});
assert.deepEqual(M.barState([{value:0},{value:10}],0),{value:0,opacity:1});
assert.deepEqual(M.barState([{value:0},{value:10}],.75,true),{value:10,opacity:1});
console.log('PASS: product bars distinguish missing/zero and fade isolated records without a zero-weight interpolation.');
// New choreography remains continuous and symmetric when reversing midway.
for(let i=0;i<=1000;i++){
 const b=i/1000,a=M.sceneState(b),reverse=M.sceneState(1-b);
 assert.ok(a.annualOpacity>=0&&a.annualOpacity<=1&&a.formsOpacity>=0&&a.formsOpacity<=1);
 assert.ok(a.annualOpacity+a.formsOpacity>.6,'the stage never disappears');
 assert.ok(Math.abs(a.annualOpacity-reverse.formsOpacity)<1e-10);
 assert.ok(Math.abs(a.annualOffset+reverse.formsOffset)<1e-10);
 const focus=M.yearFocus(b);
 assert.ok(focus.opacity>=.78&&focus.opacity<=1);
 assert.ok(M.frame(9+2*b).contextOpacity<=M.frame(9+2*b).yearOpacity+1e-10,'policy follows the year reveal');
}
assert.equal(M.sceneState(0).annualOpacity,1);assert.equal(M.sceneState(1).formsOpacity,1);
assert.equal(M.sceneState(0,true).formsOffset,0);
assert.deepEqual(M.yearFocus(.5,true),{opacity:1,offset:0});
console.log('PASS: continuous reversible stage choreography, readable metrics, policy reveal ordering and reduced-motion offsets.');
