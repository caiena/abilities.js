import { ForbiddenError } from './error'
import { Rule } from './rule'
import { wrapArray, getSubjectName, clone } from './utils'


const PRIVATE_FIELD = typeof Symbol !== 'undefined' ? Symbol('private') : `__${Date.now()}`
const ALIASES = {
  crud: ['create', 'read', 'update', 'delete'],
}


function hasAction(action, actions) {
  return action === actions || Array.isArray(actions) && actions.indexOf(action) !== -1
}


class Ability {
  static addAlias(alias, actions) {
    if (alias === 'manage' || hasAction('manage', actions)) {
      throw new Error('Cannot add alias for "manage" action because it represents any action')
    }

    if (hasAction(alias, actions)) {
      throw new Error(`Attempt to alias action to itself: ${alias} -> ${actions.toString()}`)
    }

    ALIASES[alias] = actions
    return this
  }

  constructor(rules, { RuleType = Rule, subjectName = getSubjectName } = {}) {
    this.__private = {
      RuleType,
      subjectName,
      originalRules: rules || [],
      hasPerFieldRules: false,
      indexedRules: Object.create(null),
      mergedRules: Object.create(null),
      events: {},
      aliases: clone(ALIASES)
    }
    this.update(rules)
  }

  get __private() {
    return this[PRIVATE_FIELD]
  }

  set __private(val) {
    return this[PRIVATE_FIELD] = val
  }

  update(rules) {
    if (!Array.isArray(rules)) {
      return this
    }

    const payload = { rules, ability: this }

    this.emit('update', payload)
    this.__private.originalRules = rules.slice(0)
    this.__private.mergedRules = Object.create(null)

    const index = this.buildIndexFor(rules)

    this.__private.indexedRules = index.rules
    this.__private.hasPerFieldRules = index.hasPerFieldRules

    this.emit('updated', payload)

    return this
  }

  buildIndexFor(rules) {
    const indexedRules = Object.create(null)
    const { RuleType } = this.__private
    let isAllInverted = true
    let hasPerFieldRules = false

    for (let i = 0; i < rules.length; i++) {
      const rule = new RuleType(rules[i])
      const actions = this.expandActions(rule.actions)
      const subjects = wrapArray(rule.subject)
      const priority = rules.length - i - 1

      isAllInverted = !!(isAllInverted && rule.inverted)

      if (!hasPerFieldRules && rule.fields) {
        hasPerFieldRules = true
      }

      // for (let k = 0; k < subjects.length; k++) {
      //   const subject = subjects[k]
      for (let subject of subjects) {
        indexedRules[subject] = indexedRules[subject] || Object.create(null)

        // for (let j = 0; j < actions.length; j++) {
        //   const action = actions[j]
        for (let action of actions) {
          indexedRules[subject][action] = indexedRules[subject][action] || Object.create(null)
          indexedRules[subject][action][priority] = rule
        }
      }
    }

    return {
      isAllInverted,
      hasPerFieldRules,
      rules: indexedRules,
    }
  }

  expandActions(rawActions) {
    const { aliases } = this.__private
    let actions = wrapArray(rawActions)
    let i = 0

    while (i < actions.length) {
      const action = actions[i++]

      if (aliases.hasOwnProperty(action)) {
        actions = actions.concat(aliases[action])
      }
    }

    return actions
  }

  get rules() {
    return this.__private.originalRules
  }

  can(action, subject, field) {
    if (field && typeof field !== 'string') {
      // eslint-disable-next-line
      throw new Error('[abilities]: Ability.can(action, subject, field) expects 3rd parameter (field) to be a string.')
    }

    const rule = this.relevantRuleFor(action, subject, field)

    return !!rule && !rule.inverted
  }

  relevantRuleFor(action, subject, field) {
    const rules = this.rulesFor(action, subject, field)

    for (let i = 0; i < rules.length; i++) {
      if (rules[i].matches(subject)) {
        return rules[i]
      }
    }

    return null
  }

  possibleRulesFor(action, subject) {
    const subjectName = this.__private.subjectName(subject)
    const { mergedRules } = this.__private
    const key = `${subjectName}_${action}`

    if (!mergedRules[key]) {
      mergedRules[key] = this.mergeRulesFor(action, subjectName)
    }

    return mergedRules[key]
  }

  mergeRulesFor(action, subjectName) {
    const { indexedRules } = this.__private
    const mergedRules = [subjectName, 'all'].reduce((rules, subjectType) => {
      const subjectRules = indexedRules[subjectType]

      if (!subjectRules) {
        return rules
      }

      return Object.assign(rules, subjectRules[action], subjectRules.manage)
    }, [])

    // TODO: think whether there is a better way to prioritize rules
    // or convert sparse array to regular one
    return mergedRules.filter(Boolean)
  }

  rulesFor(action, subject, field) {
    const rules = this.possibleRulesFor(action, subject)

    if (!this.__private.hasPerFieldRules) {
      return rules
    }

    return rules.filter(rule => rule.isRelevantFor(subject, field))
  }

  cannot(...args) {
    return !this.can(...args)
  }

  throwUnlessCan(...args) {
    const rule = this.relevantRuleFor(...args)

    if (!rule || rule.inverted) {
      const [action, subject, field] = args
      const subjectName = this.__private.subjectName(subject)

      throw new ForbiddenError(rule ? rule.reason : null, {
        action,
        subjectName,
        subject,
        field
      })
    }
  }

  on(event, handler) {
    const { events } = this.__private
    let isAttached = true

    if (!events[event]) {
      events[event] = []
    }

    events[event].push(handler)

    return () => {
      if (isAttached) {
        const index = events[event].indexOf(handler)
        events[event].splice(index, 1)
        isAttached = false
      }
    }
  }

  emit(event, payload) {
    const handlers = this.__private.events[event]

    if (handlers) {
      handlers.slice(0).forEach(handler => handler(payload))
    }
  }
}


export { Ability }
