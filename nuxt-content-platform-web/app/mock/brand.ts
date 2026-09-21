/**
 * 演示品牌与业务映射（全局约定，供后续逐页脱敏复用）
 * MOCK 阶段固定值；接真实后端后可保留品牌常量、替换数据源。
 */

export const DEMO_BRAND = {
  /** 对外展示名（简体） */
  nameZhCN: '讯览',
  /** 对外展示名（繁体） */
  nameZhHK: '訊覽',
  /** 对外展示名（英文） */
  nameEn: 'ContentPulse',
  /** 短描述 */
  descriptionZhCN: '多语言资讯与数据展示平台（演示）',
  descriptionZhHK: '多語言資訊與數據展示平台（演示）',
  descriptionEn: 'Multilingual news and data demo platform',
  /** 本地开发站点，勿指向原生产域名 */
  siteUrl: 'http://localhost:3666',
  /** 占位公开域名（非真实服务） */
  publicPlaceholder: 'https://demo.contentpulse.local',
} as const

/**
 * 通用内容场景映射。
 */
export const BUSINESS_MAPPING = {
  latestDataset: '期次数据发布 / 最新数据集',
  values: '数据项编号（演示用 1–49，保留图表交互）',
  history: '历史记录列表',
  coldHot: '频次与分布统计',
  numberMiss: '间隔 / 遗漏类指标',
  advancedStats: '组合与占比类进阶统计',
  demoCombinations: '固定演示组合（筛选工具）',
  newsEducation: '指南（原教学分类路由 education）',
  newsAnalysis: '分析（原分析分类路由 analysis）',
  newsStory: '动态（原故事分类路由 story）',
} as const

/** 固定可复现时钟，避免 SSR/客户端倒计时水合不一致 */
export const MOCK_CLOCK_ISO = '2026-09-17T12:00:00+08:00'

/** 跨页面一致的文章 ID */
export const MOCK_ARTICLE_IDS = [101, 102, 103, 104, 105] as const
