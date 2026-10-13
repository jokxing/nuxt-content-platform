<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NButton, NTag } from 'naive-ui'
import { listAdminDeployments, retryAdminDeployment } from '~/api/adminDeployments'
import { AdminApiError } from '~/api/adminClient'
import type { Deployment, DeploymentStatus } from '~/types/admin'
import { formatAdminMillis } from '~/types/admin'

useHead({ title: '构建状态 - 讯览资讯管理' })

const auth = useAdminAuth()
const message = useMessage()
const loading = ref(false)
const retryingId = ref<number | null>(null)
const errorMessage = ref('')
const items = ref<Deployment[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const STATUS_LABEL: Record<DeploymentStatus, string> = {
  QUEUED: '等待触发',
  RUNNING: '构建中',
  SUCCEEDED: '部署成功',
  FAILED: '构建失败',
  SKIPPED: '已合并',
}

const REASON_LABEL: Record<string, string> = {
  article_published: '文章发布',
  article_updated: '文章更新',
  article_unpublished: '文章下线',
  dataset_published: '数据发布',
  schedule_updated: '计划更新',
  daily_schedule: '每日构建',
  manual: '手动构建',
}

function statusType(status: DeploymentStatus) {
  if (status === 'SUCCEEDED')
    return 'success'
  if (status === 'FAILED')
    return 'error'
  if (status === 'RUNNING')
    return 'info'
  if (status === 'QUEUED')
    return 'warning'
  return 'default'
}

const columns = computed<DataTableColumns<Deployment>>(() => [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '触发原因',
    key: 'reason',
    width: 120,
    render: row => REASON_LABEL[row.reason] || row.reason,
  },
  {
    title: '文章',
    key: 'article_id',
    width: 110,
    render: row => row.article_id == null ? '—' : `#${row.article_id} v${row.article_version ?? '—'}`,
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render: row => h(NTag, {
      type: statusType(row.status),
      size: 'small',
      bordered: false,
    }, { default: () => STATUS_LABEL[row.status] }),
  },
  { title: '尝试次数', key: 'attempts', width: 90 },
  {
    title: '创建时间',
    key: 'created_at',
    width: 160,
    render: row => formatAdminMillis(row.created_at),
  },
  {
    title: '错误摘要',
    key: 'error_summary',
    ellipsis: { tooltip: true },
    render: row => row.error_summary || '—',
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right',
    render(row) {
      const actions = []
      if (row.external_run_url) {
        actions.push(h(NButton, {
          type: 'primary',
          ghost: true,
          size: 'small',
          tag: 'a',
          href: row.external_run_url,
          target: '_blank',
          rel: 'noopener noreferrer',
        }, { default: () => '运行详情' }))
      }
      if (row.status === 'FAILED') {
        actions.push(h(NButton, {
          text: true,
          type: 'primary',
          loading: retryingId.value === row.id,
          onClick: () => void retryBuild(row),
        }, { default: () => '重试' }))
      }
      return h('div', { class: 'action_row' }, actions)
    },
  },
])

async function loadDeployments() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listAdminDeployments(page.value, pageSize.value)
    items.value = data.items
    total.value = data.total
    page.value = data.page
    pageSize.value = data.page_size
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof AdminApiError ? error.message : '构建记录加载失败'
  }
  finally {
    loading.value = false
  }
}

async function retryBuild(row: Deployment) {
  retryingId.value = row.id
  errorMessage.value = ''
  try {
    await auth.withCsrfRetry(csrf => retryAdminDeployment(row.id, csrf))
    message.success('已重新排队，等待 worker 触发构建')
    await loadDeployments()
  }
  catch (error: unknown) {
    errorMessage.value = error instanceof AdminApiError ? error.message : '重试失败，请稍后再试'
  }
  finally {
    retryingId.value = null
  }
}

function onPageChange(value: number) {
  page.value = value
  void loadDeployments()
}

onMounted(() => void loadDeployments())
</script>

<template>
  <div class="deployments_page">
    <div class="page_header">
      <div>
        <h1 class="page_title">构建状态</h1>
        <p class="page_description">内容发布与站点部署分开执行；只有“部署成功”表示线上版本已更新。</p>
      </div>
      <n-button :loading="loading" @click="loadDeployments">刷新</n-button>
    </div>

    <n-alert v-if="errorMessage" type="error" closable class="page_alert" @close="errorMessage = ''">
      {{ errorMessage }}
    </n-alert>

    <n-card size="small" :bordered="true">
      <n-data-table
        :columns="columns"
        :data="items"
        :loading="loading"
        :bordered="false"
        :single-line="false"
        :scroll-x="980"
        size="small"
      />
      <div class="pager_row">
        <span>共 {{ total }} 条</span>
        <n-pagination
          :page="page"
          :page-size="pageSize"
          :item-count="total"
          :disabled="loading"
          @update:page="onPageChange"
        />
      </div>
    </n-card>
  </div>
</template>

<style scoped lang="scss">
.page_header,
.pager_row,
.action_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page_header { margin-bottom: 16px; }
.page_title { margin: 0; font-size: 20px; font-weight: 600; }
.page_description { margin: 6px 0 0; color: var(--admin-text-muted); }
.page_alert { margin-bottom: 12px; }
.pager_row { margin-top: 16px; color: var(--admin-text-muted); font-size: 13px; }
.action_row { justify-content: flex-start; }

@media (max-width: 640px) {
  .page_header { align-items: flex-start; }
  .page_description { max-width: 250px; }
}
</style>
