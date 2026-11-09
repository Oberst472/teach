import idioms from './idioms.json'

// Each week lives in ./weeks/week_N.json; drop in a new file to add a week
const modules = import.meta.glob('./weeks/week_*.json', { eager: true, import: 'default' })

const weekNumber = (path) => Number(path.match(/week_(\d+)\.json$/)[1])

const weeks = Object.fromEntries(
    Object.keys(modules)
        .sort((a, b) => weekNumber(a) - weekNumber(b))
        .map(path => [`week_${weekNumber(path)}`, modules[path]])
)

export const en = { ...weeks, idioms }
