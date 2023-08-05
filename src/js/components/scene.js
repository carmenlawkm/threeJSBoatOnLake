import {
  Color,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  PointLight,
  MeshLambertMaterial,
  Texture,
  DirectionalLight,
  AmbientLight,
  CircleGeometry,
  RepeatWrapping,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  Vector3,
  Vector2,
  BoxGeometry,
  SpriteMaterial,
  Sprite
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

import Stats from 'stats-js'
import LoaderManager from '@/js/managers/LoaderManager'
import vertexShader from '../glsl/main.vert'
import fragmentShader from '../glsl/main.frag'
import { randFloat } from 'three/src/math/MathUtils'

export default class MainScene {
  #canvas
  #renderer
  #scene
  #camera
  #controls
  #stats
  #width
  #height
  #groundMirror
  #boatMesh
  #bloomComposer
  #mountainSprite

  constructor() {
    this.#canvas = document.querySelector('.scene')

    this.init()
  }

  init = async () => {
    // Preload assets before initiating the scene
    const assets = [
      {
        name: 'waterdudv',
        texture: './img/waterdudv.jpg',
      },
      {
        name: 'boatBase',
        texture: './img/boat_base_colour.PNG',
      },
      {
        name: 'mountain',
        texture: './img/mountainSil.png'
      }
    ]

    await LoaderManager.load(assets)

    this.setStats()
    this.setScene()
    this.setRender()
    this.setCamera()
    this.setControls()

    this.setBoat()
    this.setLights()
    this.setBackgroundStars()
    this.setPaperLanterns()
    this.setMountain()
    this.setReflector()

    this.handleResize()

    this.events()
  }

  setRender() {
    this.#renderer = new WebGLRenderer({
      canvas: this.#canvas,
      antialias: true,
    })
  }

  setScene() {
    this.#scene = new Scene()
    const gradientColors = ['#8e5d7c','#3f3c6d','#1e1933'];
    const gradientTexture = new Texture(createGradientCanvas(window.innerWidth, window.innerHeight, gradientColors));
    gradientTexture.needsUpdate = true;
    this.#scene.background = gradientTexture
  }

  setCamera() {
    const aspectRatio = this.#width / this.#height
    const fieldOfView = 60
    const nearPlane = 0.1
    const farPlane = 10000

    this.#camera = new PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane)
    this.#camera.position.y = 1
    this.#camera.position.x = 5
    this.#camera.position.z = 5
    this.#camera.lookAt(0, 0, 0)

    this.#scene.add(this.#camera)
  }

  setControls() {
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement)
  }

  setLights() {
    const directionalLight = new DirectionalLight(0xfff8ad, 0.6);
    directionalLight.position.z = 1;
    directionalLight.position.x = -1;
    this.#scene.add(directionalLight);
    const ambientLight = new AmbientLight(0xf8c2ff, 0.4);
    this.#scene.add(ambientLight);
  }

  setBackgroundStars() {
    const geometry = new BufferGeometry();
    // create multiple particles
    const vertices = [];
    const range = 700;
    for (let i = 0; i < 3000; i++) {
      const points = new Vector3(randFloat(-range, range), randFloat(-range, 500), randFloat(-range, 500));
      vertices.push(...points);
    }
    geometry.setAttribute( 'position', new BufferAttribute( new Float32Array(vertices), 3 ) );
    const material = new PointsMaterial( { color: 0xffffff } );
    const mesh = new Points( geometry, material );
    this.#scene.add(mesh);
  }

  setPaperLanterns() {
    const lanternGeometry = new BoxGeometry(0.4, 0.6, 0.4);
    const lanternMaterial = new MeshLambertMaterial({ color: 0x403f3a,  emissive: 0xdeca62 });
    
    for (let i = 0; i< 150; i++) {
      const lanternMesh = new Mesh(lanternGeometry, lanternMaterial);

      // Generate random positions within the range
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30 + 15;
      const z = (Math.random() - 0.5) * 30;

      // point light inside the mesh to glow
      const pointLight = new PointLight(0xffcc00, 10, 10);
      pointLight.position.set(x, y, z);
      lanternMesh.add(pointLight);

      lanternMesh.position.set(x, y, z); 
      this.#scene.add(lanternMesh);
    }
    

    const renderScene = new RenderPass(this.#scene, this.#camera);
    const bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      0.02,
      0.04,
      0.02
    );
    bloomPass.threshold = 0.25;
    bloomPass.strength = 0.45;
    bloomPass.radius = 0.1;

    const bloomComposer = new EffectComposer(this.#renderer);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.renderToScreen = true;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);
    this.#bloomComposer = bloomComposer;

  }

  setMountain() {
    const mountainSpriteTexture = LoaderManager.assets['mountain'].texture;
    const mountainSpriteMaterial = new SpriteMaterial({ map: mountainSpriteTexture });
    const mountainSprite = new Sprite(mountainSpriteMaterial);
    mountainSprite.position.set(-50, 16, -50);
    mountainSprite.scale.set(150,40,40);
    
    this.#mountainSprite = mountainSprite;
    this.#scene.add(this.#mountainSprite);
  }

  // code from three.js example: https://github.com/mrdoob/three.js/blob/master/examples/webgl_mirror.html
  setReflector() {
    let geometry = new CircleGeometry( 70, 64 );
    const customShader = Reflector.ReflectorShader;
    customShader.vertexShader = vertexShader;
    customShader.fragmentShader = fragmentShader;

    const dudvMap = LoaderManager.assets['waterdudv'].texture;

    dudvMap.wrapS = dudvMap.wrapT = RepeatWrapping;
    customShader.uniforms.tDudv = { value: dudvMap };
    customShader.uniforms.time = { value: 0 };

    this.#groundMirror = new Reflector( geometry, {
      shader: customShader, // apply the custom shader to make the displacement
      clipBias: 0.003,
      textureWidth: window.innerWidth,
      textureHeight: window.innerHeight,
      color: 0x191928
    } );
    this.#groundMirror.position.y = 0;
    this.#groundMirror.rotateX( - Math.PI / 2 );
    this.#scene.add( this.#groundMirror );
  }

  setBoat() {
    const url = './obj/boat.obj';
    const boatBaseColour = LoaderManager.assets['boatBase'].texture;
    const loader = new OBJLoader();
    loader.load(
    url,
    (object) => {
      // set the material/ colour
      object.traverse((child) => {
        if (child instanceof Mesh) {
          child.material = new MeshLambertMaterial({map: boatBaseColour});
        }
      });
      this.#boatMesh = object;
      this.#boatMesh.scale.set(0.5,0.5,0.5)
      this.#scene.add(this.#boatMesh);
    }
    ),
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.error('An error loading the boat', error);
    };  
  }

  setStats() {
    this.#stats = new Stats()
    this.#stats.showPanel(0)
  }

  events() {
    window.addEventListener('resize', this.handleResize, { passive: true })
    this.draw(0)
  }

  // EVENTS

  /**
   * Request animation frame function
   * This function is called 60/time per seconds with no performance issue
   * Everything that happens in the scene is drawed here
   * @param {Number} now
   */
  draw = (time) => {
    // now: time in ms
    this.#stats.begin()

    if (this.#controls) this.#controls.update(); // for damping

    this.#renderer.autoClear = false;
    this.#renderer.clear();
    this.#renderer.render(this.#scene, this.#camera);
    if (this.#boatMesh) this.#boatMesh.position.y = Math.sin(time/1000)*0.05-0.08;
    this.#groundMirror.material.uniforms.time.value += 0.1;
    this.#bloomComposer.render();

    updateMountainSprite(this.#camera, this.#mountainSprite);

    this.#stats.end()
    this.raf = window.requestAnimationFrame(this.draw)
  }

  handleResize = () => {
    this.#width = window.innerWidth
    this.#height = window.innerHeight

    // Update camera
    this.#camera.aspect = this.#width / this.#height
    this.#camera.updateProjectionMatrix()

    const DPR = window.devicePixelRatio ? window.devicePixelRatio : 1

    this.#renderer.setPixelRatio(DPR)
    this.#renderer.setSize(this.#width, this.#height)
  }
  
}

// for rendering the background colour of the sky
function createGradientCanvas (width, height, colors) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, height);

  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

// want the sprite to face the camera no matter what
function updateMountainSprite(camera, mountainSprite) {
  const cameraPosition = camera.position.clone();
  cameraPosition.y = mountainSprite.position.y;
  mountainSprite.lookAt(cameraPosition);
}