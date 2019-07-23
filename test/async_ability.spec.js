import { AbilityBuilder, AsyncAbilityBuilder, ForbiddenError, Ability, AsyncAbility } from '../src'

class Post {
  constructor(attrs) {
    Object.assign(this, attrs)
  }
}

describe('AsyncAbility', () => {
  let ability

  it('allows to add alias for actions', async () => {
    // TODO: isolated test for alias working on Ability.addAlias() and AsyncAbility.addAlias()
    Ability.addAlias('modify', ['update', 'delete'])
    // AsyncAbility.addAlias('modify', ['update', 'delete'])

    // TODO: check with async timeout
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    // can('modify', 'Post', async (post) => wait(300).then(() => !post.published)

    ability = AbilityBuilder.define((can, cannot) => {
      // can('modify', 'Post', async (post) => !post.published)
      can('modify', 'Post', async (post) => wait(10).then(() => !post.published))
      can('read', 'Post', { published: true })
    }, { async: true })

    expect(ability).to.be.an.instanceof(AsyncAbility)

    await expect(ability.can('modify', new Post({ published: false }))).to.become(true)
    await expect(ability).to.allow('modify', new Post({ published: false }))

    await expect(ability.can('modify', new Post({ published: true }))).to.become(false)
    await expect(ability.cannot('modify', new Post({ published: true }))).to.become(true)
    await expect(ability).not.to.allow('modify', new Post({ published: true }))
    await expect(ability).not.to.allow('modify', new Post({ published: true }))
    // await expect(ability).not.to.allow('modify', new Post({ published: true }))

    await expect(ability.can('read', new Post({ published: false }))).to.become(false)
    await expect(ability).not.to.allow('read', new Post({ published: false }))
  })

  it('allows deeply nested aliased actions', async () => {
    AsyncAbility.addAlias('sort', 'increment')
    AsyncAbility.addAlias('modify', ['sort'])
    ability = AsyncAbilityBuilder.define(can => can('modify', 'all'))

    await expect(ability).to.allow('increment', 123)
  })

  it('throws exception when trying to define `manage` alias', () => {
    expect(() => AsyncAbility.addAlias('manage', 'crud')).to.throw(Error)
  })

  it('throws exception when trying to make `manage` a part of aliased action', () => {
    expect(() => AsyncAbility.addAlias('modify', ['crud', 'manage'])).to.throw(Error)
  })

  it('throws exception when trying to alias action to itself', () => {
    expect(() => AsyncAbility.addAlias('sort', 'sort')).to.throw(Error)
    expect(() => AsyncAbility.addAlias('sort', ['order', 'sort'])).to.throw(Error)
  })

  it('provides predefined `crud` alias for `create`, `read`, `update` and `delete` actions', async () => {
    ability = AsyncAbilityBuilder.define(can => can('crud', 'Post'))

    await expect(ability).to.allow('crud', 'Post')
    await expect(ability).to.allow('create', 'Post')
    await expect(ability).to.allow('read', 'Post')
    await expect(ability).to.allow('update', 'Post')
    await expect(ability).to.allow('delete', 'Post')
    await expect(ability).not.to.allow('any other action', 'Post')
  })

  it('provides `can` and `cannot` methods to check abilities', async () => {
    ability = AbilityBuilder.define(can => can('read', 'Post'), { async: true })

    await expect(ability.can('read', 'Post')).to.become(true)
    await expect(ability.cannot('read', 'Post')).to.become(false)
  })

  it('lists all rules', () => {
    ability = AsyncAbilityBuilder.define((can, cannot) => {
      can('crud', 'all')
      can('learn', 'Range')
      cannot('read', 'String')
      cannot('read', 'Hash')
      cannot('preview', 'Array')
    })

    expect(ability.rules).to.deep.equal([
      { actions: 'crud', subject: ['all'] },
      { actions: 'learn', subject: ['Range'] },
      { actions: 'read', subject: ['String'], inverted: true },
      { actions: 'read', subject: ['Hash'], inverted: true },
      { actions: 'preview', subject: ['Array'], inverted: true },
    ])
  })


  it('allows to specify multiple actions and match any', async () => {
    ability = AsyncAbilityBuilder.define(can => can(['read', 'update'], 'Post'))

    await expect(ability).to.allow('read', 'Post')
    await expect(ability).to.allow('update', 'Post')
  })

  it('allows to specify multiple subjects and match any', async () => {
    ability = AsyncAbilityBuilder.define(can => can('read', ['Post', 'User']))

    await expect(ability).to.allow('read', 'Post')
    await expect(ability).to.allow('read', 'User')
  })

  it('allows to update rules', async () => {
    ability = AsyncAbilityBuilder.define(can => can('read', ['Post', 'User']))
    ability.update([])

    expect(ability.rules).to.be.empty
    await expect(ability).not.to.allow('read', 'Post')
    await expect(ability).not.to.allow('read', 'User')
  })

  describe('by default', () => {
    beforeEach(() => {
      ability = AsyncAbilityBuilder.define((can, cannot) => {
        can(['read', 'update'], 'Post')
        can('delete', 'Post', { creator: 'admin' })
        cannot('publish', 'Post')
      })
    })

    it('allows to perform specified actions on target instance', async () => {
      await expect(ability).to.allow('read', new Post())
      await expect(ability).to.allow('update', new Post())
    })

    it('allows to perform specified actions on target type', async () => {
      await expect(ability).to.allow('read', 'Post')
      await expect(ability).to.allow('update','Post')
    })

    it('disallows to perform unspecified action on target', async () => {
      await expect(ability).not.to.allow('archive', 'Post')
      await expect(ability).not.to.allow('archive', new Post())
    })

    it('disallows to perform action if action or/and target is falsy', async () => {
      await expect(ability).not.to.allow(null, 'Post')
      await expect(ability).not.to.allow('read', null)
    })

    it('disallows to perform action on unspecified target type', async () => {
      await expect(ability).not.to.allow('read', 'User')
    })

    it('allows to perform action if target type matches at least 1 rule with or without conditions', async () => {
      await expect(ability).to.allow('delete', 'Post')
    })

    it('allows to perform action if target instance matches conditions', async () => {
      await expect(ability).to.allow('delete', new Post({ creator: 'admin' }))
    })

    it('disallows to perform action if target instance does not match conditions', async () => {
      await expect(ability).not.to.allow('delete', new Post({ creator: 'user' }))
    })

    it('disallows to perform action for inverted rule when checks by subject type', async () => {
      await expect(ability).not.to.allow('publish', 'Post')
    })

    describe('`throwUnlessCan` method', () => {
      it('raises forbidden exception on disallowed action', async () => {
        await expect(ability.throwUnlessCan('archive', 'Post')).to.be.rejectedWith(ForbiddenError)
      })

      it('does not raise forbidden exception on allowed action', async () => {
        await expect(ability.throwUnlessCan('read', 'Post')).to.be.fulfilled
      })

      it('raises error with context information', async () => {
        let error = new Error('No error raised');

        try {
          await ability.throwUnlessCan('archive', 'Post')
        } catch (abilityError) {
          error = abilityError
        }

        expect(error).to.have.property('action').that.equal('archive')
        expect(error).to.have.property('subject').that.equal('Post')
        expect(error).to.have.property('subjectName').that.equal('Post')
      })

      it('raises error with message provided in `reason` field of forbidden rule', async () => {
        const NO_CARD_MESSAGE = 'No credit card provided'
        const ability = AsyncAbilityBuilder.define((can, cannot) => {
          cannot('update', 'Post').because(NO_CARD_MESSAGE)
        })

        await expect(ability.throwUnlessCan('update', 'Post')).to.be.rejectedWith(NO_CARD_MESSAGE)
      })
    })

    describe('`update` method', () => {
      let updateHandler

      beforeEach(() => {
        updateHandler = sinon.spy()
      })

      it('triggers "update" event', () => {
        const rules = []
        ability.on('update', updateHandler)
        ability.update(rules)

        expect(updateHandler).to.have.been.calledWith({ ability, rules })
      })

      it('triggers "updated" event after rules have been updated', () => {
        const rules = []
        ability.on('updated', updateHandler)
        ability.update(rules)

        expect(updateHandler).to.have.been.calledWith({ ability, rules })
      })

      it('allows to remove subscription to "update" event', () => {
        const unsubscribe = ability.on('update', updateHandler)
        unsubscribe()
        ability.update([])

        expect(updateHandler).not.to.have.been.called
      })

      it('does not remove 2nd subscription when unsubscribe called 2 times', () => {
        const anotherHandler = sinon.spy()
        const unsubscribe = ability.on('update', updateHandler)

        ability.on('update', anotherHandler)
        unsubscribe()
        unsubscribe()
        ability.update([])

        expect(updateHandler).not.to.have.been.called
        expect(anotherHandler).to.have.been.called
      })

      it('invokes all subscribers even if they are changed during "emit" phase', () => {
        const firstSubscription = setupListenerChangesInListener()
        const secondSubscription = setupListenerChangesInListener()

        ability.update([])

        expect(firstSubscription).to.have.been.called
        expect(secondSubscription).to.have.been.called
      })

      it('warns if ability contains only inverted rules', () => {
        sinon.spy(console, 'warn')
        ability.update([{ inverted: true, action: 'read', subject: 'Post' }])

        expect(console.warn).to.have.been.calledOnce
      })

      function setupListenerChangesInListener() {
        const unsubscribe = sinon.spy(ability.on('update', function listen() {
          unsubscribe()
          ability.on('update', listen)
        }))

        return unsubscribe
      }
    })
  })

  describe('rule precedence', () => {
    it('checks every rule using logical OR operator (the order matters!)', async () => {
      ability = AsyncAbilityBuilder.define(can => {
        can('delete', 'Post', { creator: 'me' })
        // can('delete', 'Post', { sharedWith: 'me' })
        can('delete', 'Post', (post) => ['me'].includes(post.sharedWith))
      })

      await expect(ability).to.allow('delete', new Post({ creator: 'me' }))
      await expect(ability).to.allow('delete', new Post({ sharedWith: 'me' }))
      await expect(ability).not.to.allow('delete', new Post({ creator: 'you' }))
    })

    it('checks rules in inverse order', async () => {
      ability = AsyncAbilityBuilder.define((can, cannot) => {
        can('delete', 'Post', { creator: 'me' })
        cannot('delete', 'Post', { archived: true })
      })

      await expect(ability).not.to.allow('delete', new Post({ creator: 'me', archived: true }))
      await expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('shadows rule with conditions by the same rule without conditions', async () => {
      ability = AsyncAbilityBuilder.define(can => {
        can('crud', 'Post')
        can('delete', 'Post', { creator: 'me' })
      })

      await expect(ability).to.allow('delete', new Post({ creator: 'someoneelse' }))
      await expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('does not shadow rule with conditions by the same rule if the last one is disallowed by `cannot`', async () => {
      ability = AsyncAbilityBuilder.define((can, cannot) => {
        can('crud', 'Post')
        cannot('delete', 'Post')
        can('delete', 'Post', { creator: 'me' })
      })

      await expect(ability).not.to.allow('delete', new Post({ creator: 'someoneelse' }))
      await expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('shadows inverted rule by regular one', async () => {
      ability = AsyncAbilityBuilder.define((can, cannot) => {
        cannot('delete', 'Post', { creator: 'me' })
        can('crud', 'Post', { creator: 'me' })
      })

      await expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('shadows `all` subject rule by specific one', async () => {
      ability = AsyncAbilityBuilder.define((can, cannot) => {
        can('delete', 'all')
        cannot('delete', 'Post')
      })

      await expect(ability).not.to.allow('delete', 'Post')
      await expect(ability).to.allow('delete', 'User')
    })
  })


  describe('rule conditions', () => {
    it('allows to use equality conditions', async () => {
      ability = AsyncAbilityBuilder.define(can => {
        can('read', 'Post', { creator: 'me' })
      })

      await expect(ability).to.allow('read', new Post({ creator: 'me' }))
      await expect(ability).not.to.allow('read', new Post({ creator: 'someoneelse' }))
    })

    it('allows to use dynamic conditions', async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

      ability = AsyncAbilityBuilder.define((can, cannot) => {
        can('read', 'Post', (post) => wait().then(() => ['me', 'you'].includes(post.creator)))
        cannot('read', 'Post', (post) => wait().then(() => post.private))
        can('edit', 'Post', ['title', 'content'], (post) => wait().then(() => !post.published))
      })

      await expect(ability).to.allow('read', new Post({ creator: 'me' }))
      await expect(ability).not.to.allow('read', new Post({ creator: 'someoneelse' }))
      await expect(ability).not.to.allow('read', new Post({ private: true }))

      await expect(ability).to.allow('edit', new Post({ private: true, published: false }), 'title')
      await expect(ability).not.to.allow('edit', new Post({ private: true, published: true }), 'title')
    })
  })

})
