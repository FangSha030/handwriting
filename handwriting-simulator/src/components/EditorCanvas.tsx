import { useRef, useEffect, useCallback, useState } from 'react'
import { useEditor } from '../hooks/useEditor'
import { useEditorStore } from '../store/editorStore'
import { getCharBoundingBox } from '../utils/handwriting'

export function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const { render, getSelectedIndicesFromRect, autoDetectGrid } = useEditor(canvasRef)

  const {
    canvasSize,
    setCanvasSize,
    mode,
    selectedIndices,
    setSelectedIndices,
    clearSelection,
    selectionRect,
    setSelectionRect,
    setIsDragging,
    params,
    addToast,
    pages,
    currentPageIndex,
    setCurrentPageIndex,
  } = useEditorStore()

  // 根据页面尺寸预设调整画布
  useEffect(() => {
    const { pageWidth, pageHeight } = params
    setCanvasSize({ width: pageWidth, height: pageHeight })
  }, [params.pageSize, params.pageWidth, params.pageHeight, setCanvasSize])

  // 设置 canvas 实际像素尺寸（考虑 DPR）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      render()
    }
  }, [canvasSize, render])

  // 鼠标按下：开始框选
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'edit') return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsSelecting(true)
    setDragStart({ x, y })
    setSelectionRect({ x, y, width: 0, height: 0 })
    setIsDragging(true)
  }, [mode, setSelectionRect, setIsDragging])

  // 鼠标移动：更新框选
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !dragStart) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRect = {
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y),
    }
    setSelectionRect(newRect)
  }, [isSelecting, dragStart, setSelectionRect])

  // 鼠标抬起：完成框选
  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selectionRect) {
      setIsSelecting(false)
      setIsDragging(false)
      return
    }

    // 只有框选区域足够大才判定
    if (selectionRect.width > 5 && selectionRect.height > 5) {
      const indices = getSelectedIndicesFromRect(selectionRect)
      if (indices.length > 0) {
        setSelectedIndices(new Set(indices))
        addToast('info', `已选中 ${indices.length} 个字符`)
      } else {
        addToast('warn', '未选中任何字符，请尝试框选文字区域')
      }
    }

    setIsSelecting(false)
    setDragStart(null)
    setIsDragging(false)
  }, [isSelecting, selectionRect, getSelectedIndicesFromRect, setSelectedIndices, addToast, setIsDragging])

  // 键盘事件：Esc 取消选中
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection])

  // 缩放显示（适应容器）
  const [displayScale, setDisplayScale] = useState(1)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScale = () => {
      const containerRect = container.getBoundingClientRect()
      const padding = 48
      const scaleX = (containerRect.width - padding) / canvasSize.width
      const scaleY = (containerRect.height - padding) / canvasSize.height
      setDisplayScale(Math.min(scaleX, scaleY, 1))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [canvasSize])

  return (
    <div ref={containerRef} className="flex-1 overflow-auto bg-paper-dark flex items-center justify-center p-6 relative">
      {/* 画布容器（用于缩放） */}
      <div
        style={{
          transform: `scale(${displayScale})`,
          transformOrigin: 'center center',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white shadow-medium rounded-sm cursor-crosshair"
          style={{ display: 'block' }}
        />
      </div>

      {/* 模式标识 */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        {mode === 'edit' ? (
          <span className="mode-badge mode-edit">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            编辑态 · 打印体
          </span>
        ) : (
          <span className="mode-badge mode-preview">
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            最终态 · 手写体
          </span>
        )}
      </div>

      {/* 多页导航 */}
      {pages.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-paper/90 px-3 py-1.5 rounded-full shadow-soft backdrop-blur-sm z-10">
          <button
            className="btn-icon w-6 h-6 disabled:opacity-30"
            onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-xs text-ink-light min-w-[60px] text-center">
            第 {currentPageIndex + 1} / {pages.length} 页
          </span>
          <button
            className="btn-icon w-6 h-6 disabled:opacity-30"
            onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* 画布信息 */}
      <div className="absolute bottom-4 right-4 text-xs text-ink-soft bg-paper/80 px-2 py-1 rounded backdrop-blur-sm z-10">
        {canvasSize.width} × {canvasSize.height} · {Math.round(displayScale * 100)}%
      </div>

      {/* 操作提示 */}
      {mode === 'edit' && selectedIndices.size === 0 && !isSelecting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-soft bg-paper/90 px-3 py-1.5 rounded-full shadow-soft backdrop-blur-sm animate-fade-in z-10">
          鼠标拖拽框选文字进行微调 · 按 Esc 取消选中
        </div>
      )}
    </div>
  )
}
