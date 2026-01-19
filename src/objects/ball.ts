import * as THREE from 'three'
import * as CANNON from 'cannon-es'

interface BallWithPhysics {
  mesh: THREE.Mesh
  body: CANNON.Body
  outline: THREE.Mesh  // Novo: mesh de outline
  update: () => void
  setHighlight: (highlighted: boolean) => void  // Novo: função para destacar
}

interface BallConfig {
  radius?: number
  position?: { x: number; y: number; z: number }
  mass?: number
  color?: number | string
  ballName?: string
}

export const ballMaterial = new CANNON.Material('ball')

function addJitter(value: number, amount: number = 0.01): number {
  return value + (Math.random() - 0.5) * amount
}

export function createBall(config: BallConfig = {}): BallWithPhysics {

  const {
    radius = 0.3,
    position = { x: 0, y: 5, z: 0 },
    mass = 1,
    color = 0xffffff,
    ballName = 'teste'
  } = config

  const jitteredPosition = {
    x: addJitter(position.x),
    y: position.y,
    z: addJitter(position.z)
  }

  // Object
  const geometry = new THREE.SphereGeometry(radius, 32, 32)
  const material = new THREE.MeshStandardMaterial({ color })
  const mesh = new THREE.Mesh(geometry, material)
  
  mesh.position.set(jitteredPosition.x, jitteredPosition.y, jitteredPosition.z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.name = ballName

  // Outline mesh (ligeiramente maior, só mostra as bordas)
  const outlineGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32)
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.BackSide, 
  })
  const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
  outline.visible = false
  outline.name = ballName + ' Outline'
  
  mesh.add(outline)

  // Physics
  const body = new CANNON.Body({
    mass,
    shape: new CANNON.Sphere(radius),
    position: new CANNON.Vec3(jitteredPosition.x, jitteredPosition.y, jitteredPosition.z),
    linearDamping: 0.3,
    angularDamping: 0.3,
    material: ballMaterial
  })

  const update = () => {
    mesh.position.copy(body.position)
    mesh.quaternion.copy(body.quaternion)
  }

  const setHighlight = (highlighted: boolean) => {
    outline.visible = highlighted
  }

  return { mesh, body, outline, update, setHighlight }
}