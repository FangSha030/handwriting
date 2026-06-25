import type { PaperTemplateType, PageSizePreset } from '../types'

/**
 * 纸张模板生成器
 * 参考 beautifulcarrot 的纸张模板功能
 */

/** 页面尺寸预设（像素，按 96 DPI） */
export const PAGE_SIZE_PRESETS: Record<PageSizePreset, { width: number; height: number; label: string }> = {
  A4: { width: 794, height: 1123, label: 'A4 (210×297mm)' },
  A5: { width: 559, height: 794, label: 'A5 (148×210mm)' },
  B5: { width: 691, height: 979, label: 'B5 (176×250mm)' },
  Letter: { width: 816, height: 1056, label: 'Letter (8.5×11in)' },
  Custom: { width: 794, height: 1123, label: '自定义' },
}

/**
 * 生成纸张模板背景到 canvas
 */
export function drawPaperTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: PaperTemplateType,
  options: {
    paperColor: string
    lineColor: string
    lineSpacing: number
    margin: { top: number; bottom: number; left: number; right: number }
  },
): void {
  const { paperColor, lineColor, margin } = options

  // 填充纸张背景
  ctx.fillStyle = paperColor
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = lineColor
  ctx.fillStyle = lineColor

  switch (type) {
    case 'blank':
      // 空白纸，仅画边距辅助线（淡）
      drawMargins(ctx, width, height, margin, lineColor, 0.15)
      break

    case 'lined':
      drawLinedPaper(ctx, width, height, margin, options.lineSpacing, lineColor)
      break

    case 'grid':
      drawGridPaper(ctx, width, height, margin, options.lineSpacing, lineColor)
      break

    case 'dot':
      drawDotPaper(ctx, width, height, margin, options.lineSpacing, lineColor)
      break

    case 'tianzi':
      drawTianziPaper(ctx, width, height, margin, options.lineSpacing, lineColor)
      break

    case 'pinyin':
      drawPinyinPaper(ctx, width, height, margin, options.lineSpacing, lineColor)
      break

    default:
      break
  }
}

/** 绘制边距辅助线 */
function drawMargins(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  color: string,
  alpha: number,
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])

  ctx.strokeRect(margin.left, margin.top, width - margin.left - margin.right, height - margin.top - margin.bottom)
  ctx.restore()
}

/** 横线纸 */
function drawLinedPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  spacing: number,
  color: string,
): void {
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  const startY = margin.top + spacing
  for (let y = startY; y <= height - margin.bottom; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(margin.left, y)
    ctx.lineTo(width - margin.right, y)
    ctx.stroke()
  }
  ctx.restore()

  drawMargins(ctx, width, height, margin, color, 0.15)
}

/** 方格纸 */
function drawGridPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  spacing: number,
  color: string,
): void {
  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  for (let x = margin.left; x <= width - margin.right; x += spacing) {
    ctx.beginPath()
    ctx.moveTo(x, margin.top)
    ctx.lineTo(x, height - margin.bottom)
    ctx.stroke()
  }
  for (let y = margin.top; y <= height - margin.bottom; y += spacing) {
    ctx.beginPath()
    ctx.moveTo(margin.left, y)
    ctx.lineTo(width - margin.right, y)
    ctx.stroke()
  }
  ctx.restore()
}

/** 点阵纸 */
function drawDotPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  spacing: number,
  color: string,
): void {
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.fillStyle = color

  for (let x = margin.left; x <= width - margin.right; x += spacing) {
    for (let y = margin.top; y <= height - margin.bottom; y += spacing) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** 田字格纸 */
function drawTianziPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  spacing: number,
  color: string,
): void {
  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  const cellSize = spacing * 2
  const usableWidth = width - margin.left - margin.right
  const usableHeight = height - margin.top - margin.bottom
  const cols = Math.floor(usableWidth / cellSize)
  const rows = Math.floor(usableHeight / cellSize)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = margin.left + col * cellSize
      const y = margin.top + row * cellSize

      // 外框
      ctx.globalAlpha = 0.5
      ctx.strokeRect(x, y, cellSize, cellSize)

      // 虚线十字
      ctx.globalAlpha = 0.25
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(x + cellSize / 2, y)
      ctx.lineTo(x + cellSize / 2, y + cellSize)
      ctx.moveTo(x, y + cellSize / 2)
      ctx.lineTo(x + cellSize, y + cellSize / 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
  ctx.restore()
}

/** 拼音格纸 */
function drawPinyinPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  spacing: number,
  color: string,
): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1

  const rowHeight = spacing * 2.5
  const usableWidth = width - margin.left - margin.right

  for (let y = margin.top; y <= height - margin.bottom - rowHeight; y += rowHeight) {
    // 拼音区（上方 1/3）
    ctx.globalAlpha = 0.2
    ctx.beginPath()
    ctx.moveTo(margin.left, y + spacing * 0.5)
    ctx.lineTo(width - margin.right, y + spacing * 0.5)
    ctx.stroke()

    // 四线三格
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.moveTo(margin.left, y + spacing)
    ctx.lineTo(width - margin.right, y + spacing)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(margin.left, y + spacing * 1.5)
    ctx.lineTo(width - margin.right, y + spacing * 1.5)
    ctx.stroke()

    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.moveTo(margin.left, y + spacing * 2)
    ctx.lineTo(width - margin.right, y + spacing * 2)
    ctx.stroke()
  }
  ctx.restore()
}

/** 获取纸张模板的可写区域 */
export function getTemplateWritableRegion(
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  lineSpacing: number,
  type: PaperTemplateType,
): { x: number; y: number; width: number; height: number; gridLines: number[] } {
  const region = {
    x: margin.left,
    y: margin.top,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
    gridLines: [] as number[],
  }

  // 生成横格线
  if (type === 'lined' || type === 'grid' || type === 'dot') {
    for (let y = lineSpacing; y <= region.height; y += lineSpacing) {
      region.gridLines.push(y)
    }
  } else if (type === 'tianzi') {
    const cellSize = lineSpacing * 2
    for (let y = cellSize; y <= region.height; y += cellSize) {
      region.gridLines.push(y)
    }
  }

  return region
}
