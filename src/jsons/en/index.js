import idioms from './idioms.json'
import allPrepositions from './all_prepositions.json'
import allPhrasalVerbs from './all_phrasal_verbs.json'
import onInAt from './on_in_at.json'
import presentTenses from './present_tenses.json'
import prepositionsWeeks1To4 from './prepositions_weeks_1_4.json'
import phrasalVerbsWeeks1To4 from './phrasal_verbs_weeks_1_4.json'
import prepositionsWeeks5To8 from './prepositions_weeks_5_8.json'
import phrasalVerbsWeeks5To8 from './phrasal_verbs_weeks_5_8.json'

// Each week lives in ./weeks/week_N.json; drop in a new file to add a week
const modules = import.meta.glob('./weeks/week_*.json', { eager: true, import: 'default' })

const weekNumber = (path) => Number(path.match(/week_(\d+)\.json$/)[1])

const weeks = Object.fromEntries(
    Object.keys(modules)
        .sort((a, b) => weekNumber(a) - weekNumber(b))
        .map(path => [`week_${weekNumber(path)}`, modules[path]])
)

export const en = { ...weeks, idioms, 'all prepositions': allPrepositions, 'prepositions weeks 1-4': prepositionsWeeks1To4, 'prepositions weeks 5-8': prepositionsWeeks5To8, 'all phrasal verbs': allPhrasalVerbs, 'phrasal verbs weeks 1-4': phrasalVerbsWeeks1To4, 'phrasal verbs weeks 5-8': phrasalVerbsWeeks5To8, 'on in at': onInAt, 'present tenses': presentTenses }
