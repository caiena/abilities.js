import { Ability } from '../../../../src'

import { Builder }        from './builder'
import { AdminAbility }   from './admin_ability'
import { BuyerAbility }   from './buyer_ability'
import { ManagerAbility } from './manager_ability'


// as this is an entry-point file, we'll do some "setup/config" here

// aliases
Ability.addAlias('edit', ['update'])
Ability.addAlias('destroy', ['delete'])
Ability.addAlias('read', ['index', 'show'])


export {
  Builder,
  AdminAbility,
  BuyerAbility,
  ManagerAbility,
}
