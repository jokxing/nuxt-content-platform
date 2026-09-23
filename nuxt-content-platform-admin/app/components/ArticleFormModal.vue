<script setup lang="ts">
import type { FormInst, FormRules, SelectOption, UploadCustomRequestOptions } from 'naive-ui'
import {
  createAdminArticle,
  getAdminArticle,
  listAdminCategories,
  publishAdminArticle,
  unpublishAdminArticle,
  updateAdminArticle,
} from '~/api/adminArticles'
import { uploadCoverImage } from '~/api/adminMedia'
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
  buildPublicArticlePreviewUrl,
  cloneArticleFormDraft,
  createEmptyArticleFormDraft,
  isValidCoverImage,
} from '~/types/admin'
import { resolvePublicSiteUrl } from '~/constants/site'

const emit = defineEmits<{
  saved: []
}>()

const auth = useAdminAuth()
const message = useMessage()
const dialog = useDialog()
const runtimeConfig = useRuntimeConfig()
const mediaPublicBaseUrl = computed(() =>
  String(runtimeConfig.public.mediaPublicBaseUrl || '').replace(/\/+$/, ''),
)
const publicSiteUrl = computed(() =>
  resolvePublicSiteUrl(runtimeConfig.public.publicSiteUrl),
)

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
const uploadingCover = ref(false)
const uploadError = ref('')
const coverUploadedUnsaved = ref(false)
const categoryError = ref('')
const detailError = ref('')
const formError = ref('')
const versionConflict = ref(false)
const currentStatus = ref<ArticleStatus | null>(null)
const categoryParentRoute = ref('education')
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
  return isValidCoverImage(value, mediaPublicBaseUrl.value) ? value : null
})

watch(coverPreview, () => {
  coverBroken.value = false
})

const statusHint = computed(() => {
  if (mode.value === 'create')
    return '创建后保存为草稿。保存后再发布；发布成功只表示内容入库，不等于站点已部署。'
  const statusText = currentStatus.value
    ? ARTICLE_STATUS_LABEL[currentStatus.value]
    : '未知'
  return `当前状态：${statusText}。发布成功会排队构建（自动部署尚未接入）；请勿把「已发布」理解为线上部署成功。`
})

const previewUrl = computed(() => {
  if (mode.value !== 'edit' || articleId.value == null)
    return null
  if (currentStatus.value !== 'PUBLISHED')
    return null
  return buildPublicArticlePreviewUrl(
    publicSiteUrl.value,
    categoryParentRoute.value,
    articleId.value,
  )
})

const formBlocked = computed(() =>
  loadingDetail.value || Boolean(detailError.value) || saving.value,
)

const canPublish = computed(() =>
  mode.value === 'edit'
  && articleId.value != null
  && draft.value.version != null
  && (currentStatus.value === 'DRAFT' || currentStatus.value === 'ARCHIVED')
  && !isDirty.value
  && !formBlocked.value,
)

const canUnpublish = computed(() =>
  mode.value === 'edit'
  && articleId.value != null
  && draft.value.version != null
  && currentStatus.value === 'PUBLISHED'
  && !isDirty.value
  && !formBlocked.value,
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
      message: '请输入封面路径或上传图片',
      trigger: ['blur', 'input'],
    },
    {
      validator: (_rule, value: string) => {
        if (!isValidCoverImage(value || '', mediaPublicBaseUrl.value))
          return new Error('封面仅支持 /logo.svg、/images/ 相对路径或可信媒体 URL')
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
    categoryParentRoute.value = article.category.parent_route || 'education'
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
  uploadError.value = ''
  coverUploadedUnsaved.value = false
  uploadingCover.value = false
  versionConflict.value = false
  currentStatus.value = null
  categoryParentRoute.value = 'education'
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

async function onUploadCover({ file, onFinish, onError }: UploadCustomRequestOptions) {
  const raw = file.file
  if (!(raw instanceof File)) {
    onError()
    return
  }
  if (raw.size > 5 * 1024 * 1024) {
    uploadError.value = '图片超过 5 MiB 上限'
    onError()
    return
  }

  uploadingCover.value = true
  uploadError.value = ''
  try {
    const asset = await auth.withCsrfRetry(csrf => uploadCoverImage(raw, csrf))
    draft.value.coverUrl = asset.url
    coverUploadedUnsaved.value = true
    coverBroken.value = false
    message.success('图片已上传，文章仍未保存')
    onFinish()
  }
  catch (error: unknown) {
    uploadError.value = error instanceof AdminApiError
      ? error.message
      : '上传失败，请稍后重试'
    onError()
  }
  finally {
    uploadingCover.value = false
  }
}

function clearUploadedCover() {
  draft.value.coverUrl = '/logo.svg'
  coverUploadedUnsaved.value = false
  coverBroken.value = false
  uploadError.value = ''
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

function focusLocaleFromPublishError(msg: string) {
  if (msg.includes('简体'))
    activeLang.value = 'zh-CN'
  else if (msg.includes('繁体') || msg.includes('繁體'))
    activeLang.value = 'zh-HK'
  else if (msg.includes('英文') || msg.toLowerCase().includes('english'))
    activeLang.value = 'en-US'
}

function applyMutationResult(result: { article: import('~/types/admin').AdminArticle }) {
  const next = articleToFormDraft(result.article)
  currentStatus.value = result.article.status
  categoryParentRoute.value = result.article.category.parent_route || 'education'
  draft.value = next
  baseline.value = cloneArticleFormDraft(next)
  coverUploadedUnsaved.value = false
}

async function onPublish() {
  if (!canPublish.value || articleId.value == null || draft.value.version == null)
    return
  if (isDirty.value) {
    formError.value = '有未保存修改，请先保存后再发布'
    await nextTick()
    focusAlert(formErrorAlertRef.value)
    return
  }

  dialog.warning({
    title: '确认发布文章？',
    content: '发布后公开站接口可见。成功只表示内容已入库并排队构建；自动部署尚未接入，不等于 Cloudflare 已部署。',
    positiveText: '发布',
    negativeText: '取消',
    onPositiveClick: async () => {
      formError.value = ''
      versionConflict.value = false
      saving.value = true
      try {
        const result = await auth.withCsrfRetry(csrf => publishAdminArticle(
          articleId.value!,
          draft.value.version!,
          csrf,
        ))
        applyMutationResult(result)
        message.success('内容已发布，等待站点部署')
        emit('saved')
        return true
      }
      catch (error: unknown) {
        if (error instanceof AdminApiError) {
          if (error.code === 42200) {
            focusLocaleFromPublishError(error.message)
            formError.value = error.message
          }
          else if (error.code === 40900) {
            versionConflict.value = true
            formError.value = error.message || '文章已被其他操作更新，请重新加载'
          }
          else if (
            error.code === 40901
            || error.code === 40000
            || error.code === 40301
            || error.code === 40410
          ) {
            formError.value = error.message
          }
          else {
            formError.value = error.message || '发布失败，请稍后重试'
          }
        }
        else {
          formError.value = '发布失败，请稍后重试'
        }
        await nextTick()
        focusAlert(formErrorAlertRef.value)
        return true
      }
      finally {
        saving.value = false
      }
    },
  })
}

async function onUnpublish() {
  if (!canUnpublish.value || articleId.value == null || draft.value.version == null)
    return
  if (isDirty.value) {
    formError.value = '有未保存修改，请先保存后再下线'
    await nextTick()
    focusAlert(formErrorAlertRef.value)
    return
  }

  dialog.warning({
    title: '确认下线文章？',
    content: '下线后公开站将不可见；管理端仍可编辑。会排队构建事件，但不代表线上已部署完成。',
    positiveText: '下线',
    negativeText: '取消',
    onPositiveClick: async () => {
      formError.value = ''
      versionConflict.value = false
      saving.value = true
      try {
        const result = await auth.withCsrfRetry(csrf => unpublishAdminArticle(
          articleId.value!,
          draft.value.version!,
          csrf,
        ))
        applyMutationResult(result)
        message.success('内容已下线，等待站点部署')
        emit('saved')
        return true
      }
      catch (error: unknown) {
        if (error instanceof AdminApiError) {
          if (error.code === 40900) {
            versionConflict.value = true
            formError.value = error.message || '文章已被其他操作更新，请重新加载'
          }
          else if (
            error.code === 40901
            || error.code === 40000
            || error.code === 40301
            || error.code === 40410
          ) {
            formError.value = error.message
          }
          else {
            formError.value = error.message || '下线失败，请稍后重试'
          }
        }
        else {
          formError.value = '下线失败，请稍后重试'
        }
        await nextTick()
        focusAlert(formErrorAlertRef.value)
        return true
      }
      finally {
        saving.value = false
      }
    },
  })
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
        <template v-if="isDirty && mode === 'edit'">
          · 有未保存修改，发布/下线前请先保存
        </template>
      </n-alert>

      <n-alert
        v-if="previewUrl"
        type="success"
        :bordered="false"
        class="form_banner"
      >
        查看资讯页（当前公开站内容；本次修改需等待部署后更新）：
        <a
          :href="previewUrl"
          target="_blank"
          rel="noopener noreferrer"
        >{{ previewUrl }}</a>
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
            label="封面"
            path="coverUrl"
          >
            <div class="cover_field">
              <div class="cover_overview">
                <div class="cover_preview">
                  <img
                    v-if="coverPreview && !coverBroken"
                    :src="coverPreview"
                    alt="封面预览"
                    @error="coverBroken = true"
                  >
                  <span v-else>暂无预览</span>
                </div>
                <div class="cover_actions">
                  <div class="cover_action_buttons">
                    <n-upload
                      :max="1"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      :custom-request="onUploadCover"
                      :show-file-list="false"
                      :disabled="formBlocked || uploadingCover"
                    >
                      <n-button
                        size="small"
                        type="primary"
                        secondary
                        :loading="uploadingCover"
                        :disabled="formBlocked"
                      >
                        {{ uploadingCover ? '正在上传' : '选择图片' }}
                      </n-button>
                    </n-upload>
                    <n-button
                      v-if="draft.coverUrl !== '/logo.svg'"
                      size="small"
                      quaternary
                      :disabled="formBlocked || uploadingCover"
                      @click="clearUploadedCover"
                    >
                      恢复默认封面
                    </n-button>
                  </div>
                  <p class="cover_hint">
                    支持 JPEG、PNG、WebP，最大 5 MiB；上传后统一转为 WebP。
                  </p>
                </div>
              </div>
              <div class="cover_url_field">
                <span class="cover_url_label">封面地址</span>
                <n-input
                  v-model:value="draft.coverUrl"
                  placeholder="/logo.svg、/images/... 或可信媒体 URL"
                  maxlength="500"
                  :disabled="formBlocked || uploadingCover"
                >
                  <template #suffix>
                    <span class="cover_url_suffix">可手动填写</span>
                  </template>
                </n-input>
              </div>
              <n-alert
                v-if="uploadError"
                type="error"
                :bordered="false"
                class="cover_upload_error"
              >
                {{ uploadError }}
              </n-alert>
              <n-alert
                v-else-if="coverUploadedUnsaved"
                type="info"
                :bordered="false"
                class="cover_upload_error"
              >
                图片已上传，文章仍未保存
              </n-alert>
            </div>
          </n-form-item>

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
      <n-space justify="space-between" style="width: 100%">
        <n-space>
          <n-button
            v-if="mode === 'edit' && (currentStatus === 'DRAFT' || currentStatus === 'ARCHIVED')"
            type="primary"
            secondary
            :disabled="!canPublish"
            :loading="saving"
            @click="onPublish"
          >
            发布
          </n-button>
          <n-button
            v-if="mode === 'edit' && currentStatus === 'PUBLISHED'"
            type="warning"
            secondary
            :disabled="!canUnpublish"
            :loading="saving"
            @click="onUnpublish"
          >
            下线
          </n-button>
        </n-space>
        <n-space>
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
            {{ mode === 'create' ? '保存草稿' : '保存' }}
          </n-button>
        </n-space>
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
  display: flex;
  flex: 0 0 144px;
  align-items: center;
  justify-content: center;
  width: 144px;
  height: 90px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  background: var(--admin-bg);
  color: var(--admin-text-muted);
  font-size: 12px;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover_field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.cover_overview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  background: #fafafa;
}

.cover_actions {
  min-width: 0;
}

.cover_action_buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cover_hint {
  margin: 8px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.cover_url_field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cover_url_label {
  color: var(--admin-text);
  font-size: 13px;
}

.cover_url_suffix {
  color: var(--admin-text-muted);
  font-size: 12px;
}

.cover_upload_error {
  margin: 0;
}

@media (max-width: 640px) {
  .cover_overview {
    align-items: flex-start;
  }

  .cover_preview {
    flex-basis: 112px;
    width: 112px;
    height: 72px;
  }

  .cover_url_suffix {
    display: none;
  }
}
</style>
