import plugin from '../../../lib/plugins/plugin.js'
import GachaLink from '../model/gachalink.js'
import lodash from 'lodash'
const CACHE_BASEKEY = "Yz::plugin::gachalink"
export class gachaLink extends plugin {
    constructor (e) {
        super({
            name: '祈愿链接',
            dsc: '祈愿链接',
            event: 'message.private',
            priority: 250,
            rule: [
                {
                    reg: '^stoken=(.*)',
                    fnc: 'setSToken',
                },
                {
                    reg: '^#*(获取)*(祈愿|抽卡)(链接|数据)$',
                    fnc: 'genGachaLink'
                }
            ]
        })
        this.GachaLink = null
    }
    async setSToken() {
        if (this.e.isGroup) {
            await this.reply('请私聊发送SToken', false, { at: true })
            return true
        }
        this.GachaLink = new GachaLink(this.e)
        let rawStr = this.e.msg
        let fragments = rawStr.split(';')
        let params = {
            "stoken": "",
            "stuid":"",
            "mid":""
        }
        lodash.forEach(fragments, (frag) => {
            let kvPair = frag.trim().split('=')
            if (kvPair.length < 2) return
            kvPair[1] = kvPair.slice(1).join('=')
            if (!Object.keys(params).includes(kvPair[0])) return
            params[kvPair[0]] = kvPair[1]
        })

        let isValid = true
        lodash.forEach(params, (value) => {
            if (value == "") isValid = false
        })
        if (!isValid) {
            await this.reply("SToken 不完整")
            return true
        }

        let stoken = ""
        lodash.forEach(params, (value, key) => {
            stoken += `${key}=${value};`
        })
        await this.tryToGenerateGachaLink(stoken)
    }
    async genGachaLink() {
        this.GachaLink = new GachaLink(this.e)
        let stoken = await  redis.get(`${CACHE_BASEKEY}::SToken::${this.GachaLink.cookieObj.uid}`)
        if (lodash.isEmpty(stoken)) {
            await this.reply("SToken 已经失效，请发送 #米游社登录 重新获取SToken")
            this.e.msg = "#米游社登录"
            return true
        }
        await this.tryToGenerateGachaLink(stoken)
    }

    async tryToGenerateGachaLink(stoken) {
        try {
            let apiUrl = await this.GachaLink.generateGachaLink(stoken)
            await this.reply(`生成成功: ${apiUrl}`)
           
            // republish the gacha link to event loop
            var {reply, ...messageEvent} = this.e
            messageEvent.message=[{type: 'text', text: apiUrl}]
            await global.Bot.tripAsync("message", messageEvent)
            return true
        } catch (err) {
            await this.reply(err.message)
            return true
        }
    }
}