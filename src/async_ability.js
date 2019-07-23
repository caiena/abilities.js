import { Ability } from './ability'
import { ForbiddenError } from './error'
import { Rule } from './rule'


class AsyncAbility extends Ability {

  // override
  // - async
  async relevantRuleFor(action, subject, field) {
    const rules = this.rulesFor(action, subject, field)

    for (let rule of rules) {
      if (await rule.matches(subject)) {
        return rule
      }
    }

    return null
  }

  // override
  // - async
  async can(action, subject, field) {
    if (field && typeof field !== 'string') {
      // eslint-disable-next-line
      throw new Error('[abilities]: Ability.can(action, subject, field) expects 3rd parameter (field) to be a string.')
    }

    const rule = await this.relevantRuleFor(action, subject, field)

    return !!rule && !rule.inverted
  }


  // override
  // - async
  async cannot(...args) {
    let can = await this.can(...args)

    return !can
  }

  // override
  // - async
  async throwUnlessCan(...args) {
    const rule = await this.relevantRuleFor(...args)

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
} // [end] class AsyncAbility


export { AsyncAbility }
