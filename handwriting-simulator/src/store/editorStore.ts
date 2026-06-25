import { create } from 'zustand'
import type {
  EditorMode,
  HandwritingParams,
  Adjustment,
  CanvasSize,
  ToastMessage,
  CharLayout,
  CharHandwritingStyle,
} from '../types'

interface EditorState {
  // === 文本与参数 ===
  text: string
  params: HandwritingParams

  // === 画布 ===
  canvasSize: CanvasSize

  // === 模式 ===
  mode: EditorMode

  // === 布局与样式 ===
  layouts: CharLayout[]
  handwritingStyles: CharHandwritingStyle[]
  randomSeed: number

  // === 横格线 ===
  gridLines: number[]
  gridAutoDetected: boolean

  // === 选区与微调 ===
  selectedIndices: Set<number>
  adjustments: Adjustment[]
  pendingAdjustment: {
    offsetX: number
    offsetY: number
    scale: number
    rotation: number
    color?: string
  } | null

  // === UI 状态 ===
  showBoundingBoxes: boolean
  showGrid: boolean
  showAlignmentGuides: boolean
  isDragging: boolean
  selectionRect: { x: number; y: number; width: number; height: number } | null
  toasts: ToastMessage[]

  // === Actions ===
  setText: (text: string) => void
  setParams: (params: Partial<HandwritingParams>) => void
  setMode: (mode: EditorMode) => void
  setCanvasSize: (size: CanvasSize) => void
  setLayouts: (layouts: CharLayout[]) => void
  setHandwritingStyles: (styles: CharHandwritingStyle[]) => void
  setRandomSeed: (seed: number) => void
  setGridLines: (lines: number[]) => void
  setGridAutoDetected: (auto: boolean) => void
  setSelectedIndices: (indices: Set<number>) => void
  clearSelection: () => void
  addAdjustment: (adj: Adjustment) => void
  removeAdjustment: (id: string) => void
  clearAdjustments: () => void
  setPendingAdjustment: (adj: EditorState['pendingAdjustment']) => void
  applyPendingAdjustment: () => void
  setShowBoundingBoxes: (show: boolean) => void
  setShowGrid: (show: boolean) => void
  setShowAlignmentGuides: (show: boolean) => void
  setIsDragging: (dragging: boolean) => void
  setSelectionRect: (rect: EditorState['selectionRect']) => void
  addToast: (type: ToastMessage['type'], text: string) => void
  removeToast: (id: string) => void
  getMergedAdjustments: () => Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>
}

const defaultParams: HandwritingParams = {
  font: 'Ma Shan Zheng',
  printFont: 'Noto Serif SC',
  fontSize: 28,
  lineHeight: 1.8,
  letterSpacing: 1,
  color: '#1a3a5c',
  positionJitter: 1.5,
  rotationJitter: 2,
  scaleJitter: 0.05,
  opacityJitter: 0.1,
  colorJitter: 0.08,
  inkIntensity: 0.85,
  showGrid: true,
  gridSpacing: 50,
  gridColor: '#b8a890',
  paperColor: '#faf8f3',
}

export const useEditorStore = create<EditorState>((set, get) => ({
  text: '这是一段手写模拟测试文字。\n手写笔迹模拟器支持中英文混排，\n可对文字进行框选微调，\n最终渲染出真实自然的手写效果。\nHandwriting Simulator supports fine-tuning.',
  params: defaultParams,
  canvasSize: { width: 800, height: 600 },
  mode: 'edit',
  layouts: [],
  handwritingStyles: [],
  randomSeed: 42,
  gridLines: [],
  gridAutoDetected: false,
  selectedIndices: new Set(),
  adjustments: [],
  pendingAdjustment: null,
  showBoundingBoxes: true,
  showGrid: true,
  showAlignmentGuides: true,
  isDragging: false,
  selectionRect: null,
  toasts: [],

  setText: (text) => set({ text }),

  setParams: (params) =>
    set((state) => ({ params: { ...state.params, ...params } })),

  setMode: (mode) => set({ mode }),

  setCanvasSize: (canvasSize) => set({ canvasSize }),

  setLayouts: (layouts) => set({ layouts }),

  setHandwritingStyles: (handwritingStyles) => set({ handwritingStyles }),

  setRandomSeed: (randomSeed) => set({ randomSeed }),

  setGridLines: (gridLines) => set({ gridLines }),

  setGridAutoDetected: (gridAutoDetected) => set({ gridAutoDetected }),

  setSelectedIndices: (selectedIndices) => set({ selectedIndices }),

  clearSelection: () =>
    set({ selectedIndices: new Set(), pendingAdjustment: null, selectionRect: null }),

  addAdjustment: (adj) =>
    set((state) => ({ adjustments: [...state.adjustments, adj] })),

  removeAdjustment: (id) =>
    set((state) => ({ adjustments: state.adjustments.filter((a) => a.id !== id) })),

  clearAdjustments: () => set({ adjustments: [] }),

  setPendingAdjustment: (pendingAdjustment) => set({ pendingAdjustment }),

  applyPendingAdjustment: () => {
    const state = get()
    if (!state.pendingAdjustment || state.selectedIndices.size === 0) return

    const newAdj: Adjustment = {
      id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      charIndices: Array.from(state.selectedIndices).sort((a, b) => a - b),
      offsetX: state.pendingAdjustment.offsetX,
      offsetY: state.pendingAdjustment.offsetY,
      scale: state.pendingAdjustment.scale,
      rotation: state.pendingAdjustment.rotation,
      color: state.pendingAdjustment.color,
      createdAt: Date.now(),
    }
    set({
      adjustments: [...state.adjustments, newAdj],
      pendingAdjustment: null,
      selectedIndices: new Set(),
    })
  },

  setShowBoundingBoxes: (showBoundingBoxes) => set({ showBoundingBoxes }),

  setShowGrid: (showGrid) =>
    set((state) => ({
      showGrid,
      params: { ...state.params, showGrid },
    })),

  setShowAlignmentGuides: (showAlignmentGuides) => set({ showAlignmentGuides }),

  setIsDragging: (isDragging) => set({ isDragging }),

  setSelectionRect: (selectionRect) => set({ selectionRect }),

  addToast: (type, text) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({
      toasts: [...state.toasts, { id, type, text }],
    }))
    // 3 秒后自动移除
    setTimeout(() => {
      get().removeToast(id)
    }, 3000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  getMergedAdjustments: () => {
    const state = get()
    const merged = new Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>()

    // 合并所有已保存的微调
    state.adjustments.forEach((adj) => {
      adj.charIndices.forEach((idx) => {
        // 后面的微调覆盖前面的（如果同一字符被多次调整）
        merged.set(idx, {
          offsetX: adj.offsetX,
          offsetY: adj.offsetY,
          scale: adj.scale,
          rotation: adj.rotation,
          color: adj.color,
        })
      })
    })

    // 合并当前 pending 的微调（实时预览）
    if (state.pendingAdjustment && state.selectedIndices.size > 0) {
      state.selectedIndices.forEach((idx) => {
        const existing = merged.get(idx)
        if (existing) {
          merged.set(idx, {
            offsetX: existing.offsetX + state.pendingAdjustment!.offsetX,
            offsetY: existing.offsetY + state.pendingAdjustment!.offsetY,
            scale: existing.scale * state.pendingAdjustment!.scale,
            rotation: existing.rotation + state.pendingAdjustment!.rotation,
            color: state.pendingAdjustment!.color || existing.color,
          })
        } else {
          merged.set(idx, {
            offsetX: state.pendingAdjustment!.offsetX,
            offsetY: state.pendingAdjustment!.offsetY,
            scale: state.pendingAdjustment!.scale,
            rotation: state.pendingAdjustment!.rotation,
            color: state.pendingAdjustment!.color,
          })
        }
      })
    }

    return merged
  },
}))
