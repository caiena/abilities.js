import { AsyncAbilityBuilder } from '../../../../src'


const ManagerAbility = {
  build(user, options = {}) {
    let ability = AsyncAbilityBuilder.define((can, cannot) => {
      can('read', 'all')
      can('manage', 'Purchase')
    })

    return ability
  }
}


export { ManagerAbility }
