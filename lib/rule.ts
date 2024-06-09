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

function get(obj: Record<string, any>, key: string): any {
  // TODO: support some kind of get() method?
  // return typeof obj.get === 'function' ? obj.get(key) : obj[key]
  return obj[key]
}


function isPartiallyEqual(target: any, obj: any) {
  return Object.keys(obj).every(key => get(target, key) === obj[key])
}


function getConditionFn(condition: any): ConditionFn {
  return (target: any) => isPartiallyEqual(target, condition)
}


export type ConditionFn = ((target: any, fields?: string[]) => boolean)
export type Condition = Record<string, any> | ConditionFn


class Rule {
  actions: string[]
  subject: any
  fields: string[] | undefined
  inverted: boolean
  condition: Record<string, any> | ConditionFn | undefined
  reason: string | undefined

  _matches: ConditionFn | undefined

  constructor(
    params: {
      actions: string | string[],
      subject: any,
      fields?: string[],
      inverted?: boolean,
      condition?: Record<string, any> | ConditionFn,
      reason?: string
    }
  ) {
    this.actions = wrapArray(params.actions)
    this.subject = params.subject
    this.fields = params.fields ? wrapArray(params.fields) : undefined
    this.inverted = !!params.inverted
    this.condition = params.condition
    // this._matches = this.condition ? sift(this.condition) : undefined
    this.reason = params.reason

    if (this.condition == null) { // null or undefined
      this._matches = undefined
    } else if (isObject(this.condition)) {
      this._matches = getConditionFn(this.condition)
    } else if (typeof this.condition == 'function') {
      this._matches = (target, fields) => (this.condition as ConditionFn)(target, fields) // fn (object, fields) => boolean
    } else {
      throw Error(`Unsupported type for condition: ${typeof this.condition}`)
    }
  }

  matches(target: any) {
    if (this._matches == null) return true
    if (typeof target == "string") return !this.inverted

    return this._matches(target)
  }

  // TODO: revisar esse método.
  isRelevantFor(field?: string) {
    if (!this.fields) return true
    // XXX: se for uma regra de "negação" (inverted), ela é relevante mesmo que não tenha relação com o field
    if (field == null) return !this.inverted

    // somente se tiver relação com o field
    return this.fields.indexOf(field) !== -1
  }
}


export { Rule }
