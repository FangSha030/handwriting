import { useEditorStore } from '../store/editorStore'
import type { HandwritingFont, PrintFont } from '../types'

const HANDWRITING_FONTS: { value: HandwritingFont; label: string; sample: string }[] = [
  { value: 'Ma Shan Zheng', label: '马善政体', sample: '手写' },
  { value: 'Liu Jian Mao Cao', label: '刘建毛草', sample: '手写' },
  { value: 'Zhi Mang Xing', label: '志莽行', sample: '手写' },
  { value: 'Caveat', label: 'Caveat', sample: 'Abc' },
  { value: 'Kalam', label: 'Kalam', sample: 'Abc' },
  { value: 'Patrick Hand', label: 'Patrick', sample: 'Abc' },
]

const PRINT_FONTS: { value: PrintFont; label: string }[] = [
  { value: 'Noto Serif SC', label: '思源宋体' },
  { value: 'Noto Sans SC', label: '思源黑体' },
]

export function LeftSidebar() {
  const {
    text,
    setText,
    params,
    setParams,
    adjustments,
    clearAdjustments,
    addToast,
  } = useEditorStore()

  return (
    <aside className="w-72 bg-paper border-r border-line-soft flex flex-col overflow-hidden">
      {/* 文本输入区 */}
      <div className="panel rounded-none border-x-0 border-t-0">
        <div className="panel-header">
          <span className="panel-title">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5z" clipRule="evenodd" />
            </svg>
            文本输入
          </span>
          <span className="text-[10px] text-ink-soft">{text.length} 字</span>
        </div>
        <div className="p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-base h-32 leading-relaxed"
            placeholder="请输入需要模拟手写的文字内容..."
          />
          <div className="flex items-center gap-1.5 mt-2">
            <button
              className="btn-secondary text-xs flex-1"
              onClick={() => {
                setText('这是一段手写模拟测试文字。\n手写笔迹模拟器支持中英文混排，\n可对文字进行框选微调，\n最终渲染出真实自然的手写效果。\nHandwriting Simulator supports fine-tuning.')
                addToast('info', '已载入示例文本')
              }}
            >
              载入示例
            </button>
            <button
              className="btn-secondary text-xs flex-1"
              onClick={() => {
                setText('')
                addToast('info', '已清空文本')
              }}
            >
              清空
            </button>
          </div>
        </div>
      </div>

      {/* 参数配置区 */}
      <div className="panel rounded-none border-x-0 border-t-0 flex-1 overflow-y-auto">
        <div className="panel-header">
          <span className="panel-title">
            <svg className="w-4 h-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            手写参数
          </span>
        </div>
        <div className="p-3 space-y-4">
          {/* 手写字体选择 */}
          <div>
            <label className="label">手写字体</label>
            <div className="grid grid-cols-3 gap-1.5">
              {HANDWRITING_FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setParams({ font: font.value })}
                  className={`px-2 py-2 rounded-md text-xs border transition-all ${
                    params.font === font.value
                      ? 'border-accent bg-accent/10 text-accent-dark'
                      : 'border-line bg-white text-ink-light hover:border-accent-light'
                  }`}
                  style={{ fontFamily: `"${font.value}", cursive` }}
                >
                  <div className="text-base leading-tight">{font.sample}</div>
                  <div className="text-[9px] mt-0.5 font-sans">{font.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 打印字体选择（编辑态） */}
          <div>
            <label className="label">编辑态打印字体</label>
            <select
              value={params.printFont}
              onChange={(e) => setParams({ printFont: e.target.value as PrintFont })}
              className="input-base"
            >
              {PRINT_FONTS.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>

          {/* 字号 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">字号</label>
              <span className="text-xs text-ink tabular-nums">{params.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="64"
              step="1"
              value={params.fontSize}
              onChange={(e) => setParams({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 行高 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">行高</label>
              <span className="text-xs text-ink tabular-nums">{params.lineHeight.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="3.5"
              step="0.1"
              value={params.lineHeight}
              onChange={(e) => setParams({ lineHeight: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 字间距 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">字间距</label>
              <span className="text-xs text-ink tabular-nums">{params.letterSpacing}px</span>
            </div>
            <input
              type="range"
              min="-2"
              max="10"
              step="0.5"
              value={params.letterSpacing}
              onChange={(e) => setParams({ letterSpacing: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 颜色 */}
          <div>
            <label className="label">墨水颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={params.color}
                onChange={(e) => setParams({ color: e.target.value })}
                className="w-10 h-8 rounded border border-line cursor-pointer"
              />
              <input
                type="text"
                value={params.color}
                onChange={(e) => setParams({ color: e.target.value })}
                className="input-base flex-1 font-mono text-xs"
              />
            </div>
          </div>

          <div className="divider" />

          {/* 手写扰动参数 */}
          <div>
            <label className="label font-semibold text-ink">笔迹自然度</label>
          </div>

          {/* 位置抖动 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">位置抖动</label>
              <span className="text-xs text-ink tabular-nums">{params.positionJitter.toFixed(1)}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="0.1"
              value={params.positionJitter}
              onChange={(e) => setParams({ positionJitter: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 旋转抖动 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">旋转抖动</label>
              <span className="text-xs text-ink tabular-nums">{params.rotationJitter.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={params.rotationJitter}
              onChange={(e) => setParams({ rotationJitter: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 大小抖动 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">大小抖动</label>
              <span className="text-xs text-ink tabular-nums">{(params.scaleJitter * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={params.scaleJitter}
              onChange={(e) => setParams({ scaleJitter: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 笔触深浅 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">笔触深浅</label>
              <span className="text-xs text-ink tabular-nums">{(params.opacityJitter * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={params.opacityJitter}
              onChange={(e) => setParams({ opacityJitter: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 墨水浓度 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">墨水浓度</label>
              <span className="text-xs text-ink tabular-nums">{(params.inkIntensity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1"
              step="0.01"
              value={params.inkIntensity}
              onChange={(e) => setParams({ inkIntensity: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 颜色抖动 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">颜色抖动</label>
              <span className="text-xs text-ink tabular-nums">{(params.colorJitter * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={params.colorJitter}
              onChange={(e) => setParams({ colorJitter: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* 重新生成随机种子 */}
          <button
            className="btn-secondary w-full text-xs"
            onClick={() => {
              useEditorStore.getState().setRandomSeed(Math.floor(Math.random() * 100000))
              addToast('success', '已重新生成笔迹随机效果')
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            重新生成笔迹
          </button>

          <div className="divider" />

          {/* 微调记录 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0 font-semibold text-ink">微调记录</label>
              {adjustments.length > 0 && (
                <button
                  className="text-[10px] text-error hover:underline"
                  onClick={() => {
                    clearAdjustments()
                    addToast('info', '已清除所有微调记录')
                  }}
                >
                  清除全部
                </button>
              )}
            </div>
            {adjustments.length === 0 ? (
              <p className="text-xs text-ink-soft text-center py-3 bg-paper-dark/50 rounded">
                暂无微调记录
              </p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {adjustments.map((adj, i) => (
                  <div key={adj.id} className="text-xs bg-paper-dark/50 rounded px-2 py-1.5 flex items-center justify-between">
                    <span className="text-ink-light">#{i + 1} · {adj.charIndices.length}字</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                      <span>↔{adj.offsetX.toFixed(0)}</span>
                      <span>↕{adj.offsetY.toFixed(0)}</span>
                      <span>{(adj.scale * 100).toFixed(0)}%</span>
                      <span>{adj.rotation.toFixed(0)}°</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
