import { AbilityBuilder, ForbiddenError, Ability } from '../src'

class Post {
  constructor(attrs) {
    Object.assign(this, attrs)
  }
}


describe('Ability', () => {
  let ability

  it('allows to add alias for actions', () => {
    Ability.addAlias('modify', ['update', 'delete'])
    ability = AbilityBuilder.define(can => can('modify', 'Post'))

    expect(ability).to.allow('modify', 'Post')
  })

  it('allows deeply nested aliased actions', () => {
    Ability.addAlias('sort', 'increment')
    Ability.addAlias('modify', ['sort'])
    ability = AbilityBuilder.define(can => can('modify', 'all'))

    expect(ability).to.allow('increment', 123)
  })

  it('throws exception when trying to define `manage` alias', () => {
    expect(() => Ability.addAlias('manage', 'crud')).to.throw(Error)
  })

  it('throws exception when trying to make `manage` a part of aliased action', () => {
    expect(() => Ability.addAlias('modify', ['crud', 'manage'])).to.throw(Error)
  })

  it('throws exception when trying to alias action to itself', () => {
    expect(() => Ability.addAlias('sort', 'sort')).to.throw(Error)
    expect(() => Ability.addAlias('sort', ['order', 'sort'])).to.throw(Error)
  })

  it('provides predefined `crud` alias for `create`, `read`, `update` and `delete` actions', () => {
    ability = AbilityBuilder.define(can => can('crud', 'Post'))

    expect(ability).to.allow('crud', 'Post')
    expect(ability).to.allow('create', 'Post')
    expect(ability).to.allow('read', 'Post')
    expect(ability).to.allow('update', 'Post')
    expect(ability).to.allow('delete', 'Post')
    expect(ability).not.to.allow('any other action', 'Post')
  })

  it('provides `can` and `cannot` methods to check abilities', () => {
    ability = AbilityBuilder.define(can => can('read', 'Post'))

    expect(ability.can('read', 'Post')).to.be.true
    expect(ability.cannot('read', 'Post')).to.be.false
  })

  it('lists all rules', () => {
    ability = AbilityBuilder.define((can, cannot) => {
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

  it('allows to specify multiple actions and match any', () => {
    ability = AbilityBuilder.define(can => can(['read', 'update'], 'Post'))

    expect(ability).to.allow('read', 'Post')
    expect(ability).to.allow('update', 'Post')
  })

  it('allows to specify multiple subjects and match any', () => {
    ability = AbilityBuilder.define(can => can('read', ['Post', 'User']))

    expect(ability).to.allow('read', 'Post')
    expect(ability).to.allow('read', 'User')
  })

  it('allows to update rules', () => {
    ability = AbilityBuilder.define(can => can('read', ['Post', 'User']))

    expect(ability).to.allow('read', 'Post')

    ability.update([])

    expect(ability.rules).to.be.empty
    expect(ability).not.to.allow('read', 'Post')
    expect(ability).not.to.allow('read', 'User')
  })

  describe('by default', () => {
    beforeEach(() => {
      ability = AbilityBuilder.define((can, cannot) => {
        can(['read', 'update'], 'Post')
        can('delete', 'Post', { creator: 'admin' })
        cannot('publish', 'Post')
      })
    })

    it('allows to perform specified actions on target instance', () => {
      expect(ability).to.allow('read', new Post())
      expect(ability).to.allow('update', new Post())
    })

    it('allows to perform specified actions on target type', () => {
      expect(ability).to.allow('read', 'Post')
      expect(ability).to.allow('update','Post')
    })

    it('disallows to perform unspecified action on target', () => {
      expect(ability).not.to.allow('archive', 'Post')
      expect(ability).not.to.allow('archive', new Post())
    })

    it('disallows to perform action if action or/and target is falsy', () => {
      expect(ability).not.to.allow(null, 'Post')
      expect(ability).not.to.allow('read', null)
    })

    it('disallows to perform action on unspecified target type', () => {
      expect(ability).not.to.allow('read', 'User')
    })

    it('allows to perform action if target type matches at least 1 rule with or without conditions', () => {
      expect(ability).to.allow('delete', 'Post')
    })

    it('allows to perform action if target instance matches conditions', () => {
      expect(ability).to.allow('delete', new Post({ creator: 'admin' }))
    })

    it('disallows to perform action if target instance does not match conditions', () => {
      expect(ability).not.to.allow('delete', new Post({ creator: 'user' }))
    })

    it('disallows to perform action for inverted rule when checks by subject type', () => {
      expect(ability).not.to.allow('publish', 'Post')
    })

    describe('`throwUnlessCan` method', () => {
      it('raises forbidden exception on disallowed action', () => {
        expect(() => ability.throwUnlessCan('archive', 'Post')).to.throw(ForbiddenError)
      })

      it('does not raise forbidden exception on allowed action', () => {
        expect(() => ability.throwUnlessCan('read', 'Post')).not.to.throw(Error)
      })

      it('raises error with context information', () => {
        let error = new Error('No error raised');

        try {
          ability.throwUnlessCan('archive', 'Post')
        } catch (abilityError) {
          error = abilityError
        }

        expect(error).to.have.property('action').that.equal('archive')
        expect(error).to.have.property('subject').that.equal('Post')
        expect(error).to.have.property('subjectName').that.equal('Post')
      })

      it('raises error with message provided in `reason` field of forbidden rule', () => {
        const NO_CARD_MESSAGE = 'No credit card provided'
        const ability = AbilityBuilder.define((can, cannot) => {
          cannot('update', 'Post').because(NO_CARD_MESSAGE)
        })

        expect(() => ability.throwUnlessCan('update', 'Post')).to.throw(NO_CARD_MESSAGE)
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
    it('checks every rule using logical OR operator (the order matters!)', () => {
      ability = AbilityBuilder.define(can => {
        can('delete', 'Post', { creator: 'me' })
        // can('delete', 'Post', { sharedWith: 'me' })
        can('delete', 'Post', (post) => ['me'].includes(post.sharedWith))
      })

      expect(ability).to.allow('delete', new Post({ creator: 'me' }))
      expect(ability).to.allow('delete', new Post({ sharedWith: 'me' }))
    })

    it('checks rules in inverse order', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('delete', 'Post', { creator: 'me' })
        cannot('delete', 'Post', { archived: true })
      })

      expect(ability).not.to.allow('delete', new Post({ creator: 'me', archived: true }))
      expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('shadows rule with conditions by the same rule without conditions', () => {
      ability = AbilityBuilder.define(can => {
        can('crud', 'Post')
        can('delete', 'Post', { creator: 'me' })
      })

      expect(ability).to.allow('delete', new Post({ creator: 'someoneelse' }))
      expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('does not shadow rule with conditions by the same rule if the last one is disallowed by `cannot`', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('crud', 'Post')
        cannot('delete', 'Post')
        can('delete', 'Post', { creator: 'me' })
      })

      expect(ability).not.to.allow('delete', new Post({ creator: 'someoneelse' }))
      expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('shadows inverted rule by regular one', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        cannot('delete', 'Post', { creator: 'me' })
        can('crud', 'Post', { creator: 'me' })
      })

      expect(ability).to.allow('delete', new Post({ creator: 'me' }))
    })

    it('shadows `all` subject rule by specific one', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('delete', 'all')
        cannot('delete', 'Post')
      })

      expect(ability).not.to.allow('delete', 'Post')
      expect(ability).to.allow('delete', 'User')
    })
  })

  describe('rule conditions', () => {
    it('allows to use equality conditions', () => {
      ability = AbilityBuilder.define(can => {
        can('read', 'Post', { creator: 'me' })
      })

      expect(ability).to.allow('read', new Post({ creator: 'me' }))
      expect(ability).not.to.allow('read', new Post({ creator: 'someoneelse' }))
    })

    it('allows to use dynamic conditions', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('read', 'Post', (post) => ['me', 'you'].includes(post.creator))
        cannot('read', 'Post', (post) => post.private)
        can('edit', 'Post', ['title', 'content'], { published: false })
      })

      expect(ability).to.allow('read', new Post({ creator: 'me' }))
      expect(ability).not.to.allow('read', new Post({ creator: 'someoneelse' }))
      expect(ability).not.to.allow('read', new Post({ private: true }))

      expect(ability).to.allow('edit', new Post({ private: true, published: false }), 'title')
      expect(ability).not.to.allow('edit', new Post({ private: true, published: true }), 'title')
    })
  })
})
