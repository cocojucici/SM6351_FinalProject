import { attachBubbles } from './bubbles.js';

const story = document.querySelector('.ocean-story');
const stage = story.querySelector('.ocean-stage');
const intro = story.querySelector('.ocean-intro-panel');
const introContent = intro.querySelector('.ocean-intro-content');
const depth = story.querySelector('.ocean-depth');
const paragraph = depth.querySelector('p');
const surface = stage.querySelector('.ocean-surface');
const splineCanvas = stage.querySelector('.ocean-spline');
const state = { intro: 0, entrance: 0 };
let motionEnabled = false;
let visible = false;
let fishRequested = false;
let fish;
let bubbles;
let splineRequested = false;
let spline;
let splinePlaying = false;

async function loadSpline() {
  splineRequested = true;
  let app;
  try {
    const { Application } = await import('https://cdn.jsdelivr.net/npm/@splinetool/runtime@2.0.184/build/runtime.js');
    app = new Application(splineCanvas);
    await app.load('https://prod.spline.design/nKLH316Z3wAxXA5k/scene.splinecode');
    spline = app;
    splineCanvas.hidden = false;
    splinePlaying = true;
    syncSpline();
  } catch {
    // The local water texture remains visible if the original Spline scene is unavailable.
    app?.dispose?.();
  }
}

function syncSpline() {
  const showSurface = motionEnabled && visible && !document.hidden && state.intro < .995;
  if (showSurface && !splineRequested) loadSpline();
  if (!spline || showSurface === splinePlaying) return;
  splinePlaying = showSurface;
  if (showSurface) spline.play?.();
  else spline.stop?.();
}

function syncActivity() {
  const active = motionEnabled && visible && !document.hidden;
  if (active && !fishRequested) {
    fishRequested = true;
    import('./fish.js').then(({ attachFish }) => {
      fish = attachFish(stage.querySelector('.ocean-fish'), state);
      syncActivity();
    }).catch(error => console.warn('The underwater model is unavailable.', error));
  }
  if (active && !bubbles) bubbles = attachBubbles(stage.querySelector('.ocean-bubbles'));
  fish?.setActive(active);
  bubbles?.setActive(active);
  syncSpline();
}

function splitParagraph() {
  const original = [...paragraph.childNodes];
  const accessible = document.createElement('span');
  accessible.className = 'dv-sr-only';
  accessible.append(...original.map(node => node.cloneNode(true)));
  const characters = [];
  paragraph.replaceChildren(accessible);
  for (const node of original) {
    const fragment = node.nodeName === 'I' ? document.createElement('i') : document.createDocumentFragment();
    for (const token of node.textContent.match(/\S+|\s+/g) ?? []) {
      if (!token.trim()) {
        fragment.append(token);
        continue;
      }
      const word = document.createElement('span');
      word.className = 'ocean-reveal-word';
      word.setAttribute('aria-hidden', 'true');
      for (const letter of token) {
        const character = document.createElement('span');
        character.textContent = letter;
        characters.push(character);
        word.append(character);
      }
      fragment.append(word);
    }
    paragraph.append(fragment);
  }
  return { characters, restore: () => paragraph.replaceChildren(...original) };
}

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    story.dataset.motion = '';
    motionEnabled = true;
    const { characters, restore } = splitParagraph();

    gsap.fromTo(state, { intro: 0 }, {
      intro: 1,
      ease: 'none',
      scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: .5 },
      onUpdate() {
        const progress = state.intro;
        surface.style.opacity = 1 - progress * progress * (3 - 2 * progress);
        introContent.style.opacity = Math.max(0, 1 - progress * 2);
        introContent.style.transform = `translateY(${-progress * 80}px)`;
        introContent.style.visibility = progress < .5 ? 'visible' : 'hidden';
        syncSpline();
      }
    });
    gsap.fromTo(characters, { opacity: 0, filter: 'blur(6px)' }, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: .45,
      stagger: { amount: .55 },
      scrollTrigger: { trigger: depth, start: 'top 75%', end: 'top top', scrub: .35 }
    });
    gsap.fromTo(state, { entrance: 0 }, {
      entrance: 1,
      ease: 'none',
      scrollTrigger: { trigger: depth, start: 'top 15%', end: 'center top', scrub: .55 }
    });
    syncActivity();

    return () => {
      motionEnabled = false;
      delete story.dataset.motion;
      introContent.removeAttribute('style');
      surface.removeAttribute('style');
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
