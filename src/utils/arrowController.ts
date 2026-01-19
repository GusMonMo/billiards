// src/controllers/arrowController.ts
import * as THREE from 'three'

interface ArrowController {
  group: THREE.Group
  update: (origin: THREE.Vector3, direction: THREE.Vector3) => void
  show: () => void
  hide: () => void
}

export function createArrowController(length: number = 2): ArrowController {
  const group = new THREE.Group()
  
  // Linha da seta
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff00,
    linewidth: 2 
  })
  
  const lineGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(6)
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  const line = new THREE.Line(lineGeometry, lineMaterial)
  group.add(line)
  
  // Ponta da seta (cone)
  const coneGeometry = new THREE.ConeGeometry(0.1, 0.3, 8)
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const cone = new THREE.Mesh(coneGeometry, coneMaterial)
  group.add(cone)
  
  group.visible = false
  
  const update = (origin: THREE.Vector3, direction: THREE.Vector3) => {

    const end = new THREE.Vector3(
      origin.x + direction.x * length,
      origin.y,
      origin.z + direction.z * length
    )
    
    const pos = line.geometry.attributes.position.array as Float32Array
    pos[0] = origin.x
    pos[1] = origin.y
    pos[2] = origin.z
    pos[3] = end.x
    pos[4] = end.y
    pos[5] = end.z
    line.geometry.attributes.position.needsUpdate = true
    
    cone.position.copy(end)
    const angle = Math.atan2(direction.x, direction.z)
    cone.rotation.set(Math.PI / 2, 0, -angle)
  }
  
  const show = () => { group.visible = true }
  const hide = () => { group.visible = false }
  
  return { group, update, show, hide }
}