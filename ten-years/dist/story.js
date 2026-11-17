(function(){
'use strict';
const root=document.getElementById('annual-trade');
const intro=document.getElementById('ocean-intro');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const sharedFlow=!!window.MarineDecadeFlow;
const api=MarineDecade.mount(root,{linked:true,year:2024,releaseAtBoundary:true,sharedFlow,intro:!!intro});
const chapterScroll=window.MarineChapterScroll?.create();
if(sharedFlow){
 const canvas=document.createElement('canvas');
 canvas.className='dv-story-flow';
 canvas.setAttribute('aria-hidden','true');
 const main=root.parentElement;
 main.before(canvas);
 window.decadeFlow=window.MarineDecadeFlow.attach(main,{viewport:true,canvas,intro,sculpture:!!intro,surfaces:[root],themeRoot:root});
}
function showCharts(){
 if(chapterScroll)chapterScroll.to(root);
 else root.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
 root.focus({preventScroll:true});
}
intro?.addEventListener('click',event=>{
 if(!event.target.closest('.dv-intro-explore'))return;
 event.preventDefault();
 showCharts();
 if(location.hash!=='#annual-trade')history.pushState(null,'','#annual-trade');
});
function followProductLink(){
 if(location.hash!=='#product-forms')return;
 history.replaceState(null,'','#annual-trade');
 showCharts();
}
window.addEventListener('hashchange',followProductLink);
followProductLink();
new IntersectionObserver(entries=>{
 if(entries[0].intersectionRatio<.5)api.pause();
},{threshold:[0,.5]}).observe(root);
window.decadeChapters={annual:api,forms:api};
window.decadeView=api;
})();
