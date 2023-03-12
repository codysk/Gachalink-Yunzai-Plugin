import GachaLink from '../model/gachalink.js'

let gModel = new GachaLink({"user_id": process.env.QQ})
gModel.getRole(process.env.STOKEN)