export function isObject(value: any) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.getPrototypeOf({})
}

export function wrapArray(value: any) {
  return Array.isArray(value) ? value : [value];
}

export function getSubjectName(subject: any): string {
  if (!subject || typeof subject === 'string') {
    return subject;
  }

  const Type = typeof subject === 'object' ? subject.constructor : subject;

  return Type.modelName || Type.name as string;
}

export function clone(object: any) {
  return JSON.parse(JSON.stringify(object));
}
