<template>
  <section class="section-keyboard" @click.self="emits('onClose')">
    <div class="section-keyboard__card">
      <header class="section-keyboard__header">
        <span class="section-keyboard__title">Typing practice</span>
        <span class="section-keyboard__stat">{{ Math.min(data.index + 1, queue.length) }} / {{ queue.length }}</span>
        <span class="section-keyboard__stat section-keyboard__stat--mistakes">mistakes: {{ data.mistakes }}</span>
        <label class="section-keyboard__toggle">
          <input type="checkbox" v-model="data.hideTarget" @change="focusInput">
          hide English
        </label>
        <button class="section-keyboard__close" @click="emits('onClose')" title="Close (Esc)">×</button>
      </header>

      <template v-if="current">
        <div class="section-keyboard__hint">{{ current.hint }}</div>

        <div class="section-keyboard__target" :class="{'section-keyboard__target--done': isDone}">
          <span
              v-for="(char, index) in current.target"
              :key="index"
              class="section-keyboard__char"
              :class="`section-keyboard__char--${charStatus(index)}`"
          >{{ charView(char, index) }}</span>
        </div>

        <input
            ref="input"
            class="section-keyboard__input"
            v-model="data.value"
            :maxlength="current.target.length"
            :readonly="isDone"
            placeholder="type the English phrase…"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown.esc="emits('onClose')"
        >

        <div class="section-keyboard__actions">
          <button class="section-keyboard__btn" @click="giveHint" :disabled="isDone">Hint (next letter)</button>
          <button class="section-keyboard__btn section-keyboard__btn--secondary" @click="next" :disabled="isDone">Skip</button>
        </div>

        <p class="section-keyboard__help">
          Type the English for the Russian hint. Mistakes turn red — fix them with Backspace.
          The phrase is accepted automatically. Capital letters don't matter.
        </p>
      </template>

      <div v-else class="section-keyboard__finish">
        <div class="section-keyboard__finish-title">Done! 🎉</div>
        <div>{{ queue.length }} phrases, {{ data.mistakes }} mistakes, {{ data.skipped }} skipped</div>
        <button class="section-keyboard__btn" @click="restart">Again</button>
      </div>
    </div>
  </section>
</template>


<script lang="ts">
export default {
  name: 'SectionKeyboard'
}
</script>

<script setup lang="ts">

import {computed, nextTick, onMounted, reactive, ref, watch} from "vue";

interface Props {
  items: {
    id: number,
    original: string,
    translate: string,
    isActive: boolean,
  }[]
}

const props = withDefaults(defineProps<Props>(), {})
const emits = defineEmits(['onClose'])
const input = ref(null)

const data = reactive({
  value: '',
  index: 0,
  mistakes: 0,
  skipped: 0,
  hideTarget: true,
  seed: 1
})

const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
// Case-insensitive, and typographic apostrophes match the plain one
const normalize = (char: string) => char.toLowerCase().replace(/[’‘`]/g, "'")

const shuffle = function (array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// English (`original`) is typed; Russian (`translate`) is the hint
const queue = computed(() => {
  data.seed
  return shuffle(props.items.map(item => ({
    target: stripHtml(item.original),
    hint: stripHtml(item.translate),
  })))
})

const current = computed(() => queue.value[data.index])

const isCorrectAt = (index: number) => normalize(data.value[index]) === normalize(current.value.target[index])

const isDone = computed(() => Boolean(current.value)
    && data.value.length === current.value.target.length
    && [...data.value].every((_, index) => isCorrectAt(index)))

const charStatus = function (index: number) {
  if (index < data.value.length) return isCorrectAt(index) ? 'correct' : 'wrong'
  if (index === data.value.length) return 'current'
  return 'pending'
}

// In "hide English" mode untyped letters are masked; a wrong letter shows what was typed
const charView = function (char: string, index: number) {
  const status = charStatus(index)
  if (status === 'wrong') return data.value[index] === ' ' ? '␣' : data.value[index]
  if (data.hideTarget && (status === 'pending' || status === 'current') && /[a-z0-9]/i.test(char)) return '_'
  return char
}

const focusInput = () => nextTick(() => input.value?.focus())

const next = function () {
  if (!isDone.value) data.skipped++
  data.value = ''
  data.index++
  focusInput()
}

// Replaces everything from the first mistake with the correct next letter
const giveHint = function () {
  const target = current.value.target
  let correctLength = 0
  while (correctLength < data.value.length && isCorrectAt(correctLength)) correctLength++
  data.value = target.slice(0, correctLength + 1)
  focusInput()
}

const restart = function () {
  data.value = ''
  data.index = 0
  data.mistakes = 0
  data.skipped = 0
  data.seed++
  focusInput()
}

watch(() => data.value, (value, oldValue = '') => {
  if (value.length > oldValue.length && !isCorrectAt(value.length - 1)) data.mistakes++
  if (isDone.value) setTimeout(next, 700)
})

watch(() => props.items, restart)

onMounted(focusInput)

</script>

<style lang="scss">
.section-keyboard {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.6);

  &__card {
    position: relative;
    width: 100%;
    max-width: 860px;
    max-height: 100%;
    overflow: auto;
    padding: 20px 25px 25px;
    box-sizing: border-box;
    background-color: #242424;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 15px;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 25px;
    font-size: 14px;
  }

  &__title {
    margin-right: auto;
    font-size: 18px;
    font-weight: 500;
  }

  &__stat {
    opacity: 0.7;

    &--mistakes {
      color: #ff8a8a;
    }
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    user-select: none;
  }

  &__close {
    width: 32px;
    height: 32px;
    padding: 0;
    font-size: 20px;
    line-height: 1;
  }

  &__hint {
    margin-bottom: 15px;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.6);
  }

  &__target {
    margin-bottom: 20px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    font-size: 26px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
    transition: opacity 0.2s;

    &--done {
      opacity: 0.6;
    }
  }

  &__char {
    &--pending {
      color: rgba(255, 255, 255, 0.35);
    }

    &--current {
      color: rgba(255, 255, 255, 0.35);
      border-bottom: 2px solid #4efff0;
    }

    &--correct {
      color: #20ff67;
    }

    &--wrong {
      color: #ff5050;
      background-color: rgba(255, 80, 80, 0.15);
      border-radius: 3px;
    }
  }

  &__input {
    width: 100%;
    min-height: 48px;
    padding: 10px 15px;
    font-size: 20px;
    font-family: 'SF Mono', Menlo, Consolas, monospace;
    border: 1px solid #ff50c0;
    border-radius: 12px;
    box-sizing: border-box;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
  }

  &__btn {
    padding: 10px 18px;
    font-size: 14px;
    background-color: #2d6cff;

    &--secondary {
      background-color: #ff7f2e;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  &__help {
    margin: 20px 0 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
  }

  &__finish {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 30px 0;
    font-size: 16px;

    &-title {
      font-size: 28px;
      color: #20ff67;
    }
  }

  @media (max-width: 600px) {
    padding: 10px;

    &__card {
      padding: 15px;
    }

    &__header {
      flex-wrap: wrap;
      gap: 8px 12px;
      margin-bottom: 15px;
    }

    &__title {
      width: 100%;
      order: -1;
    }

    &__close {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    &__hint {
      font-size: 16px;
    }

    &__target {
      font-size: 20px;
    }

    &__actions {
      flex-wrap: wrap;
    }

    &__btn {
      flex: 1 1 auto;
    }
  }
}
</style>
