<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui'
import { AdminApiError } from '~/api/adminClient'

definePageMeta({
  layout: 'blank',
})

useHead({
  title: '登录 - 讯览资讯管理',
})

const route = useRoute()
const auth = useAdminAuth()

const formRef = ref<FormInst | null>(null)
const errorAlertRef = ref<HTMLElement | null>(null)
const submitting = ref(false)
const formError = ref('')
const formModel = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
    { max: 100, message: '账号过长', trigger: ['blur', 'input'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
    { max: 1024, message: '密码过长', trigger: ['blur', 'input'] },
  ],
}

async function onSubmit() {
  formError.value = ''
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }

  submitting.value = true
  try {
    await auth.login(formModel.username.trim(), formModel.password)
    formModel.password = ''
    const redirect = typeof route.query.redirect === 'string'
      && route.query.redirect.startsWith('/')
      && !route.query.redirect.startsWith('//')
      ? route.query.redirect
      : '/articles'
    await navigateTo(redirect)
  }
  catch (error: unknown) {
    formModel.password = ''
    if (error instanceof AdminApiError) {
      if (error.code === 40101 || error.code === 42900 || error.code === 40301 || error.code === 40000) {
        formError.value = error.message
        await nextTick()
        errorAlertRef.value?.focus({ preventScroll: true })
        return
      }
    }
    formError.value = '登录失败，请稍后重试'
    await nextTick()
    errorAlertRef.value?.focus({ preventScroll: true })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login_page">
    <div class="login_panel">
      <h1 class="login_brand">
        讯览资讯管理
      </h1>
      <p class="login_hint">
        单管理员登录
      </p>
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="top"
        class="login_form"
        @submit.prevent="onSubmit"
      >
        <n-form-item
          label="账号"
          path="username"
        >
          <n-input
            v-model:value="formModel.username"
            name="username"
            autocomplete="username"
            placeholder="请输入账号"
            :disabled="submitting"
            @keyup.enter="onSubmit"
          />
        </n-form-item>
        <n-form-item
          label="密码"
          path="password"
        >
          <n-input
            v-model:value="formModel.password"
            type="password"
            name="password"
            autocomplete="current-password"
            show-password-on="click"
            placeholder="请输入密码"
            :disabled="submitting"
            @keyup.enter="onSubmit"
          />
        </n-form-item>
        <div
          v-if="formError"
          ref="errorAlertRef"
          class="login_error"
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
        <n-button
          type="primary"
          block
          attr-type="submit"
          :loading="submitting"
          :disabled="submitting"
        >
          登录
        </n-button>
      </n-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login_page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}

.login_panel {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}

.login_brand {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 650;
}

.login_hint {
  margin: 0 0 24px;
  color: var(--admin-text-muted);
  font-size: 14px;
}

.login_form {
  margin-bottom: 0;
}

.login_error {
  margin-bottom: 16px;
  outline: none;
}
</style>
