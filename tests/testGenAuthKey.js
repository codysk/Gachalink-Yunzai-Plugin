import GachaLink from '../model/gachalink.js'

let gModel = new GachaLink({"user_id": process.env.QQ})
let role = await gModel.getRole(process.env.STOKEN)
gModel.generateAuthKey(role, process.env.STOKEN)