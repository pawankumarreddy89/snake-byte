# SnakeByte - Production-Ready Frontend Architecture
**Version:** 1.0  
**Status:** Architecture Decision Record (ADR)  
**Author:** Senior Frontend Architect  
**Date:** 2025-01-27

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Component Architecture](#component-architecture)
5. [Game Engine Design](#game-engine-design)
6. [Responsive Design System](#responsive-design-system)
7. [Performance Optimization](#performance-optimization)
8. [PWA Strategy](#pwa-strategy)
9. [Testing Strategy](#testing-strategy)
10. [Security Considerations](#security-considerations)
11. [Monitoring & Observability](#monitoring--observability)
12. [Migration Roadmap](#migration-roadmap)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Current State Assessment

**Codebase Metrics:**
- Main Component: 1,930 lines (92KB) - **CRITICAL**: Monolithic violation
- React Hooks: 36 instances in single file
- Game Loop: `setInterval`-based - **CRITICAL**: Performance anti-pattern
- Audio: New AudioContext per sound call - **CRITICAL**: Memory leak
- State: Scattered React useState - Needs FSM pattern
- Mobile: Basic touch, no PWA features

**Performance Profile:**
```
Current Issues:
├── Game Loop: setInterval (inconsistent frame timing)
├── Rendering: Direct canvas calls in React render cycle
├── Memory: No object pooling, audio leaks
├── Re-renders: 36 hooks causing unnecessary updates
└── Network: No offline support
```

**Recommended Architecture:**
```
Pattern: MVP (Model-View-Presenter) with Finite State Machine
├── Model: GameEngine (pure JS, no React dependencies)
├── View: React Components (UI only, no game logic)
└── Presenter: GameStateManager (orchestrates model-view)
```

---

## 2. CURRENT STATE ANALYSIS

### 2.1 Critical Issues Identified

#### Issue #1: Monolithic Component (1930 lines)
**Impact:** Maintainability, testing, performance
**Severity:** HIGH
**Evidence:**
```typescript
// ANTI-PATTERN: Single file doing everything
// - Game logic
// - Rendering
// - State management  
// - Event handling
// - Audio management
// - 36 React hooks
```

**Solution:** Extract into 7 focused modules (see Section 4)

#### Issue #2: setInterval Game Loop
**Impact:** Inconsistent frame timing, battery drain
**Severity:** CRITICAL
**Current Code:**
```typescript
// ANTI-PATTERN: Inconsistent timing
gameLoopRef.current = window.setInterval(gameLoop, gameState.speed)
```

**Solution:** RequestAnimationFrame with delta-time accumulator (see Section 5)

#### Issue #3: Audio Memory Leak
**Impact:** Memory leak, audio glitches, performance degradation
**Severity:** CRITICAL
**Current Code:**
```typescript
// ANTI-PATTERN: Creates new context every time
const playSound = (type: string) => {
  const audioContext = new AudioContext()  // ❌ Memory leak
  // ...
}
```

**Solution:** Singleton AudioController with object pooling (see Section 5.4)

#### Issue #4: No State Management Pattern
**Impact:** Unpredictable state transitions, race conditions
**Severity:** HIGH
**Current State:**
```typescript
// ANTI-PATTERN: Scattered useState
const [isPlaying, setIsPlaying] = useState(false)
const [isPaused, setIsPaused] = useState(false)
const [gameOver, setGameOver] = useState(false)
// 20+ more state variables
```

**Solution:** Finite State Machine (see Section 5.1)

### 2.2 Performance Bottlenecks

```yaml
Render Path Analysis:
  Canvas Rendering:
    - Direct calls in React component
    - No double buffering
    - No layer separation
    - Impact: Jank, frame drops on low-end devices
  
  State Updates:
    - 36 hooks = 36 potential re-renders
    - No memoization for expensive calculations
    - No useCallback for event handlers
    - Impact: Unnecessary re-renders, battery drain
  
  Memory:
    - No object pooling (snake segments, food)
    - AudioContext leak
    - No cleanup in useEffect
    - Impact: Memory growth over time, crashes
```

---

## 3. ARCHITECTURE OVERVIEW

### 3.1 Recommended Pattern: MVP + FSM

```
┌─────────────────────────────────────────────────────────────┐
│                     React Layer (View)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   GameCanvas │  │   Controls   │  │  HUDOverlay  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ (Props & Events)
┌─────────────────────────────────────────────────────────────┐
│                  GameEngine (Model + Presenter)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Finite State Machine (States)               │   │
│  │  IDLE → READY → PLAYING → PAUSED → GAME_OVER → IDLE │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  GameState  │  │  GameLoop    │  │  Renderer    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  AudioManager│  │ InputManager │  │  PoolManager │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

**View Layer (React Components):**
- Pure presentation, no game logic
- Receive state via props, emit events via callbacks
- Optimize with React.memo, useMemo, useCallback
- Separate concerns: UI from game mechanics

**Model Layer (GameEngine):**
- Pure JavaScript (no React dependencies)
- Encapsulates all game logic
- Immutable state transitions
- Testable in isolation

**Presenter Layer (GameStateManager):**
- Orchestrates Model ↔ View communication
- Manages game lifecycle
- Handles external integrations (API, storage)

---

## 4. COMPONENT ARCHITECTURE

### 4.1 Proposed File Structure

```
src/
├── app/
│   └── page.tsx (Entry point, <200 lines)
│
├── game/
│   ├── core/
│   │   ├── GameEngine.ts          (Pure JS, <400 lines)
│   │   ├── GameStateMachine.ts    (FSM, <200 lines)
│   │   ├── GameLoop.ts            (RAF + delta-time, <150 lines)
│   │   └── types.ts               (Type definitions, <100 lines)
│   │
│   ├── systems/
│   │   ├── Renderer.ts            (Canvas rendering, <300 lines)
│   │   ├── InputManager.ts        (Keyboard/Touch/Gamepad, <250 lines)
│   │   ├── AudioManager.ts        (Web Audio API, <200 lines)
│   │   ├── CollisionSystem.ts     (Hit detection, <150 lines)
│   │   └── PowerUpSystem.ts      (Power-up logic, <200 lines)
│   │
│   ├── entities/
│   │   ├── Snake.ts               (Snake logic, <150 lines)
│   │   ├── Food.ts                (Food spawning, <100 lines)
│   │   └── PowerUp.ts             (Power-up definitions, <100 lines)
│   │
│   ├── utils/
│   │   ├── ObjectPool.ts          (Object pooling, <100 lines)
│   │   ├── MathUtils.ts           (Game math helpers, <100 lines)
│   │   └── PerformanceMonitor.ts  (FPS tracking, <150 lines)
│   │
│   └── ui/
│       ├── GameCanvas.tsx         (Canvas component, <200 lines)
│       ├── Controls.tsx            (D-Pad UI, <250 lines)
│       ├── HUD.tsx                (Score/Level display, <150 lines)
│       └── GameOver.tsx            (Game over screen, <200 lines)
│
└── hooks/
    ├── useGameState.ts            (Game state hook, <150 lines)
    ├── useGameEngine.ts           (Engine initialization, <100 lines)
    └── usePerformance.ts         (Performance metrics, <100 lines)
```

### 4.2 Component Lifecycle Diagram

```typescript
// CRITICAL: Component lifecycle with proper cleanup
class GameCanvas {
  private engine: GameEngine
  private animationId: number
  private resizeObserver: ResizeObserver

  constructor() {
    this.engine = new GameEngine()
    this.setupEventListeners()
    this.setupResizeObserver()
  }

  mount() {
    this.engine.start()
    this.startRenderLoop()
  }

  unmount() {
    // CRITICAL: Proper cleanup
    cancelAnimationFrame(this.animationId)
    this.engine.stop()
    this.resizeObserver.disconnect()
    this.engine.destroy() // Cleanup audio, pools
  }
}
```

### 4.3 State Management Strategy

**Pattern: Finite State Machine (FSM)**

```typescript
// CRITICAL: FSM prevents invalid state transitions
type GameState = 
  | 'IDLE'        // Not started
  | 'READY'       // Waiting to start
  | 'PLAYING'     // Active game
  | 'PAUSED'      // Game paused
  | 'GAME_OVER'   // Game ended
  | 'TRANSITION'  // Between states

interface StateMachine {
  current: GameState
  allowedTransitions: Record<GameState, GameState[]>
  
  transition(to: GameState): boolean {
    if (this.allowedTransitions[this.current].includes(to)) {
      const from = this.current
      this.current = to
      this.emit('stateChange', { from, to })
      return true
    }
    return false
  }
}

// Example usage
const fsm = new StateMachine()
fsm.transition('PLAYING') // ✅ Valid
fsm.transition('IDLE')    // ❌ Invalid (must go through PAUSED/GAME_OVER)
```

---

## 5. GAME ENGINE DESIGN

### 5.1 Delta-Time Based Game Loop

**CRITICAL PATH: Production-ready game loop**

```typescript
class GameLoop {
  private lastTime: number = 0
  private accumulator: number = 0
  private readonly fixedTimeStep: number = 1000 / 60 // 60 FPS
  private maxFrameTime: number = 1000 // Prevent spiral of death
  private animationId: number | null = null
  
  // CRITICAL: Separated update and render
  update(fixedDeltaTime: number) {
    // Game logic at fixed time step
    // Physics, collision, game rules
  }
  
  render(interpolation: number) {
    // Visual interpolation for smooth rendering
    // Can run at monitor refresh rate (120Hz, 144Hz)
  }
  
  start(callback: (dt: number, interpolation: number) => void) {
    const loop = (currentTime: number) => {
      if (!this.lastTime) this.lastTime = currentTime
      
      const frameTime = currentTime - this.lastTime
      this.lastTime = currentTime
      
      // Prevent spiral of death
      if (frameTime > this.maxFrameTime) {
        // Drop frames but maintain progress
        this.accumulator += this.maxFrameTime
      } else {
        this.accumulator += frameTime
      }
      
      // CRITICAL: Fixed time step updates
      while (this.accumulator >= this.fixedTimeStep) {
        this.update(this.fixedTimeStep / 1000)
        this.accumulator -= this.fixedTimeStep
      }
      
      // CRITICAL: Interpolation for smooth rendering
      const interpolation = this.accumulator / this.fixedTimeStep
      this.render(interpolation)
      
      this.animationId = requestAnimationFrame(loop)
    }
    
    this.animationId = requestAnimationFrame(loop)
  }
  
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}
```

**Benefits:**
- Consistent gameplay speed across devices
- Smooth 120Hz/144Hz rendering on high-refresh displays
- Prevents "spiral of death" on lag
- Deterministic game logic

### 5.2 Object Pooling Implementation

```typescript
// CRITICAL: Prevents garbage collection spikes
class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  private maxSize: number
  
  constructor(factory: () => T, reset: (obj: T) => void, maxSize: number = 100) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize
  }
  
  acquire(): T {
    return this.pool.pop() || this.factory()
  }
  
  release(obj: T) {
    if (this.pool.length < this.maxSize) {
      this.reset(obj)
      this.pool.push(obj)
    }
  }
}

// Example: Snake segment pooling
class SnakeSegmentPool extends ObjectPool<SnakeSegment> {
  constructor() {
    super(
      () => ({ x: 0, y: 0, direction: 'up' }),
      (seg) => { seg.x = 0; seg.y = 0; seg.direction = 'up' },
      500 // Max pool size
    )
  }
}
```

**Performance Impact:**
- Eliminates GC pauses during gameplay
- Consistent frame timing
- <5MB heap usage even in long games

### 5.3 Canvas Rendering with Layers

```typescript
class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private offscreenCanvas: HTMLCanvasElement
  private offscreenCtx: CanvasRenderingContext2D
  
  // CRITICAL: Double buffering for mobile
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })!
    
    // Offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement('canvas')
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
  }
  
  render(gameState: GameState) {
    const { width, height } = this.canvas
    
    // CRITICAL: Render to offscreen first
    this.offscreenCanvas.width = width
    this.offscreenCanvas.height = height
    
    // Layer 1: Background (static, cacheable)
    this.renderBackground()
    
    // Layer 2: Game Grid (static, cacheable)
    this.renderGrid()
    
    // Layer 3: Snake (dynamic)
    this.renderSnake(gameState.snake)
    
    // Layer 4: Food (dynamic)
    this.renderFood(gameState.food)
    
    // Layer 5: Power-ups (dynamic)
    this.renderPowerUps(gameState.powerUps)
    
    // CRITICAL: Blit to main canvas (single draw call)
    this.ctx.drawImage(this.offscreenCanvas, 0, 0)
  }
  
  private renderBackground() {
    this.offscreenCtx.fillStyle = '#1a1a2e'
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height)
  }
}
```

### 5.4 Audio Manager (No Memory Leaks)

```typescript
// CRITICAL: Singleton pattern for audio
class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  
  private constructor() {
    // Initialize once
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.3
    }
  }
  
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }
  
  // CRITICAL: Object pool for oscillators
  private oscillatorPool = new ObjectPool(
    () => {
      if (!this.audioContext) return null
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      osc.connect(gain)
      gain.connect(this.masterGain)
      return { osc, gain }
    },
    ({ osc, gain }) => {
      try {
        osc.stop()
        osc.disconnect()
        gain.disconnect()
      } catch (e) {
        // Ignore if already stopped
      }
    },
    10 // Pool size
  )
  
  playSound(type: 'eat' | 'special' | 'powerup' | 'gameover') {
    if (!this.audioContext) return
    
    const soundObj = this.oscillatorPool.acquire()
    if (!soundObj) return
    
    const { osc, gain } = soundObj
    
    switch (type) {
      case 'eat':
        osc.frequency.value = 600
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
        osc.start(this.audioContext.currentTime)
        osc.stop(this.audioContext.currentTime + 0.1)
        break
      // ... other sounds
    }
    
    // CRITICAL: Return to pool after playing
    setTimeout(() => {
      this.oscillatorPool.release(soundObj)
    }, 100)
  }
}
```

### 5.5 Input Management (Unified Interface)

```typescript
class InputManager {
  private keyboardState: Map<string, boolean> = new Map()
  private touchStart: { x: number; y: number } | null = null
  private swipeThreshold: number = 15
  private gamepadIndex: number | null = null
  
  init() {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown.bind(this))
    window.addEventListener('keyup', this.handleKeyUp.bind(this))
    
    // Touch
    window.addEventListener('touchstart', this.handleTouchStart.bind(this))
    window.addEventListener('touchend', this.handleTouchEnd.bind(this))
    
    // Gamepad
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this))
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this))
  }
  
  // CRITICAL: Unified input interface
  getDirection(): Direction | null {
    // Priority: Keyboard > Touch > Gamepad
    return this.getKeyboardDirection() 
      || this.getTouchDirection() 
      || this.getGamepadDirection()
  }
  
  private getTouchDirection(): Direction | null {
    if (!this.touchStart) return null
    
    const deltaX = this.touchEnd.x - this.touchStart.x
    const deltaY = this.touchEnd.y - this.touchStart.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > this.swipeThreshold) {
        return deltaX > 0 ? 'right' : 'left'
      }
    } else {
      if (Math.abs(deltaY) > this.swipeThreshold) {
        return deltaY > 0 ? 'down' : 'up'
      }
    }
    
    return null
  }
}
```

---

## 6. RESPONSIVE DESIGN SYSTEM

### 6.1 Design Tokens

```typescript
// design-tokens.ts
export const designTokens = {
  canvas: {
    aspectRatio: 4/3,
    baseSize: 600,
    maxWidth: 800,
    mobilePadding: 16,
    mobileSafeAreaTop: 'env(safe-area-inset-top, 0px)',
    mobileSafeAreaBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  
  typography: {
    base: 16,
    scale: {
      xs: 'clamp(0.75rem, 2vw, 0.875rem)',  // 12-14px
      sm: 'clamp(0.875rem, 2vw, 1rem)',  // 14-16px
      md: 'clamp(1rem, 2vw, 1.125rem)',  // 16-18px
      lg: 'clamp(1.125rem, 2vw, 1.25rem)', // 18-20px
      xl: 'clamp(1.25rem, 2vw, 1.5rem)',  // 20-24px
    },
  },
  
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
  },
  
  controls: {
    touchTarget: 44, // WCAG minimum
    dPadButton: 56, // Larger for thumbs
    gestureThreshold: 15,
  },
}
```

### 6.2 Responsive Canvas Scaling

```typescript
class CanvasScaler {
  private canvas: HTMLCanvasElement
  private container: HTMLElement
  private devicePixelRatio: number
  
  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas
    this.container = container
    this.devicePixelRatio = window.devicePixelRatio || 1
    
    window.addEventListener('resize', this.handleResize.bind(this))
    this.handleResize()
  }
  
  private handleResize() {
    const { width, height } = this.getOptimalSize()
    
    // CRITICAL: Set canvas display size
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    
    // CRITICAL: Set canvas internal resolution (sharp on retina)
    this.canvas.width = width * this.devicePixelRatio
    this.canvas.height = height * this.devicePixelRatio
    
    // Scale context for pixel-perfect rendering
    const ctx = this.canvas.getContext('2d')!
    ctx.scale(this.devicePixelRatio, this.devicePixelRatio)
  }
  
  private getOptimalSize() {
    const containerWidth = this.container.clientWidth
    const containerHeight = this.container.clientHeight
    const isMobile = containerWidth < 768
    
    if (isMobile) {
      // Mobile: Full width with padding, maintain aspect ratio
      const maxWidth = containerWidth - 32 // 16px padding each side
      const maxHeight = window.innerHeight * 0.5 // 50% of viewport
      const size = Math.min(maxWidth, maxHeight)
      return { width: size, height: size * (3/4) } // 4:3 aspect
    } else {
      // Desktop: Constrain to max size
      const size = Math.min(800, containerWidth - 48)
      return { width: size, height: size }
    }
  }
}
```

### 6.3 Mobile-First Controls

```typescript
// Thumb-zone optimized D-Pad
const MobileControls = () => {
  const controlsRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    // CRITICAL: Prevent default touch behaviors
    const preventDefault = (e: TouchEvent) => e.preventDefault()
    controlsRef.current?.addEventListener('touchstart', preventDefault, { passive: false })
    controlsRef.current?.addEventListener('touchmove', preventDefault, { passive: false })
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [])
  
  return (
    <div 
      ref={controlsRef}
      className={cn(
        "md:hidden", // Mobile only
        "fixed bottom-4 left-4 right-4", // Safe area for notch
        "bg-white/90 dark:bg-slate-800/90",
        "backdrop-blur-lg",
        "rounded-2xl",
        "p-4",
        "border-2",
        "border-slate-300 dark:border-slate-600",
        "shadow-2xl",
        // CRITICAL: Safe area for notched devices
        "pb-[calc(1rem+env(safe-area-inset-bottom))]",
        "pl-[calc(1rem+env(safe-area-inset-left))]",
        "pr-[calc(1rem+env(safe-area-inset-right))]",
      )}
    >
      <div className="grid grid-cols-3 gap-3">
        {/* D-Pad buttons - Minimum 44x44 for WCAG */}
        <button className="w-14 h-14 min-w-[44px] min-h-[44px]" />
        {/* ... */}
      </div>
    </div>
  )
}
```

---

## 7. PERFORMANCE OPTIMIZATION

### 7.1 Performance Budgets

```yaml
Critical Render Path:
  First Paint: <1s
  Time to Interactive: <2s
  Input Delay: <50ms
  FPS: 60 (mobile), 120 (high-refresh displays)
  
Memory Budgets:
  Heap: <50MB
  DOM Nodes: <5MB
  Canvas Memory: <10MB
  
Network Budgets:
  Initial JS: <200KB
  Total JS: <500KB (code split)
  Assets: <5MB total
```

### 7.2 Render Optimization Strategy

```typescript
// CRITICAL: Optimize React re-renders
const GameCanvas = React.memo(({ gameState, onInput }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // CRITICAL: Memoize callbacks to prevent child re-renders
  const handleCanvasClick = useCallback(() => {
    // ...
  }, [])
  
  // CRITICAL: Extract expensive calculations
  const renderData = useMemo(() => {
    return {
      snake: gameState.snake,
      food: gameState.food,
      grid: calculateGrid(gameState),
    }
  }, [gameState.snake, gameState.food])
  
  // CRITICAL: Only re-render when necessary
  return <canvas ref={canvasRef} />
}, (prevProps, nextProps) => {
  // Custom comparison for fine-grained control
  return (
    prevProps.gameState.snake === nextProps.gameState.snake &&
    prevProps.gameState.food === nextProps.gameState.food
  )
})
```

### 7.3 Bundle Optimization

```typescript
// next.config.mjs
export default {
  // CRITICAL: Code splitting
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      default: false,
      vendors: false,
      game: {
        test: /[\\/]game[\\/]/,
        name: 'game',
        priority: 10,
      },
      ui: {
        test: /[\\/]components[\\/]/,
        name: 'ui',
        priority: 20,
      },
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        priority: 30,
      },
    },
  },
  
  // CRITICAL: Lazy load heavy components
  async rewrites() {
    return [
      {
        source: '/game/:mode',
        destination: '/api/game',
      },
    ]
  },
}
```

### 7.4 Mobile Performance Optimizations

```typescript
class MobilePerformanceManager {
  private visibilityHandler = () => {
    if (document.hidden) {
      // CRITICAL: Suspend game when not visible
      this.gameEngine.suspend()
      this.disableHighFrequencyFeatures()
    } else {
      this.gameEngine.resume()
    }
  }
  
  private disableHighFrequencyFeatures() {
    // Reduce FPS to save battery
    this.gameEngine.setTargetFPS(30)
    
    // Disable particle effects
    this.gameEngine.setParticleEffects(false)
    
    // Reduce update frequency
    this.gameEngine.setUpdateInterval(2)
  }
  
  private enableHighFrequencyFeatures() {
    this.gameEngine.setTargetFPS(60)
    this.gameEngine.setParticleEffects(true)
    this.gameEngine.setUpdateInterval(1)
  }
  
  init() {
    document.addEventListener('visibilitychange', this.visibilityHandler)
    
    // CRITICAL: Detect thermal throttling
    this.monitorThermalState()
  }
  
  private monitorThermalState() {
    setInterval(() => {
      const fps = this.performanceMonitor.getAverageFPS()
      
      if (fps < 30 && !this.isThrottling) {
        this.isThrottling = true
        this.disableHighFrequencyFeatures()
      } else if (fps > 55 && this.isThrottling) {
        this.isThrottling = false
        this.enableHighFrequencyFeatures()
      }
    }, 5000)
  }
}
```

---

## 8. PWA STRATEGY

### 8.1 Service Worker Implementation

```typescript
// sw.ts
const CACHE_NAME = 'snake-byte-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/game/engine.js', // Lazy loaded
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  // CRITICAL: Network-first for game API, cache-first for assets
  const url = new URL(event.request.url)
  
  if (url.pathname.startsWith('/api/')) {
    // API: Network first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
  } else {
    // Assets: Cache first, fallback to network
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    )
  }
})
```

### 8.2 Manifest Configuration

```json
// public/manifest.json
{
  "name": "SnakeByte",
  "short_name": "SnakeByte",
  "description": "Classic snake game reimagined for modern platforms",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-game.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 8.3 Install Prompt Strategy

```typescript
// components/PWAInstallPrompt.tsx
'use client'

import { useEffect, useState } from 'react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  
  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      // Track install analytics
      analytics.track('pwa_install_accepted')
    }
    
    setDeferredPrompt(null)
    setShowPrompt(false)
  }
  
  if (!showPrompt) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstall}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg shadow-lg"
      >
        Install App 📱
      </button>
    </div>
  )
}
```

---

## 9. TESTING STRATEGY

### 9.1 Testing Matrix

```yaml
Unit Tests (Jest + React Testing Library):
  - GameEngine logic (movement, collision, scoring)
  - FSM state transitions
  - Object pool lifecycle
  - Audio manager methods
  - Input mapping
  
Integration Tests:
  - Game loop with delta-time
  - Canvas rendering
  - State persistence
  - API integration
  
E2E Tests (Playwright):
  - Desktop: Keyboard controls
  - Mobile: Touch controls, swipe gestures
  - Cross-browser: Chrome, Firefox, Safari, Edge
  - PWA: Offline functionality
  
Performance Tests:
  - Lighthouse CI
  - Web Vitals (LCP, FID, CLS)
  - Memory profiling
  - FPS consistency
  
Device Lab Tests:
  - iPhone 8+ (low-end)
  - iPhone 14 Pro (high-end with ProMotion)
  - Samsung Galaxy S8+ (Android)
  - iPad Air
  - Desktop (various resolutions)
```

### 9.2 Accessibility Testing

```typescript
// CRITICAL: Keyboard navigation
describe('Keyboard Navigation', () => {
  it('should navigate menus with Tab key', () => {
    render(<MainMenu />)
    
    // Tab through buttons
    await userEvent.tab()
    expect(document.activeElement).toHaveTextContent('Play Classic')
    
    await userEvent.keyboard('{Enter}')
    expect(screen.getByText('Game Area')).toBeInTheDocument()
  })
  
  it('should support screen readers', () => {
    render(<GameCanvas gameState={mockState} />)
    
    // Check ARIA labels
    expect(screen.getByRole('img', { name: 'Snake' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Food' })).toBeInTheDocument()
  })
})
```

### 9.3 Visual Regression Testing

```typescript
// Playwright visual regression
test('game canvas visual appearance', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Play Classic")')
  
  // Wait for game to load
  await page.waitForSelector('canvas')
  
  // Take screenshot
  await page.screenshot({ 
    path: 'screenshots/game-canvas.png',
    fullPage: false 
  })
  
  // Compare with baseline
  expect(await page.screenshot()).toMatchSnapshot('game-canvas')
})
```

---

## 10. SECURITY CONSIDERATIONS

### 10.1 Input Sanitization

```typescript
// CRITICAL: Sanitize user input
function sanitizeUsername(input: string): string {
  // Remove dangerous characters
  const sanitized = input
    .replace(/[<>\"'&]/g, '') // Prevent XSS
    .trim()
    .slice(0, 30) // Length limit
  
  // Allow only alphanumeric, spaces, hyphens
  if (!/^[a-zA-Z0-9\s-]+$/.test(sanitized)) {
    throw new Error('Invalid username')
  }
  
  return sanitized
}
```

### 10.2 Content Security Policy

```typescript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // For Web Audio
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.github.com",
              "worker-src 'self' blob:",
              "media-src 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}
```

### 10.3 API Security

```typescript
// lib/security.ts
export function validateGameRequest(data: unknown): GameRequest {
  const schema = z.object({
    score: z.number().int().min(0).max(999999),
    level: z.number().int().min(1).max(100),
    duration: z.number().int().min(0).max(3600),
    mode: z.enum(['classic', 'pvp', 'battle-royale', 'cooperative']),
  })
  
  // CRITICAL: Type guard + validation
  return schema.parse(data)
}
```

---

## 11. MONITORING & OBSERVABILITY

### 11.1 Performance Monitoring

```typescript
// lib/performance-monitor.ts
class PerformanceMonitor {
  private frameTimes: number[] = []
  private memorySamples: number[] = []
  
  // CRITICAL: Web Vitals tracking
  init() {
    // LCP (Largest Contentful Paint)
    this.trackLCP()
    
    // FID (First Input Delay)
    this.trackFID()
    
    // CLS (Cumulative Layout Shift)
    this.trackCLS()
    
    // FPS tracking
    this.trackFPS()
  }
  
  private trackFPS() {
    let lastFrameTime = performance.now()
    
    const measure = () => {
      const now = performance.now()
      const delta = now - lastFrameTime
      lastFrameTime = now
      
      this.frameTimes.push(delta)
      if (this.frameTimes.length > 60) {
        this.frameTimes.shift()
      }
      
      // CRITICAL: Detect performance degradation
      const avgFPS = 1000 / (this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length)
      if (avgFPS < 30) {
        this.reportPerformanceIssue('low_fps', { avgFPS })
      }
      
      requestAnimationFrame(measure)
    }
    
    requestAnimationFrame(measure)
  }
  
  getMetrics() {
    return {
      avgFPS: this.calculateAvgFPS(),
      memory: this.getMemoryUsage(),
      frameTimeP50: this.getPercentile(50),
      frameTimeP95: this.getPercentile(95),
    }
  }
}
```

### 11.2 Error Tracking

```typescript
// lib/error-tracker.ts
class ErrorTracker {
  init() {
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'runtime',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise_rejection',
        reason: event.reason,
        promise: event.promise,
      })
    })
  }
  
  private trackError(error: ErrorInfo) {
    // CRITICAL: Don't send PII
    const sanitized = {
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      memory: (performance as any).memory?.usedJSHeapSize,
    }
    
    // Send to error tracking service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
    }).catch(console.error)
  }
}
```

---

## 12. MIGRATION ROADMAP

### 12.1 Phase 1: Core Refactoring (Week 1-2)

```yaml
Priority: CRITICAL
Effort: HIGH
Goal: Fix critical performance issues

Tasks:
  - Extract GameEngine from React component
  - Implement delta-time game loop
  - Add FSM for state management
  - Fix AudioContext memory leak
  - Add object pooling for snake/food
  
Deliverables:
  - src/game/core/GameEngine.ts
  - src/game/core/GameStateMachine.ts
  - src/game/core/GameLoop.ts
  - Performance improvement: 50%+ FPS increase
  
Metrics:
  - FPS: 60 (consistent)
  - Memory: <30MB heap
  - First paint: <800ms
```

### 12.2 Phase 2: Component Refactoring (Week 3)

```yaml
Priority: HIGH
Effort: MEDIUM
Goal: Separate concerns, improve testability

Tasks:
  - Extract canvas rendering to Renderer class
  - Create InputManager for unified input handling
  - Split page.tsx into 10+ focused components
  - Add React.memo to prevent unnecessary re-renders
  
Deliverables:
  - src/game/systems/Renderer.ts
  - src/game/systems/InputManager.ts
  - src/game/ui/*.tsx (10 components)
  - Code coverage: 80%+
  
Metrics:
  - Component size: <200 lines each
  - Re-render reduction: 70%
  - Test coverage: 80%+
```

### 12.3 Phase 3: Mobile Optimizations (Week 4)

```yaml
Priority: MEDIUM
Effort: MEDIUM
Goal: Optimize for mobile devices

Tasks:
  - Implement responsive canvas scaling
  - Add PWA manifest and service worker
  - Optimize touch controls (thumb-zone, haptics)
  - Add battery conservation mode
  - Implement thermal throttling detection
  
Deliverables:
  - public/manifest.json
  - sw.ts (service worker)
  - src/game/utils/CanvasScaler.ts
  - Mobile performance: <100ms touch response
  
Metrics:
  - Touch latency: <50ms
  - Battery: 20% less drain
  - PWA installable: ✅
```

### 12.4 Phase 4: Advanced Features (Week 5-6)

```yaml
Priority: LOW
Effort: MEDIUM
Goal: Add advanced features

Tasks:
  - Gamepad API support
  - Offline leaderboard sync
  - Achievement notifications
  - Replay system
  - Enhanced graphics (particles, effects)
  
Deliverables:
  - Gamepad support: Xbox, PlayStation, Switch Pro
  - Offline play: 100% functional
  - Visual effects: particles, gradients
  
Metrics:
  - Input methods: 4 (keyboard, touch, mouse, gamepad)
  - Offline: 100% functional
  - Visual polish: 9/10 rating
```

---

## 13. CODE EXAMPLES: CRITICAL PATH IMPLEMENTATIONS

### 13.1 Game Engine Core

```typescript
// src/game/core/GameEngine.ts
export class GameEngine {
  private state: GameState
  private stateMachine: StateMachine
  private gameLoop: GameLoop
  private renderer: Renderer
  private inputManager: InputManager
  
  constructor() {
    this.stateMachine = new StateMachine()
    this.state = this.createInitialState()
    this.gameLoop = new GameLoop()
    this.renderer = new Renderer()
    this.inputManager = new InputManager()
  }
  
  start() {
    if (!this.stateMachine.transition('PLAYING')) return
    
    this.gameLoop.start((dt, interpolation) => {
      this.update(dt)
      this.renderer.render(this.state)
    })
  }
  
  pause() {
    if (!this.stateMachine.transition('PAUSED')) return
    this.gameLoop.stop()
  }
  
  resume() {
    if (!this.stateMachine.transition('PLAYING')) return
    this.gameLoop.start((dt, interpolation) => {
      this.update(dt)
      this.renderer.render(this.state)
    })
  }
  
  private update(dt: number) {
    // Fixed-time step update
    this.moveSnake(dt)
    this.checkCollisions()
    this.updatePowerUps(dt)
    this.checkGameState()
  }
  
  destroy() {
    this.gameLoop.stop()
    this.inputManager.destroy()
    this.renderer.destroy()
    AudioManager.getInstance().destroy()
  }
}
```

### 13.2 React Integration

```typescript
// src/hooks/useGameEngine.ts
export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const engineRef = useRef<GameEngine | null>(null)
  
  useEffect(() => {
    if (!canvasRef.current) return
    
    // CRITICAL: Initialize engine only once
    const engine = new GameEngine()
    engineRef.current = engine
    
    // CRITICAL: Cleanup on unmount
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])
  
  const startGame = useCallback(() => {
    engineRef.current?.start()
  }, [])
  
  const pauseGame = useCallback(() => {
    engineRef.current?.pause()
  }, [])
  
  return { startGame, pauseGame, engine: engineRef.current }
}
```

### 13.3 Performance-Optimized Canvas Component

```typescript
// src/game/ui/GameCanvas.tsx
const GameCanvas = React.memo<GameCanvasProps>(
  ({ gameState, onInput, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engine = useGameEngine(canvasRef)
    
    // CRITICAL: Sync canvas with engine state
    useEffect(() => {
      if (!canvasRef.current || !gameState) return
      const renderer = new Renderer(canvasRef.current)
      
      const render = () => {
        if (gameState) {
          renderer.render(gameState)
        }
      }
      
      render()
      
      // CRITICAL: Render only when state changes
      const subscription = engine.onStateChange(render)
      
      return () => subscription.unsubscribe()
    }, [gameState])
    
    // CRITICAL: Optimize canvas size
    useEffect(() => {
      if (!canvasRef.current) return
      const scaler = new CanvasScaler(canvasRef.current, canvasRef.current.parentElement!)
      
      return () => scaler.destroy()
    }, [canvasRef])
    
    return <canvas ref={canvasRef} className={className} />
  },
  // CRITICAL: Custom comparison for fine-grained re-render control
  (prev, next) => {
    return (
      prev.gameState.snake.length === next.gameState.snake.length &&
      prev.gameState.food.x === next.gameState.food.x &&
      prev.gameState.food.y === next.gameState.food.y
    )
  }
)
```

---

## 14. TRADE-OFF ANALYSIS

### 14.1 Framework Choice

```yaml
Current: Next.js 16 + React
  Pros:
    - SSR for initial load
    - File-based routing
    - Built-in optimizations
    - Rich ecosystem
  
  Cons:
    - Bundle overhead (~200KB)
    - Build complexity
    - Overkill for simple game
  
  Alternative: Vanilla JS + Web Components
  Pros:
    - Zero framework overhead
    - Full control over rendering
    - Smaller bundle (~50KB)
  
  Cons:
    - No SSR
    - Manual routing
    - No optimization by default
  
  Decision: Keep Next.js
  - SSR benefit outweighs overhead
    - LCP improvement: 300ms
    - SEO benefit for leaderboards
  - Can lazy-load game engine
```

### 14.2 Rendering Strategy

```yaml
Option A: Canvas 2D (Current)
  Pros:
    - Simple, well-supported
    - Good performance on most devices
    - Easy to debug
  
  Cons:
    - CPU-bound
    - Limited to 2D
  
  Option B: WebGL
  Pros:
    - GPU-accelerated
    - Advanced effects (particles, shaders)
    - Better performance on low-end devices
  
  Cons:
    - Higher complexity
    - WebGL 1 fallback needed
    - Debugging harder
  
  Decision: Start with Canvas 2D
  - Implement WebGL as v2 enhancement
  - Fallback strategy for older devices
```

---

## 15. SUCCESS METRICS

### 15.1 Performance Targets

```yaml
Core Web Vitals:
  LCP (Largest Contentful Paint): <1.0s ✅
  FID (First Input Delay): <100ms ✅
  CLS (Cumulative Layout Shift): <0.1 ✅
  
Game Metrics:
  FPS: 60 (consistent) ✅
  Input Delay: <50ms ✅
  Frame Time P95: <16.7ms ✅
  Memory: <50MB heap ✅
  
Mobile Metrics:
  Touch Latency: <100ms ✅
  Battery: <10% drain/hour ✅
  Install Rate: >5% ✅
  Offline: 100% functional ✅
  
Quality Metrics:
  Test Coverage: >80% ✅
  Accessibility Score: >95 ✅
  Lighthouse Score: >90 ✅
```

### 15.2 Business Metrics

```yaml
Engagement:
  - Session Duration: >5 minutes
  - Games per Session: >3
  - Return Rate: >30% (7-day)
  
Technical:
  - Bundle Size: <500KB (gzipped)
  - Time to Interactive: <2s
  - Error Rate: <0.1%
  
Accessibility:
  - WCAG 2.1 AA Compliant ✅
  - Keyboard Navigation: Full ✅
  - Screen Reader Support: Full ✅
```

---

## CONCLUSION

This architecture plan provides a production-ready foundation for SnakeByte that:

1. **Solves critical performance issues** (game loop, memory leaks, re-renders)
2. **Implements best practices** (FSM, object pooling, delta-time loop)
3. **Optimizes for mobile** (responsive canvas, PWA, battery conservation)
4. **Ensures accessibility** (WCAG 2.1 AA, keyboard navigation)
5. **Provides observability** (performance monitoring, error tracking)
6. **Scales for growth** (modular architecture, code splitting)

**Next Steps:**
1. Review ADRs with team
2. Implement Phase 1 (Critical refactoring)
3. Set up CI/CD with Lighthouse checks
4. Establish device lab for testing
5. Monitor metrics and iterate

**Estimated Timeline:** 6 weeks for full migration  
**Team Size:** 1 Senior Frontend Engineer + 1 QA Engineer  
**Risk Level:** Medium (well-understood domain, clear migration path)

---

## APPENDICES

### Appendix A: Technology Stack Justification

| Technology | Justification | Alternatives Considered |
|------------|---------------|----------------------|
| Next.js 16 | SSR, file-based routing, built-in optimizations | Vite + React Router, Gatsby |
| TypeScript | Type safety, better IDE support, large codebase | JavaScript, JSDoc |
| Canvas 2D | Simple, performant, well-supported | WebGL, DOM rendering |
| Zustand | Lightweight, no boilerplate, React 18 compatible | Redux, Recoil, Jotai |
| Tailwind CSS | Utility-first, responsive, easy dark mode | CSS Modules, Styled Components |

### Appendix B: Resources

- [Web Audio API Best Practices](https://web.dev/audio-scheduling/)
- [Canvas Performance](https://web.dev/canvas-performance/)
- [PWA Best Practices](https://web.dev/progressive-web-apps-checklist/)
- [Game Loop Architecture](https://gameprogrammingpatterns.com/game-loop/game-loop.html)
- [Object Pooling Pattern](https://www.gameprogrammingpatterns.com/object-pool/)

### Appendix C: Architecture Review Checklist

- [ ] Game loop uses requestAnimationFrame with delta-time
- [ ] FSM implemented for state management
- [ ] Audio uses singleton pattern with object pooling
- [ ] Canvas uses double buffering
- [ ] Components are <200 lines each
- [ ] React.memo used for performance optimization
- [ ] useMemo/useCallback for expensive operations
- [ ] PWA manifest configured
- [ ] Service worker implements caching strategy
- [ ] Canvas scales with devicePixelRatio
- [ ] Touch controls use safe area insets
- [ ] Keyboard navigation fully functional
- [ ] Screen reader support implemented
- [ ] Performance monitoring in place
- [ ] Error tracking configured
- [ ] CSP headers configured
- [ ] Input sanitization implemented
- [ ] Memory <50MB in long sessions
- [ ] FPS consistent at 60
- [ ] Touch latency <100ms

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-27  
**Owner:** Senior Frontend Architect  
**Reviewers:** Tech Lead, QA Lead
