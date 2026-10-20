import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type MergedDeck = {
  parts: { geometry: THREE.BufferGeometry; material: THREE.Material }[];
  center: THREE.Vector3;
  size: THREE.Vector3;
};
const cache = new Map<string, MergedDeck>();

/** The stair is baked into the deck GLBs; we draw our own movable stair instead. */
function isStairNode(node: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = node;
  while (current) {
    if (/^(stair|railing)/i.test(current.name)) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Bake world transforms once, retaining indices and shared source materials.
 * Stair nodes are excluded, so the cached geometry and centre describe the
 * open deck frame only.
 */
export function mergedDeck(visualKey: string, scene: THREE.Object3D): MergedDeck {
  const cached = cache.get(visualKey);
  if (cached) return cached;
  scene.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  scene.traverse((node) => {
    if (node instanceof THREE.Mesh && !isStairNode(node)) meshes.push(node);
  });
  const bounds = new THREE.Box3();
  for (const mesh of meshes) bounds.expandByObject(mesh,true);
  const center = bounds.getCenter(new THREE.Vector3());
  center.y = 0;
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const node of meshes) {
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const sourceGroups = node.geometry.groups.length ? node.geometry.groups : [{ start: 0, count: Infinity, materialIndex: 0 }];
    for (const group of sourceGroups) {
      const material = materials[group.materialIndex ?? 0];
      if (!material) continue;
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      geometry.translate(-center.x, 0, -center.z);
      // Keep only attributes used by these unskinned static deck materials.
      for (const key of Object.keys(geometry.attributes)) {
        if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
      }
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
      if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
      if (sourceGroups.length > 1 && geometry.index) {
        const end = Math.min(geometry.index.count, group.start + group.count);
        geometry.setIndex(Array.from(geometry.index.array.slice(group.start, end)));
      }
      geometry.clearGroups();
      const list = groups.get(material) ?? [];
      list.push(geometry);
      groups.set(material, list);
    }
  }
  const parts: MergedDeck['parts'] = [];
  groups.forEach((geometries, material) => {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!geometry) throw new Error(`Could not merge deck geometry: ${visualKey}`);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    parts.push({ geometry, material });
  });
  const result = { parts, center, size: bounds.getSize(new THREE.Vector3()) };
  cache.set(visualKey, result);
  return result;
}
