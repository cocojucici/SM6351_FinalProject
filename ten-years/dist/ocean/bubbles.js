// Reuse the same eight bubbles throughout the dive.
export function attachBubbles(layer) {
  const bubbleUrl = new URL('./assets/bubble.webp', import.meta.url);
  let active = false;

  function cycle(image, initial = false) {
    const size = 38 + Math.random() * 50;
    const rise = 32 + Math.random() * 45;
    const drift = (Math.random() - .5) * 80;
    const duration = 11000 + Math.random() * 8000;
    Object.assign(image.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${4 + Math.random() * 92}%`,
      top: `${65 + Math.random() * 42}%`
    });
    const animation = image.animate([
      { transform: 'translate3d(0,0,0) scale(.88)', opacity: 0, offset: 0 },
      { transform: `translate3d(${drift * .2}px,-${rise * .15}vh,0) scale(.94)`, opacity: .3, offset: .18 },
      { transform: `translate3d(${drift}px,-${rise * .55}vh,0) scale(1)`, opacity: .24, offset: .55 },
      { transform: `translate3d(${drift * .5}px,-${rise * .82}vh,0) scale(1.05)`, opacity: .09, offset: .82 },
      { transform: `translate3d(${drift * .8}px,-${rise}vh,0) scale(1.08)`, opacity: 0, offset: 1 }
    ], { duration, fill: 'both' });
    animation.onfinish = () => {
      animation.cancel();
      cycle(image);
    };
    if (initial) animation.currentTime = duration * Math.random();
    if (!active) animation.pause();
  }

  for (let i = 0; i < 8; i++) {
    const image = document.createElement('img');
    image.src = bubbleUrl.href;
    image.alt = '';
    layer.append(image);
    cycle(image, true);
  }

  return {
    setActive(next) {
      if (active === next) return;
      active = next;
      for (const animation of layer.getAnimations({ subtree: true })) {
        if (active) animation.play();
        else animation.pause();
      }
    }
  };
}
