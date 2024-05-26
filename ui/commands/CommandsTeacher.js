import {commandsTeacher} from '../../constants/commands.js'
import {welcomeText} from './../../constants/welcome.js'
import {getCommandsText} from './../../helpers/getCommandsText.js'
import {generateDaysWeekKeyboard} from "../../helpers/generateDaysWeekKeyboard.js";
import SlotService from "../../services/SlotService.js";
import {user} from "../../index.js";

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
                inline_keyboard:
                    generateDaysWeekKeyboard((date) =>
                        ["create_slot_form", formatter.format(date).split('/').join('-')]
                    )
            }
        })
    }

    async handleMySlots(ctx) {
        const slots = await SlotService.getSlotsByTeacherId(user.id)

        if (slots.length === 0) {
            return ctx.reply('У вас нет слотов')
        }
        slots.forEach(slot => {
            ctx.reply(`Дата: ${slot.date}\nВремя: ${slot.startTime}-${slot.endTime}\nПредмет: ${slot.SubjectTeacher.Subject.name}`, {
                reply_markup: {
                    inline_keyboard: [
                        [{
                            text: 'Удалить',
                            callback_data: `delete_slot:${slot.id}`
                        }]
                    ]
                }
            })
        })

    }
}

export default new CommandsTeacher()
