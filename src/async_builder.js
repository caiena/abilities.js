import { Ability }        from './ability'
import { AbilityBuilder } from './builder'
import { AsyncAbility }   from './async_ability'


class AsyncAbilityBuilder extends AbilityBuilder {
  static define(dsl, options = {}) {
    const builder = new this()
    const result = dsl(builder.can.bind(builder), builder.cannot.bind(builder))

    const AbilityClass = AsyncAbility
    const buildAbility = () => new  AbilityClass(builder.rules, options)

    return result && (typeof result.then === 'function') ?
      result.then(buildAbility) :
      buildAbility()
  }
}


export { AsyncAbilityBuilder }
