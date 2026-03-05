import * as THREE from "three";

/** UserData самолёта: ссылка на группу пропеллера для анимации */
export interface AirplaneUserData {
  propeller?: THREE.Group;
}

/** UserData облака: маркер для фильтрации в сцене */
export interface CloudUserData {
  cloud: boolean;
}

/** UserData острова: маркер для идентификации в сцене */
export interface IslandUserData {
  island: boolean;
}

/** Запись в логе отладки */
export interface DebugLogEntry {
  time: number;
  type: string;
  event: string;
  [key: string]: unknown;
}

/** Минимальный интерфейс камеры для доступа к position и quaternion */
export interface CameraLike {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}
