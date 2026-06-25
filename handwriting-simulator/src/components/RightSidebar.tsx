import { useState, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { detectGridFromLayout, alignToGrid, inferLineHeightFromGrid, generateUniformGrid } from '../utils/gridDetection'

/**
 * 右侧边栏：高精度控制面板 + 横格线设置
 */
export function RightSidebar() {
  const {
    mode,
    selectedIndices,
    pendingAdjustment,
    setPendingAdjustment,
    applyPendingAdjustment,
    clearSelection,
    params,
    setParams,
    showBoundingBoxes,
    setShowBoundingBoxes,
    showGrid,
    setShowGrid,
    showAlignmentGuides,
    setShowAlignmentGuides,
    gridLines,
    setGridLines,
    gridAutoDetected,
    setGridAutoDetected,
    canvasSize,
    addToast,
    adjustments,
  } = useEditorStore()

  const [activeTab, setActiveTab] = useState<'precision' | 'grid'>('precision')

  const current = pendingAdjustment || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
  const hasSelection = selectedIndices.size > 0 && mode === 'edit'

  // 同步 pending 值到输入框
  const [inputValues, setInputValues] = useState({
    offsetX: '0',
    offsetY: '0',
    scale: '100',
    rotation: '0',
  })

  useEffect(() => {
    if (pendingAdjustment) {
      setInputValues({
        offsetX: pendingAdjustment.offsetX.toFixed(2),
        offsetY: pendingAdjustment.offsetY.toFixed(2),
        scale: (pendingAdjustment.scale * 100).toFixed(1),
        rotation: pendingAdjustment.rotation.toFixed(2),
      })
    } else {
      setInputValues({ offsetX: '0', offsetY: '0', scale: '100', rotation: '0' })
    }
  }, [pendingAdjustment, selectedIndices])

  // 数值输入更新
  const handleNumberInput = (field: 'offsetX' | 'offsetY' | 'scale' | 'rotation', value: string) => {
    setInputValues((prev) => ({ ...prev, [field]: value }))
    const num = parseFloat(value) || 0
    if (field === 'scale') {
      setPendingAdjustment({ ...current, scale: num / 100 })
    } else if (field === 'rotation') {
      setPendingAdjustment({ ...current, rotation: num })
    } else {
      setPendingAdjustment({ ...current, [field]: num })
    }
  }

  // 横格线自动检测
  const handleAutoDetectGrid = () => {
    const { layouts } = useEditorStore.getState()
    const detected = detectGridFromLayout(layouts)
    if (detected.length > 0) {
      setGridLines(detected)
      setGridAutoDetected(true)
      addToast('success', `检测到 ${detected.length} 条横格线`)
    } else {
      addToast('warn', '未检测到横格线，请先输入文本')
    }
  }

  // 自动基线对齐
  const handleAutoAlign = () => {
    const { layouts } = useEditorStore.getState()
    if (gridLines.length === 0) {
      addToast('warn', '请先检测横格线')
      return
    }
    const aligned = alignToGrid(layouts, gridLines, 30)
    useEditorStore.getState().setLayouts(aligned)
    addToast('success', '已自动对齐到横格线')
  }

  // 生成均匀横格线
  const handleGenerateUniformGrid = () => {
    const spacing = params.fontSize * params.lineHeight
    const lines = generateUniformGrid(
      params.fontSize + 40,
      canvasSize.height - 40,
      spacing,
    )
    setGridLines(lines)
    setGridAutoDetected(false)
    addToast('success', `已生成 ${lines.length} 条均匀横格线`)
  }

  // 清除横格线
  const handleClearGrid = () => {
    setGridLines([])
    setGridAutoDetected(false)
    addToast('info', '已清除横格线')
  }

  return (
    <aside className="w-72 bg-paper border-l border-line-soft flex flex-col overflow-hidden">
      {/* Tab 切换 */}
      <div className="flex border-b border-line-soft">
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'precision'
              ? 'text-accent-dark border-b-2 border-accent bg-accent/5'
              : 'text-ink-light hover:text-ink'
          }`}
          onClick={() => setActiveTab('precision')}
        >
          高精度微调
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'grid'
              ? 'text-accent-dark border-b-2 border-accent bg-accent/5'
              : 'text-ink-light hover:text-ink'
          }`}
          onClick={() => setActiveTab('grid')}
        >
          横格对齐
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'precision' ? (
          <div className="p-4 space-y-4">
            {/* 选中状态提示 */}
            <div className={`rounded-lg p-3 text-xs ${
              hasSelection
                ? 'bg-accent/10 text-accent-dark border border-accent/20'
                : 'bg-paper-dark/50 text-ink-soft border border-line-soft'
            }`}>
              {hasSelection ? (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>已选中 <strong>{selectedIndices.size}</strong> 个字符</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>请在画布上框选文字后进行微调</span>
                </div>
              )}
            </div>

            {/* 位置 X */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">水平偏移 (X)</label>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('offsetX', (parseFloat(inputValues.offsetX) - 0.5).toFixed(2))}
                  >−</button>
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('offsetX', (parseFloat(inputValues.offsetX) + 0.5).toFixed(2))}
                  >+</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  value={inputValues.offsetX}
                  onChange={(e) => handleNumberInput('offsetX', e.target.value)}
                  disabled={!hasSelection}
                  className="input-base flex-1 tabular-nums disabled:bg-paper-dark/50"
                />
                <span className="text-xs text-ink-soft w-6">px</span>
              </div>
              <p className="text-[10px] text-ink-soft mt-1">步长 0.5px，支持键盘输入精确值</p>
            </div>

            {/* 位置 Y */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">垂直偏移 (Y)</label>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('offsetY', (parseFloat(inputValues.offsetY) - 0.5).toFixed(2))}
                  >−</button>
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('offsetY', (parseFloat(inputValues.offsetY) + 0.5).toFixed(2))}
                  >+</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  value={inputValues.offsetY}
                  onChange={(e) => handleNumberInput('offsetY', e.target.value)}
                  disabled={!hasSelection}
                  className="input-base flex-1 tabular-nums disabled:bg-paper-dark/50"
                />
                <span className="text-xs text-ink-soft w-6">px</span>
              </div>
              <p className="text-[10px] text-ink-soft mt-1">步长 0.5px，支持键盘输入精确值</p>
            </div>

            {/* 字号缩放 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">字号缩放</label>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('scale', (parseFloat(inputValues.scale) - 1).toFixed(1))}
                  >−</button>
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('scale', (parseFloat(inputValues.scale) + 1).toFixed(1))}
                  >+</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="1"
                  value={inputValues.scale}
                  onChange={(e) => handleNumberInput('scale', e.target.value)}
                  disabled={!hasSelection}
                  className="input-base flex-1 tabular-nums disabled:bg-paper-dark/50"
                />
                <span className="text-xs text-ink-soft w-6">%</span>
              </div>
              <p className="text-[10px] text-ink-soft mt-1">步长 1%，100% 为原始大小</p>
            </div>

            {/* 旋转 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">旋转角度</label>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('rotation', (parseFloat(inputValues.rotation) - 0.5).toFixed(2))}
                  >−</button>
                  <button
                    className="btn-icon w-5 h-5 text-[10px] disabled:opacity-30"
                    disabled={!hasSelection}
                    onClick={() => handleNumberInput('rotation', (parseFloat(inputValues.rotation) + 0.5).toFixed(2))}
                  >+</button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  value={inputValues.rotation}
                  onChange={(e) => handleNumberInput('rotation', e.target.value)}
                  disabled={!hasSelection}
                  className="input-base flex-1 tabular-nums disabled:bg-paper-dark/50"
                />
                <span className="text-xs text-ink-soft w-6">°</span>
              </div>
              <p className="text-[10px] text-ink-soft mt-1">步长 0.5°，正值顺时针</p>
            </div>

            {/* 颜色覆盖 */}
            <div>
              <label className="label">颜色覆盖（可选）</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={current.color || params.color}
                  onChange={(e) => setPendingAdjustment({ ...current, color: e.target.value })}
                  disabled={!hasSelection}
                  className="w-10 h-8 rounded border border-line cursor-pointer disabled:opacity-50"
                />
                <button
                  className="btn-secondary text-xs flex-1 disabled:opacity-50"
                  disabled={!hasSelection}
                  onClick={() => setPendingAdjustment({ ...current, color: undefined })}
                >
                  清除颜色
                </button>
              </div>
            </div>

            <div className="divider" />

            {/* 操作按钮 */}
            <div className="space-y-2">
              <button
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!hasSelection}
                onClick={() => {
                  applyPendingAdjustment()
                  addToast('success', '微调已保存，可继续框选其他区域')
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                确认微调（可继续框选）
              </button>
              <button
                className="btn-secondary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!hasSelection}
                onClick={() => {
                  clearSelection()
                  addToast('info', '已取消当前选区')
                }}
              >
                取消选区
              </button>
            </div>

            {/* 微调统计 */}
            {adjustments.length > 0 && (
              <div className="bg-paper-dark/50 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-soft">已保存微调</span>
                  <span className="text-ink font-medium">{adjustments.length} 组</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">涉及字符</span>
                  <span className="text-ink font-medium">
                    {new Set(adjustments.flatMap((a) => a.charIndices)).size} 个
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* 横格线状态 */}
            <div className={`rounded-lg p-3 text-xs ${
              gridLines.length > 0
                ? 'bg-accent/10 text-accent-dark border border-accent/20'
                : 'bg-paper-dark/50 text-ink-soft border border-line-soft'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">横格线状态</span>
              </div>
              <div className="ml-6 space-y-0.5">
                <div>检测到 <strong>{gridLines.length}</strong> 条横格线</div>
                <div>来源：{gridAutoDetected ? '自动检测' : '手动生成'}</div>
                {gridLines.length >= 2 && (
                  <div>平均间距：<strong>{inferLineHeightFromGrid(gridLines)}px</strong></div>
                )}
              </div>
            </div>

            {/* 横格线操作 */}
            <div className="space-y-2">
              <button
                className="btn-primary w-full text-xs"
                onClick={handleAutoDetectGrid}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                自动检测横格线
              </button>
              <button
                className="btn-secondary w-full text-xs"
                onClick={handleGenerateUniformGrid}
              >
                生成均匀横格线
              </button>
              <button
                className="btn-secondary w-full text-xs"
                onClick={handleAutoAlign}
                disabled={gridLines.length === 0}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                  <path d="M5 12a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                </svg>
                自动基线对齐
              </button>
              <button
                className="btn-ghost w-full text-xs text-error"
                onClick={handleClearGrid}
                disabled={gridLines.length === 0}
              >
                清除横格线
              </button>
            </div>

            <div className="divider" />

            {/* 横格线参数 */}
            <div>
              <label className="label">横格线颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={params.gridColor}
                  onChange={(e) => setParams({ gridColor: e.target.value })}
                  className="w-10 h-8 rounded border border-line cursor-pointer"
                />
                <input
                  type="text"
                  value={params.gridColor}
                  onChange={(e) => setParams({ gridColor: e.target.value })}
                  className="input-base flex-1 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label">纸张颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={params.paperColor}
                  onChange={(e) => setParams({ paperColor: e.target.value })}
                  className="w-10 h-8 rounded border border-line cursor-pointer"
                />
                <input
                  type="text"
                  value={params.paperColor}
                  onChange={(e) => setParams({ paperColor: e.target.value })}
                  className="input-base flex-1 font-mono text-xs"
                />
              </div>
            </div>

            <div className="divider" />

            {/* 辅助线开关 */}
            <div className="space-y-2">
              <label className="label font-semibold text-ink">辅助显示</label>
              <Toggle
                label="显示横格线"
                checked={showGrid}
                onChange={setShowGrid}
              />
              <Toggle
                label="显示字符边界框"
                checked={showBoundingBoxes}
                onChange={setShowBoundingBoxes}
              />
              <Toggle
                label="自动基线对齐"
                checked={showAlignmentGuides}
                onChange={setShowAlignmentGuides}
              />
            </div>

            <div className="divider" />

            {/* 说明 */}
            <div className="bg-paper-dark/50 rounded-lg p-3 text-[11px] text-ink-soft leading-relaxed">
              <p className="font-medium text-ink mb-1">横格对齐说明</p>
              <p>1. 自动检测：根据文本布局生成横格线</p>
              <p>2. 均匀生成：按行高间距均匀分布</p>
              <p>3. 基线对齐：将文字基线吸附到横格线，容差 30px</p>
              <p>4. 编辑态显示辅助线，最终态淡化显示</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

/** 开关组件 */
function Toggle({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-xs text-ink-light">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </label>
  )
}
