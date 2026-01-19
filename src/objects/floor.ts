import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import FloorImg from "../assets/images/Dark Wood Floor.webp"
import { textureLoader } from '../textureLoader'

const geo = new THREE.PlaneGeometry(50, 50)
const mat = new THREE.MeshStandardMaterial({
    map: textureLoader.load(FloorImg),
    side: THREE.DoubleSide
})

export const Floor = new THREE.Mesh(geo, mat)
Floor.rotation.x = -0.5 * Math.PI
Floor.receiveShadow = true

export const GroundBody = new CANNON.Body({
    shape: new CANNON.Box(new CANNON.Vec3(25, 25, 0.1)),
    type: CANNON.Body.STATIC
})
GroundBody.quaternion.setFromEuler(-0.5 * Math.PI, 0, 0)