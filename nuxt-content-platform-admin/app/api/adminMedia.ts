import { adminApiRequest } from '~/api/adminClient'

export type MediaAsset = {
  id: number
  key: string
  url: string
  mime_type: 'image/webp'
  width: number
  height: number
  size: number
  created_at: number
}

export async function uploadCoverImage(
  file: File,
  csrfToken: string,
): Promise<MediaAsset> {
  const form = new FormData()
  form.append('file', file)
  return adminApiRequest<MediaAsset>('/api/admin/media/images', {
    method: 'POST',
    body: form,
    csrfToken,
  })
}
