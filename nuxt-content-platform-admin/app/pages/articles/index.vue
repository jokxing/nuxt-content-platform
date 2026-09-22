<script setup lang="ts">
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { NButton, NSpace, NTag, NTooltip } from 'naive-ui'
import { deleteAdminArticle, listAdminArticles, listAdminCategories } from '~/api/adminArticles'
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

const formModal = ref<ArticleFormModalExpose | null>(null)
const auth = useAdminAuth()
const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const loadError = ref('')
const deleteError = ref('')
const listErrorAlertRef = ref<HTMLElement | null>(null)
const categoryErrorAlertRef = ref<HTMLElement | null>(null)
const deleteErrorAlertRef = ref<HTMLElement | null>(null)
const items = ref<AdminArticleSummary[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const filterStatus = ref<ArticleStatus | null>(null)
const filterCategory = ref<string | null>(null)
const filterQ = ref('')
const categoryOptions = ref<SelectOption[]>([])
const categoryLoading = ref(false)
const categoryError = ref('')

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
    width: 140,
    fixed: 'right',
    render(row) {
      const editBtn = h(NButton, {
        text: true,
        type: 'primary',
        size: 'small',
        onClick: () => openEdit(row.id),
      }, { default: () => '编辑' })

      const deleteBtn = row.status === 'PUBLISHED'
        ? h(NTooltip, null, {
            trigger: () => h('span', { class: 'action_disabled_wrap' }, [
              h(NButton, {
                text: true,
                type: 'error',
                size: 'small',
                disabled: true,
              }, { default: () => '删除' }),
            ]),
            default: () => '请先下线后再删除',
          })
        : h(NButton, {
            text: true,
            type: 'error',
            size: 'small',
            onClick: () => requestDelete(row),
          }, { default: () => '删除' })

      return h(NSpace, { size: 8, wrap: false }, {
        default: () => [editBtn, deleteBtn],
      })
    },
  },
])

function focusAlert(el: HTMLElement | null) {
  if (!el)
    return
  el.focus({ preventScroll: true })
}

async function loadCategories() {
  categoryLoading.value = true
  categoryError.value = ''
  try {
    const cats = await listAdminCategories()
    categoryOptions.value = cats.map(item => ({
      label: item.name,
      value: item.slug,
    }))
  }
  catch (error: unknown) {
    categoryOptions.value = []
    categoryError.value = error instanceof AdminApiError
      ? error.message
      : '分类加载失败，请稍后重试'
    await nextTick()
    focusAlert(categoryErrorAlertRef.value)
  }
  finally {
    categoryLoading.value = false
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
    loadError.value = error instanceof AdminApiError
      ? error.message
      : '列表加载失败，请稍后重试'
    await nextTick()
    focusAlert(listErrorAlertRef.value)
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

async function refreshAfterDelete() {
  if (items.value.length <= 1 && page.value > 1)
    page.value -= 1
  await loadList()
}

function requestDelete(row: AdminArticleSummary) {
  if (row.status === 'PUBLISHED')
    return

  deleteError.value = ''
  const label = row.title.trim() || row.slug

  dialog.warning({
    title: '确认删除文章？',
    content: `将永久删除「${label}」（slug: ${row.slug}）。此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      const csrf = auth.csrfToken.value
      if (!csrf) {
        deleteError.value = '会话已失效，请重新登录后再删除'
        setTimeout(() => focusAlert(deleteErrorAlertRef.value), 0)
        return true
      }

      try {
        await auth.withCsrfRetry(currentCsrf => deleteAdminArticle(
          row.id,
          row.version,
          currentCsrf,
        ))
        message.success('已删除')
        await refreshAfterDelete()
        return true
      }
      catch (error: unknown) {
        if (error instanceof AdminApiError) {
          if (error.code === 40900) {
            deleteError.value = `${error.message}。请刷新列表后重试。`
          }
          else if (
            error.code === 40901
            || error.code === 40410
            || error.code === 40301
            || error.code === 40000
          ) {
            deleteError.value = error.message
          }
          else {
            deleteError.value = error.message || '删除失败，请稍后重试'
          }
        }
        else {
          deleteError.value = '删除失败，请稍后重试'
        }
        setTimeout(() => focusAlert(deleteErrorAlertRef.value), 0)
        return true
      }
    },
  })
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
          :loading="categoryLoading"
          :disabled="Boolean(categoryError)"
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
      <div
        v-if="categoryError"
        ref="categoryErrorAlertRef"
        class="filter_error"
        tabindex="-1"
        role="alert"
        aria-live="assertive"
      >
        <n-alert
          type="error"
          :bordered="false"
        >
          <div class="alert_row">
            <span>{{ categoryError }}</span>
            <n-button
              size="small"
              :loading="categoryLoading"
              @click="loadCategories"
            >
              重试分类
            </n-button>
          </div>
        </n-alert>
      </div>
    </n-card>

    <div
      v-if="loadError"
      ref="listErrorAlertRef"
      class="list_alert"
      tabindex="-1"
      role="alert"
      aria-live="assertive"
    >
      <n-alert
        type="error"
        :bordered="false"
      >
        <div class="alert_row">
          <span>{{ loadError }}</span>
          <n-button
            size="small"
            :loading="loading"
            @click="loadList"
          >
            重试
          </n-button>
        </div>
      </n-alert>
    </div>

    <div
      v-if="deleteError"
      ref="deleteErrorAlertRef"
      class="list_alert"
      tabindex="-1"
      role="alert"
      aria-live="assertive"
    >
      <n-alert
        type="error"
        :bordered="false"
        closable
        @close="deleteError = ''"
      >
        {{ deleteError }}
      </n-alert>
    </div>

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
        :scroll-x="1000"
        size="small"
      />
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

.filter_error {
  margin-top: 12px;
  outline: none;
}

.list_alert {
  margin-bottom: 12px;
  outline: none;
}

.alert_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.action_disabled_wrap {
  display: inline-flex;
}

.articles_table_card {
  overflow: hidden;
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
