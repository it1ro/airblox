export interface LevelDefinition {
  name: string;

  cloudCount: number;
  islandCount: number;

  oceanColor: number;
  islandColor: number;

  islandSizeMin: number;
  islandSizeMax: number;

  cloudHeightMin: number;
  cloudHeightMax: number;

  worldSize: number;
}
