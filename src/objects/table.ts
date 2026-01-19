import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'

interface TableWithPhysics {
  mesh: THREE.Group | null
  body: CANNON.Body
  loaded: Promise<THREE.Group>
}

export const tableMaterial = new CANNON.Material('table')

export function createPoolTable(
  assetLoader: GLTFLoader,
  tableURL: URL,
  scale = 7,
  position = { x: 0, y: 0, z: 0 }
): TableWithPhysics {

  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    material: tableMaterial 
  })

  // Dimensões reais do modelo (do console.log)
  // Tamanho: x: 18.54, y: 5.65, z: 10.78
  // Centro: x: 0.07, y: 2.80, z: -0.01
  
  const tableWidth = 18.54      // eixo X (largura total)
  const tableDepth = 10.78      // eixo Z (profundidade total)
  
  // Altura da superfície de jogo (centro Y ~2.8, então a superfície está por volta de Y = 3.7)
  const surfaceY = 4.7
  const surfaceThickness = 1
  
  // Área de jogo (um pouco menor que a mesa total por causa das bordas)
  const playAreaWidth = tableWidth - 2.5   // ~16
  const playAreaDepth = tableDepth - 2.5   // ~8.3

  const railHeight = 0.8
  const railThickness = 1.2

  // 1. Superfície de jogo (onde as bolas rolam)
  const surfaceShape = new CANNON.Box(new CANNON.Vec3(
    playAreaWidth / 2,
    surfaceThickness / 2,
    playAreaDepth / 2
  ))
  body.addShape(
    surfaceShape,
    new CANNON.Vec3(0, surfaceY, 0)
  )

  // 2. Bordas (rails) - 4 lados
  // Borda frontal (Z+)
  const railLongShape = new CANNON.Box(new CANNON.Vec3(
    playAreaWidth / 2,
    railHeight / 2,
    railThickness / 2
  ))
  body.addShape(
    railLongShape,
    new CANNON.Vec3(0, surfaceY + surfaceThickness / 2 + railHeight / 2, playAreaDepth / 2 + railThickness / 2)
  )
  
  // Borda traseira (Z-)
  body.addShape(
    railLongShape,
    new CANNON.Vec3(0, surfaceY + surfaceThickness / 2 + railHeight / 2, -playAreaDepth / 2 - railThickness / 2)
  )

  // Borda esquerda (X-)
  const railShortShape = new CANNON.Box(new CANNON.Vec3(
    railThickness / 2,
    railHeight / 2,
    playAreaDepth / 2 + railThickness
  ))
  body.addShape(
    railShortShape,
    new CANNON.Vec3(-playAreaWidth / 2 - railThickness / 2, surfaceY + surfaceThickness / 2 + railHeight / 2, 0)
  )
  
  // Borda direita (X+)
  body.addShape(
    railShortShape,
    new CANNON.Vec3(playAreaWidth / 2 + railThickness / 2, surfaceY + surfaceThickness / 2 + railHeight / 2, 0)
  )

  let mesh: THREE.Group | null = null

  const loaded = new Promise<THREE.Group>((resolve, reject) => {
    assetLoader.load(
      tableURL.href,
      (glb) => {
        mesh = glb.scene
        mesh.scale.setScalar(scale)
        mesh.position.set(position.x, position.y, position.z)

        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        resolve(mesh)
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar mesa:', error)
        reject(error)
      }
    )
  })

  return { mesh, body, loaded }
}