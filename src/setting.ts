export interface GameAssetConfig {
  symbolCount?: number;
  customSymbols?: string[];
  // animation type to frame count
  animations?: Record<string, number>;
  bg: string;
  /** Background pieces when singleBackground is false */
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  /** Optional border image path */
  border?: string;
  lines: { joint: string; body: string };
  symbol?: (index: number) => string;
  animationFrame: (type: string, index: number) => string;
}

export interface GameRuleSettings {
  /** Allowed line directions for scoring */
  lineDirections: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
  };
  /** Minimum number of consecutive symbols to score */
  minMatch: number;
  /** Score gained per matched symbol */
  scorePerBlock: number;
  /** Score multiple required to trigger Hot Spin */
  hotSpinThresholdMultiple: number;
  /** Number of symbol types during Hot Spin */
  hotSpinSymbolTypeCount: number;
  /** Number of columns (reels) */
  cols: number;
  /** Number of rows per reel */
  rows: number;
  /** Horizontal spacing between columns in pixels */
  colSpacing: number;
  /** Vertical spacing between rows in pixels */
  rowSpacing: number;
  /** Scale factor for each block */
  blockScale: number;
  /** Enable map ship feature */
  mapShip: boolean;
  /** Use a single background image instead of top/mid/bottom pieces */
  singleBackground: boolean;
  /** Custom reel container X position */
  reelX?: number;
  /** Custom reel container Y position */
  reelY?: number;
  /** Custom reel container width */
  reelWidth?: number;
  /** Custom reel container height */
  reelHeight?: number;
  /** Use predefined plate for testing */
  testPlateOpen?: boolean;
  /** Predefined symbols organized by rows */
  testPlate?: string[][];
}

function createGameConfig(
  name: string,
  symbolCount: number = 0,
  animations?: Record<string, number>,
  hasBorder: boolean = false
): GameAssetConfig {
  const config: GameAssetConfig = {
    symbolCount,
    animations,
    bg: `assets/${name}/bg/${name}_bg.png`,
    bgTop: `assets/${name}/bg/${name}_bg_top.jpg`,
    bgMid: `assets/${name}/bg/${name}_bg_mid.png`,
    bgBottom: `assets/${name}/bg/${name}_bg_bottom.jpg`,
    lines: {
      joint: `assets/${name}/lines/${name}_line_joint.png`,
      body: `assets/${name}/lines/${name}_line_body.png`
    },
    symbol: (index: number) => {
      const num = String(index).padStart(3, '0');
      return `assets/${name}/symbols/${name}_${num}.png`;
    },
    animationFrame: (type: string, index: number) => {
      const num = String(index).padStart(3, '0');
      return `assets/${name}/animation/${type}/${name}_${type}_${num}.png`;
    }
  };

  if (hasBorder) {
    config.border = `assets/${name}/symbols/${name}_border.png`;
  }

  return config;
}

export const AssetPaths = {
  bjxb: createGameConfig('bjxb', 10, { hunter: 51 }, true),
  ffp: createGameConfig('ffp', 6, undefined, false),
  alpszm: createGameConfig('alpszm', 0, undefined, false),
  lobby: {
    bg: 'assets/lobby/lobby_bg.png',
    alpszm: 'assets/lobby/lobby_icons/alpszm.png'
  }
} as const;

export const DefaultGameSettings: GameRuleSettings = {
  lineDirections: { horizontal: true, vertical: true, diagonal: true },
  minMatch: 3,
  scorePerBlock: 10,
  hotSpinThresholdMultiple: 100,
  hotSpinSymbolTypeCount: 3,
  cols: 7,
  rows: 5,
  colSpacing: 0,
  rowSpacing: 0,
  blockScale: 1,
  mapShip: false,
  singleBackground: false,
  testPlateOpen: false,
  testPlate: []
};


export const AlpszmGameSettings: GameRuleSettings = {
  ...DefaultGameSettings,
  cols: 5,
  rows: 3,
  mapShip: true,
  singleBackground: false,
  colSpacing: -15,
  rowSpacing: 32,
  blockScale: 1.2,
  reelY: 236,
  testPlateOpen: false,
  testPlate: []
};
