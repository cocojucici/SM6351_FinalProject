import * as THREE from './vendor/three.module.js';
import { clone as cloneSkeleton } from './vendor/SkeletonUtils.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

export function attachFish(canvas, story) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 100);
  const light = new THREE.DirectionalLight(0xc7efff, 3.6);
  const fill = new THREE.DirectionalLight(0x54889d, .55);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: .5, far: 90 });
  light.shadow.bias = -.0003;
  light.shadow.normalBias = .035;
  light.target.position.set(0, -2, 0);
  scene.add(light, light.target, fill, new THREE.HemisphereLight(0x84bbcf, 0x102534, 1.2));

  const rayScene = new THREE.Scene();
  const rayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const rayTime = { value: 0 };
  const rays = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: { time: rayTime },
    vertexShader: `
      varying vec2 positionOnScreen;
      void main() {
        positionOnScreen = uv;
        gl_Position = vec4(position.xy, 0., 1.);
      }`,
    fragmentShader: `
      precision highp float;
      varying vec2 positionOnScreen;
      uniform float time;

      void main() {
        vec2 uv = vec2(positionOnScreen.x, 1. - positionOnScreen.y);
        float slope = (uv.x - .98) / (uv.y + .12);
        float envelope = exp(-pow((slope + .55) / .58, 2.));
        float rays = 0.;
        for (int i = 0; i < 9; i++) {
          float f = float(i);
          float center = -.97 + f * .12 + sin(time * .17 + f * 2.1) * .012;
          float width = .03 + .008 * sin(f * 3.);
          rays += exp(-pow((slope - center) / width, 2.)) * (.48 + .15 * sin(time * .23 + f));
        }
        float attenuation = exp(-uv.y * 2.6);
        float glow = exp(-length((uv - vec2(.97, .015)) * vec2(3., 7.)));
        float alpha = clamp((rays * .11 + envelope * .085) * attenuation + glow * .38, 0., .56);
        gl_FragColor = vec4(mix(vec3(.17, .55, .66), vec3(.72, .91, .95), glow), alpha);
      }`
  });
  rayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rays));

  const shark = new THREE.Group();
  const companion = new THREE.Group();
  scene.add(shark, companion);
  const mixers = [];
  const forward = new THREE.Vector3(1, 0, .12).normalize();
  const modelForward = new THREE.Vector3(0, 0, 1);
  const routeUp = new THREE.Vector3(0, 25, 16).normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const origin = new THREE.Vector3();
  const rotation = new THREE.Matrix4();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  const cameraFront = new THREE.Vector3();
  const lightSample = new THREE.Vector3();
  const entranceHeading = new THREE.Vector3(-1, 0, 0).addScaledVector(routeUp, .5).normalize();
  const cameraView = { azimuth: 46, elevation: 32, zoom: 1.1 };
  const height = 12;
  let width = 20;
  let length = 4;
  let path;
  let ready = false;
  let travel = 0;

  const modelUrl = new URL('./assets/scalloped_hammerhead_juvenile_low_poly.glb', import.meta.url);
  new GLTFLoader().load(modelUrl.href, ({ scene: model, animations }) => {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const normalized = new THREE.Group();
    model.position.sub(bounds.getCenter(new THREE.Vector3()));
    normalized.add(model);
    normalized.scale.setScalar(1 / Math.max(size.x, size.y, size.z));
    model.traverse(node => {
      if (!node.isMesh) return;
      node.frustumCulled = false;
      node.material = node.material.clone();
      node.material.roughness = .45;
      node.material.metalness = 0;
      node.castShadow = true;
      node.receiveShadow = true;
    });

    const secondModel = cloneSkeleton(normalized);
    shark.add(normalized);
    companion.add(secondModel);
    const [clip] = animations;
    if (clip) {
      const mainMixer = new THREE.AnimationMixer(model);
      const companionMixer = new THREE.AnimationMixer(secondModel);
      mainMixer.clipAction(clip).play();
      companionMixer.clipAction(clip).play();
      companionMixer.update(.8);
      mixers.push(mainMixer, companionMixer);
    }
    ready = true;
  }, undefined, error => console.warn('The underwater model could not load.', error));

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;
    width = height * clientWidth / clientHeight;
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    length = Math.min(9, width * .84) * .8 * 1.05;
    shark.scale.setScalar(length);
    companion.scale.setScalar(length);
    const point = (x, y) => new THREE.Vector3((x - .5) * width, 0, 0).addScaledVector(routeUp, (.5 - y) * height);
    path = new THREE.CatmullRomCurve3([
      point(1.35, .17), point(.88, .17), point(.75, .22), point(.64, .37),
      point(.54, .53), point(.42, .64), point(.27, .71), point(.12, .79), point(-.35, .85)
    ], false, 'centripetal');
    path.arcLengthDivisions = 400;
    path.updateArcLengths();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  function applyView(second) {
    const angle = THREE.MathUtils.degToRad(second ? cameraView.azimuth : 0);
    const elevation = THREE.MathUtils.degToRad(second ? cameraView.elevation : -33);
    camera.position.set(30 * Math.cos(elevation) * Math.sin(angle), 30 * Math.sin(elevation), 30 * Math.cos(elevation) * Math.cos(angle));
    camera.lookAt(origin);
    camera.zoom = second ? cameraView.zoom : 1;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    cameraUp.setFromMatrixColumn(camera.matrixWorld, 1);
    cameraFront.setFromMatrixColumn(camera.matrixWorld, 2);
  }

  function swimAcrossSurface(dt) {
    travel = (travel + dt * 1.5 / path.getLength()) % 1;
    shark.position.copy(path.getPointAt(travel));
    // The model's forward axis (+Z) follows the path's tangent.
    rotation.lookAt(path.getTangentAt(travel).normalize(), origin, worldUp);
    shark.quaternion.setFromRotationMatrix(rotation);

    const secondX = THREE.MathUtils.lerp(-width / 2 - length * .75, width / 2 + length * .75, (travel + .20) % 1);
    companion.position.set(secondX, 0, secondX * .12).addScaledVector(routeUp, -1.3);
    companion.quaternion.setFromUnitVectors(modelForward, forward);
  }

  function swimIntoDepth() {
    const t = 1 - Math.pow(1 - story.entrance, 3);
    const mobile = canvas.clientWidth <= 700;
    const targetX = mobile ? 0 : width * .25 / camera.zoom;
    const targetY = mobile ? -height * .22 / camera.zoom : 0;
    const startX = width * .5 / camera.zoom + length * .6;
    const startY = -height * .5 / camera.zoom - length * .7;
    shark.position.copy(cameraRight)
      .multiplyScalar(THREE.MathUtils.lerp(startX, targetX, t))
      .addScaledVector(cameraUp, THREE.MathUtils.lerp(startY, targetY, t));
    rotation.lookAt(entranceHeading, origin, worldUp);
    shark.quaternion.setFromRotationMatrix(rotation);
  }

  let last = 0;
  let elapsed = 0;
  let frameId = 0;
  function frame(now) {
    frameId = requestAnimationFrame(frame);
    if (!path || now - last < 1000 / 30) return;
    const dt = Math.min((now - last) / 1000, .06);
    last = now;
    elapsed += dt;
    const atDepth = story.entrance > 0;
    applyView(atDepth);
    if (ready) {
      companion.visible = !atDepth;
      if (atDepth) swimIntoDepth();
      else swimAcrossSurface(dt);
      for (const mixer of mixers) mixer.update(dt * 1.5);
    }

    rayTime.value = elapsed;
    light.position.copy(cameraRight).multiplyScalar(width * .6).addScaledVector(cameraUp, 12).addScaledVector(cameraFront, 5);
    fill.position.copy(camera.position);
    lightSample.copy(shark.position).project(camera);
    const depth = THREE.MathUtils.clamp((1 - lightSample.y) * .5, 0, 1);
    light.intensity = 4.2 * Math.exp(-depth * .8) * (.96 + .04 * Math.sin(elapsed * .7));
    renderer.clear();
    if (!atDepth) renderer.render(rayScene, rayCamera);
    renderer.clearDepth();
    renderer.render(scene, camera);

    // Reveal the canvas after the new camera view and swimming position are drawn.
    canvas.style.opacity = atDepth
      ? THREE.MathUtils.smoothstep(story.entrance, 0, .08)
      : Math.pow(1 - THREE.MathUtils.clamp(story.intro, 0, 1), Math.log2(5));
  }

  return {
    setActive(active) {
      if (active && !frameId) {
        last = performance.now();
        frameId = requestAnimationFrame(frame);
      } else if (!active && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }
  };
}
