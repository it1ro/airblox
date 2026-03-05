import * as THREE from "three";

/**
 * Рекурсивно освобождает ресурсы Three.js у объекта и всех его потомков:
 * geometry, material(s), texture (map). Group и пустые Object3D не имеют
 * geometry/material — проверка через instanceof THREE.Mesh и наличие свойств.
 */
export function disposeObject(obj: THREE.Object3D): void {
  for (let i = obj.children.length - 1; i >= 0; i--) {
    disposeObject(obj.children[i]);
  }

  const mesh = obj as THREE.Mesh;
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }

  const mat = mesh.material;
  if (mat) {
    const materials = Array.isArray(mat) ? mat : [mat];
    for (const m of materials) {
      if (m.map) {
        m.map.dispose();
      }
      m.dispose();
    }
  }
}
