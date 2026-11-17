const assert=require('assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const handlers=new Map();
const root={querySelector:()=>null,scrollIntoView(){this.scrolled=true;},focus(){this.focused=true;}};
const api={pause(){this.paused=true;}};
let mountOptions,observed,visibility;
const sandbox={
 window:{matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>handlers.set(name,fn)},
 location:{hash:'#product-forms'},
 history:{replaceState(_a,_b,hash){sandbox.location.hash=hash;}},
 document:{getElementById:id=>id==='annual-trade'?root:null},
 IntersectionObserver:class{constructor(fn){visibility=fn;}observe(element){observed=element;}},
 MarineDecade:{mount(element,options){assert.equal(element,root);mountOptions=options;return api;}}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/story.js'),'utf8'),sandbox);
assert.equal(mountOptions.linked,true);
assert.equal(mountOptions.year,2024);
assert.equal(mountOptions.releaseAtBoundary,true);
assert.equal(sandbox.window.decadeView,api);
assert.equal(sandbox.window.decadeChapters.annual,sandbox.window.decadeChapters.forms);
assert.equal(observed,root);
assert.equal(sandbox.location.hash,'#annual-trade');
assert.equal(root.scrolled,true);
assert.equal(root.focused,true);
visibility([{intersectionRatio:.8}]);assert.equal(api.paused,undefined);
visibility([{intersectionRatio:.2}]);assert.equal(api.paused,true);

const app=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
require('../dist/motion.js');
const choose=app.slice(app.indexOf('  function chooseYear('),app.indexOf('  function setView('));
const scrub=app.slice(app.indexOf('  function scrub('),app.indexOf('  function cancelSwitch('));
const bounded={
 M:globalThis.MarineDecadeMotion,hideInspect(){},pause(){},dismissHint(){},
 clearTimeout(){},cancelSwitch(){},settle(){},startMotion(){},
 q:()=>({textContent:''})
};
vm.runInNewContext(`let settleTimer=null,scrubDirection=1,motionOrigin='',targetProgress=8.9,progress=0,selected=2015,chapterStart=0,chapterEnd=9;
 const linked=true,destroyed=false,view='annual';
 function renderMotion(){selected=M.frame(progress).year;}
 ${choose}${scrub}
 globalThis.test={chooseYear,scrub,year:()=>selected,value:()=>targetProgress};
`,bounded);
bounded.test.chooseYear(2021,'click');
assert.equal(bounded.test.year(),2021,'direct selection commits the year immediately');
bounded.test.scrub(99,'wheel');assert.equal(bounded.test.value(),9);
bounded.test.scrub(-99,'wheel');assert.equal(bounded.test.value(),0);
console.log('PASS: one shared timeline; 2024 opens by default; old product link opens the combined view; direct selection commits immediately; playback pauses outside the view.');
