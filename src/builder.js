import { Ability } from './ability'
import { AsyncAbility } from './async_ability'
import { getSubjectName, isObject } from './utils'


const PRIVATE_FIELD = typeof Symbol !== 'undefined' ? Symbol('private') : `__${Date.now()}`

function isStringOrNonEmptyArray(value) {
  return ![].concat(value).some(item => typeof item !== 'string')
}


class RuleBuilder {
  constructor(rule) {
    this.rule = rule
  }

  because(reason) {
    this.rule.reason = reason
    return this
  }
}


class AbilityBuilder {
  static define(dsl, options = {}) {
    const builder = new this()
    const result = dsl(builder.can.bind(builder), builder.cannot.bind(builder))

    const AbilityClass = options.async ? AsyncAbility : Ability
    const buildAbility = () => new  AbilityClass(builder.rules, options)

    return result && (typeof result.then === 'function') ?
      result.then(buildAbility) :
      buildAbility()
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
    this.__private = {
      subjectName,
    }
  }

  get __private() {
    return this[PRIVATE_FIELD]
  }

  set __private(val) {
    return this[PRIVATE_FIELD] = val
  }


  can(actions, subject, fieldsOrCondition, condition) {
    if (!isStringOrNonEmptyArray(actions)) {
      throw new TypeError('AbilityBuilder#can expects the first parameter to be an action or array of actions')
    }

    const subjectName = [].concat(subject).map(this.__private.subjectName)

    if (!isStringOrNonEmptyArray(subjectName)) {
      throw new TypeError('AbilityBuilder#can expects the second argument to be a subject name/type or an array of subject names/types')
    }

    const rule = { actions, subject: subjectName }

    if (Array.isArray(fieldsOrCondition) || typeof fieldsOrCondition === 'string') {
      rule.fields = fieldsOrCondition
    }

    // old code: replaced by below if/else
    // if (isObject(condition) || !rule.fields && isObject(fieldsOrCondition)) {
    //   rule.condition = condition || fieldsOrCondition
    // }
    if (!rule.fields && (isObject(fieldsOrCondition) || typeof fieldsOrCondition === 'function')) {
      rule.condition = fieldsOrCondition
    } else if (condition) {
      rule.condition = condition
    }


    this.rules.push(rule)

    return new RuleBuilder(rule)
  }

  cannot(...args) {
    const builder = this.can(...args)
    builder.rule.inverted = true

    return builder
  }
}


export { AbilityBuilder, RuleBuilder }
