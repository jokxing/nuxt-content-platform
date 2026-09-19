export interface BreadcrumbItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export interface BreadcrumbList {
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbItem[]
}

export interface NewsArticle {
  '@type': 'NewsArticle'
  headline: string
  description: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: {
    '@type': 'Person' | 'Organization'
    name: string
  }
  publisher?: {
    '@type': 'Organization'
    name: string
    logo?: {
      '@type': 'ImageObject'
      url: string
    }
  }
}

export interface WebPage {
  '@type': 'WebPage'
  name: string
  description: string
  url: string
  breadcrumb?: BreadcrumbList
}

export type SchemaType = NewsArticle | WebPage | BreadcrumbList

export interface SchemaOptions {
  type: 'NewsArticle' | 'WebPage' | 'BreadcrumbList'
  data: Partial<SchemaType>
}
