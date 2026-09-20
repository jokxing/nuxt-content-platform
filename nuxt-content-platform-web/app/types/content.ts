export interface ArticleDto {
  id: number
  title: string
  slug: string
  content: string
  publish_date: number | string
  author: string
  cover_image: string
  status: number
  category: string
  category_slug: string
  parent_route: 'education' | 'analysis' | 'story'
}

export interface ArticlePage {
  items: ArticleDto[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
