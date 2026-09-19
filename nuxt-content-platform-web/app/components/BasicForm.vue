<script setup lang="ts">
import type { PickerOption } from 'vant'
import { computed, onMounted, reactive, ref, useSlots, watch } from 'vue'

interface SelectOption {
  label: string
  value: string | number
}

interface FormItemProps {
  options?: SelectOption[]
  [key: string]: any
}

interface FormItem {
  type: string
  title: string
  field: string
  props?: FormItemProps
}

const props = defineProps<{
  formConfig: FormItem[]
  showLabel?: boolean // 是否显示表单label
}>()

// 定义事件
const emit = defineEmits(['submit', 'field-change'])

const model = defineModel<any>('value', { required: true })

const { t } = useI18n()
const slots = useSlots()

// 计算按钮数量（包括默认搜索按钮和插槽按钮�?
const buttonCount = computed(() => {
  const slotButtons = slots.buttons?.() || []
  return 1 + slotButtons.length // 1是默认的搜索按钮
})

// 计算是否需要将按钮移到新行
const shouldButtonsNewLine = computed(() => {
  const formCount = props.formConfig.length
  const totalButtons = buttonCount.value

  // 如果一行中�?个表单，2个按钮，则把2个按钮移到下新一�?
  if (formCount === 2 && totalButtons >= 2)
    return true

  // 如果一行中�?个表单，3个按钮，则把3个按钮移到下新一�?
  if (formCount === 1 && totalButtons >= 3)
    return true

  return false
})

// 计算表单项的列宽
const formColSpan = computed(() => {
  const formCount = props.formConfig.length
  const totalButtons = buttonCount.value

  if (shouldButtonsNewLine.value) {
    // 如果按钮在新行，表单项平�?4�?
    return Math.floor(24 / formCount)
  }
  else {
    // 如果在同一行，需要为按钮预留空间
    const totalCols = formCount + totalButtons
    if (totalCols <= 3) {
      // 如果总列数不超过3，平�?4�?
      return Math.floor(24 / totalCols)
    }
    // 其他情况按默认逻辑
    return formCount === 1 ? 16 : 8
  }
})

// 计算按钮区域的列宽和偏移
const buttonAreaStyle = computed(() => {
  const totalButtons = buttonCount.value
  if (shouldButtonsNewLine.value) {
    // 如果按钮在新行，居中显示
    const totalWidth = totalButtons * 8 // 每个按钮8�?
    const offset = Math.floor((24 - totalWidth) / 2) // 居中偏移
    return {
      span: totalWidth,
      offset,
      style: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        marginTop: '10px',
      },
    }
  }
  else {
    // 如果在同一�?
    return {
      span: 24 - (formColSpan.value * props.formConfig.length),
      offset: 0,
      style: {
        display: 'flex',
        gap: '8px',
      },
    }
  }
})

// 表单数据
const formData = ref<Record<string, any>>({})

// 显示数据（用于选择器显示）
const displayData = reactive<Record<string, any>>({})

// 选择器相�?
const showPickerPopup = ref(false)
const currentOptions = ref<PickerOption[]>([])
const currentField = ref('')

function showPicker(item: FormItem) {
  currentField.value = item.field
  // 转换选项格式
  currentOptions.value = (item.props?.options || []).map(option => ({
    text: option.label,
    value: option.value,
  }))
  showPickerPopup.value = true
}

function onConfirm(value: PickerOption) {
  const oldValue = formData.value[currentField.value]
  formData.value[currentField.value] = value.selectedValues[0]
  displayData[currentField.value] = value.selectedOptions[0].text
  showPickerPopup.value = false
  // 添加字段变化事件
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('field-change', {
    field: currentField.value,
    value: value.selectedValues[0],
    oldValue,
  })
}

// 输入框变化时也触发field-change
function onInputChange(field: string, value: any) {
  const oldValue = formData.value[field]
  formData.value[field] = value
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('field-change', {
    field,
    value,
    oldValue,
  })
}

function onSubmit() {
  model.value = { ...formData.value }
  emit('submit')
}

// 获取占位符文�?
function getPlaceholder(item: FormItem) {
  return props.showLabel ? `�?{item.type === 'select' ? '选择' : '输入'}${item.title}` : item.title
}

// 更新显示数据
function updateDisplayData() {
  props.formConfig.forEach((item) => {
    if (item.type === 'select') {
      // 如果formData中没有值，确保displayData也为�?
      if (!formData.value[item.field]) {
        displayData[item.field] = ''
      }
      // 有值时才查找对应的label
      else {
        const option = item.props?.options?.find(opt => opt.value === formData.value[item.field])
        if (option) {
          displayData[item.field] = option.label
        }
      }
    }
  })
}

// 监听 model 的变�?
watch(
  model,
  (newVal) => {
    formData.value = { ...newVal }
    updateDisplayData()
  },
  { deep: true },
)

// 监听 formData 的变化，同步更新 displayData
watch(
  () => formData.value,
  (newVal) => {
    // 清空所有displayData
    Object.keys(displayData).forEach((key) => {
      // 如果formData中对应的值为空，也清空displayData
      if (!newVal[key]) {
        displayData[key] = ''
      }
    })
    // 更新有值的字段的displayData
    updateDisplayData()
  },
  { deep: true },
)

onMounted(() => {
  formData.value = model.value
  // 初始�?displayData
  updateDisplayData()
})
</script>

<template>
  <div class="basic-form">
    <van-form @submit="onSubmit">
      <van-row :gutter="10">
        <!-- 表单�? -->
        <van-col
          v-for="item in props.formConfig"
          :key="item.field"
          :span="formColSpan"
        >
          <!-- 输入�? -->
          <van-field
            v-if="item.type === 'input'"
            v-model="formData[item.field]"
            :label="showLabel ? item.title : ''"
            :placeholder="getPlaceholder(item)"
            class="form-item"
            @update:model-value="value => onInputChange(item.field, value)"
          />
          <!-- 选择�? -->
          <van-field
            v-if="item.type === 'select'"
            v-model="displayData[item.field]"
            :label="showLabel ? item.title : ''"
            readonly
            :placeholder="getPlaceholder(item)"
            class="form-item"
            @click="showPicker(item)"
          />
        </van-col>

        <!-- 按钮区域 -->
        <van-col
          v-if="!shouldButtonsNewLine"
          :span="buttonAreaStyle.span"
          :offset="buttonAreaStyle.offset"
          class="submit-btn-col"
        >
          <div :style="buttonAreaStyle.style">
            <van-button type="primary" native-type="submit" class="submit-btn">
              搜索
            </van-button>
            <slot name="buttons" />
          </div>
        </van-col>
      </van-row>

      <!-- 新行的按钮区�? -->
      <van-row v-if="shouldButtonsNewLine">
        <van-col
          :span="buttonAreaStyle.span"
          :offset="buttonAreaStyle.offset"
          class="submit-btn-col"
        >
          <div :style="buttonAreaStyle.style">
            <van-button type="primary" native-type="submit" class="submit-btn">
              搜索
            </van-button>
            <slot name="buttons" />
          </div>
        </van-col>
      </van-row>
    </van-form>

    <!-- 选择器弹出层 -->
    <van-popup v-model:show="showPickerPopup" position="bottom">
      <van-picker
        :columns="currentOptions"
        :confirm-button-text="t('confirm')"
        :cancel-button-text="t('cancel')"
        @confirm="onConfirm"
        @cancel="showPickerPopup = false"
      />
    </van-popup>

    <!-- 额外内容插槽 -->
    <slot name="extra" />
  </div>
</template>

<style scoped>
.basic-form {
  padding: 16px;
}

.form-item {
  margin-bottom: 10px;
}

.submit-btn-col {
  display: flex;
  align-items: flex-start;
}

:deep(.van-cell) {
  padding: 5px 12px;
  height: 34px;
  border-radius: 8px;
  background-color: var(--van-background-2);
  align-items: center;
}

:deep(.van-field__label) {
  width: 3.5em;
}

:deep(.van-field__value) {
  flex: 1;
}

:deep(.van-field__body) {
  height: 100%;
}

.submit-btn {
  height: 34px;
  border-radius: 8px;
  flex: 1;
  min-width: 72px; /* 确保按钮有最小宽�?*/
}

/* 确保按钮区域在新行时的样�?*/
.submit-btn-col:has(> div[style*='margin-top']) {
  margin-top: 0;
}
</style>
