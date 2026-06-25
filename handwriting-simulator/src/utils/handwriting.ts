import type {
  CharLayout,
  CharHandwritingStyle,
  HandwritingParams,
  SelectionRect,
  WritableRegion,
  PageLayout,
} from '../types'

/**
 * 手写渲染引擎（增强版）
 * 
 * 参考 GitHub 开源项目 HandwritingGenerator + beautifulcarrot 的核心思路：
 * 1. 逐字符布局
 * 2. 对每个字符施加随机扰动（位置、旋转、缩放、不透明度、笔迹粗细）
 * 3. 模拟墨水浓淡变化
 * 4. 支持背景图渲染
 * 5. 支持多区域/多页文本流
 * 6. 支持横格线基线对齐
 * 7. 编辑态/最终态分离渲染
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
 * 为每个字符生成手写样式（随机扰动）
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
    strokeWidth,
    strokeWidthJitter,
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
        strokeWidth,
      }
    }

    return {
      offsetX: (rng.next() - 0.5) * 2 * positionJitter,
      offsetY: (rng.next() - 0.5) * 2 * positionJitter,
      rotation: ((rng.next() - 0.5) * 2 * rotationJitter * Math.PI) / 180,
      scale: 1 + (rng.next() - 0.5) * 2 * scaleJitter,
      opacity: Math.max(0.3, Math.min(1, inkIntensity + (rng.next() - 0.5) * 2 * opacityJitter)),
      color: jitterColor(color, colorJitter, rng),
      strokeWidth: Math.max(0.5, strokeWidth + (rng.next() - 0.5) * 2 * strokeWidthJitter),
    }
  })
}

/** 对颜色进行随机抖动 */
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
 * 渲染背景图（如果有）
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  background: { dataUrl: string; width: number; height: number } | null,
  canvasWidth: number,
  canvasHeight: number,
  paperColor: string,
): void {
  // 先填充纸张色
  ctx.fillStyle = paperColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (background && background.dataUrl) {
    const img = new Image()
    img.src = background.dataUrl
    // 同步绘制（图片已缓存）
    if (img.complete) {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
    } else {
      // 异步加载后会触发重绘
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      }
    }
  }
}

/**
 * 同步渲染背景图（使用预加载的 Image 对象）
 */
export function renderBackgroundSync(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  canvasWidth: number,
  canvasHeight: number,
  paperColor: string,
): void {
  ctx.fillStyle = paperColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
  }
}

/**
 * 在编辑态渲染打印体文字（标准字体，无扰动）
 */
export function renderEditMode(
  ctx: CanvasRenderingContext2D,
  layouts: CharLayout[],
  params: HandwritingParams,
  adjustments: Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>,
  selectedIndices: Set<number>,
  showBoundingBoxes: boolean,
  showGrid: boolean,
  backgroundImg: HTMLImageElement | null = null,
  regions: WritableRegion[] = [],
) {
  const { fontSize, printFont, color, gridColor, paperColor, strokeWidth } = params

  // 渲染背景
  renderBackgroundSync(ctx, backgroundImg, ctx.canvas.width, ctx.canvas.height, paperColor)

  // 绘制可写区域边界（编辑态辅助）
  if (regions.length > 0 && showGrid) {
    regions.forEach((region) => {
      ctx.save()
      ctx.strokeStyle = 'rgba(124, 152, 133, 0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 4])
      ctx.strokeRect(region.x, region.y, region.width, region.height)
      ctx.setLineDash([])

      // 绘制区域内的横格线
      region.gridLines.forEach((lineY) => {
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(region.x, region.y + lineY)
        ctx.lineTo(region.x + region.width, region.y + lineY)
        ctx.stroke()
      })
      ctx.restore()
    })
  }

  // 设置打印字体
  ctx.font = `${fontSize}px "${printFont}", sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.lineWidth = strokeWidth

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
 */
export function renderPreviewMode(
  ctx: CanvasRenderingContext2D,
  layouts: CharLayout[],
  styles: CharHandwritingStyle[],
  params: HandwritingParams,
  adjustments: Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>,
  backgroundImg: HTMLImageElement | null = null,
  regions: WritableRegion[] = [],
) {
  const { fontSize, font, paperColor, showGrid, gridColor, strokeWidth, strokeWidthJitter } = params

  // 渲染背景
  renderBackgroundSync(ctx, backgroundImg, ctx.canvas.width, ctx.canvas.height, paperColor)

  // 最终态绘制横格线（更淡）
  if (showGrid && regions.length > 0) {
    regions.forEach((region) => {
      ctx.save()
      region.gridLines.forEach((lineY) => {
        ctx.globalAlpha = 0.25
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(region.x, region.y + lineY)
        ctx.lineTo(region.x + region.width, region.y + lineY)
        ctx.stroke()
      })
      ctx.restore()
    })
  }

  // 设置手写字体
  ctx.font = `${fontSize}px "${font}", cursive`
  ctx.textBaseline = 'alphabetic'

  const rng = new SeededRandom(params.inkIntensity * 1000)

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
    const currentStrokeWidth = strokeWidth + (rng.next() - 0.5) * 2 * strokeWidthJitter

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(layout.x + layout.width / 2 + offsetX, layout.y + offsetY)
    ctx.rotate(rotation)
    ctx.scale(scale, scale)

    // 模拟墨水效果：轻微的阴影模拟笔触渗透
    ctx.shadowColor = color
    ctx.shadowBlur = 0.5
    ctx.lineWidth = Math.max(0.5, currentStrokeWidth)

    ctx.fillStyle = color
    ctx.fillText(layout.char, -layout.width / 2, 0)

    ctx.restore()
  })

  // 重置
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
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

/**
 * 渲染单页到指定 canvas（用于多页导出）
 */
export function renderPage(
  ctx: CanvasRenderingContext2D,
  page: PageLayout,
  styles: CharHandwritingStyle[],
  params: HandwritingParams,
  adjustments: Map<number, { offsetX: number; offsetY: number; scale: number; rotation: number; color?: string }>,
  mode: 'edit' | 'preview',
  backgroundImg: HTMLImageElement | null = null,
  globalStartIndex: number = 0,
): void {
  if (mode === 'edit') {
    renderEditMode(
      ctx,
      page.chars,
      params,
      adjustments,
      new Set(),
      false,
      params.showGrid,
      backgroundImg,
      [page.region],
    )
  } else {
    // 为本页字符提取对应样式
    const pageStyles = page.chars.map((_, i) => styles[globalStartIndex + i] || styles[0])
    renderPreviewMode(
      ctx,
      page.chars,
      pageStyles,
      params,
      adjustments,
      backgroundImg,
      [page.region],
    )
  }
}
