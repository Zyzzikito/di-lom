import {commandsTeacher} from '../../constants/commands.js'
import {welcomeText} from './../../constants/welcome.js'
import {getCommandsText} from './../../helpers/getCommandsText.js'
import {generateDaysWeekKeyboard} from "../../helpers/generateDaysWeekKeyboard.js";

class CommandsTeacher {
    async handleWelcome(ctx) {
        ctx.reply(`${welcomeText}\n${getCommandsText(commandsTeacher)}`)
    }

    async handleCreateSlot(ctx) {
        const formatter = new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        ctx.reply('Выберите день недели', {
            reply_markup: {
                inline_keyboard: generateDaysWeekKeyboard((date) => ["create_slot_form", formatter.format(date)])
            }
        })
    }
}

export default new CommandsTeacher()
