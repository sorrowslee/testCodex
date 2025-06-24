export interface GameAssetConfig {
  symbolCount: number;
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
  symbol: (index: number) => string;
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
  /** Width of each block (symbol) in pixels */
  blockWidth: number;
  /** Height of each block (symbol) in pixels */
  blockHeight: number;
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
}

function createGameConfig(
  name: string,
  symbolCount: number,
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
  alpszm: createGameConfig('alpszm', 13, undefined, false),
  lobby: {
    bg: 'assets/lobby/lobby_bg.png',
    backBtn: 'assets/lobby/backBtn.png',
    bjxb: 'assets/lobby/lobby_icons/bjxb.png',
    ffp: 'assets/lobby/lobby_icons/ffp.png',
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
  blockWidth: 128,
  blockHeight: 128,
  mapShip: false,
  singleBackground: false
};

export const BjxbGameSettings: GameRuleSettings = {
  ...DefaultGameSettings,
  singleBackground: true
};

export const FfpGameSettings: GameRuleSettings = {
  ...DefaultGameSettings,
  cols: 5,
  rows: 5,
  blockWidth: 128,
  blockHeight: 90,
  mapShip: true,
  singleBackground: true
};

export const AlpszmGameSettings: GameRuleSettings = {
  ...DefaultGameSettings,
  cols: 5,
  rows: 3,
  blockWidth: 120,
  blockHeight: 140,
  mapShip: true,
  singleBackground: false
};
