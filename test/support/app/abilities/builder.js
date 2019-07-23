import { AdminAbility }   from './admin_ability'
import { BuyerAbility }   from './buyer_ability'
import { ManagerAbility } from './manager_ability'


const Builder = {
  buildFor(user, options = {}) {
    if (user.roles.includes('admin')) {
      return AdminAbility.build(user, options)
    } else if (user.roles.includes('manager')) {
      return ManagerAbility.build(user, options)
    } else if (user.roles.includes('buyer')) {
      return BuyerAbility.build(user, options)
    }

    // you could define a "default guest" ability
    // return DefaultAbility.build(user, options)

    // or just throw an error
    throw Error(`[abilities.Builder] don't know how to provide an ability for user ${user}`)
  }
}


export { Builder }
