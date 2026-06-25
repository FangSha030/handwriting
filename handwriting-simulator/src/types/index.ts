// 核心类型定义

/** 编辑模式 */
export type EditorMode = 'edit' | 'preview'

/** 手写字体类型 */
export type HandwritingFont =
  | 'Ma Shan Zheng'
  | 'Liu Jian Mao Cao'
  | 'Zhi Mang Xing'
  | 'Caveat'
  | 'Kalam'
  | 'Patrick Hand'

/** 打印字体类型（编辑态使用） */
export type PrintFont = 'Noto Sans SC' | 'Noto Serif SC'

/** 单个字符的布局信息 */
export interface CharLayout {
  /** 字符内容 */
  char: string
  /** 字符在画布中的 x 坐标（基线左端） */
  x: number
  /** 字符在画布中的 y 坐标（基线） */
  y: number
  /** 字符宽度 */
  width: number
  /** 字符高度 */
  height: number
  /** 字符所在行索引 */
  lineIndex: number
  /** 是否为换行符 */
  isLineBreak?: boolean
}

/** 单个字符的手写样式（最终渲染时使用） */
export interface CharHandwritingStyle {
  /** x 方向随机偏移 */
  offsetX: number
  /** y 方向随机偏移 */
  offsetY: number
  /** 旋转角度（弧度） */
  rotation: number
  /** 缩放比例 */
  scale: number
  /** 不透明度（模拟笔触深浅） */
  opacity: number
  /** 颜色微调 */
  color: string
}

/** 用户对选中区域的微调操作 */
export interface Adjustment {
  /** 唯一 ID */
  id: string
  /** 选中字符的索引列表 */
  charIndices: number[]
  /** 位置 x 偏移（px） */
  offsetX: number
  /** 位置 y 偏移（px） */
  offsetY: number
  /** 字号缩放比例（1 = 原始） */
  scale: number
  /** 旋转角度（度） */
  rotation: number
  /** 颜色覆盖（可选） */
  color?: string
  /** 创建时间戳 */
  createdAt: number
}

/** 横格线 */
export interface GridLine {
  /** y 坐标 */
  y: number
  /** 是否为自动检测 */
  auto: boolean
}

/** 手写参数配置 */
export interface HandwritingParams {
  /** 手写字体 */
  font: HandwritingFont
  /** 打印字体（编辑态） */
  printFont: PrintFont
  /** 字号 */
  fontSize: number
  /** 行高（倍数） */
  lineHeight: number
  /** 字间距 */
  letterSpacing: number
  /** 颜色 */
  color: string
  /** 位置抖动幅度 */
  positionJitter: number
  /** 旋转抖动幅度（度） */
  rotationJitter: number
  /** 大小抖动幅度（比例） */
  scaleJitter: number
  /** 笔触深浅变化 */
  opacityJitter: number
  /** 颜色抖动幅度 */
  colorJitter: number
  /** 墨水浓度（基础不透明度） */
  inkIntensity: number
  /** 是否启用横格线 */
  showGrid: boolean
  /** 横格线间距 */
  gridSpacing: number
  /** 横格线颜色 */
  gridColor: string
  /** 纸张背景色 */
  paperColor: string
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
