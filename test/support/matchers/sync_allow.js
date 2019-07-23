// expects "chai" to be defined globally

chai.use((_chai, utils) => {

  chai.Assertion.addMethod('syncAllow', function(action, subject, field) {
    const subjectRepresantation = prettifyObject(subject)
    const fieldRepresentation = field ? ` (field: ${field})` : ''
    this.assert(
      this._obj.can(action, subject, field),
      `expected ability to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`,
      `expected ability not to allow ${action}${fieldRepresentation} on ${subjectRepresantation}`
    )
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
