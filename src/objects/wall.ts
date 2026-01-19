import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { textureLoader } from '../textureLoader'
import WallImg from "../assets/images/Wall.webp"

// Interface para o retorno da função
interface WallWithPhysics {
  mesh: THREE.Mesh
  body: CANNON.Body
}

// Função que cria parede com física
export function createWall(
  width = 50, 
  height = 25, 
  depth = 0.5,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 }
): WallWithPhysics {
  
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({ 
    map: textureLoader.load(WallImg),
    side: THREE.DoubleSide 
  })
  const mesh = new THREE.Mesh(geometry, material)
  
  mesh.position.set(position.x, position.y, position.z)
  mesh.rotation.set(rotation.x, rotation.y, rotation.z)
  mesh.receiveShadow = true

  // Physics
  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2))
  })
  
  body.position.set(position.x, position.y, position.z)
  const quaternion = new THREE.Quaternion()
  quaternion.setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z))
  body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w)

  return { mesh, body }
}