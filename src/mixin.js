// @see https://github.com/Vincit/objection.js/blob/2f7dd232aec1b1b3d880d10e75b169af2554ea91/lib/utils/mixin.js
import _ from '@caiena/lodash-ext'


function mixin(Class, mixins) {
  return mixins.reduce((MixedClass, Mixin) => Mixin(MixedClass), Class)
}


export default mixin
