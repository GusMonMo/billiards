import * as THREE from 'three'

interface DirectionArrow {
  group: THREE.Group
  update: (origin: THREE.Vector3, direction: THREE.Vector3, length: number) => void
  show: () => void
  hide: () => void
  isVisible: () => boolean
}

export function createDirectionArrow(): DirectionArrow {
  const group = new THREE.Group()
  
  // Linha da seta
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff00,
    linewidth: 2 
  })
  
  // Geometria inicial (será atualizada)
  const lineGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(6) // 2 pontos * 3 coordenadas
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  const line = new THREE.Line(lineGeometry, lineMaterial)
  group.add(line)
  
  // Ponta da seta (cone)
  const coneGeometry = new THREE.ConeGeometry(0.15, 0.4, 8)
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const cone = new THREE.Mesh(coneGeometry, coneMaterial)
  group.add(cone)
  
  // Começa invisível
  group.visible = false
  
  const update = (origin: THREE.Vector3, direction: THREE.Vector3, length: number) => {
    // Normaliza a direção
    const dir = direction.clone().normalize()
    
    // Calcula o ponto final
    const end = origin.clone().add(dir.clone().multiplyScalar(length))
    
    // Atualiza a linha
    const positions = line.geometry.attributes.position.array as Float32Array
    positions[0] = origin.x
    positions[1] = origin.y
    positions[2] = origin.z
    positions[3] = end.x
    positions[4] = end.y
    positions[5] = end.z
    line.geometry.attributes.position.needsUpdate = true
    
    // Posiciona o cone na ponta
    cone.position.copy(end)
    
    // Rotaciona o cone para apontar na direção correta
    const quaternion = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    quaternion.setFromUnitVectors(up, dir)
    cone.setRotationFromQuaternion(quaternion)
  }
  
  const show = () => {
    group.visible = true
    console.log("Habilitou arrow")
  }
  
  const hide = () => {
    group.visible = false
  }
  
  const isVisible = () => group.visible
  
  return { group, update, show, hide, isVisible }
}