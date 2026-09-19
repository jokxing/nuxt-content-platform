<!--
  数据项编号展示（原 BallNumber API 兼容）
  扁平圆角标签 + 左侧色条，避免彩票球体联想。
  <BallNumber :number="12" />
  <BallNumber :number="7" is-special />
  <BallNumber :number="18" variant="solid" :size="32" />
-->
<script setup lang="ts">
interface Props {
  number: number | string
  /** image 已废弃，等同 chip；保留 solid / outlined */
  variant?: 'image' | 'chip' | 'solid' | 'outlined'
  size?: number
  /** 附加数据项（强调描边） */
  isSpecial?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'chip',
  size: 38,
  isSpecial: false,
})

const resolvedVariant = computed(() =>
  props.variant === 'image' ? 'chip' : props.variant,
)

/** 青 / 靛 / 石板分档，不用红蓝绿波色 */
const toneClass = computed(() => {
  if (props.isSpecial)
    return 'tone-accent'
  const n = Number(props.number)
  if (!Number.isFinite(n))
    return 'tone-a'
  const band = ((n - 1) % 3 + 3) % 3
  return band === 0 ? 'tone-a' : band === 1 ? 'tone-b' : 'tone-c'
})

const rootClass = computed(() => [
  'data-chip',
  `data-chip--${resolvedVariant.value}`,
  toneClass.value,
])

const rootStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.max(12, Math.floor(props.size * 0.42))}px`,
  borderRadius: `${Math.max(6, Math.floor(props.size * 0.22))}px`,
}))
</script>

<template>
  <div
    :class="rootClass"
    :style="rootStyle"
    role="img"
    :aria-label="isSpecial ? `附加数据项 ${number}` : `数据项 ${number}`"
  >
    <span class="data-chip__bar" aria-hidden="true" />
    <span class="data-chip__value">{{ number }}</span>
  </div>
</template>

<style scoped lang="scss">
.data-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  user-select: none;
  box-sizing: border-box;
  overflow: hidden;
}

.data-chip__bar {
  position: absolute;
  left: 0;
  top: 18%;
  bottom: 18%;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: currentColor;
  opacity: 0.55;
}

.data-chip__value {
  letter-spacing: -0.02em;
  padding-left: 2px;
}

.data-chip--chip {
  background: var(--chip-bg);
  color: var(--chip-fg);
  border: 1px solid var(--chip-border);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.data-chip--solid {
  background: var(--chip-fg);
  color: #fff;
  border: 1px solid transparent;

  .data-chip__bar {
    background: #fff;
    opacity: 0.7;
  }
}

.data-chip--outlined {
  background: transparent;
  color: var(--chip-fg);
  border: 1.5px solid var(--chip-border);
}

.tone-a {
  --chip-bg: #ecfdf8;
  --chip-fg: #0f766e;
  --chip-border: #99f6e4;
}

.tone-b {
  --chip-bg: #eef2ff;
  --chip-fg: #3730a3;
  --chip-border: #c7d2fe;
}

.tone-c {
  --chip-bg: #f1f5f9;
  --chip-fg: #334155;
  --chip-border: #cbd5e1;
}

.tone-accent {
  --chip-bg: #f5f3ff;
  --chip-fg: #6d28d9;
  --chip-border: #ddd6fe;
}

.data-chip--chip.tone-accent {
  box-shadow: 0 0 0 1px rgba(109, 40, 217, 0.12);
}
</style>
