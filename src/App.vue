<template>
  <section class='app'>
    <ul class='app__nav first'>
      <li class='app__nav-item app__nav-title'>
        Categories
      </li>
      <template v-for='(item, key) in data.words'>
        <template v-if='isGroup(item)'>
          <li class='app__nav-item app__nav-group'
              :class='{"app__nav-group--open": data.openGroups.includes(key)}'
              @click='toggleGroup(key)'
          >
            <span class='app__nav-group-arrow'>▸</span>{{ key }}
          </li>
          <template v-if='data.openGroups.includes(key)'>
            <li class='app__nav-item app__nav-item--nested'
                :class='{"app__nav-item--active": data.activeCategoryWord === `${key} / ${group.title}`}'
                v-for='group in item'
                @click='changeActiveCategory(`${key} / ${group.title}`)'
            >
              {{ `${group.title} (${group.items.length} сл.)` }}
            </li>
          </template>
        </template>
        <li class='app__nav-item'
            v-else
            :class='{"app__nav-item--active": data.activeCategoryWord === key}'
            @click='changeActiveCategory(key)'
        >
          {{ `${key} (${item.length} сл.)` }}
        </li>
      </template>
    </ul>

    <ul class='app__nav second'>
      <li class='app__nav-item app__nav-title'>
        <span class="app__nav-title-text">Words</span>
        <button class="app__nav-item-btn app__nav-item-btn--green"
                title="Swap the question and answer languages"
                @click="data.isAlgorithmChanged = !data.isAlgorithmChanged">{{ data.isAlgorithmChanged ? 'EN → RU' : 'RU → EN' }}
        </button>
        <button class="app__nav-item-btn" @click="data.isKeyboardActive = true">Typing practice</button>
      </li>

      <li class='app__nav-item app__nav-description'
          v-if='descriptions[data.activeCategoryWord]'
          v-html='descriptions[data.activeCategoryWord]'
      ></li>

      <li class='app__nav-item' v-for='item in data.currentCategoryWords'>
        <span class="app__nav-word" v-html="item.original"></span>
        <span class="app__nav-word-sep">—</span>
        <span class="app__nav-word-translate" v-html="item.translate"></span>
      </li>
    </ul>

    <div class='app__content'>
      <div class='app__content-stats'>
        <span class='app__content-stat app__content-stat--correct' title='Correct answers'>✓ {{ data.score.correct }}</span>
        <span class='app__content-stat app__content-stat--wrong' title='Wrong answers'>✗ {{ data.score.wrong }}</span>
        <span class='app__content-stat' :class="{'app__content-stat--accent': data.els.length === 0}"
              title='Cards left in this round'>
          {{ data.els.length === 0 ? 'last card' : `${data.els.length} left` }}
        </span>
      </div>

      <div class='app__content-label'>{{ data.isAlgorithmChanged ? 'English' : 'Russian' }}</div>
      <div class='app__content-current' v-html='question'></div>

      <div class='app__content-translate'
           :class='{"hide": data.hidePrompt, [`app__content-translate--${data.result}`]: data.result}'
           v-html='answer'
      ></div>

      <div class='app__content-inp'>
        <input type='text'
               ref='answerInput'
               v-model='data.inpValue'
               :class='{[`is-${data.result}`]: data.result}'
               :placeholder='`type the ${data.isAlgorithmChanged ? "Russian" : "English"} and press Enter`'
               autocomplete='off'
               spellcheck='false'
               @keydown.enter.prevent='onEnter'
        >
        <div class='app__content-feedback' v-if='data.result'>
          {{ feedbackText }}
        </div>
      </div>

      <div class='app__content-btns'>
        <button class='app__content-btn show' @click='showAnswer' :disabled='!data.hidePrompt'>Show answer</button>
        <button class='app__content-btn' @click='showNextWord'>Next →</button>
      </div>

      <p class='app__content-help'>
        <b>Enter</b> — check, then next card · empty <b>Enter</b> — show answer.<br>
        Outside the input: <b>Space</b> — show answer, <b>→</b> — next card.
      </p>
    </div>
    <SectionKeyboard
        v-if="data.isKeyboardActive"
        :items="data.currentCategoryWords"
        @onClose="data.isKeyboardActive = false"
    />
  </section>
</template>

<script lang='ts'>
export default {
  name: ''
}
</script>

<script setup lang='ts'>
import {en} from './jsons/en'
import {computed, nextTick, onMounted, reactive, ref, watch} from 'vue';
import SectionKeyboard from './components/sections/keyboard/index.vue'

const data = reactive({
  inpValue: '',
  activeCategoryWord: '',
  hidePrompt: true,
  current: '' as string,
  els: [],
  defaultEls: [],
  currentCategoryWords: [],
  words: [],
  isKeyboardActive: false,
  isAlgorithmChanged: false,
  openGroups: [] as string[],
  result: '' as '' | 'correct' | 'wrong' | 'shown',
  score: {correct: 0, wrong: 0}
})

const answerInput = ref(null)
let nextTimer = null

const stripHtml = (text = '') => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const question = computed(() => data.isAlgorithmChanged ? data.current.original : data.current.translate)
const answer = computed(() => data.isAlgorithmChanged ? data.current.translate : data.current.original)

// Loose comparison: case, apostrophe style, punctuation and extra spaces don't matter
const normalize = (text: string) => stripHtml(text).toLowerCase()
  .replace(/[’‘`]/g, "'")
  .replace(/[.,!?;:"«»—–-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Accepted answers: the whole text, with or without the parts in brackets,
// and each alternative of "thin / skinny" or "mother, mum"
const acceptedAnswers = computed(() => {
  const full = stripHtml(answer.value)
  const versions = [full, full.replace(/\([^)]*\)/g, ' '), full.replace(/[()]/g, '')]
  const parts = versions.flatMap(version => [version, ...version.split(/\s\/\s|,/)])
  return new Set(parts.map(normalize).filter(Boolean))
})

const feedbackText = computed(() => ({
  correct: 'Correct! Next card…',
  wrong: 'Not quite — compare with the answer above. Enter — next card.',
  shown: 'Enter — next card.',
}[data.result]))

const focusInput = () => nextTick(() => answerInput.value?.focus())

const showAnswer = function () {
  data.hidePrompt = false
  if (!data.result) data.result = 'shown'
  focusInput()
}

const checkAnswer = function () {
  data.hidePrompt = false
  if (acceptedAnswers.value.has(normalize(data.inpValue))) {
    data.result = 'correct'
    data.score.correct++
    nextTimer = setTimeout(showNextWord, 900)
  } else {
    data.result = 'wrong'
    data.score.wrong++
  }
}

// Enter: empty input shows the answer, typed input is checked, after a result goes next
const onEnter = function () {
  if (data.result) return showNextWord()
  if (!data.inpValue.trim()) return showAnswer()
  checkAnswer()
}

// A category is either an array of words or an array of groups: { title, items: [words] }
const isGroup = (item) => Boolean(item[0]?.items)

// Flat map of selectable categories; grouped ones are keyed as `week / group title`
const categories = computed(() => {
  const result = {}
  Object.entries(data.words).forEach(([key, item]) => {
    if (isGroup(item)) item.forEach(group => result[`${key} / ${group.title}`] = group.items)
    else result[key] = item
  })
  return result
})

// Optional group descriptions (e.g. a grammar explanation), keyed the same way as `categories`
const descriptions = computed(() => {
  const result = {}
  Object.entries(data.words).forEach(([key, item]) => {
    if (isGroup(item)) item.forEach(group => {
      if (group.description) result[`${key} / ${group.title}`] = group.description
    })
  })
  return result
})

const toggleGroup = function (key: string) {
  data.openGroups = data.openGroups.includes(key)
    ? data.openGroups.filter(item => item !== key)
    : [...data.openGroups, key]
}

// Expand the group that contains the given category, e.g. `week_1` for `week_1 / words`
const openParentGroup = function (category: string) {
  const parent = category.split(' / ')[0]
  if (parent !== category && !data.openGroups.includes(parent)) data.openGroups.push(parent)
}

const changeActiveCategory = function (val: string) {
  data.activeCategoryWord = val
  data.score = {correct: 0, wrong: 0}
  data.currentCategoryWords = categories.value[val]
  data.defaultEls = JSON.parse(JSON.stringify(data.currentCategoryWords))
  data.els = JSON.parse(JSON.stringify(data.currentCategoryWords))
  showNextWord()
  localStorage.setItem('activeCategoryWord', val)
}
const goNextWord = function (e) {
  // The typing overlay has its own input; don't reveal or skip cards behind it
  if (data.isKeyboardActive) return
  // While typing an answer, keys belong to the input (Enter is handled by it)
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
  if (e.code === 'Space') showAnswer()
  if (['Enter', 'ArrowRight'].includes(e.code)) showNextWord()
}
const changeInfo = function () {
  if (!data.els.length) data.els = JSON.parse(JSON.stringify(data.defaultEls))
  let randomIndex = Math.floor(Math.random() * data.els.length)
  data.current = data.els.splice(randomIndex, 1)[0]
}
const showNextWord = function () {
  clearTimeout(nextTimer)
  data.inpValue = ''
  data.result = ''
  changeInfo()
  data.hidePrompt = true
  focusInput()
}

watch(() => [
  data.isKeyboardActive,
  data.isAlgorithmChanged,
  data.words,
  data.currentCategoryWords,
], () => {
  data.inpValue = ''
  data.result = ''
  data.hidePrompt = true
})

onMounted(() => {
  data.words = en

  let word = localStorage.getItem('activeCategoryWord')
  if (!word || !categories.value[word]) {
    word = Object.keys(categories.value)[0]
    localStorage.setItem('activeCategoryWord', word)
  }
  data.activeCategoryWord = word
  openParentGroup(word)
  data.currentCategoryWords = categories.value[word]
  data.defaultEls = JSON.parse(JSON.stringify(data.currentCategoryWords))
  data.els = JSON.parse(JSON.stringify(data.currentCategoryWords))
  showNextWord()

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
      width: 320px;
      flex-shrink: 0;
    }

    &.second {
      flex: 1 1 auto;
      min-width: 0;
    }

    &-item {
      padding: 15px;
      font-size: 14px;
      align-items: center;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-weight: 300;
      cursor: pointer;

      &-btn {
        padding: 5px 10px;
        font-size: 12px;
        margin-left: 10px;
        background-color: #4efff0;
        color: #333333;

        &--green {
          background-color: #ff50c0;
        }
      }

      &--active {
        background-color: rgba(255, 255, 255, 0.18);
      }

      &--nested {
        padding-left: 35px;
      }
    }

    &-group {
      font-weight: 500;
      user-select: none;

      &-arrow {
        display: inline-block;
        margin-right: 8px;
        transition: transform 0.15s;
      }

      &--open &-arrow {
        transform: rotate(90deg);
      }
    }

    &-description {
      cursor: default;
      line-height: 1.5;
      background-color: rgba(78, 255, 240, 0.06);

      h3 {
        margin: 0 0 10px;
        font-size: 17px;
        font-weight: 600;
      }

      p {
        margin: 10px 0 4px;
      }

      ul {
        margin: 0;
        padding-left: 20px;
      }

      li {
        margin-bottom: 2px;
      }
    }

    &-word {
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;

      &-sep {
        margin: 0 6px;
        opacity: 0.3;
      }

      &-translate {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.55);
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

      &-text {
        margin-right: auto;
      }
    }
  }

  &__content {
    margin-left: 15px;
    padding: 15px 20px 20px;
    width: 420px;
    flex-shrink: 0;
    box-sizing: border-box;
    background-color: rgba(255, 255, 255, 0.05);
    max-height: calc(100vh - 60px);
    overflow: auto;
    display: flex;
    flex-direction: column;
    border-radius: 10px;

    &-stats {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 25px;
      font-size: 13px;
    }

    &-stat {
      opacity: 0.6;

      &--correct {
        color: #20ff67;
        opacity: 0.9;
      }

      &--wrong {
        color: #ff8a8a;
        opacity: 0.9;
      }

      &--accent {
        color: #ffd24e;
        opacity: 1;
      }
    }

    &-label {
      margin-bottom: 8px;
      font-size: 12px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.45;
    }

    &-current {
      font-size: 26px;
      text-align: center;
      line-height: 1.25;
      margin-bottom: 25px;
      word-break: break-word;
    }

    &-translate {
      border: 1px dashed rgba(255, 255, 255, 0.3);
      padding: 12px 15px;
      border-radius: 12px;
      font-size: 20px;
      text-align: center;
      color: #6aff46;
      background-color: rgba(255, 255, 255, 0.07);
      word-break: break-word;
      transition: opacity 0.2s;

      &.hide {
        opacity: 0;
      }

      &--correct {
        border: 1px solid #20ff67;
      }

      &--wrong {
        border: 1px solid #ff5050;
      }
    }

    &-inp {
      margin-top: 20px;

      input {
        width: 100%;
        min-height: 48px;
        padding: 10px 15px;
        font-size: 18px;
        border: 1px solid #ff50c0;
        border-radius: 12px;
        box-sizing: border-box;

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 80, 192, 0.25);
        }

        &.is-correct {
          border-color: #20ff67;
          box-shadow: 0 0 0 2px rgba(32, 255, 103, 0.25);
        }

        &.is-wrong {
          border-color: #ff5050;
          box-shadow: 0 0 0 2px rgba(255, 80, 80, 0.25);
        }
      }
    }

    &-feedback {
      margin-top: 8px;
      font-size: 13px;
      opacity: 0.7;
    }

    &-btns {
      margin-top: 20px;
      display: flex;
      gap: 15px;
    }

    &-btn {
      flex-basis: 50%;
      height: 48px;
      background-color: #ff7f2e;

      &.show {
        background-color: #2d6cff;
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }
    }

    &-help {
      margin: auto 0 0;
      padding-top: 20px;
      font-size: 12px;
      line-height: 1.6;
      opacity: 0.45;

      b {
        color: inherit;
        font-weight: 600;
      }
    }
  }

}

b {
  color: #20ff67;
  font-weight: 700;
}
</style>

