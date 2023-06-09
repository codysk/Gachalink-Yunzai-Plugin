import redisInit from '../../../lib/config/redis.js'
import GachaLink from '../model/gachalink.js'
import setLog from '../../../lib/config/log.js'

setLog()
await redisInit()

let gModel = new GachaLink({"user_id": process.env.QQ})
let role = await gModel.getRole(process.env.STOKEN)
gModel.generateAuthKey(role, process.env.STOKEN)