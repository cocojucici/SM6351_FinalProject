const assert=require('assert/strict');require('../dist/particle-sculpture.js');
const F=globalThis.MarineParticleSculpture;
for(let i=0;i<300;i++){const p=F.shape(i/300,i*.7,i*.03);for(const n of Object.values(p))assert.ok(Number.isFinite(n)&&Math.abs(n)<2);}
globalThis.document={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
const positions=[],ctx={beginPath(){},moveTo(){},lineTo(){},stroke(){},drawImage(_s,x,y,w,h){assert.ok([x,y,w,h].every(Number.isFinite));assert.ok(w>0&&h>0);positions.push([x,y]);}};
const colors={ink:'#c9ccd1',accent:'#1899c5',secondary:'#06619b',surface:'#042156'};
const field=F.create(),args={width:1280,height:720,phase:0,mouse:{x:.7,y:.45,vx:1,vy:1},colors,intro:0,chapter:0,energy:0,static:false};
field.draw(ctx,args);assert.equal(field.getState().count,5400);
field.pulse();for(let i=0;i<30;i++)field.draw(ctx,args);const moved=field.getState().maxDisplacement;assert.ok(moved>10&&moved<230,'pointer force produces bounded deformation');
args.static=true;field.draw(ctx,args);assert.equal(field.getState().maxDisplacement,moved,'pause freezes particle physics');
args.static=false;args.mouse={x:-10,y:-10,vx:0,vy:0};for(let i=0;i<180;i++)field.draw(ctx,args);assert.ok(field.getState().maxDisplacement<moved*.05,'particles return to the sculpture after interaction');
for(const intro of [0,.25,.5,.75,1])for(const chapter of [0,.5,1])field.draw(ctx,{...args,intro,chapter});
field.draw(ctx,{...args,width:390,height:844});assert.equal(field.getState().count,1800,'mobile work is capped');positions.length=0;field.draw(ctx,{...args,intro:1,chapter:1,static:true,anchor:{left:60,right:1220,top:240,year:.8,forms:1}});
for(const [x,y] of positions){assert.ok(x>=50&&x<=1230);assert.ok(y>=168&&y<=225,'the settled current stays above the chart reading area');}
field.destroy();assert.equal(field.getState().count,0);
console.log('PASS: finite 3D surface, pointer deformation and recovery, bounded impulse, paused physics, all scroll morph stages, mobile particle cap and cleanup.');
