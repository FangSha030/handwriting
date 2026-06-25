import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import {
  layoutText,
  generateHandwritingStyles,
  renderEditMode,
  renderPreviewMode,
  getCharBoundingBox,
} from '../utils/handwriting'
import { detectGridFromLayout, alignToGrid } from '../utils/gridDetection'

/**
 * 编辑器核心 Hook
 * 管理 canvas 渲染、文本布局、横格线检测
 */
export function useEditor(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const {
    text,
    params,
    mode,
    canvasSize,
    randomSeed,
    gridLines,
    showBoundingBoxes,
    showGrid,
    showAlignmentGuides,
    setLayouts,
    setHandwritingStyles,
    setGridLines,
    setGridAutoDetected,
    getMergedAdjustments,
  } = useEditorStore()

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  // 重新计算布局
  const recomputeLayout = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 根据横格线对齐
    const startY = gridLines.length > 0 ? gridLines[0] - params.fontSize : 60
    let layouts = layoutText(text, ctx, params, canvasSize.width, startY, gridLines)

    // 自动基线对齐到横格线
    if (gridLines.length > 0 && showAlignmentGuides) {
      layouts = alignToGrid(layouts, gridLines, 25)
    }

    setLayouts(layouts)

    // 生成手写样式
    const styles = generateHandwritingStyles(layouts, params, randomSeed)
    setHandwritingStyles(styles)
  }, [text, params, canvasSize, gridLines, randomSeed, showAlignmentGuides, canvasRef, setLayouts, setHandwritingStyles])

  // 自动检测横格线（基于文本布局）
  const autoDetectGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 先做一次布局（不依赖横格线）
    const startY = 60
    const baseLayouts = layoutText(text, ctx, params, canvasSize.width, startY, [])
    const detected = detectGridFromLayout(baseLayouts)

    if (detected.length > 0) {
      setGridLines(detected)
      setGridAutoDetected(true)
    }
  }, [text, params, canvasSize, canvasRef, setGridLines, setGridAutoDetected])

  // 初次加载时自动检测横格线
  useEffect(() => {
    if (gridLines.length === 0 && text) {
      autoDetectGrid()
    }
  }, []) // 仅初次加载

  // 文本/参数变化时重新布局
  useEffect(() => {
    recomputeLayout()
  }, [recomputeLayout])

  // 渲染画布
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { layouts, handwritingStyles } = useEditorStore.getState()
    const mergedAdjustments = getMergedAdjustments()
    const selectedIndices = useEditorStore.getState().selectedIndices

    if (mode === 'edit') {
      renderEditMode(
        ctx,
        layouts,
        params,
        mergedAdjustments,
        selectedIndices,
        showBoundingBoxes,
        showGrid,
      )
    } else {
      renderPreviewMode(
        ctx,
        layouts,
        handwritingStyles,
        params,
        mergedAdjustments,
      )
    }
  }, [canvasRef, mode, params, showBoundingBoxes, showGrid, getMergedAdjustments])

  // 任何相关状态变化时重新渲染
  useEffect(() => {
    render()
  }, [render, useEditorStore.getState().layouts, useEditorStore.getState().handwritingStyles, useEditorStore.getState().selectedIndices, useEditorStore.getState().adjustments, useEditorStore.getState().pendingAdjustment, useEditorStore.getState().selectionRect])

  // 订阅 store 变化以触发重渲染
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(() => {
      render()
    })
    return unsubscribe
  }, [render])

  // 根据框选矩形获取选中的字符索引
  const getSelectedIndicesFromRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }): number[] => {
      const { layouts } = useEditorStore.getState()
      const indices: number[] = []

      layouts.forEach((layout, index) => {
        if (layout.isLineBreak) return

        // 使用包含留白的边界框进行判定
        const bbox = getCharBoundingBox(layout, 4)
        // 矩形相交判定
        if (
          rect.x < bbox.x + bbox.width &&
          rect.x + rect.width > bbox.x &&
          rect.y < bbox.y + bbox.height &&
          rect.y + rect.height > bbox.y
        ) {
          indices.push(index)
        }
      })

      return indices
    },
    [],
  )

  return {
    recomputeLayout,
    autoDetectGrid,
    render,
    getSelectedIndicesFromRect,
  }
}
