import { ManagerAbility } from '../../support/app/abilities'
import { Purchase, User } from '../../support/app/models'


describe('ManagerAbility', () => {
  let manager
  let ability

  beforeEach(async () => {
    manager = new User({ roles: ['manager'], name: 'John Doe' })
    ability = await ManagerAbility.build(manager)
  })

  it('cannot mange all', async () => {
    await expect(ability).not.to.allow('manage', 'all')
  })

  describe('with User', () => {
    it('can read all users', async () => {
      await expect(ability).to.allow('read', 'User')
    })
  })

  describe('with Purchase', () => {
    it('can manage all purchases', async () => {
      await expect(ability).to.allow('manage', 'Purchase')

      // sanity checking
      await expect(ability).to.allow('create',  'Purchase')
      await expect(ability).to.allow('approve', 'Purchase')
    })
  }) // [end] Purchase

})
