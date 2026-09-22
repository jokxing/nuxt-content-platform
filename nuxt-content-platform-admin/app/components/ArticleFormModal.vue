<script setup lang="ts">
import type { FormInst, FormRules, SelectOption } from 'naive-ui'
import {
  createAdminArticle,
  getAdminArticle,
  listAdminCategories,
  updateAdminArticle,
} from '~/api/adminArticles'
import { AdminApiError } from '~/api/adminClient'
import type {
  ArticleFormDraft,
  ArticleFormMode,
  ArticleLocale,
  ArticleStatus,
  ArticleWritePayload,
} from '~/types/admin'
import {
  ARTICLE_STATUS_LABEL,
  articleToFormDraft,
  cloneArticleFormDraft,
  createEmptyArticleFormDraft,
  isValidCoverImage,
} from '~/types/admin'

const emit = defineEmits<{
  saved: []
}>()

const auth = useAdminAuth()
const message = useMessage()

const LANG_TABS: { key: ArticleLocale, label: string }[] = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'zh-HK', label: '繁体中文' },
  { key: 'en-US', label: '英文' },
]

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const visible = ref(false)
const confirmVisible = ref(false)
const mode = ref<ArticleFormMode>('create')
const articleId = ref<number | null>(null)
const activeLang = ref<ArticleLocale>('zh-CN')
const draft = ref<ArticleFormDraft>(createEmptyArticleFormDraft())
const baseline = ref<ArticleFormDraft>(createEmptyArticleFormDraft())
const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const loadingDetail = ref(false)
const loadingCategories = ref(false)
const categoryError = ref('')
const detailError = ref('')
const formError = ref('')
const versionConflict = ref(false)
const currentStatus = ref<ArticleStatus | null>(null)
const categoryOptions = ref<SelectOption[]>([])
const categoriesLoaded = ref(false)
const categoryErrorAlertRef = ref<HTMLElement | null>(null)
const detailErrorAlertRef = ref<HTMLElement | null>(null)
const formErrorAlertRef = ref<HTMLElement | null>(null)

const title = computed(() => {
  if (mode.value === 'create')
    return '新建文章'
  return articleId.value == null ? '编辑文章' : `编辑文章 #${articleId.value}`
})

const isDirty = computed(() =>
  JSON.stringify(draft.value) !== JSON.stringify(baseline.value),
)

const coverBroken = ref(false)

const coverPreview = computed(() => {
  const value = draft.value.coverUrl.trim()
  return isValidCoverImage(value) ? value : null
})

watch(coverPreview, () => {
  coverBroken.value = false
})

const statusHint = computed(() => {
  if (mode.value === 'create')
    return '创建后保存为草稿。本阶段不提供发布。'
  const statusText = currentStatus.value
    ? ARTICLE_STATUS_LABEL[currentStatus.value]
    : '未知'
  return `当前状态：${statusText}。仅保存内容与版本；发布/下线尚未接入。`
})

const formBlocked = computed(() =>
  loadingDetail.value || Boolean(detailError.value) || saving.value,
)

const rules: FormRules = {
  slug: [
    {
      required: true,
      message: '请输入 slug',
      trigger: ['blur', 'input'],
    },
    {
      validator: (_rule, value: string) => {
        if (!value || !SLUG_PATTERN.test(value) || value.length > 160)
          return new Error('slug 须为小写字母、数字与单连字符，长度 1～160')
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
  author: [
    {
      required: true,
      message: '请输入作者',
      trigger: ['blur', 'input'],
    },
    {
      max: 100,
      message: '作者过长',
      trigger: ['blur', 'input'],
    },
  ],
  coverUrl: [
    {
      required: true,
      message: '请输入封面路径',
      trigger: ['blur', 'input'],
    },
    {
      validator: (_rule, value: string) => {
        if (!isValidCoverImage(value || ''))
          return new Error('封面仅支持 /logo.svg 或 /images/ 下相对路径')
        return true
      },
      trigger: ['blur', 'input'],
    },
  ],
  categoryId: [
    {
      type: 'number',
      required: true,
      message: '请选择分类',
      trigger: ['blur', 'change'],
    },
  ],
}

function focusAlert(el: HTMLElement | null) {
  if (!el)
    return
  el.focus({ preventScroll: true })
}

async function loadCategories(force = false) {
  if (categoriesLoaded.value && !force)
    return
  loadingCategories.value = true
  categoryError.value = ''
  try {
    const items = await listAdminCategories()
    categoryOptions.value = items.map(item => ({
      label: `${item.name}（${item.slug}）`,
      value: item.id,
    }))
    categoriesLoaded.value = true
  }
  catch (error: unknown) {
    categoriesLoaded.value = false
    categoryError.value = error instanceof AdminApiError
      ? error.message
      : '分类加载失败，请稍后重试'
    await nextTick()
    focusAlert(categoryErrorAlertRef.value)
  }
  finally {
    loadingCategories.value = false
  }
}

async function loadArticleDetail(id: number) {
  loadingDetail.value = true
  detailError.value = ''
  try {
    const article = await getAdminArticle(id)
    const next = articleToFormDraft(article)
    currentStatus.value = article.status
    draft.value = next
    baseline.value = cloneArticleFormDraft(next)
  }
  catch (error: unknown) {
    detailError.value = error instanceof AdminApiError
      ? error.message
      : '文章加载失败，请稍后重试'
    await nextTick()
    focusAlert(detailErrorAlertRef.value)
  }
  finally {
    loadingDetail.value = false
  }
}

function resetState() {
  mode.value = 'create'
  articleId.value = null
  activeLang.value = 'zh-CN'
  draft.value = createEmptyArticleFormDraft()
  baseline.value = createEmptyArticleFormDraft()
  categoryError.value = ''
  detailError.value = ''
  formError.value = ''
  versionConflict.value = false
  currentStatus.value = null
  loadingDetail.value = false
  loadingCategories.value = false
  saving.value = false
  formRef.value?.restoreValidation()
}

async function openCreate() {
  resetState()
  visible.value = true
  await loadCategories()
}

async function openEdit(id: number) {
  resetState()
  mode.value = 'edit'
  articleId.value = id
  visible.value = true
  // 分类与详情独立加载，互不影响已填草稿
  void loadCategories()
  await loadArticleDetail(id)
}

async function retryCategories() {
  await loadCategories(true)
}

async function retryDetail() {
  if (articleId.value == null)
    return
  await loadArticleDetail(articleId.value)
}

async function reloadCurrent() {
  if (articleId.value == null)
    return
  versionConflict.value = false
  formError.value = ''
  loadingDetail.value = true
  try {
    const article = await getAdminArticle(articleId.value)
    const next = articleToFormDraft(article)
    currentStatus.value = article.status
    draft.value = next
    baseline.value = cloneArticleFormDraft(next)
    detailError.value = ''
    message.success('已重新加载最新内容')
  }
  catch (error: unknown) {
    detailError.value = error instanceof AdminApiError
      ? error.message
      : '重新加载失败，请稍后重试'
    await nextTick()
    focusAlert(detailErrorAlertRef.value)
  }
  finally {
    loadingDetail.value = false
  }
}

function forceClose() {
  visible.value = false
  confirmVisible.value = false
  resetState()
}

function requestClose() {
  if (saving.value)
    return
  if (isDirty.value) {
    confirmVisible.value = true
    return
  }
  forceClose()
}

function onUpdateShow(show: boolean) {
  if (show) {
    visible.value = true
    return
  }
  requestClose()
}

function buildPayload(): ArticleWritePayload | null {
  const categoryId = draft.value.categoryId
  if (categoryId == null)
    return null
  return {
    slug: draft.value.slug.trim(),
    author: draft.value.author.trim(),
    cover_image: draft.value.coverUrl.trim(),
    category_id: categoryId,
    translations: {
      'zh-CN': {
        title: draft.value.translations['zh-CN'].title,
        content: draft.value.translations['zh-CN'].content,
      },
      'zh-HK': {
        title: draft.value.translations['zh-HK'].title,
        content: draft.value.translations['zh-HK'].content,
      },
      'en-US': {
        title: draft.value.translations['en-US'].title,
        content: draft.value.translations['en-US'].content,
      },
    },
  }
}

async function onSave() {
  formError.value = ''
  versionConflict.value = false
  if (formBlocked.value)
    return

  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }

  const payload = buildPayload()
  if (!payload || !auth.csrfToken.value) {
    formError.value = '会话已失效，请重新登录后再保存'
    await nextTick()
    focusAlert(formErrorAlertRef.value)
    return
  }

  saving.value = true
  try {
    if (mode.value === 'create') {
      await auth.withCsrfRetry(csrf => createAdminArticle(payload, csrf))
      message.success('草稿已创建')
    }
    else {
      if (articleId.value == null || draft.value.version == null) {
        formError.value = '缺少文章版本，请重新打开编辑'
        await nextTick()
        focusAlert(formErrorAlertRef.value)
        return
      }
      await auth.withCsrfRetry(csrf => updateAdminArticle(
        articleId.value!,
        { ...payload, version: draft.value.version! },
        csrf,
      ))
      message.success('已保存')
    }
    forceClose()
    emit('saved')
  }
  catch (error: unknown) {
    if (error instanceof AdminApiError) {
      if (error.code === 40900) {
        versionConflict.value = true
        formError.value = error.message || '文章已被其他操作更新，请重新加载'
        await nextTick()
        focusAlert(formErrorAlertRef.value)
        return
      }
      if (
        error.code === 40000
        || error.code === 40902
        || error.code === 40301
        || error.code === 40410
      ) {
        formError.value = error.message
        await nextTick()
        focusAlert(formErrorAlertRef.value)
        return
      }
    }
    formError.value = '保存失败，请稍后重试'
    await nextTick()
    focusAlert(formErrorAlertRef.value)
  }
  finally {
    saving.value = false
  }
}

defineExpose({
  openCreate,
  openEdit,
})
</script>

<template>
  <n-modal
    :show="visible"
    preset="card"
    :title="title"
    :mask-closable="false"
    :closable="!saving"
    :style="{ width: 'min(880px, calc(100vw - 24px))' }"
    :segmented="{ content: true, footer: 'soft' }"
    @update:show="onUpdateShow"
  >
    <div class="article_form_body">
      <n-alert
        type="info"
        :bordered="false"
        class="form_banner"
      >
        {{ statusHint }}
        <template v-if="mode === 'edit' && draft.version != null">
          · 当前版本 {{ draft.version }}
        </template>
      </n-alert>

      <div
        v-if="categoryError"
        ref="categoryErrorAlertRef"
        class="form_banner error_focus"
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
              :loading="loadingCategories"
              @click="retryCategories"
            >
              重新加载分类
            </n-button>
          </div>
        </n-alert>
      </div>

      <div
        v-if="detailError"
        ref="detailErrorAlertRef"
        class="form_banner error_focus"
        tabindex="-1"
        role="alert"
        aria-live="assertive"
      >
        <n-alert
          type="error"
          :bordered="false"
        >
          <div class="alert_row">
            <span>{{ detailError }}</span>
            <n-button
              size="small"
              :loading="loadingDetail"
              @click="retryDetail"
            >
              重试文章详情
            </n-button>
          </div>
        </n-alert>
      </div>

      <div
        v-if="versionConflict"
        ref="formErrorAlertRef"
        class="form_banner error_focus"
        tabindex="-1"
        role="alert"
        aria-live="assertive"
      >
        <n-alert
          type="warning"
          title="版本冲突"
          :bordered="false"
        >
          <p>{{ formError || '文章已被其他操作更新，请重新加载最新内容后再编辑。' }}</p>
          <n-button
            size="small"
            class="reload_btn"
            :loading="loadingDetail"
            @click="reloadCurrent"
          >
            重新加载
          </n-button>
        </n-alert>
      </div>

      <div
        v-else-if="formError"
        ref="formErrorAlertRef"
        class="form_banner error_focus"
        tabindex="-1"
        role="alert"
        aria-live="assertive"
      >
        <n-alert
          type="error"
          :bordered="false"
        >
          {{ formError }}
        </n-alert>
      </div>

      <n-spin :show="loadingDetail">
        <n-form
          ref="formRef"
          class="article_form"
          :model="draft"
          :rules="rules"
          label-placement="top"
          :disabled="formBlocked"
        >
          <div class="form_grid">
            <n-form-item
              label="Slug"
              path="slug"
            >
              <n-input
                v-model:value="draft.slug"
                placeholder="例如 getting-started-demo"
                maxlength="160"
                show-count
              />
            </n-form-item>
            <n-form-item
              label="作者"
              path="author"
            >
              <n-input
                v-model:value="draft.author"
                placeholder="作者"
                maxlength="100"
                show-count
              />
            </n-form-item>
          </div>

          <n-form-item
            label="分类"
            path="categoryId"
          >
            <n-select
              v-model:value="draft.categoryId"
              placeholder="选择分类"
              :options="categoryOptions"
              :loading="loadingCategories"
              :disabled="Boolean(categoryError) || formBlocked"
              filterable
            />
          </n-form-item>

          <n-form-item
            label="封面路径"
            path="coverUrl"
          >
            <n-input
              v-model:value="draft.coverUrl"
              placeholder="/logo.svg 或 /images/..."
              maxlength="500"
            />
          </n-form-item>
          <div
            v-if="coverPreview && !coverBroken"
            class="cover_preview"
          >
            <img
              :src="coverPreview"
              alt="封面预览"
              @error="coverBroken = true"
            >
          </div>

          <n-tabs
            v-model:value="activeLang"
            type="line"
            animated
          >
            <n-tab-pane
              v-for="lang in LANG_TABS"
              :key="lang.key"
              :name="lang.key"
              :tab="lang.label"
            >
              <n-form-item :label="`${lang.label}标题`">
                <n-input
                  v-model:value="draft.translations[lang.key].title"
                  :placeholder="`${lang.label}标题（草稿可空）`"
                  maxlength="200"
                  show-count
                />
              </n-form-item>
              <n-form-item :label="`${lang.label}正文`">
                <n-input
                  v-model:value="draft.translations[lang.key].content"
                  type="textarea"
                  :rows="10"
                  :placeholder="`${lang.label}正文（草稿可空；HTML 将由服务端清理）`"
                  maxlength="100000"
                  show-count
                />
              </n-form-item>
            </n-tab-pane>
          </n-tabs>
        </n-form>
      </n-spin>
    </div>
    <template #footer>
      <n-space justify="end">
        <n-button
          :disabled="saving"
          @click="requestClose"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="saving"
          :disabled="formBlocked"
          @click="onSave"
        >
          保存草稿
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal
    v-model:show="confirmVisible"
    preset="dialog"
    title="放弃未保存的修改？"
    content="关闭后本次填写不会保存。"
    positive-text="放弃"
    negative-text="继续编辑"
    @positive-click="forceClose"
  />
</template>

<style scoped lang="scss">
.article_form_body {
  max-height: calc(100vh - 220px);
  overflow: auto;
  padding-right: 4px;
}

.form_banner {
  margin-bottom: 12px;
}

.error_focus {
  outline: none;
}

.alert_row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.reload_btn {
  margin-top: 8px;
}

.article_form {
  margin-top: 4px;
}

.form_grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.cover_preview {
  margin: -8px 0 16px;
  max-width: 160px;
  max-height: 90px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  background: #fafafa;

  img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 90px;
    object-fit: contain;
  }
}
</style>
