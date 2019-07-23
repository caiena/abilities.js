import { BuyerAbility } from '../../support/app/abilities/buyer_ability'
import { Purchase, User }         from '../../support/app/models'


describe('BuyerAbility', () => {

  let buyer
  let ability

  beforeEach(async () => {
    buyer = new User({ roles: ['buyer'], name: 'John Locke' })
    ability = BuyerAbility.build(buyer)
  })

  it('cannot mange all', async () => {
    await expect(ability).not.to.allow('manage', 'all')
  })

  describe('with Purchase', () => {

    it('can create any purchase', async () => {
      await expect(ability).to.allow('create', 'Purchase')
    })

    it('cannot approve any purchase', async () => {
      await expect(ability).not.to.allow('approve', 'Purchase')
    })

    context('reading', () => {
      it('can index all purchases', async () => {
        await expect(ability).to.allow('index', 'Purchase')
      })

      it('can show purchases created by him/her', async () => {
        let purchase = new Purchase()
        purchase.create({ user: buyer })

        expect(purchase.createdById).to.eq(buyer.id)
        await expect(ability).to.allow('show', purchase)
      })

      it('cannot show purchases created by someone else', async () => {
        let someoneElse = new User({ name: 'Someone Else' })
        let purchase = new Purchase()
        purchase.create({ user: someoneElse })

        expect(purchase.createdById).to.eq(someoneElse.id)
        await expect(ability).not.to.allow('show', purchase)
      })
    })

  }) // [end] Purchase

})
