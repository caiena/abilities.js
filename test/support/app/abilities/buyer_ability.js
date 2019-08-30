import { AsyncAbilityBuilder } from '../../../../src'


const BuyerAbility = {
  build(user, options = {}) {
    // simulating async
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    let ability = AsyncAbilityBuilder.define((can, cannot) => {
      can('create', 'Purchase')
      can('index', 'Purchase')
      can('read', 'Purchase', async (purchase) => {
        // simulating a fetch to request data (async)
        return wait().then(() => purchase.createdById === user.id)
      })
      can('delete', 'Purchase', async (purchase) => !purchase.approved)
      cannot('delete', 'Purchase', async (purchase) => purchase.approved)
    })

    return ability
  }
}


export { BuyerAbility }
