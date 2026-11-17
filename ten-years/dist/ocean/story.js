import { attachBubbles } from './bubbles.js?v=webp';

const story = document.querySelector('.ocean-story');
const stage = story.querySelector('.ocean-stage');
const intro = story.querySelector('.ocean-intro-panel');
const introContent = intro.querySelector('.ocean-intro-content');
const depth = story.querySelector('.ocean-depth');
const paragraph = depth.querySelector('p');
const surface = stage.querySelector('.ocean-surface');
const rays = stage.querySelector('.ocean-rays');
const state = { intro: 0, entrance: 0 };
let motionEnabled = false;
let visible = false;
let fishRequested = false;
let fish;
let bubbles;

function syncActivity() {
  const active = motionEnabled && visible && !document.hidden;
  if (active && !fishRequested) {
    fishRequested = true;
    import('./fish.js?v=lighter-renderer').then(({ attachFish }) => {
      fish = attachFish(stage.querySelector('.ocean-fish'), state);
      syncActivity();
    }).catch(error => console.warn('The underwater model is unavailable.', error));
  }
  if (active && !bubbles) bubbles = attachBubbles(stage.querySelector('.ocean-bubbles'));
  fish?.setActive(active);
  bubbles?.setActive(active);
}

function splitParagraph() {
  const original = [...paragraph.childNodes];
  const words = [];
  paragraph.replaceChildren();
  for (const node of original) {
    const fragment = node.nodeName === 'I' ? document.createElement('i') : document.createDocumentFragment();
    for (const token of node.textContent.match(/\S+|\s+/g) ?? []) {
      if (!token.trim()) {
        fragment.append(token);
        continue;
      }
      const word = document.createElement('span');
      word.className = 'ocean-reveal-word';
      word.textContent = token;
      words.push(word);
      fragment.append(word);
    }
    paragraph.append(fragment);
  }
  return { words, restore: () => paragraph.replaceChildren(...original) };
}

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    story.dataset.motion = '';
    motionEnabled = true;
    const { words, restore } = splitParagraph();

    gsap.fromTo(state, { intro: 0 }, {
      intro: 1,
      ease: 'none',
      scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: .3 },
      onUpdate() {
        const progress = state.intro;
        const surfaceOpacity = 1 - progress * progress * (3 - 2 * progress);
        surface.style.opacity = surfaceOpacity;
        rays.style.opacity = surfaceOpacity;
        introContent.style.opacity = Math.max(0, 1 - progress * 2);
        introContent.style.transform = `translateY(${-progress * 80}px)`;
        introContent.style.visibility = progress < .5 ? 'visible' : 'hidden';
      }
    });
    gsap.fromTo(words, { opacity: 0, y: 5 }, {
      opacity: 1,
      y: 0,
      duration: .45,
      stagger: { amount: .55 },
      scrollTrigger: { trigger: depth, start: 'top 75%', end: 'top top', scrub: .25 }
    });
    gsap.fromTo(state, { entrance: 0 }, {
      entrance: 1,
      ease: 'none',
      scrollTrigger: { trigger: depth, start: 'top 15%', end: 'center top', scrub: .3 }
    });
    syncActivity();

    return () => {
      motionEnabled = false;
      delete story.dataset.motion;
      introContent.removeAttribute('style');
      surface.removeAttribute('style');
      rays.removeAttribute('style');
      restore();
      syncActivity();
    };
  });

  // Wait for local type metrics before measuring the scroll ranges.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting && entry.intersectionRatio > 0;
  syncActivity();
}).observe(stage);
document.addEventListener('visibilitychange', syncActivity);
