import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'

export function TopToolbar() {
  const {
    mode,
    setMode,
    adjustments,
    clearAdjustments,
    addToast,
    params,
    pages,
    currentPageIndex,
  } = useEditorStore()

  const [isExporting, setIsExporting] = useState(false)

  const handlePreview = () => {
    setMode('preview')
    addToast('success', '已切换到最终手写体渲染')
  }

  const handleEdit = () => {
    setMode('edit')
    addToast('info', '已切换到编辑态')
  }

  // 导出当前页为 PNG
  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(canvas, 0, 0)

    const link = document.createElement('a')
    link.download = `handwriting-page${currentPageIndex + 1}-${Date.now()}.png`
    link.href = exportCanvas.toDataURL('image/png')
    link.click()
    addToast('success', `已导出第 ${currentPageIndex + 1} 页 PNG`)
  }

  // 导出所有页为 PNG（打包下载）
  const handleExportAllPNG = async () => {
    if (pages.length <= 1) {
      handleExportPNG()
      return
    }

    setIsExporting(true)
    addToast('info', `正在导出 ${pages.length} 页...`)

    // 简化实现：逐页导出（实际项目可用 JSZip 打包）
    for (let i = 0; i < pages.length; i++) {
      // 切换到该页
      useEditorStore.getState().setCurrentPageIndex(i)
      await new Promise((r) => setTimeout(r, 500)) // 等待渲染

      const canvas = document.querySelector('canvas')
      if (!canvas) continue

      const link = document.createElement('a')
      link.download = `handwriting-page${i + 1}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      await new Promise((r) => setTimeout(r, 300))
    }

    setIsExporting(false)
    addToast('success', `已导出全部 ${pages.length} 页`)
  }

  // 导出为 JSON 配置
  const handleExportConfig = () => {
    const state = useEditorStore.getState()
    const config = {
      version: '2.0',
      text: state.text,
      params: state.params,
      adjustments: state.adjustments,
      gridLines: state.gridLines,
      randomSeed: state.randomSeed,
      paperTemplate: state.paperTemplate,
      pagesCount: state.pages.length,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `handwriting-config-${Date.now()}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    addToast('success', '配置已导出')
  }

  return (
    <header className="h-12 bg-paper border-b border-line-soft flex items-center justify-between px-4 shrink-0">
      {/* 左侧：Logo + 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M14 2a1 1 0 011 1v2.382l1.447.723a1 1 0 11-.894 1.79l-1.448-.724A2 2 0 0014 7H6a2 2 0 00-1.105.335l-1.447.724a1 1 0 11-.894-1.79L4 5.382V3a1 1 0 011-1h9z" />
            <path d="M4 14h12v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-ink leading-tight">手写笔迹模拟器</h1>
          <p className="text-[10px] text-ink-soft leading-tight">Pro · 多背景 · 自动分页</p>
        </div>
      </div>

      {/* 中间：模式切换 */}
      <div className="flex items-center gap-1 bg-paper-dark rounded-lg p-1">
        <button
          onClick={handleEdit}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === 'edit' ? 'bg-white text-ink shadow-soft' : 'text-ink-light hover:text-ink'
          }`}
        >
          ✎ 编辑态
        </button>
        <button
          onClick={handlePreview}
          className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === 'preview' ? 'bg-white text-accent-dark shadow-soft' : 'text-ink-light hover:text-ink'
          }`}
        >
          ✦ 最终预览
        </button>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {adjustments.length > 0 && (
          <button
            onClick={() => {
              clearAdjustments()
              addToast('info', '已重置所有微调')
            }}
            className="btn-ghost text-xs"
            title="重置所有微调"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            重置微调
          </button>
        )}

        <div className="w-px h-6 bg-line-soft mx-1" />

        <button
          onClick={handleExportConfig}
          className="btn-secondary text-xs"
          title="导出配置 JSON"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          配置
        </button>

        <button
          onClick={handleExportPNG}
          className="btn-secondary text-xs"
          title="导出当前页 PNG"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          当前页
        </button>

        <button
          onClick={handleExportAllPNG}
          disabled={isExporting}
          className="btn-primary text-xs disabled:opacity-50"
          title="导出所有页 PNG"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {isExporting ? '导出中...' : `导出全部 (${pages.length}页)`}
        </button>
      </div>
    </header>
  )
}
