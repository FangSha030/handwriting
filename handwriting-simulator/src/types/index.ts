// 核心类型定义

/** 编辑模式 */
export type EditorMode = 'edit' | 'preview'

/** 手写字体类型（含本地+Google Fonts CDN） */
export type HandwritingFont =
  // 本地字体
  | 'LXGW WenKai'
  // Google Fonts 中文手写
  | 'Ma Shan Zheng'
  | 'Liu Jian Mao Cao'
  | 'Zhi Mang Xing'
  | 'Long Cang'
  | 'ZCOOL KuaiLe'
  | 'ZCOOL QingKe HuangYou'
  | 'ZCOOL XiaoWei'
  | 'Tian Ma Shan Shan'
  // Google Fonts 英文手写
  | 'Caveat'
  | 'Kalam'
  | 'Patrick Hand'
  | 'Shadows Into Light'
  | 'Indie Flower'
  // 用户自定义
  | string

/** 打印字体类型（编辑态使用） */
export type PrintFont = 'Noto Sans SC' | 'Noto Serif SC'

/** 字体来源 */
export type FontSource = 'local' | 'google' | 'custom'

/** 字体定义 */
export interface FontDefinition {
  name: HandwritingFont
  label: string
  source: FontSource
  /** 本地字体文件路径（仅 source=local/custom 时） */
  file?: string
  /** 预览样例 */
  sample: string
  /** 是否支持中文 */
  cjk: boolean
}

/** 纸张模板类型 */
export type PaperTemplateType =
  | 'blank'        // 空白
  | 'lined'        // 横线
  | 'grid'         // 方格
  | 'dot'          // 点阵
  | 'tianzi'       // 田字格
  | 'pinyin'       // 拼音格
  | 'custom'       // 自定义背景图

/** 纸张尺寸预设 */
export type PageSizePreset = 'A4' | 'A5' | 'B5' | 'Letter' | 'Custom'

/** 背景图来源 */
export type BackgroundSource = 'template' | 'upload' | 'folder'

/** 背景图定义 */
export interface BackgroundImage {
  id: string
  /** 来源类型 */
  source: BackgroundSource
  /** 原始文件名 */
  name: string
  /** Data URL */
  dataUrl: string
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 缩略图 Data URL */
  thumbnail?: string
}

/** 可写区域（背景图上检测到的可书写区域） */
export interface WritableRegion {
  id: string
  /** 区域 x 坐标 */
  x: number
  /** 区域 y 坐标 */
  y: number
  /** 区域宽度 */
  width: number
  /** 区域高度 */
  height: number
  /** 该区域内的横格线 y 坐标列表（相对于区域） */
  gridLines: number[]
  /** 是否为自动检测 */
  autoDetected: boolean
}

/** 单页配置 */
export interface PageConfig {
  id: string
  /** 页面索引 */
  index: number
  /** 使用的背景图 ID（null 表示使用纸张模板） */
  backgroundId: string | null
  /** 纸张模板类型 */
  paperTemplate: PaperTemplateType
  /** 页面尺寸 */
  width: number
  height: number
  /** 该页的可写区域列表 */
  regions: WritableRegion[]
  /** 该页分配到的文本（字符索引范围） */
  textStartIndex: number
  textEndIndex: number
}

/** 单个字符的布局信息 */
export interface CharLayout {
  char: string
  x: number
  y: number
  width: number
  height: number
  lineIndex: number
  pageIndex: number
  regionId: string
  isLineBreak?: boolean
  isPageBreak?: boolean
}

/** 单个字符的手写样式 */
export interface CharHandwritingStyle {
  offsetX: number
  offsetY: number
  rotation: number
  scale: number
  opacity: number
  color: string
  strokeWidth: number
}

/** 单页布局结果 */
export interface PageLayout {
  /** 页面索引 */
  pageIndex: number
  /** 该页使用的背景图 ID（null 表示纸张模板） */
  backgroundId: string | null
  /** 该页的可写区域 */
  region: WritableRegion
  /** 该页的字符布局列表 */
  chars: CharLayout[]
  /** 该页在全文中的起始字符索引 */
  startCharIndex: number
  /** 该页在全文中的结束字符索引 */
  endCharIndex: number
}

/** 用户微调操作 */
export interface Adjustment {
  id: string
  charIndices: number[]
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
  color?: string
  createdAt: number
}

/** 手写参数配置（扩展版，对齐 HandwritingGenerator） */
export interface HandwritingParams {
  // === 字体 ===
  font: HandwritingFont
  printFont: PrintFont

  // === 排版 ===
  fontSize: number
  lineHeight: number
  letterSpacing: number
  wordSpacing: number
  /** 首行缩进（字符数） */
  firstLineIndent: number

  // === 页面 ===
  pageSize: PageSizePreset
  pageWidth: number
  pageHeight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number

  // === 颜色 ===
  color: string
  paperColor: string

  // === 手写自然度 ===
  positionJitter: number
  rotationJitter: number
  scaleJitter: number
  opacityJitter: number
  colorJitter: number
  inkIntensity: number
  /** 笔迹粗细（0.5-3） */
  strokeWidth: number
  /** 笔迹粗细抖动 */
  strokeWidthJitter: number

  // === 横格 ===
  showGrid: boolean
  gridSpacing: number
  gridColor: string
  /** 是否自动检测背景横格线 */
  autoDetectGrid: boolean
  /** 基线对齐容差 */
  baselineTolerance: number

  // === 文本流 ===
  /** 是否自动分页 */
  autoPageBreak: boolean
  /** 是否自动检测可写区域 */
  autoDetectRegions: boolean
}

/** 画布尺寸 */
export interface CanvasSize {
  width: number
  height: number
}

/** 框选矩形 */
export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

/** 通知消息 */
export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'warn' | 'error'
  text: string
}
