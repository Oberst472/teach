<template>
  <section class="section-keyboard">
    <button class="section-keyboard__close" @click="emits('onClose')">X</button>
    <div class="section-keyboard__letters">
      <span
          class="section-keyboard__letter"
          v-for="(item, index) in changedItems"
          v-html="item === '&' ? ', ' : item"
          :class="{
            'section-keyboard__letter-coma': item === '&',
            'section-keyboard__letter-space': item === ' ',
            'section-keyboard__letter-red': data.value[index] && item !== data.value[index] && item !== '&',
            'section-keyboard__letter-green': data.value[index] && item === data.value[index]
          }"
      >
      </span>
    </div>
    <textarea class="section-keyboard__text" v-model="data.value"></textarea>
  </section>
</template>


<script lang="ts">
export default {
  name: 'SectionKeyboard'
}
</script>

<script setup lang="ts">

import {computed, reactive, watch} from "vue";

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

const data = reactive({
  value: '',
  randomKey: 1
})
const changedItems = computed(() => {
  const r = data.randomKey

  function shuffle(array) {
    const arr = [...array]
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
  }

  const str = shuffle(props.items.map(item => item.translate)).join('&')
  const st = str.replaceAll('<b>', '').replaceAll('</b>', '')
  return st.split('')
})
watch(() => data.value, (val) => {
  if (val.length === changedItems.value.length) {
    data.value = ''
    data.randomKey++
  }
})

</script>

<style lang="scss">
.section-keyboard {
  position: fixed;
  top: 30px;
  left: 30px;
  width: calc(100vw - 60px);
  height: calc(100vh - 60px);
  background-color: #242424;
  border: 1px dotted rgba(255, 255, 255, 0.15);
  border-radius: 15px;
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  &__letters {
    display: flex;
    font-size: 30px;
    align-items: center;
    align-content: center;
    height: 50vh;
    padding: 15px;
    box-sizing: border-box;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  &__letter {

    &-coma {
      width: 20px;
    }

    &-space {
      width: 6px;
    }

    &-red {
      color: red;
    }

    &-green {
      color: green
    }
  }

  &__text {
    width: 100%;
    height: 50vh;
    margin-top: auto;
    padding: 15px;
    border-radius: 15px;
    box-sizing: border-box;
    font-size: 30px;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  }

  &__close {
    width: 40px;
    height: 40px;
    padding: 0;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    right: -20px;
    position: absolute;
    top: -20px;

    &:active {
      opacity: 0.5;
    }
  }
}
</style>
