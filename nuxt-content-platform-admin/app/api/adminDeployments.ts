import { adminApiRequest } from '~/api/adminClient'
import type { Deployment, DeploymentPage } from '~/types/admin'

export function listAdminDeployments(page = 1, pageSize = 20): Promise<DeploymentPage> {
  return adminApiRequest<DeploymentPage>('/api/admin/deployments', {
    method: 'GET',
    query: { page, page_size: pageSize },
  })
}

export function retryAdminDeployment(id: number, csrfToken: string): Promise<Deployment> {
  return adminApiRequest<Deployment>(`/api/admin/deployments/${id}/retry`, {
    method: 'POST',
    csrfToken,
  })
}
