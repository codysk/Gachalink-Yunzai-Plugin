import fetch from 'node-fetch'
import querystring from 'node:querystring'
import crypto from 'node:crypto'
import GsCfg from '../../genshin/model/gsCfg.js'
import lodash from 'lodash'

const CLIENT_VERSION='2.40.1'
const CLIENT_TYPE='2'
const CLIENT_SALT='fdv0fY9My9eA7MR0NpjGP9RjueFvjUSQ'

export default class GachaLink {
    constructor (e = {}) {
        this.e = e
        this.userId = e?.user_id
        this.model = 'GachaLink'
        this._path = process.cwd().replace(/\\/g, '/')
        this.cookieObj = this.getMainCookieObj()
    }

    getMainCookieObj() {
        let cookieObjs = GsCfg.getBingCkSingle(this.userId)
        let mainCookie = lodash.pickBy(cookieObjs, (obj) => {
            return obj.isMain
        })
        if (Object.keys(mainCookie).length == 0) {
            return {}
        }
        return mainCookie[Object.keys(mainCookie)[0]]
    }
    
    getHeader(cookie) {
        let t = Math.floor(Date.now() / 1000).toString()
        let r = Math.random().toString(36).slice(2,8)
        // m = md5(`salt=${CLIENT_SALT}&t=${t}&r=${r}`.encode()).hexdigest()
        let m = crypto.createHash('md5').update(`salt=${CLIENT_SALT}&t=${t}&r=${r}`).digest('hex')
        let headers = {
            "cookie": cookie,
            "ds": `${t},${r},${m}`,
            "host": "api-takumi.mihoyo.com",
            "referer": "https://app.mihoyo.com",
            "user-agent": "okhttp/4.8.0",
            "x-rpc-app_version": CLIENT_VERSION,
            "x-rpc-channel": "mihoyo",
            "x-rpc-client_type": CLIENT_TYPE,
            "x-rpc-device_id": Math.random().toString(36).slice(2,12).toUpperCase(),
            "x-rpc-device_model": "SM-977N",
            "x-rpc-device_name": "Samsung SM-G977N",
            "x-rpc-sys_version": "12",
            "content-type": "application/json; charset=UTF-8"
        }
        return headers
    }

    async getRole(stoken) {
        let api='https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByStoken'
        let headers = this.getHeader(this.cookieObj.ck + stoken)
        let resp = await fetch(api, {method: 'GET', headers: headers})
        let ret = await resp.json()
        if (ret.retcode != 0) {
            throw Error("获取用户失败，可能是cookie/stoken已经失效")
        }
        // logger.info((ret)
        let roles = lodash.filter(ret.data.list, {"game_biz": "hk4e_cn"})
        if (roles.length == 0) {
            throw Error("未找到天空岛游戏角色")
        }
        return roles[0]
    }

    async generateAuthKey(role, stoken) {
        let data = {
            "auth_appid": "webview_gacha",
            "game_biz": role["game_biz"],
            "game_uid": role["game_uid"],
            "region": role["region"],
        }
        let headers = this.getHeader(this.cookieObj.ck + stoken)
        let api = "https://api-takumi.mihoyo.com/binding/api/genAuthKey"
        let resp = await fetch(api, {method: "POST", headers: headers, body: JSON.stringify(data)})
        let ret = await resp.json()
        // logger.info(ret)
        if (ret.retcode != 0) {
            throw Error("authkey 生成失败，cookie/stoken 可能已经失效")
        }
        return ret.data.authkey
    }
    async generateGachaLink(stoken) {
        let role = await this.getRole(stoken)
        let authKey = await this.generateAuthKey(role, stoken)
        let querys = {
            "authkey_ver": "1",
            "sign_type": "2",
            "auth_appid": "webview_gacha",
            "init_type": "200",
            "gacha_id": "fecafa7b6560db5f3182222395d88aaa6aaac1bc",
            "timestamp": Math.floor(Date.now() / 1000).toString(),
            "lang": "zh-cn",
            "device_type": "mobile",
            "plat_type": "android",
            "region": role["region"],
            "authkey": authKey,
            "game_biz": role["game_biz"],
            "gacha_type": "301",
            "page": "1",
            "size": "6",
            "end_id": 0,
        }
        let apibaseUrl = "https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog"
        let queryStr = querystring.stringify(querys)
        let apiUrl = apibaseUrl + '?' + queryStr
        return apiUrl
    }

}