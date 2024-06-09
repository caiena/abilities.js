import { ForbiddenError } from './errors'
import { Rule } from './rule'
import { wrapArray, getSubjectName, clone } from './utils'


const ALIASES = {
  crud: ['create', 'read', 'update', 'delete'],
} as Record<string, string[]>


function hasAction(action: string, actions: string | string[]) {
  return action === actions || Array.isArray(actions) && actions.indexOf(action) !== -1
}


export type ConstructorOptions = { RuleType: Rule, subjectName: typeof getSubjectName }

class Ability {
  #private: Record<string, any> = {}

  static addAlias(alias: string, actions: string | string[]) {
    if (alias === 'manage' || hasAction('manage', actions)) {
      throw new Error('Cannot add alias for "manage" action because it represents any action')
    }

    if (hasAction(alias, actions)) {
      throw new Error(`Attempt to alias action to itself: ${alias} -> ${actions.toString()}`)
    }

    ALIASES[alias] = wrapArray(actions)
    return this
  }

  constructor(rules: Rule[], { RuleType = Rule, subjectName = getSubjectName } = {} as ConstructorOptions) {
    this.#private = {
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

  update(rules: Rule[]) {
    if (!Array.isArray(rules)) {
      return this
    }

    const payload = { rules, ability: this }

    this.emit('update', payload)
    this.#private.originalRules = rules.slice(0)
    this.#private.mergedRules = Object.create(null)

    const index = this.buildIndexFor(rules)

    this.#private.indexedRules = index.rules
    this.#private.hasPerFieldRules = index.hasPerFieldRules

    this.emit('updated', payload)

    return this
  }

  buildIndexFor(rules: Rule[]) {
    const indexedRules = Object.create(null)
    const { RuleType } = this.#private
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

  expandActions(rawActions: string | string[]) {
    const { aliases } = this.#private
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
    return this.#private.originalRules
  }

  can(action: string, subject: any, field?: string) {
    if (field && typeof field !== 'string') {
      // eslint-disable-next-line
      throw new Error('[abilities]: Ability.can(action, subject, field) expects 3rd parameter (field) to be a string.')
    }

    const rule = this.relevantRuleFor(action, subject, field)

    return !!rule && !rule.inverted
  }

  relevantRuleFor(action: string, subject: any, field?: string): Rule | null {
    const rules = this.rulesFor(action, subject, field)

    for (let i = 0; i < rules.length; i++) {
      if (rules[i].matches(subject)) {
        return rules[i]
      }
    }

    return null
  }

  possibleRulesFor(action: string, subject: any): Rule[] {
    const subjectName = this.#private.subjectName(subject)
    const { mergedRules } = this.#private
    const key = `${subjectName}_${action}`

    if (!mergedRules[key]) {
      mergedRules[key] = this.mergeRulesFor(action, subjectName)
    }

    return mergedRules[key]
  }

  mergeRulesFor(action: string, subjectName: string): Rule[] {
    const { indexedRules } = this.#private
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

  rulesFor(action: string, subject: any, field?: string): Rule[] {
    const rules = this.possibleRulesFor(action, subject)

    if (!this.#private.hasPerFieldRules) {
      return rules
    }

    return rules.filter((rule: Rule) => rule.isRelevantFor(field))
  }

  cannot(...args: Parameters<Ability["can"]>) {
    return !this.can(...args)
  }

  throwUnlessCan(...args: Parameters<Ability["relevantRuleFor"]>) {
    const rule = this.relevantRuleFor(...args)

    if ((rule == null) || rule.inverted) {
      const [action, subject, field] = args
      const subjectName = this.#private.subjectName(subject)
      const reason = rule?.reason

      throw new ForbiddenError(reason, {
        action,
        subjectName,
        subject,
        field
      })
    }
  }

  on(event: string, handler: (payload: any) => void) {
    const { events } = this.#private
    let isAttached = true

    if (!events[event]) {
      events[event] = []
    }

    events[event].push(handler)

    // Retorna uma função que, quando invocada, "desliga" o listener
    // ex:
    //   // inscreva seu listener, retornando o hook para remover inscrição
    //   let unsubscribe = ability.on("update", doSomething)
    //
    //   // faça alguma coisa...
    //
    //   // quando necessário, desinscreva seu listener
    //   unsubscribe()
    //
    return () => {
      if (isAttached) {
        const index = events[event].indexOf(handler)
        events[event].splice(index, 1)
        isAttached = false
      }
    }
  }

  emit(event: string, payload: any) {
    const handlers = this.#private.events[event]

    if (handlers) {
      handlers.slice(0).forEach((handler: (payload: any) => {}) => handler(payload))
    }
  }
}


export { Ability }
