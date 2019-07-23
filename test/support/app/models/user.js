// import _      from '@caiena/lodash-ext'
// import moment from 'moment'

import { BaseModel }  from './base_model'
// import Purchase from './purchase'


class User extends BaseModel {

  // attrs:
  // - id: Number
  // - name: string
  // - roles: string[]
  // - disabledAt: string (date ISO format)


  // methods
  // ----
  get disabled() {
    return !!this.disabledAt
  }


  disable() {
    this.disabledAt = (new Date()).toISOString()
  }

  enable() {
    this.disabledAt = null
  }
}


export { User }
