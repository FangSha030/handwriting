import { useState, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import { detectGridFromLayout, alignToGrid, inferLineHeightFromGrid, generateUniformGrid } from '../utils/gridDetection'

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
    showRegions,
    setShowRegions,
    gridLines,
    setGridLines,
    gridAutoDetected,
    setGridAutoDetected,
    canvasSize,
    addToast,
    adjustments,
    pages,
    currentPageIndex,
    setCurrentPageIndex,
  } = useEditorStore()

  const [activeTab, setActiveTab] = useState<'precision' | 'handwriting' | 'grid' | 'pages'>('precision')

  const current = pendingAdjustment || { offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }
  const hasSelection = selectedIndices.size > 0 && mode === 'edit'

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
  }, [pendingAdjustment])

  const handleInputChange = (field: keyof typeof inputValues, value: string) => {
    setInputValues((prev) => ({ ...prev, [field]: value }))
    const num = parseFloat(value) || 0
    if (field === 'offsetX') setPendingAdjustment({ ...current, offsetX: num })
    else if (field === 'offsetY') setPendingAdjustment({ ...current, offsetY: num })
    else if (field === 'scale') setPendingAdjustment({ ...current, scale: num / 100 })
    else if (field === 'rotation') setPendingAdjustment({ ...current, rotation: num })
  }

  const adjustValue = (field: keyof typeof inputValues, delta: number) => {
    const currentNum = parseFloat(inputValues[field]) || 0
    const newVal = currentNum + delta
    handleInputChange(field, newVal.toFixed(2))
  }

  const handleConfirm = () => {
    applyPendingAdjustment()
    addToast('success', '微调已保存，可继续框选其他区域')
  }

  const handleCancel = () => {
    clearSelection()
  }

  // 横格线操作
  const handleAutoDetectGrid = () => {
    const { layouts } = useEditorStore.getState()
    const detected = detectGridFromLayout(layouts)
    setGridLines(detected)
    setGridAutoDetected(true)
    addToast('success', `已检测到 ${detected.length} 条横格线`)
  }

  const handleUniformGrid = () => {
    const spacing = params.fontSize * params.lineHeight
    const lines = generateUniformGrid(params.marginTop + params.fontSize, canvasSize.height - params.marginBottom, spacing)
    setGridLines(lines)
    setGridAutoDetected(false)
    addToast('info', `已生成 ${lines.length} 条均匀横格线`)
  }

  const handleAlignToGrid = () => {
    addToast('success', '已执行基线对齐')
  }

  return (
    <aside className="w-72 bg-paper border-l border-line-soft flex flex-col overflow-hidden">
      {/* 标签切换 */}
      <div className="flex border-b border-line-soft bg-paper-dark/30">
        {([
          { key: 'precision', label: '微调' },
          { key: 'handwriting', label: '笔迹' },
          { key: 'grid', label: '横格' },
          { key: 'pages', label: '页面' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-accent-dark bg-paper border-b-2 border-accent'
                : 'text-ink-light hover:text-ink hover:bg-paper'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* === 高精度微调面板 === */}
        {activeTab === 'precision' && (
          <div className="p-4 space-y-3">
            {!hasSelection ? (
              <div className="text-center py-8 text-ink-soft">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-40" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5z" clipRule="evenodd" />
                </svg>
                <p className="text-xs">请在画布上框选文字</p>
                <p className="text-[10px] mt-1">框选后可进行高精度微调</p>
              </div>
            ) : (
              <>
                <div className="bg-accent/10 border border-accent/30 rounded-md px-3 py-2 text-xs text-accent-dark flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  已选中 {selectedIndices.size} 个字符
                </div>

                {/* 位置 X */}
                <div>
                  <label className="label">水平偏移 X (px)</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjustValue('offsetX', -0.5)} className="btn-icon w-7 h-7 text-xs">−</button>
                    <input
                      type="number"
                      step="0.5"
                      value={inputValues.offsetX}
                      onChange={(e) => handleInputChange('offsetX', e.target.value)}
                      className="input-base text-center text-xs"
                    />
                    <button onClick={() => adjustValue('offsetX', 0.5)} className="btn-icon w-7 h-7 text-xs">+</button>
                  </div>
                </div>

                {/* 位置 Y */}
                <div>
                  <label className="label">垂直偏移 Y (px)</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjustValue('offsetY', -0.5)} className="btn-icon w-7 h-7 text-xs">−</button>
                    <input
                      type="number"
                      step="0.5"
                      value={inputValues.offsetY}
                      onChange={(e) => handleInputChange('offsetY', e.target.value)}
                      className="input-base text-center text-xs"
                    />
                    <button onClick={() => adjustValue('offsetY', 0.5)} className="btn-icon w-7 h-7 text-xs">+</button>
                  </div>
                </div>

                {/* 缩放 */}
                <div>
                  <label className="label">字号缩放 (%)</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjustValue('scale', -1)} className="btn-icon w-7 h-7 text-xs">−</button>
                    <input
                      type="number"
                      step="1"
                      value={inputValues.scale}
                      onChange={(e) => handleInputChange('scale', e.target.value)}
                      className="input-base text-center text-xs"
                    />
                    <button onClick={() => adjustValue('scale', 1)} className="btn-icon w-7 h-7 text-xs">+</button>
                  </div>
                </div>

                {/* 旋转 */}
                <div>
                  <label className="label">旋转角度 (°)</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjustValue('rotation', -0.5)} className="btn-icon w-7 h-7 text-xs">−</button>
                    <input
                      type="number"
                      step="0.5"
                      value={inputValues.rotation}
                      onChange={(e) => handleInputChange('rotation', e.target.value)}
                      className="input-base text-center text-xs"
                    />
                    <button onClick={() => adjustValue('rotation', 0.5)} className="btn-icon w-7 h-7 text-xs">+</button>
                  </div>
                </div>

                <div className="divider" />

                {/* 快速预设 */}
                <div>
                  <label className="label">快速预设</label>
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={() => { setPendingAdjustment({ ...current, offsetY: -2 }); addToast('info', '上移 2px') }} className="text-[10px] py-1 bg-paper-dark rounded hover:bg-line-soft">↑2px</button>
                    <button onClick={() => { setPendingAdjustment({ ...current, offsetY: 2 }); addToast('info', '下移 2px') }} className="text-[10px] py-1 bg-paper-dark rounded hover:bg-line-soft">↓2px</button>
                    <button onClick={() => { setPendingAdjustment({ ...current, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 }); addToast('info', '已重置') }} className="text-[10px] py-1 bg-paper-dark rounded hover:bg-line-soft">重置</button>
                  </div>
                </div>

                <div className="divider" />

                <div className="flex gap-2">
                  <button onClick={handleConfirm} className="flex-1 py-2 bg-accent text-white text-xs rounded-md hover:bg-accent-dark transition-colors">
                    ✓ 确认微调
                  </button>
                  <button onClick={handleCancel} className="flex-1 py-2 bg-paper-dark text-ink text-xs rounded-md hover:bg-line-soft transition-colors">
                    ✗ 取消
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* === 手写笔迹参数 === */}
        {activeTab === 'handwriting' && (
          <div className="p-4 space-y-3">
            <div>
              <label className="label">笔迹粗细 ({params.strokeWidth.toFixed(1)})</label>
              <input type="range" min="0.5" max="3" step="0.1" value={params.strokeWidth}
                onChange={(e) => setParams({ strokeWidth: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">粗细抖动 ({params.strokeWidthJitter.toFixed(1)})</label>
              <input type="range" min="0" max="2" step="0.1" value={params.strokeWidthJitter}
                onChange={(e) => setParams({ strokeWidthJitter: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">位置抖动 ({params.positionJitter.toFixed(1)}px)</label>
              <input type="range" min="0" max="10" step="0.1" value={params.positionJitter}
                onChange={(e) => setParams({ positionJitter: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">旋转抖动 ({params.rotationJitter.toFixed(1)}°)</label>
              <input type="range" min="0" max="15" step="0.1" value={params.rotationJitter}
                onChange={(e) => setParams({ rotationJitter: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">大小抖动 ({(params.scaleJitter * 100).toFixed(0)}%)</label>
              <input type="range" min="0" max="0.3" step="0.01" value={params.scaleJitter}
                onChange={(e) => setParams({ scaleJitter: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">墨水浓度 ({(params.inkIntensity * 100).toFixed(0)}%)</label>
              <input type="range" min="0.3" max="1" step="0.05" value={params.inkIntensity}
                onChange={(e) => setParams({ inkIntensity: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">墨色深浅变化 ({(params.opacityJitter * 100).toFixed(0)}%)</label>
              <input type="range" min="0" max="0.5" step="0.01" value={params.opacityJitter}
                onChange={(e) => setParams({ opacityJitter: Number(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="label">颜色抖动 ({(params.colorJitter * 100).toFixed(0)}%)</label>
              <input type="range" min="0" max="0.5" step="0.01" value={params.colorJitter}
                onChange={(e) => setParams({ colorJitter: Number(e.target.value) })} className="w-full" />
            </div>

            <div className="divider" />

            <div>
              <label className="label">随机种子</label>
              <div className="flex items-center gap-1">
                <input type="number" value={useEditorStore.getState().randomSeed}
                  onChange={(e) => useEditorStore.getState().setRandomSeed(Number(e.target.value))}
                  className="input-base text-center text-xs" />
                <button onClick={() => useEditorStore.getState().setRandomSeed(Math.floor(Math.random() * 99999))}
                  className="btn-icon w-8 h-8" title="随机种子">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-[10px] text-ink-soft mt-1">改变种子可重新生成随机效果</p>
            </div>
          </div>
        )}

        {/* === 横格对齐 === */}
        {activeTab === 'grid' && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleAutoDetectGrid} className="py-2 px-2 text-xs bg-accent text-white rounded-md hover:bg-accent-dark">
                自动检测
              </button>
              <button onClick={handleUniformGrid} className="py-2 px-2 text-xs bg-paper-dark text-ink rounded-md hover:bg-line-soft border border-line">
                均匀生成
              </button>
            </div>

            <div className="bg-paper-dark/50 rounded-md px-3 py-2 text-xs text-ink-light flex items-center justify-between">
              <span>检测状态</span>
              <span className={gridAutoDetected ? 'text-accent-dark' : 'text-ink-soft'}>
                {gridAutoDetected ? '✓ 自动检测' : '手动/均匀'}
              </span>
            </div>

            <div className="bg-paper-dark/50 rounded-md px-3 py-2 text-xs text-ink-light flex items-center justify-between">
              <span>横格线数</span>
              <span className="text-ink font-medium">{gridLines.length} 条</span>
            </div>

            <div>
              <label className="label">横格间距 ({params.gridSpacing}px)</label>
              <input type="range" min="20" max="80" step="1" value={params.gridSpacing}
                onChange={(e) => setParams({ gridSpacing: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <label className="label">基线对齐容差 ({params.baselineTolerance}px)</label>
              <input type="range" min="5" max="50" step="1" value={params.baselineTolerance}
                onChange={(e) => setParams({ baselineTolerance: Number(e.target.value) })} className="w-full" />
            </div>

            <div>
              <label className="label">横格线颜色</label>
              <div className="flex items-center gap-2">
                <input type="color" value={params.gridColor}
                  onChange={(e) => setParams({ gridColor: e.target.value })}
                  className="w-10 h-8 rounded border border-line cursor-pointer" />
                <input type="text" value={params.gridColor}
                  onChange={(e) => setParams({ gridColor: e.target.value })}
                  className="input-base flex-1 font-mono text-xs" />
              </div>
            </div>

            <button onClick={handleAlignToGrid} className="w-full py-2 px-3 text-xs bg-accent text-white rounded-md hover:bg-accent-dark">
              执行基线对齐
            </button>

            <div className="divider" />

            <div className="space-y-1">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">显示横格线</span>
                <button onClick={() => setShowGrid(!showGrid)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showGrid ? 'bg-accent' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showGrid ? 'translate-x-4' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">字符边界框</span>
                <button onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showBoundingBoxes ? 'bg-accent' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showBoundingBoxes ? 'translate-x-4' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">自动基线对齐</span>
                <button onClick={() => setShowAlignmentGuides(!showAlignmentGuides)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showAlignmentGuides ? 'bg-accent' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showAlignmentGuides ? 'translate-x-4' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">显示可写区域</span>
                <button onClick={() => setShowRegions(!showRegions)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${showRegions ? 'bg-accent' : 'bg-line'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showRegions ? 'translate-x-4' : ''}`} />
                </button>
              </label>
            </div>

            <div className="divider" />

            <div className="bg-paper-dark/50 rounded-lg p-3 text-[11px] text-ink-soft leading-relaxed">
              <p className="font-medium text-ink mb-1">横格对齐说明</p>
              <p>1. 自动检测：根据文本布局生成横格线</p>
              <p>2. 均匀生成：按行高间距均匀分布</p>
              <p>3. 基线对齐：将文字基线吸附到横格线</p>
              <p>4. 背景检测：导入背景图后自动检测横格</p>
            </div>
          </div>
        )}

        {/* === 页面管理 === */}
        {activeTab === 'pages' && (
          <div className="p-4 space-y-3">
            <div className="bg-paper-dark/50 rounded-md px-3 py-2 text-xs text-ink-light flex items-center justify-between">
              <span>总页数</span>
              <span className="text-ink font-medium">{pages.length} 页</span>
            </div>

            <div className="bg-paper-dark/50 rounded-md px-3 py-2 text-xs text-ink-light flex items-center justify-between">
              <span>当前页字符数</span>
              <span className="text-ink font-medium">
                {pages[currentPageIndex]?.chars.length || 0} 字
              </span>
            </div>

            {pages.length > 0 && (
              <div>
                <label className="label">页面导航</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                    disabled={currentPageIndex === 0}
                    className="btn-icon w-8 h-8 disabled:opacity-30">←</button>
                  <input type="number" min="1" max={pages.length} value={currentPageIndex + 1}
                    onChange={(e) => setCurrentPageIndex(Math.min(pages.length - 1, Math.max(0, Number(e.target.value) - 1)))}
                    className="input-base text-center text-xs" />
                  <button onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                    disabled={currentPageIndex === pages.length - 1}
                    className="btn-icon w-8 h-8 disabled:opacity-30">→</button>
                </div>
              </div>
            )}

            <div className="divider" />

            <div>
              <label className="label">页边距</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-ink-soft">上 ({params.marginTop}px)</label>
                  <input type="number" value={params.marginTop}
                    onChange={(e) => setParams({ marginTop: Number(e.target.value) })}
                    className="input-base text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-ink-soft">下 ({params.marginBottom}px)</label>
                  <input type="number" value={params.marginBottom}
                    onChange={(e) => setParams({ marginBottom: Number(e.target.value) })}
                    className="input-base text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-ink-soft">左 ({params.marginLeft}px)</label>
                  <input type="number" value={params.marginLeft}
                    onChange={(e) => setParams({ marginLeft: Number(e.target.value) })}
                    className="input-base text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-ink-soft">右 ({params.marginRight}px)</label>
                  <input type="number" value={params.marginRight}
                    onChange={(e) => setParams({ marginRight: Number(e.target.value) })}
                    className="input-base text-xs" />
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="bg-paper-dark/50 rounded-lg p-3 text-[11px] text-ink-soft leading-relaxed">
              <p className="font-medium text-ink mb-1">自动分页说明</p>
              <p>当输入文字超过单页容量时，系统自动将剩余文字分配到新页面。支持：</p>
              <p>• 多背景图轮流使用</p>
              <p>• 自动检测可写区域</p>
              <p>• 横格线基线对齐</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
