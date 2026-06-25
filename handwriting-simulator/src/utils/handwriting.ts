import type {
  CharLayout,
  CharHandwritingStyle,
  HandwritingParams,
  SelectionRect,
} from '../types'

/**
 * 手写渲染引擎
 * 参考 GitHub 开源项目 HandwritingGenerator 的核心思路：
 * 1. 逐字符布局
 * 2. 对每个字符施加随机扰动（位置、旋转、缩放、不透明度）
 * 3. 模拟墨水浓淡变化
 *
 * 在此基础上增强：
 * - 支持用户微调覆盖
 * - 支持横格线基线对齐
 * - 编辑态/最终态分离渲染
 */

/** 简易种子随机数（保证同一文本多次渲染结果一致） */
class SeededRandom {
  private seed: number
  constructor(seed: number) {
    this.seed = seed
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
}

/**
 * 对文本进行逐字符布局
 * @param text 文本内容
 * @param ctx canvas 上下文（用于测量字符宽度）
 * @param params 手写参数
 * @param canvasWidth 画布宽度
 * @param startY 起始 y 坐标
 * @param gridLines 横格线（用于基线对齐）
 * @returns 字符布局数组
 */
export function layoutText(
  text: string,
  ctx: CanvasRenderingContext2D,
  params: HandwritingParams,
  canvasWidth: number,
  startY: number,
  gridLines: number[] = [],
): CharLayout[] {
  const layouts: CharLayout[] = []
  const {
    fontSize,
    lineHeight,
    letterSpacing,
    printFont,
  } = params

  // 设置字体用于测量
  ctx.font = `${fontSize}px "${printFont}", sans-serif`

  const leftMargin = 40
  const rightMargin = 40
  const usableWidth = canvasWidth - leftMargin - rightMargin

  let currentX = leftMargin
  let currentLine = 0
  // 基线 y 坐标：如果有横格线则对齐到横格线，否则按行高计算
  let currentBaselineY = startY + fontSize

  // 如果有横格线，将第一行基线对齐到第一条横格线
  if (gridLines.length > 0) {
    currentBaselineY = gridLines[0]
  }

  const chars = Array.from(text)

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]

    // 处理换行符
    if (char === '\n') {
      layouts.push({
        char: '\n',
        x: currentX,
        y: currentBaselineY,
        width: 0,
        height: fontSize,
        lineIndex: currentLine,
        isLineBreak: true,
      })
      currentLine++
      currentX = leftMargin
      // 下一行基线
      if (gridLines.length > currentLine) {
        currentBaselineY = gridLines[currentLine]
      } else {
        currentBaselineY += fontSize * lineHeight
      }
      continue
    }

    // 测量字符宽度
    const metrics = ctx.measureText(char)
    const charWidth = metrics.width + letterSpacing

    // 检查是否需要换行
    if (currentX + charWidth > leftMargin + usableWidth) {
      currentLine++
      currentX = leftMargin
      if (gridLines.length > currentLine) {
        currentBaselineY = gridLines[currentLine]
      } else {
        currentBaselineY += fontSize * lineHeight
      }
    }

    layouts.push({
      char,
      x: currentX,
      y: currentBaselineY,
      width: metrics.width,
      height: fontSize,
      lineIndex: currentLine,
    })

    currentX += charWidth
  }

  return layouts
}

/**
 * 为每个字符生成手写样式（随机扰动）
 * @param layouts 字符布局
 * @param params 手写参数
 * @param seed 随机种子
 */
export function generateHandwritingStyles(
  layouts: CharLayout[],
  params: HandwritingParams,
  seed: number = 42,
): CharHandwritingStyle[] {
  const rng = new SeededRandom(seed)
  const {
    positionJitter,
    rotationJitter,
    scaleJitter,
    opacityJitter,
    colorJitter,
    inkIntensity,
    color,
  } = params

  return layouts.map((layout) => {
    if (layout.isLineBreak) {
      return {
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        scale: 1,
        opacity: 0,
        color,
      }
    }

    return {
      offsetX: (rng.next() - 0.5) * 2 * positionJitter,
      offsetY: (rng.next() - 0.5) * 2 * positionJitter,
      rotation: ((rng.next() - 0.5) * 2 * rotationJitter * Math.PI) / 180,
      scale: 1 + (rng.next() - 0.5) * 2 * scaleJitter,
      opacity: Math.max(0.3, Math.min(1, inkIntensity + (rng.next() - 0.5) * 2 * opacityJitter)),
      color: jitterColor(color, colorJitter, rng),
    }
  })
}

/**
 * 对颜色进行随机抖动
 */
function jitterColor(hex: string, jitter: number, rng: SeededRandom): string {
  if (jitter <= 0) return hex
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = 1 + (rng.next() - 0.5) * 2 * jitter
  const r = Math.max(0, Math.min(255, Math.round(rgb.r * factor)))
  const g = Math.max(0, Math.min(255, Math.round(rgb.g * factor)))
  const b = Math.max(0, Math.min(255, Math.round(rgb.b * factor)))
  return rgbToHex(r, g, b)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * 在编辑态渲染打印体文字（标准字体，无扰动）
 * @param ctx canvas 上下文
 * @param layouts 字符布局
 * @param params 手写参数
 * @param adjustments 用户微调
 * @param selectedIndices 当前选中的字符索引
 * @param showBoundingBoxes 是否显示字符边界框
 * @param showGrid 是否显示网格辅助线
 */
export function renderEditMode(
  ctx: CanvasRenderingContext2D,
  layouts: CharLayout[],
  params: HandwritingParams,
  adjustments: Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>,
  selectedIndices: Set<number>,
  showBoundingBoxes: boolean,
  showGrid: boolean,
) {
  const { fontSize, printFont, color, gridColor, paperColor } = params

  // 清空画布并填充纸张背景
  ctx.fillStyle = paperColor
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 绘制横格线（编辑态辅助线）
  if (showGrid) {
    drawGridLines(ctx, layouts, params)
  }

  // 设置打印字体
  ctx.font = `${fontSize}px "${printFont}", sans-serif`
  ctx.textBaseline = 'alphabetic'

  // 渲染每个字符
  layouts.forEach((layout, index) => {
    if (layout.isLineBreak) return

    const adj = adjustments.get(index)
    const offsetX = adj?.offsetX || 0
    const offsetY = adj?.offsetY || 0
    const scale = adj?.scale || 1
    const rotation = ((adj?.rotation || 0) * Math.PI) / 180
    const charColor = adj?.color || color

    ctx.save()
    ctx.translate(layout.x + layout.width / 2 + offsetX, layout.y + offsetY)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)

    // 选中状态高亮背景
    if (selectedIndices.has(index)) {
      ctx.fillStyle = 'rgba(124, 152, 133, 0.18)'
      ctx.fillRect(
        -layout.width / 2 - 2,
        -fontSize,
        layout.width + 4,
        fontSize * 1.3,
      )
    }

    // 绘制字符
    ctx.fillStyle = charColor
    ctx.fillText(layout.char, -layout.width / 2, 0)

    ctx.restore()

    // 绘制字符边界框（包含留白）
    if (showBoundingBoxes) {
      const isSelected = selectedIndices.has(index)
      ctx.strokeStyle = isSelected ? 'rgba(124, 152, 133, 0.9)' : 'rgba(138, 132, 125, 0.25)'
      ctx.lineWidth = isSelected ? 1.5 : 0.5
      ctx.setLineDash(isSelected ? [] : [3, 3])
      const padding = 3
      ctx.strokeRect(
        layout.x + offsetX - padding,
        layout.y + offsetY - fontSize - padding,
        layout.width + padding * 2,
        fontSize * 1.3 + padding * 2,
      )
      ctx.setLineDash([])
    }
  })
}

/**
 * 在最终态渲染手写体文字（带随机扰动效果）
 * @param ctx canvas 上下文
 * @param layouts 字符布局
 * @param styles 手写样式
 * @param params 手写参数
 * @param adjustments 用户微调
 */
export function renderPreviewMode(
  ctx: CanvasRenderingContext2D,
  layouts: CharLayout[],
  styles: CharHandwritingStyle[],
  params: HandwritingParams,
  adjustments: Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>,
) {
  const { fontSize, font, paperColor, showGrid, gridColor } = params

  // 清空画布并填充纸张背景
  ctx.fillStyle = paperColor
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // 最终态也绘制横格线（更淡）
  if (showGrid) {
    drawGridLines(ctx, layouts, params, 0.35)
  }

  // 设置手写字体
  ctx.font = `${fontSize}px "${font}", cursive`
  ctx.textBaseline = 'alphabetic'

  // 渲染每个字符（带手写效果）
  layouts.forEach((layout, index) => {
    if (layout.isLineBreak) return

    const style = styles[index]
    const adj = adjustments.get(index)

    // 合并用户微调与手写扰动
    const offsetX = (adj?.offsetX || 0) + style.offsetX
    const offsetY = (adj?.offsetY || 0) + style.offsetY
    const scale = (adj?.scale || 1) * style.scale
    const rotation = ((adj?.rotation || 0) * Math.PI) / 180 + style.rotation
    const color = adj?.color || style.color
    const opacity = style.opacity

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(layout.x + layout.width / 2 + offsetX, layout.y + offsetY)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)

    // 模拟墨水效果：轻微的阴影模拟笔触渗透
    ctx.shadowColor = color
    ctx.shadowBlur = 0.5

    ctx.fillStyle = color
    ctx.fillText(layout.char, -layout.width / 2, 0)

    ctx.restore()
  })

  // 重置阴影
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

/**
 * 绘制横格线
 */
function drawGridLines(
  ctx: CanvasRenderingContext2D,
  layouts: CharLayout[],
  params: HandwritingParams,
  alpha: number = 0.6,
) {
  const { gridColor, fontSize, lineHeight, gridSpacing } = params
  const leftMargin = 40
  const rightMargin = 40
  const width = ctx.canvas.width - leftMargin - rightMargin

  // 收集所有行的基线 y 坐标
  const baselines = new Set<number>()
  layouts.forEach((layout) => {
    if (!layout.isLineBreak) {
      baselines.add(layout.y)
    }
  })

  // 如果没有布局信息，按固定间距绘制
  if (baselines.size === 0) {
    const spacing = gridSpacing || fontSize * lineHeight
    for (let y = fontSize + 40; y < ctx.canvas.height - 40; y += spacing) {
      drawSingleGridLine(ctx, leftMargin, y, width, gridColor, alpha)
    }
    return
  }

  // 按基线绘制横格线
  Array.from(baselines).sort((a, b) => a - b).forEach((y) => {
    drawSingleGridLine(ctx, leftMargin, y, width, gridColor, alpha)
  })
}

function drawSingleGridLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
  alpha: number,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()
  ctx.restore()
}

/**
 * 获取字符的边界框（包含留白）
 */
export function getCharBoundingBox(layout: CharLayout, padding: number = 3): SelectionRect {
  return {
    x: layout.x - padding,
    y: layout.y - layout.height - padding,
    width: layout.width + padding * 2,
    height: layout.height * 1.3 + padding * 2,
  }
}
