import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import {
  generateHandwritingStyles,
  renderEditMode,
  renderPreviewMode,
  getCharBoundingBox,
} from '../utils/handwriting'
import { detectGridFromLayout, alignToGrid } from '../utils/gridDetection'
import { flowTextIntoRegions, flattenPages } from '../utils/textFlow'
import { drawPaperTemplate, getTemplateWritableRegion, PAGE_SIZE_PRESETS } from '../utils/paperTemplates'
import { detectWritableRegions, detectGridLinesFromImage, imageToImageData, loadImage } from '../utils/regionDetection'

/**
 * 编辑器核心 Hook
 * 管理 canvas 渲染、文本布局、横格线检测、背景图、文本流
 */
export function useEditor(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const store = useEditorStore()

  const offscreenRef = useRef<HTMLCanvasElement | null>(null)

  // 重新计算布局（核心：文本流 + 区域检测）
  const recomputeLayout = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { text, params, canvasSize, writableRegions, currentBackgroundImg, paperTemplate, randomSeed } = store

    // 确定可写区域
    let regions = writableRegions

    // 如果没有显式设置区域，根据背景/模板生成
    if (regions.length === 0) {
      if (currentBackgroundImg && params.autoDetectRegions) {
        // 自动检测背景可写区域
        try {
          const imageData = imageToImageData(currentBackgroundImg, canvasSize.width, canvasSize.height)
          // 先检测横格线
          const gridYs = params.autoDetectGrid ? detectGridLinesFromImage(imageData, 100, 180) : []
          // 基于横格线检测可写区域
          regions = detectWritableRegions(imageData, gridYs, {
            top: params.marginTop,
            bottom: params.marginBottom,
            left: params.marginLeft,
            right: params.marginRight,
          })
        } catch (e) {
          console.warn('Region detection failed:', e)
        }
      }

      // 如果还是没区域，使用纸张模板生成
      if (regions.length === 0) {
        const templateRegion = getTemplateWritableRegion(
          canvasSize.width,
          canvasSize.height,
          { top: params.marginTop, bottom: params.marginBottom, left: params.marginLeft, right: params.marginRight },
          params.gridSpacing,
          paperTemplate,
        )
        regions = [{
          id: 'template-region',
          x: templateRegion.x,
          y: templateRegion.y,
          width: templateRegion.width,
          height: templateRegion.height,
          gridLines: templateRegion.gridLines,
          autoDetected: false,
        }]
      }
    }

    // 文本流布局
    const pages = flowTextIntoRegions(text, ctx, params, regions)
    const layouts = flattenPages(pages)

    store.setPages(pages)
    store.setLayouts(layouts)
    store.setWritableRegions(regions)

    // 生成手写样式
    const styles = generateHandwritingStyles(layouts, params, randomSeed)
    store.setHandwritingStyles(styles)

    // 更新横格线（用于显示）
    const allGridLines = new Set<number>()
    regions.forEach((r) => {
      r.gridLines.forEach((y) => allGridLines.add(r.y + y))
    })
    store.setGridLines(Array.from(allGridLines).sort((a, b) => a - b))
    store.setGridAutoDetected(true)
  }, [canvasRef, store])

  // 自动检测横格线
  const autoDetectGrid = useCallback(() => {
    recomputeLayout()
    store.addToast('success', `已检测到 ${store.gridLines.length} 条横格线`)
  }, [recomputeLayout, store])

  // 渲染
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const {
      mode,
      params,
      showBoundingBoxes,
      showGrid,
      showRegions,
      getMergedAdjustments,
      layouts,
      handwritingStyles,
      selectedIndices,
      selectionRect,
      currentBackgroundImg,
      writableRegions,
      paperTemplate,
    } = store

    const mergedAdjustments = getMergedAdjustments()

    // 如果没有背景图，绘制纸张模板
    if (!currentBackgroundImg) {
      drawPaperTemplate(
        ctx,
        canvas.width,
        canvas.height,
        paperTemplate,
        {
          paperColor: params.paperColor,
          lineColor: params.gridColor,
          lineSpacing: params.gridSpacing,
          margin: { top: params.marginTop, bottom: params.marginBottom, left: params.marginLeft, right: params.marginRight },
        },
      )
    }

    if (mode === 'edit') {
      renderEditMode(
        ctx,
        layouts,
        params,
        mergedAdjustments,
        selectedIndices,
        showBoundingBoxes,
        showGrid,
        currentBackgroundImg,
        showRegions ? writableRegions : [],
      )

      // 绘制选区矩形
      if (selectionRect) {
        ctx.save()
        ctx.strokeStyle = 'rgba(124, 152, 133, 0.8)'
        ctx.fillStyle = 'rgba(124, 152, 133, 0.1)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.fillRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
        ctx.strokeRect(selectionRect.x, selectionRect.y, selectionRect.width, selectionRect.height)
        ctx.setLineDash([])
        ctx.restore()
      }
    } else {
      renderPreviewMode(
        ctx,
        layouts,
        handwritingStyles,
        params,
        mergedAdjustments,
        currentBackgroundImg,
        writableRegions,
      )
    }
  }, [canvasRef, store])

  // 订阅 store 变化以触发重渲染
  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe(() => {
      render()
    })
    return unsubscribe
  }, [render])

  // 文本/参数/背景变化时重新布局
  useEffect(() => {
    recomputeLayout()
  }, [
    store.text,
    store.params.fontSize,
    store.params.lineHeight,
    store.params.letterSpacing,
    store.params.wordSpacing,
    store.params.firstLineIndent,
    store.params.font,
    store.params.marginTop,
    store.params.marginBottom,
    store.params.marginLeft,
    store.params.marginRight,
    store.params.gridSpacing,
    store.params.autoDetectGrid,
    store.params.autoDetectRegions,
    store.params.autoPageBreak,
    store.canvasSize,
    store.currentBackgroundId,
    store.paperTemplate,
    store.randomSeed,
  ])

  // 根据框选矩形获取选中的字符索引
  const getSelectedIndicesFromRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }): number[] => {
      const { layouts } = useEditorStore.getState()
      const indices: number[] = []

      layouts.forEach((layout, index) => {
        if (layout.isLineBreak) return

        const bbox = getCharBoundingBox(layout, 4)
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

  // 加载背景图
  const loadBackground = useCallback(async (dataUrl: string) => {
    try {
      const img = await loadImage(dataUrl)
      store.setCurrentBackgroundImg(img)
      store.addToast('success', '背景图已加载')
    } catch (e) {
      store.addToast('error', '背景图加载失败')
    }
  }, [store])

  return {
    recomputeLayout,
    autoDetectGrid,
    render,
    getSelectedIndicesFromRect,
    loadBackground,
  }
}
