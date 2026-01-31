export interface WallConfig {
  type: 'none' | 'boundary' | 'parallel' | 'obstacle'
  enabled: boolean
  vertical?: VerticalWall[]
  horizontal?: HorizontalWall[]
  obstacles?: Obstacle[]
  spawnPosition?: Position
}

export interface VerticalWall {
  x: number
  yStart: number
  yEnd: number
}

export interface HorizontalWall {
  y: number
  xStart: number
  xEnd: number
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
}

export interface Level {
  id: string
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  gridWidth: number
  gridHeight: number
  walls: WallConfig
  foodCount: number
  powerUps: boolean
  gameMode: 'classic' | 'pvp' | 'battle-royale' | 'cooperative'
}

export const LEVELS: Level[] = [
  // Classic levels
  {
    id: 'classic-1',
    name: 'Open World',
    description: 'No boundaries - infinite play space',
    difficulty: 'easy',
    gridWidth: 20,
    gridHeight: 20,
    walls: { type: 'none', enabled: false, spawnPosition: { x: 10, y: 10 } },
    foodCount: 1,
    powerUps: true,
    gameMode: 'classic'
  },
  {
    id: 'classic-2',
    name: 'Box Arena',
    description: 'Standard boundary walls',
    difficulty: 'easy',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'boundary',
      enabled: true,
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 1,
    powerUps: true,
    gameMode: 'classic'
  },
  {
    id: 'classic-3',
    name: 'Corridor',
    description: 'Narrow passages with gaps',
    difficulty: 'medium',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'none',
      enabled: true,
      obstacles: [
        // Vertical walls with gaps - creating 3 lanes with openings
        { x: 6, y: 0, width: 1, height: 8 },
        { x: 6, y: 12, width: 1, height: 8 },
        { x: 13, y: 0, width: 1, height: 8 },
        { x: 13, y: 12, width: 1, height: 8 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 2,
    powerUps: true,
    gameMode: 'classic'
  },
  {
    id: 'classic-4',
    name: 'Crossroads',
    description: 'Intersection with gaps for shortcuts',
    difficulty: 'medium',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'obstacle',
      enabled: true,
      obstacles: [
        { x: 5, y: 5, width: 2, height: 10 },
        { x: 13, y: 5, width: 2, height: 10 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 3,
    powerUps: true,
    gameMode: 'classic'
  },
  {
    id: 'classic-5',
    name: 'Maze',
    description: 'Complex maze with tight corners',
    difficulty: 'hard',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'none',
      enabled: true,
      obstacles: [
        // Outer boundary walls
        { x: 0, y: 0, width: 20, height: 1 },
        { x: 0, y: 19, width: 20, height: 1 },
        { x: 0, y: 0, width: 1, height: 20 },
        { x: 19, y: 0, width: 1, height: 20 },
        // Inner maze structure - creating corridors
        { x: 2, y: 2, width: 6, height: 1 },
        { x: 12, y: 2, width: 6, height: 1 },
        { x: 2, y: 17, width: 6, height: 1 },
        { x: 12, y: 17, width: 6, height: 1 },
        { x: 2, y: 2, width: 1, height: 6 },
        { x: 17, y: 2, width: 1, height: 6 },
        { x: 2, y: 12, width: 1, height: 7 },
        { x: 17, y: 12, width: 1, height: 7 },
        // Inner walls
        { x: 5, y: 5, width: 1, height: 3 },
        { x: 14, y: 5, width: 1, height: 3 },
        { x: 5, y: 12, width: 1, height: 3 },
        { x: 14, y: 12, width: 1, height: 3 },
        { x: 8, y: 5, width: 4, height: 1 },
        { x: 8, y: 14, width: 4, height: 1 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 1,
    powerUps: true,
    gameMode: 'classic'
  },
  {
    id: 'classic-6',
    name: 'Spiral',
    description: 'Walls form a spiral pattern',
    difficulty: 'expert',
    gridWidth: 25,
    gridHeight: 25,
    walls: {
      type: 'obstacle',
      enabled: true,
      obstacles: Array.from({ length: 10 }, (_, i) => {
        const x = 12 + Math.floor(Math.cos(i * Math.PI / 5) * 6)
        const y = 12 + Math.floor(Math.sin(i * Math.PI / 5) * 6)
        return { x, y, width: 3, height: 3 }
      }),
      spawnPosition: { x: 12, y: 12 }
    },
    foodCount: 2,
    powerUps: true,
    gameMode: 'classic'
  },

  // PvP Levels - Designed for 2-player competitive play
  {
    id: 'pvp-1',
    name: 'Duel Arena',
    description: 'Simple arena for head-to-head battles',
    difficulty: 'easy',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'boundary',
      enabled: true,
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 2,
    powerUps: true,
    gameMode: 'pvp'
  },
  {
    id: 'pvp-2',
    name: 'Split Arena',
    description: 'Divided arena with central passage',
    difficulty: 'medium',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'none',
      enabled: true,
      obstacles: [
        // Central dividing wall with gaps
        { x: 9, y: 0, width: 2, height: 7 },
        { x: 9, y: 13, width: 2, height: 7 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 3,
    powerUps: true,
    gameMode: 'pvp'
  },
  {
    id: 'pvp-3',
    name: 'Pillars Arena',
    description: 'Strategic pillars for tactical play',
    difficulty: 'medium',
    gridWidth: 22,
    gridHeight: 22,
    walls: {
      type: 'boundary',
      enabled: true,
      obstacles: [
        { x: 5, y: 5, width: 2, height: 2 },
        { x: 15, y: 5, width: 2, height: 2 },
        { x: 5, y: 15, width: 2, height: 2 },
        { x: 15, y: 15, width: 2, height: 2 }
      ],
      spawnPosition: { x: 11, y: 11 }
    },
    foodCount: 3,
    powerUps: true,
    gameMode: 'pvp'
  },
  {
    id: 'pvp-4',
    name: 'Symmetrical Maze',
    description: 'Perfectly balanced competitive maze',
    difficulty: 'hard',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'none',
      enabled: true,
      obstacles: [
        // Outer boundary
        { x: 0, y: 0, width: 20, height: 1 },
        { x: 0, y: 19, width: 20, height: 1 },
        { x: 0, y: 0, width: 1, height: 20 },
        { x: 19, y: 0, width: 1, height: 20 },
        // Symmetrical inner walls
        { x: 5, y: 5, width: 10, height: 1 },
        { x: 5, y: 14, width: 10, height: 1 },
        { x: 5, y: 5, width: 1, height: 4 },
        { x: 14, y: 5, width: 1, height: 4 },
        { x: 5, y: 10, width: 1, height: 5 },
        { x: 14, y: 10, width: 1, height: 5 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 2,
    powerUps: true,
    gameMode: 'pvp'
  },

  // Battle Royale Levels - Designed for 8-player free-for-all
  {
    id: 'br-1',
    name: 'Battle Grounds',
    description: 'Open arena for 8-player chaos',
    difficulty: 'easy',
    gridWidth: 25,
    gridHeight: 25,
    walls: {
      type: 'boundary',
      enabled: true,
      spawnPosition: { x: 12, y: 12 }
    },
    foodCount: 4,
    powerUps: true,
    gameMode: 'battle-royale'
  },
  {
    id: 'br-2',
    name: 'Obstacle Field',
    description: 'Dense obstacles create chaotic battles',
    difficulty: 'medium',
    gridWidth: 25,
    gridHeight: 25,
    walls: {
      type: 'obstacle',
      enabled: true,
      obstacles: [
        { x: 5, y: 5, width: 2, height: 2 },
        { x: 18, y: 5, width: 2, height: 2 },
        { x: 5, y: 18, width: 2, height: 2 },
        { x: 18, y: 18, width: 2, height: 2 },
        { x: 11, y: 11, width: 3, height: 3 }
      ],
      spawnPosition: { x: 12, y: 12 }
    },
    foodCount: 5,
    powerUps: true,
    gameMode: 'battle-royale'
  },
  {
    id: 'br-3',
    name: 'Survival Zone',
    description: 'Tight quarters for intense survival',
    difficulty: 'hard',
    gridWidth: 22,
    gridHeight: 22,
    walls: {
      type: 'boundary',
      enabled: true,
      obstacles: [
        // Ring structure
        { x: 3, y: 3, width: 16, height: 1 },
        { x: 3, y: 18, width: 16, height: 1 },
        { x: 3, y: 3, width: 1, height: 16 },
        { x: 18, y: 3, width: 1, height: 16 },
        // Cross in middle
        { x: 10, y: 6, width: 2, height: 10 }
      ],
      spawnPosition: { x: 11, y: 11 }
    },
    foodCount: 4,
    powerUps: true,
    gameMode: 'battle-royale'
  },

  // Cooperative Levels - Designed for team play
  {
    id: 'coop-1',
    name: 'Team Arena',
    description: 'Simple arena for cooperative play',
    difficulty: 'easy',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'boundary',
      enabled: true,
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 3,
    powerUps: true,
    gameMode: 'cooperative'
  },
  {
    id: 'coop-2',
    name: 'Parallel Paths',
    description: 'Side-by-side lanes for teamwork',
    difficulty: 'medium',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'none',
      enabled: true,
      obstacles: [
        // Two horizontal lanes with openings
        { x: 0, y: 9, width: 7, height: 1 },
        { x: 13, y: 9, width: 7, height: 1 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 3,
    powerUps: true,
    gameMode: 'cooperative'
  },
  {
    id: 'coop-3',
    name: 'Hub and Spoke',
    description: 'Central hub with radiating passages',
    difficulty: 'medium',
    gridWidth: 22,
    gridHeight: 22,
    walls: {
      type: 'boundary',
      enabled: true,
      obstacles: [
        // Central hub walls
        { x: 8, y: 8, width: 6, height: 6 }
      ],
      spawnPosition: { x: 11, y: 11 }
    },
    foodCount: 4,
    powerUps: true,
    gameMode: 'cooperative'
  },
  {
    id: 'coop-4',
    name: 'Team Maze',
    description: 'Complex maze requiring coordination',
    difficulty: 'hard',
    gridWidth: 20,
    gridHeight: 20,
    walls: {
      type: 'none',
      enabled: true,
      obstacles: [
        // Outer boundary
        { x: 0, y: 0, width: 20, height: 1 },
        { x: 0, y: 19, width: 20, height: 1 },
        { x: 0, y: 0, width: 1, height: 20 },
        { x: 19, y: 0, width: 1, height: 20 },
        // Maze walls
        { x: 3, y: 3, width: 14, height: 1 },
        { x: 3, y: 15, width: 14, height: 1 },
        { x: 3, y: 3, width: 1, height: 5 },
        { x: 16, y: 3, width: 1, height: 5 },
        { x: 3, y: 11, width: 1, height: 5 },
        { x: 16, y: 11, width: 1, height: 5 }
      ],
      spawnPosition: { x: 10, y: 10 }
    },
    foodCount: 3,
    powerUps: true,
    gameMode: 'cooperative'
  }
]
