import * as THREE from "three";

/** UserData самолёта (для будущих расширений) */
export interface AirplaneUserData {}

/** UserData облака: маркер для фильтрации в сцене */
export interface CloudUserData {
  cloud: boolean;
}

/** UserData острова: маркер для идентификации в сцене */
export interface IslandUserData {
  island: boolean;
}

/** Минимальный интерфейс камеры для доступа к position и quaternion */
export interface CameraLike {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}
