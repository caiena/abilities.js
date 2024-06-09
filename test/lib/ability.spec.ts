import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AbilityBuilder, ForbiddenError, Ability, Rule } from "@/lib"
import { afterEach } from 'node:test'


class Post {
  constructor(attrs = {}) {
    Object.assign(this, attrs)
  }
}


afterEach(() => {
    vi.restoreAllMocks()
})


describe('Ability', () => {
  let ability: Ability | undefined

  it('allows to add alias for actions', () => {
    Ability.addAlias('modify', ['update', 'delete'])
    ability = AbilityBuilder.define((can) => {
      can('modify', 'Post')
    })

    expect(ability.can("modify", "Post")).toBe(true)
  })

  it('allows deeply nested aliased actions', () => {
    Ability.addAlias('sort', 'increment')
    Ability.addAlias('modify', ['sort'])
    ability = AbilityBuilder.define(can => can('modify', 'all'))

    expect(ability.can('increment', 123)).toBe(true)
  })

  it('throws exception when trying to define `manage` alias', () => {
    expect(() => Ability.addAlias('manage', 'crud')).toThrow(Error)
  })

  it('throws exception when trying to make `manage` a part of aliased action', () => {
    expect(() => Ability.addAlias('modify', ['crud', 'manage'])).toThrow(Error)
  })

  it('throws exception when trying to alias action to itself', () => {
    expect(() => Ability.addAlias('sort', 'sort')).toThrow(Error)
    expect(() => Ability.addAlias('sort', ['order', 'sort'])).toThrow(Error)
  })

  it('provides predefined `crud` alias for `create`, `read`, `update` and `delete` actions', () => {
    ability = AbilityBuilder.define(can => can('crud', 'Post'))

    expect(ability.can('crud', 'Post')).toBe(true)
    expect(ability.can('create', 'Post')).toBe(true)
    expect(ability.can('read', 'Post')).toBe(true)
    expect(ability.can('update', 'Post')).toBe(true)
    expect(ability.can('delete', 'Post')).toBe(true)

    expect(ability.can('any other action', 'Post')).toBe(false)
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

    expect(ability.rules).toMatchObject([
      { actions: ['crud'], subject: ['all'] },
      { actions: ['learn'], subject: ['Range'] },
      { actions: ['read'], subject: ['String'], inverted: true },
      { actions: ['read'], subject: ['Hash'], inverted: true },
      { actions: ['preview'], subject: ['Array'], inverted: true },
    ])
  })

  it('allows to specify multiple actions and match any', () => {
    ability = AbilityBuilder.define(can => can(['read', 'update'], 'Post'))

    expect(ability.can('read', 'Post')).toBe(true)
    expect(ability.can('update', 'Post')).toBe(true)
  })

  it('allows to specify multiple subjects and match any', () => {
    ability = AbilityBuilder.define(can => can('read', ['Post', 'User']))

    expect(ability.can('read', 'Post')).toBe(true)
    expect(ability.can('read', 'User')).toBe(true)
  })

  it('allows to update rules', () => {
    ability = AbilityBuilder.define(can => can('read', ['Post', 'User']))

    expect(ability.can('read', 'Post')).toBe(true)

    ability.update([])

    expect(ability.rules).to.be.empty
    expect(ability.can('read', 'Post')).toBe(false)
    expect(ability.can('read', 'User')).toBe(false)
  })

  describe('by default', () => {
    let ability = AbilityBuilder.define((can, cannot) => {
      can(['read', 'update'], 'Post')
      can('delete', 'Post', { condition: { creator: 'admin' } })
      cannot('publish', 'Post')
    })

    it('allows to perform specified actions on target instance', () => {
      expect(ability!.can('read', new Post())).toBe(true)
      expect(ability!.can('update', new Post())).toBe(true)
    })

    it('allows to perform specified actions on target type', () => {
      expect(ability!.can('read', 'Post')).toBe(true)
      expect(ability!.can('update','Post')).toBe(true)
    })

    it('disallows to perform unspecified action on target', () => {
      expect(ability!.can('archive', 'Post')).toBe(false)
      expect(ability!.can('archive', new Post())).toBe(false)
    })

    it('disallows to perform action if action or/and target is falsy', () => {
      expect(ability!.can("", 'Post')).toBe(false)
      expect(ability!.can('read', null)).toBe(false)
    })

    it('disallows to perform action on unspecified target type', () => {
      expect(ability.can('read', 'User')).toBe(false)
    })

    it('allows to perform action if target type matches at least 1 rule with or without conditions', () => {
      expect(ability.can('delete', 'Post')).toBe(true)
    })

    it('allows to perform action if target instance matches conditions', () => {
      expect(ability.can('delete', new Post({ creator: 'admin' }))).toBe(true)
    })

    it('disallows to perform action if target instance does not match conditions', () => {
      expect(ability.can('delete', new Post({ creator: 'user' }))).toBe(false)
    })

    it('disallows to perform action for inverted rule when checks by subject type', () => {
      expect(ability.can('publish', 'Post')).toBe(false)
    })

    describe('`throwUnlessCan` method', () => {
      it('raises forbidden exception on disallowed action', () => {
        expect(() => ability.throwUnlessCan('archive', 'Post')).toThrow(ForbiddenError)
      })

      it('does not raise forbidden exception on allowed action', () => {
        expect(() => ability.throwUnlessCan('read', 'Post')).not.toThrow(Error)
      })

      it('raises error with context information', () => {
        let error = new Error('No error raised');

        try {
          ability.throwUnlessCan('archive', 'Post')
        } catch (abilityError) {
          error = abilityError as ForbiddenError
        }

        expect(error).to.have.property('action').that.equal('archive')
        expect(error).to.have.property('subject').that.equal('Post')
        expect(error).to.have.property('subjectName').that.equal('Post')
      })

      it('raises error with message provided in `reason` field of forbidden rule', () => {
        const NO_CARD_MESSAGE = 'No credit card provided'
        const ability = AbilityBuilder.define((can, cannot) => {
          // cannot('update', 'Post').because(NO_CARD_MESSAGE)
          cannot('update', 'Post', { reason: NO_CARD_MESSAGE })
        })

        expect(() => ability.throwUnlessCan('update', 'Post')).toThrow(NO_CARD_MESSAGE)
      })
    })

    describe('`update` method', () => {
      let updateHandler: (payload: any) => void

      beforeEach(() => {
        updateHandler = vi.fn() // sinon.spy()
      })

      it('triggers "update" event', () => {
        const rules = [] as Rule[]
        ability.on('update', updateHandler)
        ability.update(rules)

        expect(updateHandler).toHaveBeenCalledWith({ ability, rules })
      })

      it('triggers "updated" event after rules have been updated', () => {
        const rules = [] as Rule[]
        ability.on('updated', updateHandler)
        ability.update(rules)

        expect(updateHandler).toHaveBeenCalledWith({ ability, rules })
      })

      it('allows to remove subscription to "update" event', () => {
        const unsubscribe = ability.on('update', updateHandler)
        unsubscribe()
        ability.update([])

        expect(updateHandler).not.toHaveBeenCalled
      })

      it('does not remove 2nd subscription when unsubscribe called 2 times', () => {
        const anotherHandler = vi.fn()
        const unsubscribe = ability.on('update', updateHandler)

        ability.on('update', anotherHandler)
        unsubscribe()
        unsubscribe()
        ability.update([])

        expect(updateHandler).not.toHaveBeenCalled
        expect(anotherHandler).toHaveBeenCalled
      })

      it('invokes all subscribers even if they are changed during "emit" phase', () => {
        const firstSubscription = setupListenerChangesInListener()
        const secondSubscription = setupListenerChangesInListener()

        ability.update([])

        expect(firstSubscription).toHaveBeenCalled
        expect(secondSubscription).toHaveBeenCalled
      })

      function setupListenerChangesInListener() {
        const unsubscribe = vi.fn(
          ability.on('update', function listen() {
            unsubscribe()
            ability.on('update', listen)
          })
        )

        return unsubscribe
      }
    })
  })

  describe('rule precedence', () => {
    it('checks every rule using logical OR operator (the order matters!)', () => {
      ability = AbilityBuilder.define((can) => {
        can('delete', 'Post', { condition: { creator: 'me' } })
        // can('delete', 'Post', { sharedWith: 'me' })
        can('delete', 'Post', { condition: (post) => ['me'].includes(post.sharedWith) })
      })

      console.log(ability.can('delete', new Post({ creator: 'me' })))
      expect(ability.can('delete', new Post({ creator: 'me' }))).toBe(true)
      expect(ability.can('delete', new Post({ creator: 'someone' }))).toBe(false)
      expect(ability.can('delete', new Post({ sharedWith: 'me' }))).toBe(true)
      expect(ability.can('delete', new Post({ sharedWith: 'someone' }))).toBe(false)
    })

    it('checks rules in inverse order', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('delete', 'Post', { condition: { creator: 'me' } })
        cannot('delete', 'Post', { condition: { archived: true } })
      })

      expect(ability.can('delete', new Post({ creator: 'me', archived: true }))).toBe(false)
      expect(ability.can('delete', new Post({ creator: 'me' }))).toBe(true)
    })

    it('shadows rule with conditions by the same rule without conditions', () => {
      ability = AbilityBuilder.define(can => {
        can('crud', 'Post')
        can('delete', 'Post', { condition: { creator: 'me' } })
      })

      expect(ability.can('delete', new Post({ creator: 'someoneelse' }))).toBe(true)
      expect(ability.can('delete', new Post({ creator: 'me' }))).toBe(true)
    })

    it('does not shadow rule with conditions by the same rule if the last one is disallowed by `cannot`', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('crud', 'Post')
        cannot('delete', 'Post')
        can('delete', 'Post', { condition: { creator: 'me' } })
      })

      expect(ability.can('delete', new Post({ creator: 'someoneelse' }))).toBe(false)
      expect(ability.can('delete', new Post({ creator: 'me' }))).toBe(true)
    })

    it('shadows inverted rule by regular one', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        cannot('delete', 'Post', { condition: { creator: 'me' } })
        can('crud', 'Post', { condition: { creator: 'me' } })
      })

      expect(ability.can('delete', new Post({ creator: 'me' }))).toBe(true)
      expect(ability.can('delete', new Post({ creator: 'someone' }))).toBe(false)
    })

    it('shadows `all` subject rule by specific one', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('delete', 'all')
        cannot('delete', 'Post')
      })

      expect(ability.can('delete', 'Post')).toBe(false)
      expect(ability.can('delete', 'User')).toBe(true)
    })
  })

  describe('rule conditions', () => {
    it('allows to use equality conditions', () => {
      ability = AbilityBuilder.define(can => {
        can('read', 'Post', { condition: { creator: 'me' } })
      })

      expect(ability.can('read', new Post({ creator: 'me' }))).toBe(true)
      expect(ability.can('read', new Post({ creator: 'someoneelse' }))).toBe(false)
    })

    it('allows to use dynamic conditions', () => {
      ability = AbilityBuilder.define((can, cannot) => {
        can('read', 'Post', { condition: (post) => ['me', 'you'].includes(post.creator) })
        cannot('read', 'Post', { condition: (post) => post.private })
        // can('edit', 'Post', ['title', 'content'], { published: false })
      })

      expect(ability.can('read', new Post({ creator: 'me' }))).toBe(true)
      expect(ability.can('read', new Post({ creator: 'someoneelse' }))).toBe(false)
      expect(ability.can('read', new Post({ private: true }))).toBe(false)

      // expect(ability.can('edit', new Post({ private: true, published: false }), 'title')).toBe(true)
      // expect(ability.can('edit', new Post({ private: true, published: true }), 'title')).toBe(false)
    })
  })
})
