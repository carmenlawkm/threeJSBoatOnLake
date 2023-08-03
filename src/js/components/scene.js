import {
  Color,
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  SphereGeometry,
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
  
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
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
  #sphereMesh
  #groundMirror
  #boatMesh

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
    ]

    await LoaderManager.load(assets)

    this.setStats()
    this.setScene()
    this.setRender()
    this.setCamera()
    this.setControls()

    this.setSphere()
    this.setBoat()
    this.setLights()
    this.setReflector()
    this.setBackgroundStars()

    this.handleResize()

    this.events()
  }

  setRender() {
    this.#renderer = new WebGLRenderer({
      canvas: this.#canvas,
      antialias: true,
    })
  }

  // add all the objects in the scene here
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

  // code from three.js example: https://github.com/mrdoob/three.js/blob/master/examples/webgl_mirror.html
  setReflector() {
    let geometry = new CircleGeometry( 50, 64 );
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

  setSphere() {
    const geometry = new SphereGeometry(1, 32, 32)
    const material = new MeshLambertMaterial({color: '#ffffff' })

    this.#sphereMesh = new Mesh(geometry, material)
    this.#scene.add(this.#sphereMesh)
  }

  setBoat() {
    this.loadOBJModel('./obj/boat.obj'); // boat model
  }

  setStats() {
    this.#stats = new Stats()
    this.#stats.showPanel(0)
    // document.body.appendChild(this.#stats.dom)
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
    this.#renderer.render(this.#scene, this.#camera);
    this.#sphereMesh.position.y = Math.sin(time/1000)*0.1 + 0.8;
    this.#groundMirror.material.uniforms.time.value += 0.1;

    this.#stats.end()
    this.raf = window.requestAnimationFrame(this.draw)
  }

  /**
   * On resize, we need to adapt our camera based
   * on the new window width and height and the renderer
   */
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

  loadOBJModel = (url) => {
    const loader = new OBJLoader();
    loader.load(
    url,
    (object) => {
      this.#scene.add(object);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
      console.error('An error loading an obj', error);
    }
    );
  };
  
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
