import { create } from 'zustand'
import type {
  EditorMode,
  HandwritingParams,
  Adjustment,
  CanvasSize,
  ToastMessage,
  CharLayout,
  CharHandwritingStyle,
  WritableRegion,
  PageLayout,
  BackgroundImage,
  PaperTemplateType,
  FontDefinition,
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
  pages: PageLayout[]

  // === 横格线 ===
  gridLines: number[]
  gridAutoDetected: boolean

  // === 背景 ===
  backgrounds: BackgroundImage[]
  currentBackgroundId: string | null
  currentBackgroundImg: HTMLImageElement | null
  paperTemplate: PaperTemplateType

  // === 可写区域 ===
  writableRegions: WritableRegion[]

  // === 字体 ===
  customFonts: FontDefinition[]

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
  showRegions: boolean
  isDragging: boolean
  selectionRect: { x: number; y: number; width: number; height: number } | null
  toasts: ToastMessage[]
  currentPageIndex: number

  // === Actions ===
  setText: (text: string) => void
  setParams: (params: Partial<HandwritingParams>) => void
  setMode: (mode: EditorMode) => void
  setCanvasSize: (size: CanvasSize) => void
  setLayouts: (layouts: CharLayout[]) => void
  setHandwritingStyles: (styles: CharHandwritingStyle[]) => void
  setRandomSeed: (seed: number) => void
  setPages: (pages: PageLayout[]) => void
  setGridLines: (lines: number[]) => void
  setGridAutoDetected: (auto: boolean) => void
  setBackgrounds: (backgrounds: BackgroundImage[]) => void
  addBackground: (bg: BackgroundImage) => void
  removeBackground: (id: string) => void
  setCurrentBackgroundId: (id: string | null) => void
  setCurrentBackgroundImg: (img: HTMLImageElement | null) => void
  setPaperTemplate: (template: PaperTemplateType) => void
  setWritableRegions: (regions: WritableRegion[]) => void
  addCustomFont: (font: FontDefinition) => void
  setSelectedIndices: (indices: Set<number>) => void
  clearSelection: () => void
  addAdjustment: (adj: Adjustment) => void
  clearAdjustments: () => void
  setPendingAdjustment: (adj: Partial<{ offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }> | null) => void
  applyPendingAdjustment: () => void
  resetPendingAdjustment: () => void
  setShowBoundingBoxes: (show: boolean) => void
  setShowGrid: (show: boolean) => void
  setShowAlignmentGuides: (show: boolean) => void
  setShowRegions: (show: boolean) => void
  setIsDragging: (dragging: boolean) => void
  setSelectionRect: (rect: { x: number; y: number; width: number; height: number } | null) => void
  setCurrentPageIndex: (index: number) => void
  addToast: (type: ToastMessage['type'], text: string) => void
  removeToast: (id: string) => void
  getMergedAdjustments: () => Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>
}

const DEFAULT_PARAMS: HandwritingParams = {
  font: 'LXGW WenKai',
  printFont: 'Noto Serif SC',
  fontSize: 28,
  lineHeight: 1.8,
  letterSpacing: 2,
  wordSpacing: 6,
  firstLineIndent: 2,
  pageSize: 'A4',
  pageWidth: 794,
  pageHeight: 1123,
  marginTop: 80,
  marginBottom: 80,
  marginLeft: 80,
  marginRight: 80,
  color: '#1a3a5c',
  paperColor: '#faf8f3',
  positionJitter: 2,
  rotationJitter: 2,
  scaleJitter: 0.04,
  opacityJitter: 0.15,
  colorJitter: 0.1,
  inkIntensity: 0.85,
  strokeWidth: 1,
  strokeWidthJitter: 0.3,
  showGrid: true,
  gridSpacing: 50,
  gridColor: '#c5bda8',
  autoDetectGrid: true,
  baselineTolerance: 30,
  autoPageBreak: true,
  autoDetectRegions: true,
}

const DEFAULT_TEXT = `手写笔迹模拟器

本项目基于 GitHub 开源手写生成项目进行二次开发，专注于后期处理微调与界面优化。

核心功能包括：
一、文本输入与参数配置
二、背景图导入与纸张模板
三、框选微调与高精度控制
四、横格线检测与基线对齐
五、自动文本流与多页分页
六、编辑态打印体与最终态手写体切换

支持中英文混排，支持长文本自动分页，支持自定义背景图与可写区域检测。

请输入您的文字内容，调整参数后点击最终预览查看手写效果。`

export const useEditorStore = create<EditorState>((set, get) => ({
  text: DEFAULT_TEXT,
  params: DEFAULT_PARAMS,
  canvasSize: { width: 794, height: 1123 },
  mode: 'edit',
  layouts: [],
  handwritingStyles: [],
  randomSeed: 42,
  pages: [],
  gridLines: [],
  gridAutoDetected: false,
  backgrounds: [],
  currentBackgroundId: null,
  currentBackgroundImg: null,
  paperTemplate: 'lined',
  writableRegions: [],
  customFonts: [],
  selectedIndices: new Set(),
  adjustments: [],
  pendingAdjustment: null,
  showBoundingBoxes: false,
  showGrid: true,
  showAlignmentGuides: true,
  showRegions: true,
  isDragging: false,
  selectionRect: null,
  toasts: [],
  currentPageIndex: 0,

  setText: (text) => set({ text }),
  setParams: (params) => set((state) => ({ params: { ...state.params, ...params } })),
  setMode: (mode) => set({ mode }),
  setCanvasSize: (canvasSize) => set({ canvasSize }),
  setLayouts: (layouts) => set({ layouts }),
  setHandwritingStyles: (handwritingStyles) => set({ handwritingStyles }),
  setRandomSeed: (randomSeed) => set({ randomSeed }),
  setPages: (pages) => set({ pages }),
  setGridLines: (gridLines) => set({ gridLines }),
  setGridAutoDetected: (gridAutoDetected) => set({ gridAutoDetected }),
  setBackgrounds: (backgrounds) => set({ backgrounds }),
  addBackground: (bg) => set((state) => ({ backgrounds: [...state.backgrounds, bg] })),
  removeBackground: (id) => set((state) => ({
    backgrounds: state.backgrounds.filter((b) => b.id !== id),
    currentBackgroundId: state.currentBackgroundId === id ? null : state.currentBackgroundId,
  })),
  setCurrentBackgroundId: (currentBackgroundId) => set({ currentBackgroundId }),
  setCurrentBackgroundImg: (currentBackgroundImg) => set({ currentBackgroundImg }),
  setPaperTemplate: (paperTemplate) => set({ paperTemplate }),
  setWritableRegions: (writableRegions) => set({ writableRegions }),
  addCustomFont: (font) => set((state) => ({ customFonts: [...state.customFonts, font] })),
  setSelectedIndices: (selectedIndices) => set({ selectedIndices }),
  clearSelection: () => set({ selectedIndices: new Set(), pendingAdjustment: null, selectionRect: null }),
  addAdjustment: (adj) => set((state) => ({ adjustments: [...state.adjustments, adj] })),
  clearAdjustments: () => set({ adjustments: [] }),
  setPendingAdjustment: (adj) => set((state) => ({
    pendingAdjustment: adj === null ? null : { ...state.pendingAdjustment || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }, ...adj },
  })),
  applyPendingAdjustment: () => {
    const state = get()
    if (!state.pendingAdjustment || state.selectedIndices.size === 0) return
    const adj: Adjustment = {
      id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      charIndices: Array.from(state.selectedIndices),
      offsetX: state.pendingAdjustment.offsetX,
      offsetY: state.pendingAdjustment.offsetY,
      scale: state.pendingAdjustment.scale,
      rotation: state.pendingAdjustment.rotation,
      color: state.pendingAdjustment.color,
      createdAt: Date.now(),
    }
    set({
      adjustments: [...state.adjustments, adj],
      pendingAdjustment: null,
      selectedIndices: new Set(),
      selectionRect: null,
    })
  },
  resetPendingAdjustment: () => set({ pendingAdjustment: null }),
  setShowBoundingBoxes: (showBoundingBoxes) => set({ showBoundingBoxes }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowAlignmentGuides: (showAlignmentGuides) => set({ showAlignmentGuides }),
  setShowRegions: (showRegions) => set({ showRegions }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setSelectionRect: (selectionRect) => set({ selectionRect }),
  setCurrentPageIndex: (currentPageIndex) => set({ currentPageIndex }),
  addToast: (type, text) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({ toasts: [...state.toasts, { id, type, text }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  getMergedAdjustments: () => {
    const state = get()
    const merged = new Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>()

    state.adjustments.forEach((adj) => {
      adj.charIndices.forEach((idx) => {
        merged.set(idx, {
          offsetX: adj.offsetX,
          offsetY: adj.offsetY,
          scale: adj.scale,
          rotation: adj.rotation,
          color: adj.color,
        })
      })
    })

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
