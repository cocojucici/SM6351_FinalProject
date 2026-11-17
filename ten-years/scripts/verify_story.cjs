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

const presentation=app.slice(app.indexOf('  function cancelLinkedYearAnimation('),app.indexOf('  function update(animate)'));
function node(){
  const classes=new Set();
  return {
    style:{}, attributes:{}, classList:{
      contains:name=>classes.has(name),
      toggle:(name,on)=>on?classes.add(name):classes.delete(name)
    },
    setAttribute(name,value){this.attributes[name]=value;},
    removeAttribute(name){delete this.attributes[name];}
  };
}
const heading=node(),indicator=node(),column=node(),animations=[];
heading.animate=(frames,options)=>{
  const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;}};
  animations.push(animation);
  return animation;
};
const geometry={name:'Fins',ceiling:100,row:node(),fill:node(),zero:node(),value:node()};
const reduced={matches:false};
const stage={
  root:{dataset:{}}, reduced, chartX:index=>50+index*22,
  q:name=>name==='forms-year'?heading:{querySelector:selector=>selector==='.dv-year-indicator'?indicator:column},
  D:{fmt:String}, formGeometry:[geometry],
  formSeries:[{values:[{value:10},{value:35},{value:null},{value:0},{value:40}]}]
};
vm.runInNewContext(`
  const linked=true;
  let selected=2015,linkedYearAnimation;
  ${presentation}
  globalThis.select=year=>{const previous=selected;selected=year;updateLinkedYear(previous);};
`,stage);
stage.select(2015);
assert.equal(animations.length,0,'initial presentation is static');
stage.select(2016);
assert.equal(heading.textContent,'2016');
assert.equal(indicator.style.transform,'translateX(72px)');
assert.equal(geometry.fill.style.transform,'scaleX(0.35)');
assert.equal(geometry.fill.classList.contains('dv-fill-moving'),true);
stage.select(2017);
assert.equal(animations[0].cancelled,true,'rapid navigation cancels the previous label animation');
assert.equal(geometry.value.textContent,'No records');
assert.equal(geometry.fill.style.transform,'scaleX(0.35)','the disappearing bar fades at its known weight');
stage.select(2018);
assert.equal(geometry.value.textContent,'0 kg');
assert.equal(geometry.zero.hidden,false);
assert.equal(geometry.fill.classList.contains('dv-fill-moving'),false,'missing data is not an interpolation endpoint');
reduced.matches=true;
stage.select(2019);
assert.equal(geometry.value.textContent,'40 kg');
assert.equal(geometry.fill.classList.contains('dv-fill-moving'),false);
assert.equal(animations.length,3);
assert.equal(animations.at(-1).cancelled,true);
console.log('PASS: linked year transitions commit immediately, replace interrupted motion, and distinguish missing records from zero.');
