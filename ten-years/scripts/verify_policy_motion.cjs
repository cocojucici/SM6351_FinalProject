const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
require('../dist/motion.js');
const source=fs.readFileSync(require('path').join(__dirname,'../dist/app.js'),'utf8');
const functions=source.slice(source.indexOf('  function commitPolicy('),source.indexOf('  function renderEvents()'));
const sandbox={M:globalThis.MarineDecadeMotion};
vm.runInNewContext(`
 let policyHTML='',policyPending='',policyOpacity=0,policyPhase=null,policyElapsed=0,policyFrom=0;
 const reduced={matches:false},panel={hidden:true},content={innerHTML:''};
 const root={querySelector:()=>panel},q=()=>content;function startMotion(){}
 ${functions}
 globalThis.test={queuePolicy,tickPolicy,reduced,state:()=>({html:content.innerHTML,alpha:policyOpacity,phase:policyPhase,hidden:panel.hidden})};
`,sandbox);
const t=sandbox.test;
t.queuePolicy('A');assert.equal(t.state().alpha,0);
t.tickPolicy(500,false);assert.equal(t.state().phase,'wait');assert.equal(t.state().alpha,0);
t.tickPolicy(90);assert.equal(t.state().phase,'in');
t.tickPolicy(140);assert.equal(t.state().alpha,.5);t.tickPolicy(140);assert.equal(t.state().alpha,1);
t.queuePolicy('B');t.tickPolicy(60);assert.equal(t.state().html,'A');assert.equal(t.state().alpha,.5);
t.queuePolicy('C');t.tickPolicy(120);assert.equal(t.state().html,'C');assert.equal(t.state().alpha,0);
t.tickPolicy(80);t.tickPolicy(50,false);assert.equal(t.state().phase,'wait');
t.tickPolicy(90);t.tickPolicy(280);assert.equal(t.state().alpha,1);
t.queuePolicy('');t.tickPolicy(120);assert.equal(t.state().html,'');assert.equal(t.state().hidden,true);assert.equal(t.state().phase,null);
t.reduced.matches=true;t.queuePolicy('D');assert.equal(t.state().alpha,1);assert.equal(t.state().html,'D');assert.equal(t.state().phase,null);
assert.match(source,/!motionFrame&&!destroyed&&!inTick/);
console.log('PASS: policy waits for stable motion, interrupted wait restarts, fade-out before replacement, latest-request coalescing, empty years, reduced motion and RAF reentrancy guard.');
