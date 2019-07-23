import { AbilityBuilder } from '../../../../src'


const AdminAbility = {
  build(admin, options = {}) {
    let ability = AbilityBuilder.define((can, cannot) => {
      can('manage', 'all')
    })

    return ability
  }
}


export { AdminAbility }
