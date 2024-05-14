import { commands } from '../../constants/commands.js'
import ReservationService from '../../services/ReservationService.js'
import SubjectService from '../../services/SubjectService.js'
import { welcomeText } from './../../constants/welcome.js'
import { getCommandsText } from './../../helpers/getCommandsText.js'

class Commands {
  async handleSchoolSubject(ctx) {
    const keyboard = await SubjectService.getSubjectsKeyboard()

    ctx.reply('Выберите предмет:', {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    })
  }

  async handleReservations(ctx) {
    await ctx.reply('Все заявки:')

    const reservations =
      await ReservationService.getReservationsWithSubjectTeacher()

    if (reservations.length === 0) ctx.reply('Заявок нет')

    reservations.forEach((reservation) => {
      const fullDescription =
        ReservationService.getReservationDescription(reservation)

      ctx.reply(fullDescription, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: ReservationService.getReservationKeyboard(
            reservation.id,
          ),
        },
      })
    })
  }

  async handleWelcome(ctx) {
    ctx.reply(`${welcomeText}adfn\n${getCommandsText(commands)}`)
  }
}

export default new Commands()
