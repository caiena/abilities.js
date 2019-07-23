// expects "chai" to be defined globally

chai.use((_chai, utils) => {

  chai.Assertion.addMethod('allow', function allow(action, subject, field) {
    const subjectRepresantation = prettifyObject(subject)
    const fieldRepresentation = field ? ` (field: ${field})` : ''

    let ability = this._obj
    let can = this._obj.can(action, subject, field)

    if (can.then && typeof can.then === 'function') {
      // then we resolve the promise and assert it (async)
      return can.then((result) => {
        this.assert(
          result,
          `expected ability to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`,
          `expected ability not to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`
        )
      })
    } else {
      // or we assert it right away (sync)
      this.assert(
        can,
        `expected ability to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`,
        `expected ability not to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`
      )
    }
  })

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
