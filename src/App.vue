<template>
  <section class='app'>
    <ul class='app__nav first'>
      <li class='app__nav-item app__nav-title'>
        <button class="app__lang-btn app__lang-btn--en" @click="changeLang('en')">
          <img src="/en.svg" alt="">
        </button>
        <button class="app__lang-btn app__lang-btn--pl" @click="changeLang('pl')">
          <img src="/pl.svg" alt="">
        </button>
        Categories
      </li>
      <li class='app__nav-item'
          :class='{"app__nav-item--active": data.activeCategoryWord === key}'
          v-for='(item, key) in data.words'
          @click='changeActiveCategory(key)'
      >
        {{ `${key} (${item.length} сл.)` }}
      </li>
    </ul>

    <ul class='app__nav second'>
      <li class='app__nav-item app__nav-title'>Words</li>

      <li class='app__nav-item' v-for='item in data.currentCategoryWords'>
        <span v-html="item.original"></span>: <span v-html="item.translate"></span>
      </li>
    </ul>

    <div class='app__content'>
      <div class='app__content-number'> {{ data.els.length }}</div>
      <div class='app__content-current' v-html="data.current.original"></div>
      <div class='app__content-translate' :class='{"hide": data.hidePrompt}' v-html="data.current.translate"></div>
      <div class='app__content-btns'>
        <button class='app__content-btn show' @click='data.hidePrompt = false'>Prompt</button>
        <button class='app__content-btn' @click='showNextWord'>Next word</button>
      </div>
    </div>
  </section>
</template>


<script lang='ts'>
export default {
  name: ''
}
</script>

<script setup lang='ts'>
import { en } from './jsons/en'
import { pl } from './jsons/pl'
import { computed, onMounted, reactive, watch } from 'vue';

const data = reactive({
  currentLanguage: 'en',
  activeCategoryWord: '',
  hidePrompt: true,
  current: '' as string,
  els: [],
  defaultEls: [],
  currentCategoryWords: [],
  words: [],
})
// const words = computed(() => {
//   console.log(9);
//   localStorage.setItem('currentLanguage', data.currentLanguage)
//   data.hidePrompt = false
//   console.log(data.currentLanguage);
//   return data.currentLanguage === 'en' ? en : pl
// })

const changeLang = function(val) {
  data.currentLanguage = val
    localStorage.setItem('currentLanguage', data.currentLanguage)
  data.words = val === 'en' ? en : pl

  const word = Object.keys(data.words)[0]

  data.activeCategoryWord = Object.keys(data.words)[0]
  localStorage.setItem('activeCategoryWord', Object.keys(data.words)[0])

  data.currentCategoryWords = data.words[word]
  data.defaultEls = JSON.parse(JSON.stringify(data.currentCategoryWords))
  data.els = JSON.parse(JSON.stringify(data.currentCategoryWords))
  changeInfo()
}

const changeActiveCategory = function(val: string) {
  data.activeCategoryWord = val
  data.hidePrompt = true
  data.currentCategoryWords = data.words[val]
  data.defaultEls = JSON.parse(JSON.stringify(data.currentCategoryWords))
  data.els = JSON.parse(JSON.stringify(data.currentCategoryWords))
  changeInfo()
  localStorage.setItem('activeCategoryWord', val)
}
const goNextWord = function(e) {
  if (e.code === 'Space' || e.code === 'ShiftRight') data.hidePrompt = false
  if (['MetaRight', 'Enter', 'ArrowRight'].includes(e.code)) showNextWord()
}
const changeInfo = function() {
  if (!data.els.length) data.els = JSON.parse(JSON.stringify(data.defaultEls))
  let randomIndex = Math.floor(Math.random() * data.els.length)
  data.current = data.els.splice(randomIndex, 1)[0]
}
const showNextWord = function() {
  changeInfo()
  data.hidePrompt = true
}

onMounted(() => {
  if (localStorage.getItem('currentLanguage')) {
    data.currentLanguage = localStorage.getItem('currentLanguage')
  }
  data.words = data.currentLanguage === 'en' ? en : pl

  let word = ''
  if (localStorage.getItem('activeCategoryWord')) {
    word = localStorage.getItem('activeCategoryWord')
  } else {
    localStorage.setItem('activeCategoryWord', Object.keys(data.words)[0])
    word = Object.keys(data.words)[0]
  }
  data.activeCategoryWord = word
  data.currentCategoryWords = data.words[word]
  data.defaultEls = JSON.parse(JSON.stringify(data.currentCategoryWords))
  data.els = JSON.parse(JSON.stringify(data.currentCategoryWords))
  changeInfo()

  window.addEventListener('keyup', goNextWord)
  console.info(`${new Date()} v2`);
})
</script>

<style lang='scss'>
.app {
  font-weight: 300;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  padding: 30px;
  &__lang-btn {
    margin-right: 4px;
    padding: 0;
    font-size: 0;
    background-size: contain;
    background-repeat: no-repeat;
    border-radius: 0;
    border: 0;
    width: 40px;
    height: 30px;
    background-color: transparent;
    background-position: center;
    cursor: pointer;
    img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    &--en {
    }
    &--pl {

    }
  }

  &__nav {
    padding: 0;
    list-style: none;
    margin: 0;
    background-color: rgba(255, 255, 255, 0.05);
    max-height: calc(100vh - 60px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    border-radius: 10px;

    & + & {
      margin-left: 15px;
    }

    &.first {
      width: 400px;
    }

    &.second {
      width: 800px;
    }

    &-item {
      padding: 15px;
      font-size: 14px;
      align-items: center;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-weight: 300;
      cursor: pointer;

      &--active {
        background-color: rgba(255, 255, 255, 0.18);
      }
    }

    &-title {
      font-size: 18px;
      font-weight: 500;
      top: 0;
      position: sticky;
      height: 40px;
      display: flex;
      padding: 0 15px;
      background-color: #2f2f2f;
      border-bottom: 1px solid white;
    }
  }

  &__content {
    list-style: none;
    margin-left: 30px;
    padding: 15px;
    flex-basis: 100%;
    background-color: rgba(255, 255, 255, 0.05);
    max-height: calc(100vh - 60px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    border-radius: 10px;

    &-number {
      margin-bottom: 50px;
      opacity: 0.7;
      text-align: right;
    }

    &-current {
      font-size: 40px;
      text-align: center;
      line-height: 1.2;
      margin-bottom: 60px;
    }

    &-translate {
      border: 1px dashed;
      padding: 15px;
      border-radius: 15px;
      font-size: 30px;
      text-align: center;
      color: #6aff46;
      background-color: rgba(255, 255, 255, 0.07);

      &.hide {
        opacity: 0;
      }
    }

    &-btns {
      margin-top: 60px;
      display: flex;
      gap: 30px;
    }

    &-btn {
      flex-basis: 50%;
      height: 60px;
      background-color: #ff7f2e;

      &.show {
        background-color: #2d6cff;
      }
    }
  }
}

b {
  color: #20ff67;
  font-weight: 700;
}
</style>

