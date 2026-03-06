/**
 * Воксельная форма самолёта в стиле Ил-2: «горбатый» силуэт (приподнятая кабина),
 * округлый нос (мотор), низкоплан, выраженное хвостовое оперение.
 * Ось Z — вперёд (нос), iz=0 — хвост, iz=dimZ-1 — нос.
 */

export const VOXEL_GRID = {
  dimX: 32,
  dimY: 18,
  dimZ: 36,
  voxelSize: 0.17,
} as const;

export type VoxelType = "fuselage" | "canopy" | "wing" | "tail";

const { dimX, dimY, dimZ } = VOXEL_GRID;
const cx = dimX / 2;
const cy = dimY / 2;
const cz = dimZ / 2;

/** Нормализованная координата по длине: 0 = хвост, 1 = нос */
function noseFrac(iz: number): number {
  return iz / (dimZ - 1);
}

/** «Горб» кабины по длине: подъём центра фюзеляжа в зоне козырька (как у Ил-2) */
function fuselageCenterY(iz: number): number {
  const f = noseFrac(iz);
  const peak = 0.55;
  const width = 0.25;
  const hump = Math.exp(-((f - peak) ** 2) / (2 * width * width));
  return cy + 2.2 * hump;
}

/** Радиусы фюзеляжа по Z: округлый нос (мотор), расширение к кабине, сужение к хвосту */
function fuselageRadii(iz: number): { rx: number; ry: number } {
  const tailEnd = 4;
  const noseStart = dimZ - 4;
  if (iz < tailEnd || iz > noseStart) return { rx: 0, ry: 0 };
  const f = noseFrac(iz);
  const t = (iz - tailEnd) / (noseStart - tailEnd);
  const ramp = Math.sin(t * Math.PI);
  const rx = 1.2 + 3.2 * ramp;
  const ry = 1 + 2.4 * ramp;
  return { rx, ry };
}

/** Принадлежит ли точка эллипсу в сечении X/Y (центр по Y может подниматься — «горб») */
function inFuselageSection(ix: number, iy: number, iz: number): boolean {
  const { rx, ry } = fuselageRadii(iz);
  if (rx <= 0 || ry <= 0) return false;
  const cyFus = fuselageCenterY(iz);
  const dx = (ix - cx) / rx;
  const dy = (iy - cyFus) / ry;
  return dx * dx + dy * dy <= 1;
}

/** Кабина-козырёк Ил-2: приподнятый объём над «горбом» фюзеляжа */
function inCanopy(ix: number, iy: number, iz: number): boolean {
  if (iy < cy + 1) return false;
  const czCanopy = 20;
  const cyCanopy = cy + 5;
  const dx = (ix - cx) / 2.8;
  const dy = (iy - cyCanopy) / 2.2;
  const dz = (iz - czCanopy) / 3.5;
  return dx * dx + dy * dy + dz * dz <= 1;
}

/** Низкоплан: крыло под фюзеляжем, трапеция в плане (сужение к законцовкам) */
function inWing(ix: number, iy: number, iz: number): boolean {
  const izRoot = 18;
  const izStart = 10;
  const izEnd = 26;
  if (iz < izStart || iz > izEnd) return false;
  if (iy < 2 || iy > cy - 1) return false;
  const halfSpan = 13 - 3 * Math.abs(iz - izRoot);
  if (halfSpan <= 0) return false;
  return Math.abs(ix - cx) <= halfSpan;
}

/** Хвостовое оперение: стабилизатор + киль */
function inTail(ix: number, iy: number, iz: number): boolean {
  if (iz > 7) return false;
  const halfSpanStab = 6;
  const iyStabLo = cy - 1;
  const iyStabHi = cy + 1;
  if (iy >= iyStabLo && iy <= iyStabHi && Math.abs(ix - cx) <= halfSpanStab) {
    return true;
  }
  const ixFinLo = cx - 1;
  const ixFinHi = cx + 1;
  if (ix >= ixFinLo && ix <= ixFinHi && iy >= cy && iz <= 6) {
    return true;
  }
  return false;
}

export function getVoxelType(
  ix: number,
  iy: number,
  iz: number
): VoxelType | null {
  if (ix < 0 || ix >= dimX || iy < 0 || iy >= dimY || iz < 0 || iz >= dimZ) {
    return null;
  }
  if (inCanopy(ix, iy, iz)) return "canopy";
  if (inWing(ix, iy, iz)) return "wing";
  if (inTail(ix, iy, iz)) return "tail";
  if (inFuselageSection(ix, iy, iz)) return "fuselage";
  return null;
}

export interface Voxel {
  ix: number;
  iy: number;
  iz: number;
  type: VoxelType;
}

/** Обход сетки и сбор всех занятых вокселей */
export function collectVoxels(): Voxel[] {
  const out: Voxel[] = [];
  for (let iz = 0; iz < dimZ; iz++) {
    for (let iy = 0; iy < dimY; iy++) {
      for (let ix = 0; ix < dimX; ix++) {
        const type = getVoxelType(ix, iy, iz);
        if (type !== null) {
          out.push({ ix, iy, iz, type });
        }
      }
    }
  }
  return out;
}
