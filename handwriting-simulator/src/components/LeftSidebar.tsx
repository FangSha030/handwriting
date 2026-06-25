import { useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'
import { BUILTIN_FONTS, loadCustomFont } from '../utils/fonts'
import { fileToDataUrl, generateThumbnail, loadImage } from '../utils/regionDetection'
import { PAGE_SIZE_PRESETS } from '../utils/paperTemplates'
import type { HandwritingFont, PaperTemplateType, PageSizePreset, FontDefinition, BackgroundImage } from '../types'

const PAPER_TEMPLATES: { value: PaperTemplateType; label: string; icon: string }[] = [
  { value: 'lined', label: '横线纸', icon: '☰' },
  { value: 'grid', label: '方格纸', icon: '⊞' },
  { value: 'dot', label: '点阵纸', icon: '⋮⋮' },
  { value: 'tianzi', label: '田字格', icon: '田' },
  { value: 'pinyin', label: '拼音格', icon: 'ā' },
  { value: 'blank', label: '空白纸', icon: '□' },
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
    backgrounds,
    addBackground,
    removeBackground,
    currentBackgroundId,
    setCurrentBackgroundId,
    setCurrentBackgroundImg,
    paperTemplate,
    setPaperTemplate,
    customFonts,
    addCustomFont,
  } = useEditorStore()

  const [activeSection, setActiveSection] = useState<'text' | 'background' | 'font'>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const fontInputRef = useRef<HTMLInputElement>(null)

  const allFonts = [...BUILTIN_FONTS, ...customFonts]

  // 处理背景图上传
  const handleBackgroundUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        addToast('warn', `${file.name} 不是图片文件`)
        continue
      }

      try {
        const dataUrl = await fileToDataUrl(file)
        const img = await loadImage(dataUrl)
        const thumbnail = generateThumbnail(img)

        const bg: BackgroundImage = {
          id: `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: file.name.includes('/') ? 'folder' : 'upload',
          name: file.name,
          dataUrl,
          width: img.width,
          height: img.height,
          thumbnail,
        }
        addBackground(bg)

        // 如果是第一张，自动选中
        if (backgrounds.length === 0) {
          setCurrentBackgroundId(bg.id)
          setCurrentBackgroundImg(img)
        }
      } catch (e) {
        addToast('error', `${file.name} 加载失败`)
      }
    }

    addToast('success', `已导入 ${files.length} 张背景图`)
  }

  // 选择背景图
  const handleSelectBackground = async (bg: BackgroundImage) => {
    setCurrentBackgroundId(bg.id)
    try {
      const img = await loadImage(bg.dataUrl)
      setCurrentBackgroundImg(img)
      // 自动调整画布尺寸为背景图尺寸
      setParams({
        pageSize: 'Custom',
        pageWidth: bg.width,
        pageHeight: bg.height,
      })
      addToast('info', `已选择背景: ${bg.name}`)
    } catch (e) {
      addToast('error', '背景图加载失败')
    }
  }

  // 移除背景图
  const handleRemoveBackground = (id: string) => {
    removeBackground(id)
    if (currentBackgroundId === id) {
      setCurrentBackgroundId(null)
      setCurrentBackgroundImg(null)
    }
  }

  // 处理字体上传
  const handleFontUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (!/\.(ttf|otf|woff|woff2)$/i.test(file.name)) {
        addToast('warn', `${file.name} 不是字体文件`)
        continue
      }

      try {
        const fontName = await loadCustomFont(file)
        const fontDef: FontDefinition = {
          name: fontName,
          label: file.name.replace(/\.(ttf|otf|woff|woff2)$/i, ''),
          source: 'custom',
          sample: '手写笔迹 Abc',
          cjk: true,
        }
        addCustomFont(fontDef)
        addToast('success', `字体已加载: ${fontName}`)
      } catch (e) {
        addToast('error', `${file.name} 加载失败`)
      }
    }
  }

  return (
    <aside className="w-72 bg-paper border-r border-line-soft flex flex-col overflow-hidden">
      {/* 标签切换 */}
      <div className="flex border-b border-line-soft bg-paper-dark/30">
        {([
          { key: 'text', label: '文本', icon: '📝' },
          { key: 'background', label: '背景', icon: '🖼' },
          { key: 'font', label: '字体', icon: '🔤' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeSection === tab.key
                ? 'text-accent-dark bg-paper border-b-2 border-accent'
                : 'text-ink-light hover:text-ink hover:bg-paper'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* === 文本输入区 === */}
        {activeSection === 'text' && (
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">文本内容</label>
                <span className="text-[10px] text-ink-soft">{text.length} 字</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="请输入需要模拟手写的文字内容..."
                className="w-full h-64 px-3 py-2 text-sm bg-white border border-line rounded-md focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="divider" />

            {/* 排版参数 */}
            <div>
              <label className="label">字号 ({params.fontSize}px)</label>
              <input
                type="range"
                min="12"
                max="60"
                step="1"
                value={params.fontSize}
                onChange={(e) => setParams({ fontSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="label">行高 ({params.lineHeight.toFixed(1)}倍)</label>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={params.lineHeight}
                onChange={(e) => setParams({ lineHeight: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="label">字间距 ({params.letterSpacing}px)</label>
              <input
                type="range"
                min="-2"
                max="20"
                step="0.5"
                value={params.letterSpacing}
                onChange={(e) => setParams({ letterSpacing: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="label">词间距 ({params.wordSpacing}px)</label>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={params.wordSpacing}
                onChange={(e) => setParams({ wordSpacing: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="label">首行缩进 ({params.firstLineIndent} 字符)</label>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={params.firstLineIndent}
                onChange={(e) => setParams({ firstLineIndent: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="divider" />

            {/* 页面设置 */}
            <div>
              <label className="label">页面尺寸</label>
              <select
                value={params.pageSize}
                onChange={(e) => {
                  const preset = e.target.value as PageSizePreset
                  const size = PAGE_SIZE_PRESETS[preset]
                  setParams({ pageSize: preset, pageWidth: size.width, pageHeight: size.height })
                }}
                className="input-base"
              >
                {Object.entries(PAGE_SIZE_PRESETS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">页宽 (px)</label>
                <input
                  type="number"
                  value={params.pageWidth}
                  onChange={(e) => setParams({ pageWidth: Number(e.target.value), pageSize: 'Custom' })}
                  className="input-base"
                />
              </div>
              <div>
                <label className="label">页高 (px)</label>
                <input
                  type="number"
                  value={params.pageHeight}
                  onChange={(e) => setParams({ pageHeight: Number(e.target.value), pageSize: 'Custom' })}
                  className="input-base"
                />
              </div>
            </div>

            <div className="divider" />

            {/* 微调记录 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
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
        )}

        {/* === 背景管理区 === */}
        {activeSection === 'background' && (
          <div className="p-4 space-y-3">
            {/* 纸张模板 */}
            <div>
              <label className="label font-semibold text-ink">纸张模板</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {PAPER_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.value}
                    onClick={() => {
                      setPaperTemplate(tmpl.value)
                      setCurrentBackgroundId(null)
                      setCurrentBackgroundImg(null)
                      addToast('info', `已切换到${tmpl.label}`)
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-all ${
                      paperTemplate === tmpl.value && !currentBackgroundId
                        ? 'border-accent bg-accent/10 text-accent-dark'
                        : 'border-line bg-white text-ink-light hover:border-accent-light'
                    }`}
                  >
                    <span className="text-lg">{tmpl.icon}</span>
                    <span className="text-[10px]">{tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            {/* 背景图导入 */}
            <div>
              <label className="label font-semibold text-ink">背景图导入</label>
              <div className="space-y-2 mt-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 text-xs bg-accent text-white rounded-md hover:bg-accent-dark transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
                  </svg>
                  上传背景图
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="w-full py-2 px-3 text-xs bg-paper-dark text-ink rounded-md hover:bg-line-soft transition-colors flex items-center justify-center gap-1.5 border border-line"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  从文件夹导入
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleBackgroundUpload(e.target.files)}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-expect-error webkitdirectory is non-standard
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                  onChange={(e) => handleBackgroundUpload(e.target.files)}
                />
              </div>
            </div>

            {/* 背景图列表 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0 font-semibold text-ink">背景图列表</label>
                <span className="text-[10px] text-ink-soft">{backgrounds.length} 张</span>
              </div>
              {backgrounds.length === 0 ? (
                <p className="text-xs text-ink-soft text-center py-6 bg-paper-dark/50 rounded">
                  暂无背景图
                  <br />
                  <span className="text-[10px]">上传后将自动检测可写区域</span>
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {backgrounds.map((bg) => (
                    <div
                      key={bg.id}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
                        currentBackgroundId === bg.id
                          ? 'border-accent bg-accent/10'
                          : 'border-line bg-white hover:border-accent-light'
                      }`}
                      onClick={() => handleSelectBackground(bg)}
                    >
                      <img src={bg.thumbnail} alt={bg.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-ink truncate">{bg.name}</p>
                        <p className="text-[10px] text-ink-soft">{bg.width}×{bg.height}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveBackground(bg.id)
                        }}
                        className="text-ink-soft hover:text-error p-1"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="divider" />

            {/* 自动检测选项 */}
            <div className="space-y-2">
              <label className="label font-semibold text-ink">智能检测</label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">自动检测可写区域</span>
                <button
                  type="button"
                  onClick={() => setParams({ autoDetectRegions: !params.autoDetectRegions })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${params.autoDetectRegions ? 'bg-accent' : 'bg-line'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${params.autoDetectRegions ? 'translate-x-4' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">自动检测横格线</span>
                <button
                  type="button"
                  onClick={() => setParams({ autoDetectGrid: !params.autoDetectGrid })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${params.autoDetectGrid ? 'bg-accent' : 'bg-line'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${params.autoDetectGrid ? 'translate-x-4' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-xs text-ink-light">自动分页</span>
                <button
                  type="button"
                  onClick={() => setParams({ autoPageBreak: !params.autoPageBreak })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${params.autoPageBreak ? 'bg-accent' : 'bg-line'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${params.autoPageBreak ? 'translate-x-4' : ''}`} />
                </button>
              </label>
            </div>
          </div>
        )}

        {/* === 字体管理区 === */}
        {activeSection === 'font' && (
          <div className="p-4 space-y-3">
            <div>
              <label className="label font-semibold text-ink">手写字体</label>
              <div className="space-y-1.5 mt-1.5 max-h-80 overflow-y-auto">
                {allFonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => setParams({ font: font.name as HandwritingFont })}
                    className={`w-full flex items-center gap-2 p-2 rounded-md border transition-all text-left ${
                      params.font === font.name
                        ? 'border-accent bg-accent/10'
                        : 'border-line bg-white hover:border-accent-light'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-ink font-medium">{font.label}</span>
                        {font.source === 'local' && <span className="text-[9px] px-1 py-0.5 bg-accent/20 text-accent-dark rounded">本地</span>}
                        {font.source === 'google' && <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 rounded">CDN</span>}
                        {font.source === 'custom' && <span className="text-[9px] px-1 py-0.5 bg-warn/20 text-warn rounded">自定义</span>}
                      </div>
                      <p
                        className="text-base text-ink-light mt-0.5 truncate"
                        style={{ fontFamily: `"${font.name}", sans-serif` }}
                      >
                        {font.sample}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div>
              <label className="label font-semibold text-ink">自定义字体上传</label>
              <p className="text-[10px] text-ink-soft mb-2">支持 TTF / OTF / WOFF / WOFF2 格式</p>
              <button
                onClick={() => fontInputRef.current?.click()}
                className="w-full py-2 px-3 text-xs bg-accent text-white rounded-md hover:bg-accent-dark transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                上传字体文件
              </button>
              <input
                ref={fontInputRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                multiple
                className="hidden"
                onChange={(e) => handleFontUpload(e.target.files)}
              />
            </div>

            <div className="divider" />

            <div>
              <label className="label">编辑态打印字体</label>
              <select
                value={params.printFont}
                onChange={(e) => setParams({ printFont: e.target.value as typeof params.printFont })}
                className="input-base"
              >
                <option value="Noto Serif SC">思源宋体</option>
                <option value="Noto Sans SC">思源黑体</option>
              </select>
            </div>

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
          </div>
        )}
      </div>
    </aside>
  )
}
