(function(){
'use strict';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const pages=[
 {root:document.getElementById('annual-trade'),view:'annual'},
 {root:document.getElementById('product-forms'),view:'forms'}
];
const sharedFlow=!!window.MarineDecadeFlow;
const intro=document.getElementById('ocean-intro');
pages.forEach(page=>{page.api=MarineDecade.mount(page.root,{chapterView:page.view,releaseAtBoundary:true,sharedFlow,intro:!!intro});});
const chapterScroll=window.MarineChapterScroll?.create();
if(sharedFlow){
 const canvas=document.createElement('canvas');canvas.className='dv-story-flow';canvas.setAttribute('aria-hidden','true');
 const main=pages[0].root.parentElement;main.before(canvas);
 window.decadeFlow=window.MarineDecadeFlow.attach(main,{viewport:true,canvas,intro,sculpture:!!intro,buttons:[intro?.querySelector('[data-action="flow"]'),...pages.map(page=>page.root.querySelector('[data-action="flow"]'))].filter(Boolean),surfaces:pages.map(page=>page.root),themeRoot:pages[0].root});
}
intro?.addEventListener('click',event=>{
 if(event.target.closest('[data-action="flow"]')){intro.dispatchEvent(new CustomEvent('decade:flow-toggle',{bubbles:true}));return;}
 if(!event.target.closest('.dv-intro-explore'))return;
 event.preventDefault();
 if(chapterScroll)chapterScroll.to(pages[0].root);else pages[0].root.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
 pages[0].root.focus({preventScroll:true});history.pushState(null,'','#annual-trade');
});
let syncing=false;
function mirror(action){if(syncing)return;syncing=true;try{action();}finally{syncing=false;}}
function owner(event){return pages.find(page=>page.root===event.target);}
function navigate(target,source,year,filters,selectProduct=false){
 if(!target||target===source)return;
 mirror(()=>{
  pages.forEach(page=>page.api.pause());
  target.api.setFilters({reporter:filters.reporter,source:filters.source,...(selectProduct&&target.view==='annual'?{term:filters.term}:{})});
  target.api.setYear(year);
 });
 if(chapterScroll)chapterScroll.to(target.root);else target.root.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
 target.root.focus({preventScroll:true});
 target.root.querySelector('[data-role="interaction-status"]').textContent=`${target.view==='annual'?'Annual trade':'Product forms'} · ${year}`;
 if(location.hash!==`#${target.root.id}`)history.pushState(null,'',`#${target.root.id}`);
}
document.addEventListener('decade:filters-change',event=>{
 const source=owner(event);if(!source)return;
 mirror(()=>pages.filter(page=>page!==source).forEach(page=>page.api.setFilters({reporter:event.detail.filters.reporter,source:event.detail.filters.source})));
});
document.addEventListener('decade:data-change',event=>{
 const source=owner(event);if(!source)return;
 mirror(()=>pages.filter(page=>page!==source).forEach(page=>page.api.setData(event.detail.data)));
});
document.addEventListener('decade:events-change',event=>{
 const source=owner(event);if(!source)return;
 mirror(()=>pages.filter(page=>page!==source).forEach(page=>page.api.setEvents(event.detail.events)));
});
document.addEventListener('decade:navigate',event=>{
 const source=owner(event);if(!source)return;
 navigate(pages.find(page=>page.view===event.detail.view),source,event.detail.year,event.detail.filters,event.detail.origin==='product');
});
document.addEventListener('decade:boundary',event=>{
 const source=owner(event);if(!source)return;
 const target=pages[pages.indexOf(source)+event.detail.direction];
 if(target){event.preventDefault?.();const state=source.api.getState();navigate(target,source,event.detail.origin==='wheel'?state.year:event.detail.direction>0?2015:2024,state.filters);}
});
document.addEventListener('click',event=>{
 const link=event.target.closest('.dv-chapter-link');if(!link)return;
 const source=pages.find(page=>page.root.contains(link)),target=pages.find(page=>`#${page.root.id}`===link.getAttribute('href'));
 if(source&&target){event.preventDefault();const state=source.api.getState();navigate(target,source,state.year,state.filters);}
});
const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(entry.intersectionRatio<.5)pages.find(page=>page.root===entry.target)?.api.pause();
}),{threshold:[0,.5]});
pages.forEach(page=>visibility.observe(page.root));
window.decadeChapters={annual:pages[0].api,forms:pages[1].api};
window.decadeView=pages[0].api;
})();
