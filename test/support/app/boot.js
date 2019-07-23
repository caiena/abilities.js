// a "boot" script - entrypoint
import _        from '@caiena/lodash-ext'
import { i18n, translations } from '@caiena/i18n'
import Model    from '../../../src/model'

import appTranslations from './config/i18n/translations'

import Admin from './models/admin'
import Purchase from './models/purchase'
import Photo from './models/photo'
import User from './models/user'


// initializing i18n
i18n.init({
  locales:       ['pt-BR', 'en-US'],
  defaultLocale: 'pt-BR',
  translations:  _.merge({}, translations, appTranslations)
})


// we're providing a default $lookupModel() using a global variable "mapping" all models.
const $models = {
  Admin,
  Purchase,
  Photo,
  User
}

// exporting globally
global.$models = $models


// overriding the lookup method
_.assign(Model, {
  $lookupModel(nameOrPath) {
    return _.get($models, nameOrPath)
  }
})


export { $models }
