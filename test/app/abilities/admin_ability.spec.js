import { AdminAbility } from '../../support/app/abilities'
import { User }         from '../../support/app/models'


describe('AdminAbility', () => {

  describe('building', () => {
    describe('for an admin', () => {
      let admin
      let ability

      beforeEach(async () => {
        admin = new User({ roles: ['admin'], name: 'John Locke' })
        ability = AdminAbility.build(admin)
      })

      it('can manage all', async () => {
        await expect(ability).to.allow('manage', 'all')

        // sanity check
        await expect(ability).to.allow('create', 'User')
        await expect(ability).to.allow('create', 'Purchase')
      })
    })
  })

})
