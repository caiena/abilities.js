// Interface definition
// interface Rule {
//   actions: string | string[],
//   subject: string | string[],
//   fields?: string[],
//   condition?: Object | Function,
//   inverted?: boolean, // default is `false`
//   reason?: string // mainly to specify why user can't do something. See forbidden reasons for details
// }


import { isObject, wrapArray } from './utils'

function get(obj, key) {
  // TODO: support some kind of get() method?
  // return typeof obj.get === 'function' ? obj.get(key) : obj[key]
  return obj[key]
}


function isPartiallyEqual(target, obj) {
  return Object.keys(obj).every(key => get(target, key) === obj[key])
}


function getConditionFn(condition) {
  return (target) => isPartiallyEqual(target, condition)
}



class Rule {
  constructor(params) {
    this.actions = params.actions || params.action
    this.subject = params.subject
    this.fields = !params.fields || params.fields.length === 0
      ? undefined
      : wrapArray(params.fields)
    this.inverted = !!params.inverted
    this.condition = params.condition
    // this._matches = this.condition ? sift(this.condition) : undefined
    this.reason = params.reason

    if (this.condition == null) { // null or undefined
      this._matches = undefined
    } else if (isObject(this.condition)) {
      this._matches = getConditionFn(this.condition)
    } else if (typeof this.condition === 'function') {
      this._matches = (target, fields) => this.condition(target, fields) // fn (object, fields) => boolean
    } else {
      throw Error(`Unsupported type for condition: ${typeof this.condition}`)
    }
  }

  matches(target) {
    if (!this._matches) return true
    if (typeof target === 'string') return !this.inverted

    return this._matches(target)
  }

  isRelevantFor(target, field) {
    if (!this.fields) return true
    if (!field) return !this.inverted

    return this.fields.indexOf(field) !== -1
  }
}


export { Rule }
