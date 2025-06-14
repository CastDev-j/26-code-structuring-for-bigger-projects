import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import { GLTFLoader, Timer } from "three/examples/jsm/Addons.js";
import GUI from "lil-gui";

/**
 * Set up the gui
 */

const gui = new GUI().close();
const debugObject = {
  envMapIntensity: 0.4,
};

/**
 * Set up scene
 */

const scene = new THREE.Scene();

/**
 * Set up loaders
 */

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMap/px.jpg",
  "/textures/environmentMap/nx.jpg",
  "/textures/environmentMap/py.jpg",
  "/textures/environmentMap/ny.jpg",
  "/textures/environmentMap/pz.jpg",
  "/textures/environmentMap/nz.jpg",
]);

environmentMap.colorSpace = THREE.SRGBColorSpace;

// scene.background = environmentMap
scene.environment = environmentMap;

debugObject.envMapIntensity = 0.4;
gui
  .add(debugObject, "envMapIntensity")
  .min(0)
  .max(4)
  .step(0.001)
  .onChange(updateAllMaterials);

/**
 * Models
 */
let foxMixer: THREE.AnimationMixer | null = null;

gltfLoader.load("/models/Fox/glTF/Fox.gltf", (gltf) => {
  // Model
  gltf.scene.scale.set(0.02, 0.02, 0.02);
  scene.add(gltf.scene);

  // Animation
  foxMixer = new THREE.AnimationMixer(gltf.scene);
  const foxAction = foxMixer.clipAction(gltf.animations[0]);
  foxAction.play();

  // Update materials
  updateAllMaterials();
});

/**
 * Floor
 */
const floorColorTexture = textureLoader.load("textures/dirt/color.jpg");
floorColorTexture.colorSpace = THREE.SRGBColorSpace;
floorColorTexture.repeat.set(1.5, 1.5);
floorColorTexture.wrapS = THREE.RepeatWrapping;
floorColorTexture.wrapT = THREE.RepeatWrapping;

const floorNormalTexture = textureLoader.load("textures/dirt/normal.jpg");
floorNormalTexture.repeat.set(1.5, 1.5);
floorNormalTexture.wrapS = THREE.RepeatWrapping;
floorNormalTexture.wrapT = THREE.RepeatWrapping;

const floorGeometry = new THREE.CircleGeometry(5, 64);
const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorColorTexture,
  normalMap: floorNormalTexture,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#313fa2', 2);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(3.5, 2, -1.25);
scene.add(directionalLight);

gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.001)
  .name("lightIntensity");
gui
  .add(directionalLight.position, "x")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightX");
gui
  .add(directionalLight.position, "y")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightY");
gui
  .add(directionalLight.position, "z")
  .min(-5)
  .max(5)
  .step(0.001)
  .name("lightZ");

/**
 * Set up canvas
 */

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const [width, height] = [
  (canvas.width = window.innerWidth),
  (canvas.height = window.innerHeight),
];

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
camera.position.set(8, 6, 10);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1.75;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor("#211d20");
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animation loop
 */

const timer = new Timer();

const tick = () => {
  timer.update();
  // const elapsedTime = timer.getElapsed();
  const deltaTime = timer.getDelta();

  // update controls to enable damping
  controls.update();

  // Fox animation
  if (foxMixer) {
    foxMixer.update(deltaTime);
  }

  // render
  renderer.render(scene, camera);

  // request next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Handle window resize
 */

function handleResize() {
  const visualViewport = window.visualViewport!;
  const width = visualViewport.width;
  const height = visualViewport.height;

  canvas.width = width;
  canvas.height = height;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

/**
 * Usar el evento 'resize' de visualViewport para móviles
 */

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleResize);
} else {
  window.addEventListener("resize", handleResize);
}
