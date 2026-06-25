import type { FontDefinition, HandwritingFont } from '../types'

/**
 * 字体注册表
 * 包含本地字体、Google Fonts CDN 字体、用户自定义字体
 */

/** 内置字体列表 */
export const BUILTIN_FONTS: FontDefinition[] = [
  // === 本地字体 ===
  {
    name: 'LXGW WenKai',
    label: '霞鹜文楷',
    source: 'local',
    file: '/fonts/LXGWWenKai-Regular.ttf',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  // === Google Fonts 中文手写 ===
  {
    name: 'Ma Shan Zheng',
    label: '马善政体',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'Liu Jian Mao Cao',
    label: '刘建毛草',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'Zhi Mang Xing',
    label: '志莽行书',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'Long Cang',
    label: '龙藏体',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'ZCOOL KuaiLe',
    label: '站酷快乐体',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'ZCOOL QingKe HuangYou',
    label: '站酷庆科黄油',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'ZCOOL XiaoWei',
    label: '站酷小薇',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  {
    name: 'Tian Ma Shan Shan',
    label: '天马山山',
    source: 'google',
    sample: '手写笔迹模拟',
    cjk: true,
  },
  // === Google Fonts 英文手写 ===
  {
    name: 'Caveat',
    label: 'Caveat',
    source: 'google',
    sample: 'Handwriting Abc',
    cjk: false,
  },
  {
    name: 'Kalam',
    label: 'Kalam',
    source: 'google',
    sample: 'Handwriting Abc',
    cjk: false,
  },
  {
    name: 'Patrick Hand',
    label: 'Patrick Hand',
    source: 'google',
    sample: 'Handwriting Abc',
    cjk: false,
  },
  {
    name: 'Shadows Into Light',
    label: 'Shadows Into Light',
    source: 'google',
    sample: 'Handwriting Abc',
    cjk: false,
  },
  {
    name: 'Indie Flower',
    label: 'Indie Flower',
    source: 'google',
    sample: 'Handwriting Abc',
    cjk: false,
  },
]

/** 已加载的字体集合（用于检测字体是否可用） */
const loadedFonts = new Set<string>()

/**
 * 加载本地字体文件
 */
export async function loadLocalFont(fontDef: FontDefinition): Promise<void> {
  if (!fontDef.file || loadedFonts.has(fontDef.name)) return

  try {
    const fontFace = new FontFace(fontDef.name, `url(${fontDef.file})`)
    await fontFace.load()
    document.fonts.add(fontFace)
    loadedFonts.add(fontDef.name)
  } catch (err) {
    console.warn(`Failed to load font ${fontDef.name}:`, err)
  }
}

/**
 * 加载用户自定义字体（通过 File 对象）
 */
export async function loadCustomFont(file: File): Promise<string> {
  const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '')
  const arrayBuffer = await file.arrayBuffer()

  try {
    const fontFace = new FontFace(fontName, arrayBuffer)
    await fontFace.load()
    document.fonts.add(fontFace)
    loadedFonts.add(fontName)
    return fontName
  } catch (err) {
    console.error(`Failed to load custom font ${file.name}:`, err)
    throw err
  }
}

/**
 * 等待 Google Fonts 加载完成
 */
export async function ensureGoogleFontLoaded(fontName: string): Promise<void> {
  if (loadedFonts.has(fontName)) return
  try {
    await document.fonts.load(`16px "${fontName}"`)
    loadedFonts.add(fontName)
  } catch (err) {
    console.warn(`Google font ${fontName} not available:`, err)
  }
}

/**
 * 获取字体定义
 */
export function getFontDefinition(name: HandwritingFont): FontDefinition | undefined {
  return BUILTIN_FONTS.find((f) => f.name === name)
}

/**
 * 初始化所有本地字体
 */
export async function initLocalFonts(): Promise<void> {
  const localFonts = BUILTIN_FONTS.filter((f) => f.source === 'local')
  await Promise.all(localFonts.map(loadLocalFont))
}
