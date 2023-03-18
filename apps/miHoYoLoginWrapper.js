import plugin from '../../../lib/plugins/plugin.js'

export class miHoYoLoginWrapper extends plugin {
    constructor() {
        super({
            name: "米哈游登录",
            dsc: "米哈游登录",
            event: "message",
            priority: 9,
            rule: [
                {
                    reg: "^#?(米哈?游社?登录|登录米哈?游社?) ",
                    event: "message.private",
                    fnc: "contextWrapper"
                },
                {
                    reg: "^#?(米哈?游社?登录|登录米哈?游社?)$",
                    event: "message.private",
                    fnc: "wrapper"
                }
            ]
        })
        this.wrappedKey = `${this.constructor.name}Wrapped`
    }
    async wrapper() {
        if (this.wrappedKey in this.e && this.e[this.wrappedKey]) {
            return false
        }
        this.e[this.wrappedKey] = true
        var originReplay = this.e.replyNew.bind(this.e)
        this.e.reply = async (content, quote = false) => {
            if (/^(ltoken|stoken)=/.test(content)) {
                var {reply, msg, ...messageEvent} = this.e
                messageEvent.message=[{type: 'text', text: content}]
                await global.Bot.tripAsync("message", messageEvent)
            }
            return originReplay(content, quote = false)
        }
        this.e.msg = ""
        await global.Bot.tripAsync("message", this.e)
        return true
    }
    async contextWrapper() {
        this.e.reply("账号密码暂不支持")
        return true
    }
}