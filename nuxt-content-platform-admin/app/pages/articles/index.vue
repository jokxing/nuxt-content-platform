<script setup lang="ts">
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { NButton, NTag } from 'naive-ui'
import { listAdminArticles, listAdminCategories } from '~/api/adminArticles'
import { AdminApiError } from '~/api/adminClient'
import type {
  AdminArticleSummary,
  ArticleFormModalExpose,
  ArticleStatus,
} from '~/types/admin'
import {
  ARTICLE_STATUS_LABEL,
  formatAdminMillis,
} from '~/types/admin'

useHead({
  title: '文章列表 - 讯览资讯管理',
})

const message = useMessage()
const formModal = ref<ArticleFormModalExpose | null>(null)

const loading = ref(false)
const loadError = ref('')
const items = ref<AdminArticleSummary[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filterStatus = ref<ArticleStatus | null>(null)
const filterCategory = ref<string | null>(null)
const filterQ = ref('')
const categoryOptions = ref<SelectOption[]>([])

const statusOptions: SelectOption[] = [
  { label: ARTICLE_STATUS_LABEL.DRAFT, value: 'DRAFT' },
  { label: ARTICLE_STATUS_LABEL.PUBLISHED, value: 'PUBLISHED' },
  { label: ARTICLE_STATUS_LABEL.ARCHIVED, value: 'ARCHIVED' },
]

const columns = computed<DataTableColumns<AdminArticleSummary>>(() => [
  {
    title: '标题',
    key: 'title',
    ellipsis: { tooltip: true },
    render(row) {
      return row.title || '（无标题）'
    },
  },
  {
    title: 'Slug',
    key: 'slug',
    width: 160,
    ellipsis: { tooltip: true },
  },
  {
    title: '分类',
    key: 'category',
    width: 120,
    render(row) {
      return row.category?.name || '—'
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 96,
    render(row) {
      const type = row.status === 'PUBLISHED'
        ? 'success'
        : row.status === 'ARCHIVED'
          ? 'default'
          : 'warning'
      return h(NTag, { type, size: 'small', bordered: false }, {
        default: () => ARTICLE_STATUS_LABEL[row.status],
      })
    },
  },
  {
    title: '作者',
    key: 'author',
    width: 100,
    ellipsis: { tooltip: true },
  },
  {
    title: '更新时间',
    key: 'updated_at',
    width: 150,
    render(row) {
      return formatAdminMillis(row.updated_at)
    },
  },
  {
    title: '版本',
    key: 'version',
    width: 64,
  },
  {
    title: '操作',
    key: 'actions',
    width: 88,
    fixed: 'right',
    render(row) {
      return h(NButton, {
        text: true,
        type: 'primary',
        size: 'small',
        onClick: () => openEdit(row.id),
      }, { default: () => '编辑' })
    },
  },
])

async function loadCategories() {
  try {
    const cats = await listAdminCategories()
    categoryOptions.value = cats.map(item => ({
      label: item.name,
      value: item.slug,
    }))
  }
  catch (error: unknown) {
    message.error(error instanceof AdminApiError ? error.message : '分类加载失败')
  }
}

async function loadList() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await listAdminArticles({
      status: filterStatus.value,
      category: filterCategory.value,
      q: filterQ.value.trim() || null,
      page: page.value,
      pageSize: pageSize.value,
    })
    items.value = data.items
    total.value = data.total
    page.value = data.page
    pageSize.value = data.page_size
  }
  catch (error: unknown) {
    items.value = []
    total.value = 0
    loadError.value = error instanceof AdminApiError ? error.message : '列表加载失败'
  }
  finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  void loadList()
}

function onPageChange(next: number) {
  page.value = next
  void loadList()
}

function onPageSizeChange(next: number) {
  pageSize.value = next
  page.value = 1
  void loadList()
}

function openCreate() {
  formModal.value?.openCreate()
}

function openEdit(id: number) {
  formModal.value?.openEdit(id)
}

function onSaved() {
  void loadList()
}

onMounted(async () => {
  await loadCategories()
  await loadList()
})
</script>

<template>
  <div class="articles_page">
    <div class="articles_toolbar">
      <h1 class="page_title">
        文章列表
      </h1>
      <n-button
        type="primary"
        @click="openCreate"
      >
        新建文章
      </n-button>
    </div>

    <n-card
      size="small"
      class="articles_filters"
      :bordered="true"
    >
      <div class="filters_row">
        <n-select
          v-model:value="filterStatus"
          class="filter_item"
          :options="statusOptions"
          placeholder="全部状态"
          clearable
        />
        <n-select
          v-model:value="filterCategory"
          class="filter_item"
          :options="categoryOptions"
          placeholder="全部分类"
          clearable
          filterable
        />
        <n-input
          v-model:value="filterQ"
          class="filter_q"
          clearable
          placeholder="搜索 slug / 作者 / 标题"
          maxlength="100"
          @keyup.enter="onSearch"
        />
        <n-button
          type="primary"
          secondary
          :loading="loading"
          @click="onSearch"
        >
          查询
        </n-button>
      </div>
    </n-card>

    <n-alert
      v-if="loadError"
      type="error"
      :bordered="false"
      class="list_alert"
    >
      <div class="alert_row">
        <span>{{ loadError }}</span>
        <n-button
          size="small"
          @click="loadList"
        >
          重试
        </n-button>
      </div>
    </n-alert>

    <n-card
      class="articles_table_card"
      size="small"
      :bordered="true"
    >
      <n-data-table
        :columns="columns"
        :data="items"
        :loading="loading"
        :bordered="false"
        :single-line="false"
        :scroll-x="960"
        size="small"
      />
      <div
        v-if="!loading && !loadError && items.length === 0"
        class="empty_wrap"
      >
        <n-empty description="暂无文章" />
      </div>
      <div class="pager_row">
        <span class="pager_meta">共 {{ total }} 篇</span>
        <n-pagination
          :page="page"
          :page-size="pageSize"
          :item-count="total"
          :page-sizes="[10, 20, 50]"
          show-size-picker
          :disabled="loading"
          @update:page="onPageChange"
          @update:page-size="onPageSizeChange"
        />
      </div>
    </n-card>

    <ArticleFormModal
      ref="formModal"
      @saved="onSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.articles_toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.page_title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.articles_filters {
  margin-bottom: 16px;
}

.filters_row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter_item {
  width: 160px;
}

.filter_q {
  flex: 1 1 200px;
  min-width: 160px;
  max-width: 360px;
}

.list_alert {
  margin-bottom: 12px;
}

.alert_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.articles_table_card {
  overflow: hidden;
}

.empty_wrap {
  padding: 24px 0 8px;
}

.pager_row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.pager_meta {
  color: var(--n-text-color-3);
  font-size: 13px;
}

@media (max-width: 640px) {
  .filter_item {
    width: 100%;
  }

  .filter_q {
    max-width: none;
  }

  .pager_row {
    justify-content: center;
  }
}
</style>
