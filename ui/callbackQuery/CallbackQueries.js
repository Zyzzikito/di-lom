import { Teacher } from '../../models.js'
import { generateDaysWeekKeyboard } from '../../generate-days-week-keyboard.js'
import { dateRuFormatter } from '../../constants.js'
import SubjectService from '../../services/SubjectService.js'
import ReservationService from '../../services/ReservationService.js'
import SlotService from '../../services/SlotService.js'
import SubjectTeacherService from '../../services/SubjectTeacherService.js'
import TeacherService from '../../services/TeacherService.js'
import { user } from '../../index.js'

class CallbackQueries {
  async handleSubject(ctx, subjectIdString) {
    const subjectId = Number(subjectIdString)
    const teachers = await TeacherService.getTeachersBySubjectId(subjectId)
    const subject = await SubjectService.getSubjectById(subjectId)

    await ctx.reply(' 📘 Предмет: ' + subject.name)

    teachers.map((teacher) => {
      ctx.reply(teacher.name + '\n' + teacher.description, {
        reply_markup: {
          inline_keyboard: TeacherService.getTeacherKeyboard(
            teacher.id,
            subject.id,
          ),
        },
      })
    })
  }

  async handleTeacher(ctx, value, value2) {
    const teacherId = Number(value)
    const { name, surname, patronymic, fullDescription } =
      await Teacher.findByPk(teacherId)

    const subjectId = Number(value2)
    const subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(
      subjectId,
      teacherId,
    )

    ctx.reply(`${surname} ${name} ${patronymic}\n${fullDescription}`, {
      reply_markup: {
        inline_keyboard: SubjectTeacherService.getSubjectTeacherKeyboard(
          subjectTeacher.id,
        ),
      },
    })
  }

  async handleBookLesson(ctx, value) {
    ctx.reply('Дни недели', {
      reply_markup: {
        inline_keyboard: generateDaysWeekKeyboard(value),
      },
    })
  }

  async handleDayWeek(ctx, value, value2) {
    const [month, day, year] = value.split('/')
    const reservations = await ReservationService.getAllReservations()

    const avaliableSlots = await SlotService.getAvaliableSlots(
      Number(value2),
      { year, day, month },
      reservations,
    )

    const errors = SlotService.validateAvaliableSlots(avaliableSlots)

    if (errors.length !== 0) {
      errors.forEach((er) => ctx.reply(er))
      return
    }

    ctx.reply('Выберите время на ' + dateRuFormatter.format(new Date(value)), {
      reply_markup: {
        inline_keyboard: SlotService.getAvaliableSlotsKeyboard(avaliableSlots),
      },
    })
  }

  async handleTime(ctx, value) {
    const slotId = Number(value)

    if (!user) {
      ctx.reply('Вы не авторизованы')
      return
    }

    const alreadyReserved = await ReservationService.getIsAlreadyReserved(
      slotId,
    )

    if (alreadyReserved) {
      ctx.reply('Вы уже забронировали это время')
      return
    }

    await ReservationService.createReservation(slotId, user.id, 'offline')

    ctx.reply('Ваша заявка отправлена!')
  }

  async handleCancelReservation(ctx, value) {
    await ReservationService.deleteReservation(Number(value))
    ctx.reply('Заявка отменена')
  }
}

export default new CallbackQueries()
