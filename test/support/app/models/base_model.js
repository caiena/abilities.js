
let UID = 0
function uid() {
  return UID++
}


class BaseModel {
  constructor(attrs) {
    Object.assign(this, attrs)

    if (this.id == null) this.id = uid()
  }
}


export { BaseModel }
