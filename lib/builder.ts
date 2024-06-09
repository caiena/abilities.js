import { Ability, ConstructorOptions as AbilityConstructorOptions } from './ability'
import { Rule, Condition } from './rule'
import { getSubjectName, wrapArray } from './utils'

function isStringOrNonEmptyArray(value: any): boolean {
  return ![].concat(value).some(item => typeof item !== 'string')
}

type DefineFn = ((can: AbilityBuilder["can"], cannot: AbilityBuilder["cannot"]) => void)

// class RuleBuilder {
//   rule: Rule
//
//   constructor(rule: Rule) {
//     this.rule = rule
//   }
//
//   because(reason: string) {
//     this.rule.reason = reason
//     return this
//   }
// }


class AbilityBuilder {
  #private: Record<string, any> = {}

  rules: Rule[]

  static define(fn: DefineFn, options = {} as AbilityConstructorOptions) {
    const builder = new this()
    fn(builder.can.bind(builder), builder.cannot.bind(builder))

    // const result = dsl(builder.can.bind(builder), builder.cannot.bind(builder))
    //
    // const AbilityClass = options.async ? AsyncAbility : Ability
    // const buildAbility = () => new  AbilityClass(builder.rules, options)
    //
    // const buildAbility = () => new Ability(builder.rules, options)
    //
    // return result && (typeof result.then === 'function') ?
    //   result.then(buildAbility) :
    //   buildAbility()

    return new Ability(builder.rules, options)
  }

  static extract() {
    const builder = new this()

    return {
      can: builder.can.bind(builder),
      cannot: builder.cannot.bind(builder),
      rules: builder.rules,
    }
  }

  constructor({ subjectName = getSubjectName } = {}) {
    this.rules = []
    this.#private = {
      subjectName,
    }
  }

  can(actions: string | string[], subject: any, options?: { condition?: Condition, reason?: string }) {
    if (!isStringOrNonEmptyArray(actions)) {
      throw new TypeError('AbilityBuilder#can expects the first parameter to be an action or array of actions')
    }

    const subjectName = [].concat(subject).map(this.#private.subjectName)

    if (!isStringOrNonEmptyArray(subjectName)) {
      throw new TypeError('AbilityBuilder#can expects the second argument to be a subject name/type or an array of subject names/types')
    }

    // let rule = { actions, subject: subjectName } as Record<string, any>
    let _actions = wrapArray(actions)
    let rule = new Rule({ actions: _actions, subject: subjectName })

    // if (options.fields) {
    //   rule.fields = wrapArray(options.fields)
    // }

    if (options?.condition) {
      rule.condition = options.condition
    }

    if (options?.reason) {
      rule.reason = options.reason
    }
    console.log("options", options)

    this.rules.push(rule)

    return rule
  }

  cannot(...args: Parameters<AbilityBuilder["can"]>) {
    const rule = this.can(...args)
    rule.inverted = true

    return rule
  }
}


export { AbilityBuilder }
