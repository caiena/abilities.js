import {
  Builder as AbilitiesBuilder,
  AdminAbility,
  BuyerAbility,
  ManagerAbility
} from '../../support/app/abilities'

import { User } from '../../support/app/models'


describe('abilities Builder', () => {

  describe('building', () => {
    describe('for an admin', () => {
      let admin
      let ability

      beforeEach(async () => {
        admin = new User({ roles: ['admin'], name: 'John Locke' })
        sinon.spy(AdminAbility, 'build')
        ability = await AbilitiesBuilder.buildFor(admin)
      })

      it('builds using AdminAbility', () => {
        expect(AdminAbility.build).to.have.been.calledOnceWith(admin)
      })

      // TODO: move ./admin_ability.spec.js to a "behavior" function, and use
      // expect(ability).to.behaveLike(AdminAbilitySpecs)
    })

    describe('for a manager', () => {
      let manager
      let ability

      beforeEach(async () => {
        manager = new User({ roles: ['manager'], name: 'John Locke' })
        sinon.spy(ManagerAbility, 'build')
        ability = await AbilitiesBuilder.buildFor(manager)
      })

      it('builds using ManagerAbility', () => {
        expect(ManagerAbility.build).to.have.been.calledOnceWith(manager)
      })

      // TODO: move ./manager_ability.spec.js to a "behavior" function, and use:
      // expect(ability).to.behaveLike(ManagerAbilitySpecs)
    })

    describe('for a buyer', () => {
      let buyer
      let ability

      beforeEach(async () => {
        buyer = new User({ roles: ['buyer'], name: 'John Locke' })
        sinon.spy(BuyerAbility, 'build')
        ability = await AbilitiesBuilder.buildFor(buyer)
      })

      it('builds using BuyerAbility', () => {
        expect(BuyerAbility.build).to.have.been.calledOnceWith(buyer)
      })

      // TODO: move ./buyer_ability.spec.js to a "behavior" function, and use
      // expect(ability).to.behaveLike(BuyerAbilitySpecs)
    })
  })

})
