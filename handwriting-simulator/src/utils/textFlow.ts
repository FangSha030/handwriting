import type { CharLayout, HandwritingParams, WritableRegion, PageLayout } from '../types'

/**
 * 文本流引擎
 * 
 * 核心功能：
 * 1. 将长文本自动分配到多个可写区域/多页
 * 2. 支持横格线对齐
 * 3. 支持自动分页
 * 4. 支持首行缩进
 * 
 * 参考 HandwritingGenerator 的分页逻辑，增强为：
 * - 多区域支持（一张背景图可有多个可写区域）
 * - 自动检测背景可写区域
 * - 横格线基线对齐
 */

/**
 * 将文本布局到可写区域
 * 
 * @param text 文本内容
 * @param ctx canvas 上下文（用于测量字符宽度）
 * @param params 手写参数
 * @param regions 可写区域列表（按顺序填充）
 * @returns 页面布局列表（每页包含字符布局）
 */
export function flowTextIntoRegions(
  text: string,
  ctx: CanvasRenderingContext2D,
  params: HandwritingParams,
  regions: WritableRegion[],
): PageLayout[] {
  const pages: PageLayout[] = []
  const {
    fontSize,
    lineHeight,
    letterSpacing,
    wordSpacing,
    firstLineIndent,
    font,
    printFont,
  } = params

  // 设置字体用于测量（编辑态用打印体，最终态用手写体）
  const measureFont = `"${font}", "${printFont}", sans-serif`
  ctx.font = `${fontSize}px ${measureFont}`

  let charIndex = 0
  const chars = Array.from(text) // 支持 Unicode（含 emoji）
  let regionIdx = 0

  // 每个可写区域对应一"页"（在单张背景图上）
  // 如果文本超出所有区域，则循环使用区域（自动分页）
  while (charIndex < chars.length) {
    // 如果所有区域都用完了，但还有文字，创建新页（复用最后一个区域或创建空白页）
    let currentRegion: WritableRegion
    if (regionIdx < regions.length) {
      currentRegion = regions[regionIdx]
    } else {
      // 自动分页：复用第一个区域作为模板
      if (regions.length === 0) break
      currentRegion = { ...regions[0], id: `region-auto-${regionIdx}` }
    }

    const pageLayout = layoutCharsInRegion(
      chars.slice(charIndex),
      ctx,
      params,
      currentRegion,
      charIndex, // 全局字符起始索引
    )

    if (pageLayout.chars.length === 0) {
      // 无法放入任何字符，跳过
      regionIdx++
      if (regionIdx > regions.length + 10) break // 防止死循环
      continue
    }

    pages.push({
      pageIndex: pages.length,
      backgroundId: null,
      region: currentRegion,
      chars: pageLayout.chars,
      startCharIndex: charIndex,
      endCharIndex: charIndex + pageLayout.chars.filter((c) => !c.isLineBreak).length,
    })

    charIndex += pageLayout.chars.filter((c) => !c.isLineBreak).length

    regionIdx++

    // 安全阀
    if (pages.length > 200) break
  }

  return pages
}

/**
 * 在单个可写区域内布局字符
 */
function layoutCharsInRegion(
  chars: string[],
  ctx: CanvasRenderingContext2D,
  params: HandwritingParams,
  region: WritableRegion,
  globalStartIndex: number,
): { chars: CharLayout[] } {
  const {
    fontSize,
    lineHeight,
    letterSpacing,
    wordSpacing,
    firstLineIndent,
    font,
    printFont,
  } = params

  const layouts: CharLayout[] = []
  const measureFont = `"${font}", "${printFont}", sans-serif`
  ctx.font = `${fontSize}px ${measureFont}`

  const regionLeft = region.x
  const regionRight = region.x + region.width
  const regionTop = region.y
  const regionBottom = region.y + region.height

  // 横格线（相对于画布的绝对坐标）
  const gridLines = region.gridLines.map((y) => region.y + y)

  let currentX = regionLeft + (firstLineIndent * fontSize)
  let currentLine = 0
  let currentBaselineY: number

  // 基线 y：如果有横格线，对齐到第一条；否则按行高计算
  if (gridLines.length > 0) {
    currentBaselineY = gridLines[0]
  } else {
    currentBaselineY = regionTop + fontSize
  }

  let globalIdx = globalStartIndex

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]

    // 换行符
    if (char === '\n') {
      layouts.push({
        char: '\n',
        x: currentX,
        y: currentBaselineY,
        width: 0,
        height: fontSize,
        lineIndex: currentLine,
        isLineBreak: true,
        pageIndex: 0, // 由调用方设置
        regionId: region.id,
      })
      currentLine++
      currentX = regionLeft // 换行后不缩进
      currentBaselineY = getNextBaselineY(currentBaselineY, gridLines, fontSize, lineHeight)
      // 检查是否超出区域
      if (currentBaselineY > regionBottom) break
      continue
    }

    // 测量字符宽度
    const charWidth = ctx.measureText(char).width
    const advance = charWidth + letterSpacing + (char === ' ' ? wordSpacing : 0)

    // 检查是否需要换行
    if (currentX + charWidth > regionRight) {
      currentLine++
      currentX = regionLeft
      currentBaselineY = getNextBaselineY(currentBaselineY, gridLines, fontSize, lineHeight)
      if (currentBaselineY > regionBottom) break
    }

    layouts.push({
      char,
      x: currentX,
      y: currentBaselineY,
      width: charWidth,
      height: fontSize,
      lineIndex: currentLine,
      pageIndex: 0, // 由调用方设置
      regionId: region.id,
    })

    currentX += advance
    globalIdx++
  }

  return { chars: layouts }
}

/**
 * 获取下一行的基线 y 坐标
 * 优先对齐到横格线，否则按行高计算
 */
function getNextBaselineY(
  currentY: number,
  gridLines: number[],
  fontSize: number,
  lineHeight: number,
): number {
  if (gridLines.length === 0) {
    return currentY + fontSize * lineHeight
  }

  // 找到当前 y 之后的下一条横格线
  for (const lineY of gridLines) {
    if (lineY > currentY + fontSize * 0.3) {
      return lineY
    }
  }

  // 如果没有更多横格线，按行高继续
  return currentY + fontSize * lineHeight
}

/**
 * 将多页布局展平为单个字符布局数组（用于兼容旧渲染逻辑）
 */
export function flattenPages(pages: PageLayout[]): CharLayout[] {
  const all: CharLayout[] = []
  pages.forEach((page) => {
    all.push(...page.chars)
  })
  return all
}

/**
 * 统计文本能填充多少页
 */
export function estimatePageCount(
  text: string,
  params: HandwritingParams,
  region: { width: number; height: number },
): number {
  const charsPerLine = Math.floor(region.width / (params.fontSize + params.letterSpacing))
  const linesPerPage = Math.floor(region.height / (params.fontSize * params.lineHeight))
  const charsPerPage = charsPerLine * linesPerPage
  if (charsPerPage === 0) return 1
  return Math.ceil(text.length / charsPerPage)
}
