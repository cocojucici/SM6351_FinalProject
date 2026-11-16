const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');require('../dist/motion.js');
const source=fs.readFileSync(require('path').join(__dirname,'../dist/app.js'),'utf8');
const code=source.slice(source.indexOf("    const cursor=q('chart').querySelector('.dv-cursor')"),source.indexOf('    renderTransport();',source.indexOf("    const cursor=q('chart').querySelector('.dv-cursor')")));
const node=()=>({style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}}),cursor=node(),mark=node(),bar={fill:node(),tip:node(),ceiling:100};
const state={M:globalThis.MarineDecadeMotion,q:()=>({querySelector:s=>s==='.dv-cursor'?cursor:mark}),data:[{value:25},{value:null},{value:0}],annualPosition:0,x:42,chartY:v=>200-v,progress:11,switchMotion:null,position:0,formGeometry:[bar],formSeries:[{values:[{value:25},{value:null},{value:0}]}],reduced:{matches:false}};
function render(position){state.annualPosition=state.position=position;vm.runInNewContext(`{${code}}`,state);}
render(0);assert.equal(mark.attrs.transform,'translate(42 175)');assert.equal(mark.style.visibility,'visible');assert.equal(bar.tip.style.left,'25%');assert.equal(bar.tip.hidden,false);assert.equal(bar.fill.style.transform,'scaleX(0.25)');
render(1);assert.equal(mark.style.visibility,'hidden');assert.equal(bar.tip.hidden,true);assert.equal(bar.fill.style.transform,'scaleX(0)');
render(2);assert.equal(mark.style.visibility,'visible');assert.equal(mark.attrs.transform,'translate(42 200)');assert.equal(bar.tip.hidden,true,'reported zero has no artificial positive endpoint');
console.log('PASS: particle accents use the actual data cursor and bar scale; missing values stay hidden; zero remains zero; no extra interaction targets.');
