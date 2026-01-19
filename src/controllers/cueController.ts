// src/controllers/cueController.ts
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { createArrowController } from '../utils/arrowController'

interface BallData {
  mesh: THREE.Mesh
  body: CANNON.Body
  setHighlight: (highlighted: boolean) => void
}

interface CueControllerConfig {
  camera: THREE.Camera
  scene: THREE.Scene
  balls: BallData[]
  hitPower?: number
  cueBallName?: string
}

export function createCueController(config: CueControllerConfig) {
  const {
    camera,
    scene,
    balls,
    hitPower = 10,
    cueBallName = 'White'
  } = config

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -4.5)
  let selectionMode = false
  const arrowLength = 2

  const arrow = createArrowController(arrowLength)
  scene.add(arrow.group)

  const getCueBall = (): BallData | undefined => {
    return balls.find(ball => ball.mesh.name === cueBallName)
  }

  const updateMouse = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  const getBallUnderMouse = (): BallData | null => {
    raycaster.setFromCamera(mouse, camera)
    
    const meshes = balls.map(b => b.mesh)
    const intersects = raycaster.intersectObjects(meshes)
    
    if (intersects.length === 0) return null

    const hitMesh = intersects[0].object
    return balls.find(b => b.mesh === hitMesh) || null
  }

    const getMouseOnTable = (): THREE.Vector3 | null => {
    raycaster.setFromCamera(mouse, camera)
    const point = new THREE.Vector3()
    const hit = raycaster.ray.intersectPlane(tablePlane, point)
    return hit ? point : null
  }

  const calculateHitDirection = (
    ballCenter: THREE.Vector3,
    hitPoint: THREE.Vector3
  ): THREE.Vector3 => {

    const direction = new THREE.Vector3()
      .subVectors(ballCenter, hitPoint) 
      .setY(0)
      .normalize()

    return direction
  }

  const onMouseMove = (event: MouseEvent) => {
    updateMouse(event)

    if (!selectionMode) return

    const cueBall = getCueBall()
    if (!cueBall) return

    const mouseOnTable = getMouseOnTable()
    if (!mouseOnTable) return

    const intersects = raycaster.intersectObject(cueBall.mesh)
    if (intersects.length === 0) return

    const ballCenter = new THREE.Vector3().copy(cueBall.body.position)
    const hitPoint = intersects[0].point
    const direction = calculateHitDirection(ballCenter, hitPoint)
    
    arrow.update(ballCenter, direction)
  }

  // Handler: Click para dar tacada
  const onMouseClick = (event: MouseEvent) => {
    updateMouse(event)
    raycaster.setFromCamera(mouse, camera)

    const cueBall = getCueBall()
    if (!cueBall) return

    const intersects = raycaster.intersectObject(cueBall.mesh)
    if (intersects.length === 0) return
    if (!selectionMode) {
        selectionMode = true
        arrow.show()
        console.log("Habilitou Seleção")
    } else if (selectionMode){
        const hitPoint = intersects[0].point
        const ballCenter = new THREE.Vector3().copy(cueBall.body.position)
        const direction = calculateHitDirection(ballCenter, hitPoint)
    
        cueBall.body.velocity.set(
          direction.x * hitPower,
          0,
          direction.z * hitPower
        )
        selectionMode = false
        arrow.hide()
        console.log("Desfez Seleção")
    }
  }

  const onRightClick = (event: MouseEvent) => {
    event.preventDefault()
    if (selectionMode) {
      selectionMode = false
      arrow.hide()
    }
  }

  // Registra os event listeners
  const enable = () => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('click', onMouseClick)
    window.addEventListener('contextmenu', onRightClick)
  }

  // Remove os event listeners
  const disable = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('click', onMouseClick)
    window.removeEventListener('contextmenu', onRightClick)
    arrow.hide()
  }

  return {
    enable,
    disable,
    getBallUnderMouse,
    calculateHitDirection
  }
}