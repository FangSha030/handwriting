import type { WritableRegion } from '../types'

/**
 * 可写区域检测引擎
 * 
 * 核心功能：
 * 1. 分析背景图像素，检测可书写区域（白色/浅色连通区域）
 * 2. 检测背景图上的横格线
 * 3. 支持多种检测策略：横格线检测、空白区域检测、边缘检测
 */

/** RGB 像素 */
interface Pixel {
  r: number
  g: number
  b: number
  a: number
}

/**
 * 从 ImageData 提取像素
 */
function getPixel(imageData: ImageData, x: number, y: number): Pixel {
  const idx = (y * imageData.width + x) * 4
  return {
    r: imageData.data[idx],
    g: imageData.data[idx + 1],
    b: imageData.data[idx + 2],
    a: imageData.data[idx + 3],
  }
}

/** 判断像素是否为"可写"（浅色/白色） */
function isWritablePixel(pixel: Pixel, threshold: number = 200): boolean {
  const brightness = (pixel.r + pixel.g + pixel.b) / 3
  return brightness > threshold && pixel.a > 128
}

/**
 * 检测背景图中的横格线
 * 通过扫描每一行，统计深色像素的连续性
 * 
 * @param imageData 背景图像数据
 * @param minLineLength 最小线条长度（像素）
 * @param darknessThreshold 深色阈值
 * @returns 横格线 y 坐标列表（相对于图像）
 */
export function detectGridLinesFromImage(
  imageData: ImageData,
  minLineLength: number = 100,
  darknessThreshold: number = 180,
): number[] {
  const { width, height } = imageData
  const gridLines: number[] = []
  const lineThreshold = 0.6 // 60% 像素为深色才算横格线

  for (let y = 0; y < height; y++) {
    let darkCount = 0
    let consecutiveDark = 0
    let maxConsecutive = 0

    for (let x = 0; x < width; x++) {
      const pixel = getPixel(imageData, x, y)
      const brightness = (pixel.r + pixel.g + pixel.b) / 3

      if (brightness < darknessThreshold) {
        darkCount++
        consecutiveDark++
        if (consecutiveDark > maxConsecutive) {
          maxConsecutive = consecutiveDark
        }
      } else {
        consecutiveDark = 0
      }
    }

    // 判定为横格线：深色像素占比高 且 有足够长的连续段
    if (darkCount / width > lineThreshold && maxConsecutive > minLineLength) {
      gridLines.push(y)
    }
  }

  // 合并相邻的横格线（间距小于 3px 的合并）
  const merged: number[] = []
  for (const y of gridLines) {
    if (merged.length === 0 || y - merged[merged.length - 1] > 3) {
      merged.push(y)
    } else {
      // 取平均
      merged[merged.length - 1] = Math.round((merged[merged.length - 1] + y) / 2)
    }
  }

  return merged
}

/**
 * 检测背景图中的可写区域
 * 策略：基于横格线检测结果，每两条横格线之间为一个可写区域
 * 如果没有横格线，则将整个浅色区域作为一个可写区域
 * 
 * @param imageData 背景图像数据
 * @param gridLines 已检测的横格线
 * @param margin 边距
 * @returns 可写区域列表
 */
export function detectWritableRegions(
  imageData: ImageData,
  gridLines: number[],
  margin: { top: number; bottom: number; left: number; right: number } = { top: 40, bottom: 40, left: 40, right: 40 },
): WritableRegion[] {
  const { width, height } = imageData
  const regions: WritableRegion[] = []

  if (gridLines.length >= 2) {
    // 基于横格线生成可写区域
    // 将横格线按间距分组，连续的横格线归为同一区域
    const groups: number[][] = []
    let currentGroup: number[] = [gridLines[0]]

    for (let i = 1; i < gridLines.length; i++) {
      const gap = gridLines[i] - gridLines[i - 1]
      // 如果间距与平均间距接近，归为同一组
      const avgGap = currentGroup.length > 1
        ? (currentGroup[currentGroup.length - 1] - currentGroup[0]) / (currentGroup.length - 1)
        : gap

      if (Math.abs(gap - avgGap) < avgGap * 0.3) {
        currentGroup.push(gridLines[i])
      } else {
        if (currentGroup.length >= 3) groups.push(currentGroup)
        currentGroup = [gridLines[i]]
      }
    }
    if (currentGroup.length >= 3) groups.push(currentGroup)

    // 每组横格线构成一个可写区域
    groups.forEach((group, idx) => {
      const topY = group[0]
      const bottomY = group[group.length - 1]
      regions.push({
        id: `region-${idx}-${Date.now()}`,
        x: margin.left,
        y: topY,
        width: width - margin.left - margin.right,
        height: bottomY - topY,
        gridLines: group.map((y) => y - topY),
        autoDetected: true,
      })
    })
  }

  // 如果没有检测到横格线区域，使用空白区域检测
  if (regions.length === 0) {
    const blankRegion = detectBlankRegion(imageData, margin)
    if (blankRegion) {
      regions.push({
        id: `region-blank-${Date.now()}`,
        ...blankRegion,
        gridLines: [],
        autoDetected: true,
      })
    }
  }

  // 如果仍然没有区域，使用整个页面（减去边距）
  if (regions.length === 0) {
    regions.push({
      id: `region-full-${Date.now()}`,
      x: margin.left,
      y: margin.top,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
      gridLines: [],
      autoDetected: true,
    })
  }

  return regions
}

/**
 * 检测图像中最大的浅色（可写）连通区域
 * 使用简化的洪水填充算法
 */
function detectBlankRegion(
  imageData: ImageData,
  margin: { top: number; bottom: number; left: number; right: number },
): { x: number; y: number; width: number; height: number } | null {
  const { width, height } = imageData
  const writableThreshold = 200

  // 按行扫描，找到可写行的范围
  let minWritableY = height
  let maxWritableY = 0
  let minWritableX = width
  let maxWritableX = 0

  const step = 4 // 采样步长，加速检测

  for (let y = margin.top; y < height - margin.bottom; y += step) {
    for (let x = margin.left; x < width - margin.right; x += step) {
      const pixel = getPixel(imageData, x, y)
      if (isWritablePixel(pixel, writableThreshold)) {
        if (y < minWritableY) minWritableY = y
        if (y > maxWritableY) maxWritableY = y
        if (x < minWritableX) minWritableX = x
        if (x > maxWritableX) maxWritableX = x
      }
    }
  }

  if (maxWritableY <= minWritableY || maxWritableX <= minWritableX) {
    return null
  }

  return {
    x: minWritableX,
    y: minWritableY,
    width: maxWritableX - minWritableX,
    height: maxWritableY - minWritableY,
  }
}

/**
 * 从图片元素加载 ImageData
 */
export function imageToImageData(img: HTMLImageElement, width: number, height: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/**
 * 从 Data URL 加载图片
 */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * 生成缩略图 Data URL
 */
export function generateThumbnail(img: HTMLImageElement, maxSize: number = 120): string {
  const ratio = Math.min(maxSize / img.width, maxSize / img.height)
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.7)
}

/**
 * 文件转 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
