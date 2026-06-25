import { useEffect, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { getCharBoundingBox } from '../utils/handwriting'

/**
 * 悬浮工具栏
 * 当用户框选文字后，在框选区域附近自动弹出
 * 包含：位置微移、字号微调、旋转、确认等
 */
export function FloatingToolbar() {
  const {
    mode,
    selectedIndices,
    pendingAdjustment,
    setPendingAdjustment,
    applyPendingAdjustment,
    clearSelection,
    addToast,
  } = useEditorStore()

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)

  // 计算工具栏位置（选中区域的上方居中）
  useEffect(() => {
    if (mode !== 'edit' || selectedIndices.size === 0) {
      setPosition(null)
      return
    }

    const { layouts } = useEditorStore.getState()
    let minX = Infinity, maxX = -Infinity, minY = Infinity

    selectedIndices.forEach((idx) => {
      const layout = layouts[idx]
      if (!layout || layout.isLineBreak) return
      const bbox = getCharBoundingBox(layout, 4)
      minX = Math.min(minX, bbox.x)
      maxX = Math.max(maxX, bbox.x + bbox.width)
      minY = Math.min(minY, bbox.y)
    })

    if (minX === Infinity) {
      setPosition(null)
      return
    }

    const centerX = (minX + maxX) / 2
    setPosition({ x: centerX, y: minY - 12 })
  }, [mode, selectedIndices])

  if (!position || mode !== 'edit' || selectedIndices.size === 0) return null

  // 初始化 pending 调整值
  const current = pendingAdjustment || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }

  const updatePending = (updates: Partial<typeof current>) => {
    setPendingAdjustment({ ...current, ...updates })
  }

  // 位置微移（极小步长）
  const nudge = (dx: number, dy: number) => {
    updatePending({
      offsetX: current.offsetX + dx,
      offsetY: current.offsetY + dy,
    })
  }

  // 字号微调
  const adjustScale = (delta: number) => {
    updatePending({
      scale: Math.max(0.3, Math.min(3, current.scale + delta)),
    })
  }

  // 旋转微调
  const adjustRotation = (delta: number) => {
    updatePending({
      rotation: current.rotation + delta,
    })
  }

  // 确认微调（累积保存）
  const handleConfirm = () => {
    applyPendingAdjustment()
    addToast('success', '微调已保存，可继续框选其他区域')
  }

  // 取消
  const handleCancel = () => {
    clearSelection()
    addToast('info', '已取消当前选区')
  }

  return (
    <div
      className="absolute z-30 animate-slide-up"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-paper rounded-lg shadow-float border border-line p-1.5 flex items-center gap-0.5">
        {/* 位置微移组 */}
        <div className="flex items-center gap-0.5 px-1 border-r border-line-soft">
          <span className="text-[10px] text-ink-soft px-1">位置</span>
          <div className="grid grid-cols-3 gap-0.5 w-[60px]">
            <div></div>
            <button
              className="btn-icon w-6 h-6 text-xs"
              onClick={() => nudge(0, -1)}
              title="上移 1px"
            >↑</button>
            <div></div>
            <button
              className="btn-icon w-6 h-6 text-xs"
              onClick={() => nudge(-1, 0)}
              title="左移 1px"
            >←</button>
            <button
              className="btn-icon w-6 h-6 text-xs"
              onClick={() => nudge(0, 1)}
              title="下移 1px"
            >↓</button>
            <button
              className="btn-icon w-6 h-6 text-xs"
              onClick={() => nudge(1, 0)}
              title="右移 1px"
            >→</button>
          </div>
        </div>

        {/* 字号微调组 */}
        <div className="flex items-center gap-1 px-1 border-r border-line-soft">
          <span className="text-[10px] text-ink-soft">字号</span>
          <button
            className="btn-icon w-6 h-6 text-xs"
            onClick={() => adjustScale(-0.02)}
            title="缩小 2%"
          >−</button>
          <span className="text-[10px] text-ink w-8 text-center tabular-nums">
            {(current.scale * 100).toFixed(0)}%
          </span>
          <button
            className="btn-icon w-6 h-6 text-xs"
            onClick={() => adjustScale(0.02)}
            title="放大 2%"
          >+</button>
        </div>

        {/* 旋转微调组 */}
        <div className="flex items-center gap-1 px-1 border-r border-line-soft">
          <span className="text-[10px] text-ink-soft">旋转</span>
          <button
            className="btn-icon w-6 h-6 text-xs"
            onClick={() => adjustRotation(-1)}
            title="逆时针 1°"
          >↺</button>
          <span className="text-[10px] text-ink w-8 text-center tabular-nums">
            {current.rotation.toFixed(0)}°
          </span>
          <button
            className="btn-icon w-6 h-6 text-xs"
            onClick={() => adjustRotation(1)}
            title="顺时针 1°"
          >↻</button>
        </div>

        {/* 确认/取消 */}
        <div className="flex items-center gap-0.5 px-1">
          <button
            className="btn-icon w-7 h-7 text-success hover:text-success-dark"
            onClick={handleConfirm}
            title="确认微调（可继续框选其他区域）"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="btn-icon w-7 h-7 text-error hover:text-error-dark"
            onClick={handleCancel}
            title="取消选区"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* 三角指示器 */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-paper rotate-45 border-r border-b border-line" />
    </div>
  )
}
