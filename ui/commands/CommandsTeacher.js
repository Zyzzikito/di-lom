import { commandsTeacher } from '../../constants/commands.js'
import { welcomeText } from './../../constants/welcome.js'
import { getCommandsText } from './../../helpers/getCommandsText.js'
import { generateDaysWeekKeyboard } from '../../helpers/generateDaysWeekKeyboard.js'
import SlotService from '../../services/SlotService.js'

class CommandsTeacher {
  async handleWelcome(ctx) {
    ctx.reply(`${welcomeText}\n${getCommandsText(commandsTeacher)}`)
  }

  async handleCreateSlot(ctx) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

    ctx.reply('Выберите день недели', {
      reply_markup: {
        inline_keyboard: generateDaysWeekKeyboard((date) => [
          'create_slot_form',
          formatter.format(date).split('/').join('-'),
        ]),
      },
    })
  }

  async handleMySlots(ctx, userId) {
    const slots = await SlotService.getSlotsByTeacherId(userId)

    if (slots.length === 0) {
      return ctx.reply('У вас нет слотов')
    }

    slots.forEach((slot) => {
      ctx.reply(
        `Дата: ${slot.date}\nВремя: ${slot.startTime}-${
          slot.endTime
        }\nПредмет: ${slot.SubjectTeacher.Subject.name}\n\n${
          slot?.Reservations?.id
            ? '@' + slot.Reservations.Student.username + ' кинул заявку'
            : ''
        }`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Удалить',
                  callback_data: `delete_slot:${slot.id}`,
                },
              ],
              slot.Reservations.id
                ? slot.Reservations.approved
                  ? [
                      {
                        text: 'Отклонить',
                        callback_data: `cancel_reservation:${slot.Reservations.id}`,
                      },
                    ]
                  : [
                      {
                        text: 'Принять',
                        callback_data: `approve_reservation:${slot.Reservations.id}`,
                      },
                    ]
                : [],
            ],
          },
        },
      )
    })
  }
}

export default new CommandsTeacher()
