import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import camera from './camera'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { Floor, GroundBody } from './objects/floor'
import { createWall } from './objects/wall'
import { createBall, ballMaterial } from './objects/ball'
import { createPoolTable, tableMaterial } from './objects/table'
import { createCueController } from './controllers/cueController'


const wallsConfig = [
  { 
    position: { x: 0, y: 12.5, z: -25 },
    rotation: { x: 0, y: 0, z: 0 },
    size: { width: 50, height: 25, depth: 0.5 }
  },
  { 
    position: { x: 0, y: 12.5, z: 25 },
    rotation: { x: 0, y: Math.PI, z: 0 },
    size: { width: 50, height: 25, depth: 0.5 }
  },
  { 
    position: { x: -25, y: 12.5, z: 0 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    size: { width: 50, height: 25, depth: 0.5 }
  },
  { 
    position: { x: 25, y: 12.5, z: 0 },
    rotation: { x: 0, y: -Math.PI / 2, z: 0 },
    size: { width: 50, height: 25, depth: 0.5 }
  }
]

const ballsConfig = [
  { radius: 0.3, position: { x: 0, y: 5.5, z: 0 }, color: 0xffffff, mass: 1, ballName: 'White' },
  { radius: 0.3, position: { x: -2, y: 5.5, z: -1 }, color: 0x4169E1, mass: 1, ballName: 'Blue' },
  { radius: 0.3, position: { x: 2, y: 5.5, z: -1 }, color: 0x3CB371, mass: 1, ballName: 'Green' },
  { radius: 0.3, position: { x: 0, y: 5.5, z: -2 }, color: 0xFFD700, mass: 1, ballName: 'Yellow' },
  { radius: 0.3, position: { x: 4, y: 5.5, z: 0 }, color: 0xFF0000, mass: 1, ballName: 'Red' },
  { radius: 0.3, position: { x: -4, y: 5.5, z: 1 }, color: 0x8B4513, mass: 1, ballName: 'Brown' },
]

interface BallData {
  mesh: THREE.Mesh
  body: CANNON.Body
  outline: THREE.Mesh
  update: () => void
  setHighlight: (highlighted: boolean) => void
}

function App() {
  const refContainer = useRef<HTMLDivElement>(null)
  const cueControllerRef = useRef<any>(null)

  useEffect(() => {
    if (!refContainer.current) return

    const getSize = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const { width, height } = getSize();

    // Scene && config
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true
    refContainer.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xffffff, 0, 400)

    // Physics main config
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.81, 0),
    })

    world.addBody(GroundBody)

    // Camera
    const orbit = new OrbitControls(camera, renderer.domElement)
    camera.position.set(0, 15, 15)
    orbit.maxDistance = 25
    orbit.minDistance = 10
    orbit.maxPolarAngle = 0.3 * Math.PI
    orbit.enablePan = false
    orbit.update()

    const handleResize = () => {
      const { width, height } = getSize()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.render(scene, camera)
    }

    window.addEventListener('resize', handleResize)

    // Light
    const mainLight = new THREE.AmbientLight(0xffffff)
    const luminar = new THREE.SpotLight(0xBF9E00, 600, 40, 1, 2)
    
    scene.add(mainLight)
    scene.add(luminar)

    mainLight.intensity = 0.2
    luminar.castShadow = true
    luminar.position.y = 20

    //OBJECTS

    // Objects URLS
    const assetLoader = new GLTFLoader()
    const TableURL = new URL("./objects/poolTable.glb", import.meta.url)
    const ChandelierURL = new URL("./objects/chandelier.glb", import.meta.url)

    // Floor
    scene.add(Floor)
    Floor.rotation.x = -0.5 * Math.PI
    Floor.receiveShadow = true

    // Walls
    wallsConfig.forEach((config) => {
      const { mesh, body } = createWall(
        config.size.width,
        config.size.height,
        config.size.depth,
        config.position,
        config.rotation
      )
      scene.add(mesh)
      world.addBody(body)
    })

    // Raycaster setup
    const raycaster = new THREE.Raycaster()
    const mousePosition = new THREE.Vector2()
    
    const balls: BallData[] = []
    const ballMeshes: THREE.Mesh[] = []

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1
      mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(mousePosition, camera)
      const intersects = raycaster.intersectObjects(scene.children)

        for(let j = 0; j < balls.length; j++){
          if(balls[j].mesh.name === intersects[0].object.name){
            balls[j].setHighlight(true)
          }

          if(balls[j].mesh.name !== intersects[0].object.name){
            balls[j].setHighlight(false)
          }
        }
    }
    
    window.addEventListener('mousemove', handleMouseMove)

    
    // Controlador de hit
    const cueController = createCueController({
      camera,
      scene,
      balls,
      hitPower: 10,
      cueBallName: 'White',
    })
    cueControllerRef.current = cueController
    
    cueController.enable()

    // Contact Materials
    const ballBallContact = new CANNON.ContactMaterial(ballMaterial, ballMaterial, {
      friction: 0.1,
      restitution: 0.9,
    })
    world.addContactMaterial(ballBallContact)

    const ballTableContact = new CANNON.ContactMaterial(ballMaterial, tableMaterial, {
      friction: 0.3,
      restitution: 0.6,
    })
    world.addContactMaterial(ballTableContact)

    // Table with balls
    const poolTable = createPoolTable(assetLoader, TableURL, 7, { x: 0, y: 0, z: 0 })

    poolTable.loaded.then((tableMesh) => {
      scene.add(tableMesh)
      world.addBody(poolTable.body)

      ballsConfig.forEach((config) => {
        const ballData = createBall(config)
        
        scene.add(ballData.mesh)
        world.addBody(ballData.body)
        
        balls.push(ballData)
        ballMeshes.push(ballData.mesh)

      })
      console.log('balls: ', balls)
    })

    // Chandelier
    assetLoader.load(ChandelierURL.href, function(glb) {
      const Chandelier = glb.scene
      scene.add(Chandelier)
      Chandelier.scale.setScalar(4)
      Chandelier.position.y = 25
      Chandelier.castShadow = true
    }, undefined, function(error) {
      console.error(error)
    })

    // Animation loop
    const fixedTimeStep = 1 / 60
    const maxSubSteps = 3
    let lastTime = 0

    function Animation(currentTime: number) {
      const time = currentTime / 1000
      
      if (lastTime === 0) {
        lastTime = time
      }
      
      const deltaTime = time - lastTime
      lastTime = time

      world.step(fixedTimeStep, deltaTime, maxSubSteps)

      balls.forEach(ball => ball.update())

      renderer.render(scene, camera)
    }

    renderer.setAnimationLoop(Animation)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.body.style.cursor = 'default'
      renderer.dispose()
      if (refContainer.current?.contains(renderer.domElement)) {
        refContainer.current.removeChild(renderer.domElement)
      }
      if (cueControllerRef.current) {
        cueController.disable()
      }
    }
  }, [])

  return (
    <section className='masterContainer'>
      <header className='headerContainer'>
        <h1 className='mainTitle'>Billard Game</h1>
      </header>
      {/* <button 
      className='testButton'>
        <h2 className='mainTitle'>Test Button</h2>
      </button> */}
      <main className='canvasContainer'>
        <div ref={refContainer}/>
      </main>
    </section>
  )
}

export default App