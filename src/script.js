import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
const debugObject = {};
debugObject.envMapIntensity = 2.5;
debugObject.directionalLightCameraHelperOptions = true;

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
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
      child.material.envMap = environmentMap;
      child.material.envMapIntensity = debugObject.envMapIntensity;
      //激活网络上的阴影
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Plane
 */
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 15, 15),
  new THREE.MeshStandardMaterial()
);
plane.rotation.y = Math.PI;
plane.position.y = -5;
plane.position.z = 5;
scene.add(plane);

/**
 * Models
 */
gltfLoader.load("/models/Butterfly/butterfly.glb", (gltf) => {
  console.log(gltf);
  // Model
  const mesh = gltf.scene;
  mesh.rotation.y = Math.PI * 0.4;
  mesh.position.y = -1;

  // Update material
  mesh.material = material;
  mesh.customDepthMaterial = depthMaterial;

  // 添加到场景
  scene.add(mesh);

  //添加旋转控制到GUI
  gui
    .add(gltf.scene.rotation, "y")
    .min(-Math.PI)
    .max(Math.PI)
    .step(0.001)
    .name("rotation");

  // 更新所有材质
  updateAllMaterials();

  // 获取动画混合器
  const mixer = new THREE.AnimationMixer(mesh);
  console.log(mixer);

  // 获取动画数据
  const animations = gltf.animations;
  console.log(animations);

  //如果有动画，播放动画
  if (animations && animations.length) {
    for (let i = 0; i < animations.length; i++) {
      const animation = animations[i];
      const action = mixer.clipAction(animation);
      action.play();
    }
  }

  // 更新动画
  function update() {
    mixer.update(0.01);
    requestAnimationFrame(update);
  }

  // 开始更新动画
  update();
});

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/1/px.jpg",
  "/textures/environmentMaps/1/nx.jpg",
  "/textures/environmentMaps/1/py.jpg",
  "/textures/environmentMaps/1/ny.jpg",
  "/textures/environmentMaps/1/pz.jpg",
  "/textures/environmentMaps/1/nz.jpg",
]);
scene.background = environmentMap;
scene.environment = environmentMap;

/**
 * Material
 */

// Textures
const mapTexture = textureLoader.load("/models/Butterfly/Diffuse-Map.png");
const opacityTexture = textureLoader.load("/models/Butterfly/Opacity-Map.png");

// // Material
const material = new THREE.MeshStandardMaterial({
  map: mapTexture,
  alphaMap: opacityTexture,
  transparent: true,
});

const depthMaterial = new THREE.MeshDepthMaterial({
  depthPacking: THREE.RGBADepthPacking,
});

const customUniforms = {
  uTime: { value: 0 },
};

// material.onBeforeCompile = (shader) =>
// {
//     shader.uniforms.uTime = customUniforms.uTime
//     shader.vertexShader = shader.vertexShader.replace(
//         '#include <common>',
//         `
//         #include <common>
//         uniform float uTime;

//         mat2 get2dRotateMatrix(float _angle)
//         {
//             return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
//         }
//         `
// )
//     shader.vertexShader = shader.vertexShader.replace(
//     '#include <beginnormal_vertex>',
//     `#include <beginnormal_vertex>
//     float angle = (sin(uTime+position.y))*0.4;
//             mat2 rotateMatrix = get2dRotateMatrix(angle);

//             objectNormal.xz = rotateMatrix * objectNormal.xz;
//     `
// )
//     shader.vertexShader = shader.vertexShader.replace(
//         '#include <begin_vertex>',
//         `
//             #include <begin_vertex>

//             transformed.xz = rotateMatrix * transformed.xz;

//         `
//     )

// }

// depthMaterial.onBeforeCompile = (shader) =>
// {
//     shader.uniforms.uTime = customUniforms.uTime
//     shader.vertexShader = shader.vertexShader.replace(
//         '#include <common>',
//         `
//         #include <common>
//         uniform float uTime;

//         mat2 get2dRotateMatrix(float _angle)
//         {
//             return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
//         }
//         `
// )
//     shader.vertexShader = shader.vertexShader.replace(
//         '#include <begin_vertex>',
//         `
//             #include <begin_vertex>

//             float angle = (sin(uTime+position.y))*0.4;
//             mat2 rotateMatrix = get2dRotateMatrix(angle);

//             transformed.xz = rotateMatrix * transformed.xz;

//         `
//     )
// }
/**
 * Light
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 1);

//Castshadow
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);

directionalLight.position.set(0.25, 2, -2.25);
scene.add(directionalLight);

//创建一个helper
const directionalLightCameraHelper = new THREE.CameraHelper(
  directionalLight.shadow.camera
);
scene.add(directionalLightCameraHelper);

//将 helper 的可见性添加到 GUI 中
gui.add(debugObject, "directionalLightCameraHelperOptions").onChange(() => {
  directionalLightCameraHelper.visible =
    debugObject.directionalLightCameraHelperOptions;
});

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

gui
  .add(debugObject, "envMapIntensity")
  .min(0)
  .max(10)
  .step(0.001)
  .onChange(updateAllMaterials);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMappingExposure = 3;
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4, 1, -4);
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
renderer.setSize(sizes.width, sizes.height);

//Tone
renderer.toneMapping = THREE.ACESFilmicToneMapping;
gui.add(renderer, "toneMapping", {
  No: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  Cineon: THREE.CineonToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
});
gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);

//Shadow
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  //Update material
  customUniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
