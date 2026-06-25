import { useEditorStore } from '../store/editorStore'

/**
 * 顶部工具栏
 * 包含：模式切换、保存/最终预览、导出、撤销等操作
 */
export function TopToolbar() {
  const {
    mode,
    setMode,
    adjustments,
    clearAdjustments,
    addToast,
    params,
  } = useEditorStore()

  // 切换到最终预览
  const handlePreview = () => {
    setMode('preview')
    addToast('success', '已切换到最终手写体渲染')
  }

  // 切换回编辑态
  const handleEdit = () => {
    setMode('edit')
    addToast('info', '已切换到编辑态')
  }

  // 导出为 PNG
  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    // 创建一个临时 canvas 用于导出（不包含 DPR 缩放）
    const exportCanvas = document.createElement('canvas')
    const dpr = window.devicePixelRatio || 1
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // 将原 canvas 内容绘制到导出 canvas
    ctx.drawImage(canvas, 0, 0)

    // 下载
    const link = document.createElement('a')
    link.download = `handwriting-${Date.now()}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
    addToast('success', '已导出 PNG 图片')
  }

  // 导出为 JSON 配置
  const handleExportConfig = () => {
    const state = useEditorStore.getState()
    const config = {
      text: state.text,
      params: state.params,
      adjustments: state.adjustments,
      gridLines: state.gridLines,
      randomSeed: state.randomSeed,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `handwriting-config-${Date.now()}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
    addToast('success', '已导出配置文件')
  }

  // 重置所有微调
  const handleReset = () => {
    if (adjustments.length === 0) {
      addToast('info', '没有需要重置的微调')
      return
    }
    clearAdjustments()
    addToast('success', '已重置所有微调')
  }

  return (
    <header className="h-14 bg-paper border-b border-line-soft flex items-center justify-between px-4 flex-shrink-0">
      {/* 左侧：Logo + 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="21" cy="7" r="1.5" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-ink leading-tight">手写笔迹模拟器</h1>
          <p className="text-[10px] text-ink-soft leading-tight">Handwriting Simulator</p>
        </div>
      </div>

      {/* 中间：模式切换 */}
      <div className="flex items-center gap-1 bg-paper-dark rounded-lg p-1 border border-line-soft">
        <button
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
            mode === 'edit'
              ? 'bg-warn text-white shadow-soft'
              : 'text-ink-light hover:text-ink'
          }`}
          onClick={handleEdit}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          编辑态
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
            mode === 'preview'
              ? 'bg-accent text-white shadow-soft'
              : 'text-ink-light hover:text-ink'
          }`}
          onClick={handlePreview}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          最终预览
        </button>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-1.5">
        {/* 微调数量提示 */}
        {adjustments.length > 0 && (
          <span className="text-xs text-ink-soft mr-2">
            <span className="inline-flex items-center gap-1 bg-accent/10 text-accent-dark px-2 py-1 rounded-full">
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              {adjustments.length} 组微调
            </span>
          </span>
        )}

        <button
          className="btn-ghost text-xs"
          onClick={handleReset}
          title="重置所有微调"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          重置微调
        </button>

        <div className="w-px h-6 bg-line-soft mx-1" />

        <button
          className="btn-secondary text-xs"
          onClick={handleExportConfig}
          title="导出配置 JSON"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 4.25C2 3.56 2.56 3 3.25 3h5.5a.75.75 0 010 1.5h-5.5a.25.25 0 00-.25.25v11.5c0 .138.112.25.25.25h11.5a.25.25 0 00.25-.25v-5.5a.75.75 0 011.5 0v5.5A1.75 1.75 0 0114.75 18H3.25A1.75 1.75 0 012 16.25V4.25z" clipRule="evenodd" />
            <path d="M11 13.25a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z" />
            <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06l1.22-1.22h-3.94a.75.75 0 010-1.5h3.94l-1.22-1.22a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
          导出配置
        </button>

        <button
          className="btn-primary text-xs"
          onClick={handleExportPNG}
          title="导出为 PNG 图片"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          导出图片
        </button>
      </div>
    </header>
  )
}
