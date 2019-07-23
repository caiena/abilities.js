// expects "chai" to be defined globally

chai.use((_chai, utils) => {

  // checkout https://github.com/domenic/chai-as-promised/issues/156

  // usage:
  //
  // - simple
  // ```js
  // await expect(ability).to.asyncAllow('modify', 'Post')
  // await expect(ability).to.asyncAllow('modify', 'Post', 'title')
  // ````
  // - realistic
  // ```js
  // let ability = ...
  // let post = new Post({ private: false })
  // await expect(ability).not.to.asyncAllow('modify', post)
  // await expect(ability).not.to.asyncAllow('modify', post, 'title')
  // ```
  //
  chai.Assertion.addMethod('asyncAllow', async function(action, subject, field) {
    const subjectRepresantation = prettifyObject(subject)
    const fieldRepresentation = field ? ` (field: ${field})` : ''

    let ability = this._obj
    let can = await ability.can(action, subject, field)

    this.assert(
      can,
      `expected ability to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`,
      `expected ability not to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`
    );
  });

})

function prettifyObject(object) {
  if (!object || typeof object === 'string') {
    return object;
  }

  if (typeof object === 'function') {
    return object.name;
  }

  const attrs = JSON.stringify(object);
  return `${object.constructor.name} { ${attrs[0] === '{' ? attrs.slice(1, -1) : attrs} }`
}
