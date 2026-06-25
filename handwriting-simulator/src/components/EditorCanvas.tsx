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
  } = useEditorStore()

  // 根据容器大小调整画布
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      const padding = 48
      const width = Math.max(400, rect.width - padding)
      const height = Math.max(400, rect.height - padding)
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [setCanvasSize])

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
    }
    render()
  }, [canvasSize, render])

  // 获取鼠标在画布坐标系中的位置
  const getCanvasPos = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  // 鼠标按下：开始框选
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode !== 'edit') return
    if (e.button !== 0) return

    const pos = getCanvasPos(e)
    setIsSelecting(true)
    setIsDragging(true)
    setDragStart(pos)
    setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 })
  }, [mode, getCanvasPos, setIsDragging, setSelectionRect])

  // 鼠标移动：更新框选矩形
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !dragStart) return

    const pos = getCanvasPos(e)
    const rect = {
      x: Math.min(dragStart.x, pos.x),
      y: Math.min(dragStart.y, pos.y),
      width: Math.abs(pos.x - dragStart.x),
      height: Math.abs(pos.y - dragStart.y),
    }
    setSelectionRect(rect)
  }, [isSelecting, dragStart, getCanvasPos, setSelectionRect])

  // 鼠标抬起：完成框选，计算选中字符
  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return
    setIsSelecting(false)
    setIsDragging(false)

    if (selectionRect && (selectionRect.width > 3 || selectionRect.height > 3)) {
      const indices = getSelectedIndicesFromRect(selectionRect)
      if (indices.length > 0) {
        setSelectedIndices(new Set(indices))
        addToast('success', `已框选 ${indices.length} 个字符，可进行微调`)
      } else {
        addToast('info', '框选区域内未检测到文字')
      }
    }

    setDragStart(null)
  }, [isSelecting, selectionRect, getSelectedIndicesFromRect, setSelectedIndices, addToast, setIsDragging])

  // 点击空白处取消选中
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'edit') return
    // 如果是拖拽结束的小范围移动，视为点击空白
    if (selectionRect && selectionRect.width < 3 && selectionRect.height < 3) {
      clearSelection()
    }
  }, [mode, selectionRect, clearSelection])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'edit') return
      // Esc 取消选中
      if (e.key === 'Escape') {
        clearSelection()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, clearSelection])

  // 绘制框选矩形覆盖层
  const renderSelectionOverlay = () => {
    if (!selectionRect || !isSelecting) return null
    return (
      <div
        className="absolute border-2 border-accent bg-accent/10 pointer-events-none rounded-sm"
        style={{
          left: selectionRect.x,
          top: selectionRect.y,
          width: selectionRect.width,
          height: selectionRect.height,
        }}
      />
    )
  }

  // 绘制选中字符的高亮覆盖层
  const renderSelectedHighlight = () => {
    if (mode !== 'edit' || selectedIndices.size === 0) return null
    const { layouts } = useEditorStore.getState()
    const highlights: React.ReactNode[] = []

    selectedIndices.forEach((idx) => {
      const layout = layouts[idx]
      if (!layout || layout.isLineBreak) return
      const bbox = getCharBoundingBox(layout, 4)
      highlights.push(
        <div
          key={idx}
          className="absolute border border-accent/60 bg-accent/8 pointer-events-none rounded-sm"
          style={{
            left: bbox.x,
            top: bbox.y,
            width: bbox.width,
            height: bbox.height,
          }}
        />,
      )
    })

    return <>{highlights}</>
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-paper-dark/50 overflow-hidden relative"
    >
      {/* 画布容器 */}
      <div className="relative shadow-medium rounded-sm overflow-hidden">
        <canvas
          ref={canvasRef}
          className={`block bg-white cursor-${mode === 'edit' ? (isSelecting ? 'crosshair' : 'text') : 'default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        />
        {/* 覆盖层 */}
        <div className="absolute inset-0 pointer-events-none">
          {renderSelectionOverlay()}
          {renderSelectedHighlight()}
        </div>
      </div>

      {/* 模式标识 */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
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

      {/* 画布信息 */}
      <div className="absolute bottom-4 right-4 text-xs text-ink-soft bg-paper/80 px-2 py-1 rounded backdrop-blur-sm">
        {canvasSize.width} × {canvasSize.height}
      </div>

      {/* 操作提示 */}
      {mode === 'edit' && selectedIndices.size === 0 && !isSelecting && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ink-soft bg-paper/90 px-3 py-1.5 rounded-full shadow-soft backdrop-blur-sm animate-fade-in">
          鼠标拖拽框选文字进行微调 · 按 Esc 取消选中
        </div>
      )}
    </div>
  )
}
