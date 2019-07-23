import { BaseModel } from './base_model'


class Purchase extends BaseModel {

  // attrs:
  // - id: Number
  // - name: string
  // - createdById: Number (User#id)
  // - approvedAt: string (date ISO format)
  // - approvedById: Number (User#id)


  get approved() {
    return !!this.approvedAt
  }


  create({ user } = {}) {
    this.createdById = user.id
  }

  approve({ user } = {}) {
    this.approvedAt = (new Date()).toISOString()
    this.approvedById = user.id
  }

}


export { Purchase }
