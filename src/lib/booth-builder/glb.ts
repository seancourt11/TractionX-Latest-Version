import * as THREE from "three";

/**
 * Normalise an uploaded GLB to the builder's conventions: metres, footprint
 * centred on the origin, floor at y = 0. Source files arrive in mixed units
 * (millimetres or metres) with offset origins, so units are detected from the
 * bounding box: anything implausibly large for a booth piece is treated as
 * millimetres.
 */
export function normalizeGlb(scene: THREE.Object3D, unitScale = 1): THREE.Object3D {
  const root = scene.clone(true);
  const wrapper = new THREE.Group();
  wrapper.add(root);
  wrapper.scale.setScalar(unitScale);
  wrapper.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(wrapper,true);
  const center = scaled.getCenter(new THREE.Vector3());
  wrapper.position.set(-center.x, -scaled.min.y, -center.z);
  return wrapper;
}

/** World-space size of a normalised model, in millimetres. */
export function normalizedSizeMm(scene: THREE.Object3D): { widthMm: number; depthMm: number; heightMm: number } {
  const size = new THREE.Box3().setFromObject(scene,true).getSize(new THREE.Vector3());
  return { widthMm: size.x * 1000, depthMm: size.z * 1000, heightMm: size.y * 1000 };
}
