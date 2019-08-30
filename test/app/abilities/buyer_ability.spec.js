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

      it('can read purchases created by him/her', async () => {
        let purchase = new Purchase()
        purchase.create({ user: buyer })

        expect(purchase.createdById).to.eq(buyer.id)
        await expect(ability).to.allow('read', purchase)
      })

      it('cannot read purchases created by someone else', async () => {
        let someoneElse = new User({ name: 'Someone Else' })
        let purchase = new Purchase()
        purchase.create({ user: someoneElse })

        expect(purchase.createdById).to.eq(someoneElse.id)
        await expect(ability).not.to.allow('read', purchase)
      })
    })

    context('deleting', () => {
      it('can delete if purchase is not approved', async () => {
        let purchase = new Purchase()
        purchase.create({ user: buyer })

        expect(purchase.approved).to.be.false
        await expect(ability).to.allow('delete', purchase)
      })

      it('cannot delete if purchase is approved', async () => {
        let purchase = new Purchase()
        purchase.create({ user: buyer })

        let manager = new User({ roles: ['manager'], name: 'Fyodor Dostoyevsky' })
        purchase.approve({ user: manager })

        expect(purchase.approved).to.be.true
        await expect(ability).not.to.allow('delete', purchase)
      })
    })

  }) // [end] Purchase

})
