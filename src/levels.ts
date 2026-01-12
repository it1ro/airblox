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


export const LEVELS: LevelDefinition[] = [
  {
    name: "Tropical Isles",
    cloudCount: 40,
    islandCount: 12,
    oceanColor: 0x3366aa,
    islandColor: 0x55aa55,
    islandSizeMin: 20,
    islandSizeMax: 40,
    cloudHeightMin: 5,
    cloudHeightMax: 15,
    worldSize: 500
  },

  {
    name: "Arctic Floes",
    cloudCount: 20,
    islandCount: 8,
    oceanColor: 0xaadfff,
    islandColor: 0xffffff,
    islandSizeMin: 10,
    islandSizeMax: 30,
    cloudHeightMin: 2,
    cloudHeightMax: 8,
    worldSize: 400
  },

  {
    name: "Volcanic Zone",
    cloudCount: 10,
    islandCount: 15,
    oceanColor: 0x330000,
    islandColor: 0x552222,
    islandSizeMin: 30,
    islandSizeMax: 60,
    cloudHeightMin: 10,
    cloudHeightMax: 25,
    worldSize: 600
  }
];
