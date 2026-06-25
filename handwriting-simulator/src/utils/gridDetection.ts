import type { CharLayout, HandwritingParams } from '../types'

/**
 * 横格线检测工具
 * 支持两种模式：
 * 1. 基于文本布局自动生成横格线（每行基线一条）
 * 2. 基于画布像素分析检测已有横格线（用于导入横线本图片场景）
 */

/**
 * 基于文本布局生成横格线 y 坐标列表
 * 每一行的基线对应一条横格线
 */
export function detectGridFromLayout(layouts: CharLayout[]): number[] {
  const baselines = new Set<number>()
  layouts.forEach((layout) => {
    if (!layout.isLineBreak) {
      baselines.add(Math.round(layout.y))
    }
  })
  return Array.from(baselines).sort((a, b) => a - b)
}

/**
 * 基于画布像素分析检测横格线
 * 通过扫描每一行的像素密度，找出横向线条
 * @param ctx canvas 上下文
 * @param threshold 像素密度阈值（0-1）
 * @param minLineLength 最小线条长度（像素）
 * @returns 检测到的横格线 y 坐标列表
 */
export function detectGridFromCanvas(
  ctx: CanvasRenderingContext2D,
  threshold: number = 0.5,
  minLineLength: number = 100,
): number[] {
  const { width, height } = ctx.canvas
  if (width === 0 || height === 0) return []

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const gridLines: number[] = []

  // 逐行扫描，统计深色像素数量
  for (let y = 0; y < height; y++) {
    let darkPixelCount = 0
    let consecutiveDark = 0
    let maxConsecutive = 0

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const brightness = (r + g + b) / 3

      if (brightness < 200) {
        darkPixelCount++
        consecutiveDark++
        if (consecutiveDark > maxConsecutive) {
          maxConsecutive = consecutiveDark
        }
      } else {
        consecutiveDark = 0
      }
    }

    const density = darkPixelCount / width
    // 判定为横格线：像素密度高且连续深色段足够长
    if (density > threshold && maxConsecutive > minLineLength) {
      gridLines.push(y)
    }
  }

  // 合并相近的横格线（容错处理）
  return mergeCloseLines(gridLines, 5)
}

/**
 * 合并相近的横格线
 * @param lines 横格线列表
 * @param tolerance 容差（像素）
 */
function mergeCloseLines(lines: number[], tolerance: number): number[] {
  if (lines.length === 0) return []
  const merged: number[] = []
  let currentGroup: number[] = [lines[0]]

  for (let i = 1; i < lines.length; i++) {
    if (lines[i] - lines[i - 1] <= tolerance) {
      currentGroup.push(lines[i])
    } else {
      // 取当前组的平均值
      merged.push(Math.round(currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length))
      currentGroup = [lines[i]]
    }
  }
  if (currentGroup.length > 0) {
    merged.push(Math.round(currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length))
  }
  return merged
}

/**
 * 自动对齐文本基线到横格线
 * 对每个字符，找到最近的横格线，将基线对齐
 * 提供容错率：在一定误差范围内自动吸附
 * @param layouts 字符布局
 * @param gridLines 横格线 y 坐标
 * @param tolerance 对齐容差（像素），超出此范围不自动对齐
 * @returns 对齐后的布局
 */
export function alignToGrid(
  layouts: CharLayout[],
  gridLines: number[],
  tolerance: number = 20,
): CharLayout[] {
  if (gridLines.length === 0) return layouts

  return layouts.map((layout) => {
    if (layout.isLineBreak) return layout

    // 找到最近的横格线
    let nearestLine = gridLines[0]
    let minDistance = Math.abs(layout.y - gridLines[0])

    for (let i = 1; i < gridLines.length; i++) {
      const distance = Math.abs(layout.y - gridLines[i])
      if (distance < minDistance) {
        minDistance = distance
        nearestLine = gridLines[i]
      }
    }

    // 在容差范围内自动对齐
    if (minDistance <= tolerance) {
      return {
        ...layout,
        y: nearestLine,
      }
    }

    return layout
  })
}

/**
 * 根据横格线间距自动推断行高
 * @param gridLines 横格线列表
 * @returns 平均间距
 */
export function inferLineHeightFromGrid(gridLines: number[]): number {
  if (gridLines.length < 2) return 0
  const spacings: number[] = []
  for (let i = 1; i < gridLines.length; i++) {
    spacings.push(gridLines[i] - gridLines[i - 1])
  }
  return Math.round(spacings.reduce((a, b) => a + b, 0) / spacings.length)
}

/**
 * 生成均匀分布的横格线（用于没有导入图片时）
 * @param startY 起始 y
 * @param endY 结束 y
 * @param spacing 间距
 */
export function generateUniformGrid(
  startY: number,
  endY: number,
  spacing: number,
): number[] {
  const lines: number[] = []
  for (let y = startY; y <= endY; y += spacing) {
    lines.push(Math.round(y))
  }
  return lines
}
