import {
  Reservation,
  Slot,
  Student,
  SubjectTeacher,
  Teacher,
} from '../../models.js'
import { dateRuFormatter } from '../../constants.js'
import SubjectService from '../../services/SubjectService.js'
import ReservationService from '../../services/ReservationService.js'
import SlotService from '../../services/SlotService.js'
import SubjectTeacherService from '../../services/SubjectTeacherService.js'
import TeacherService from '../../services/TeacherService.js'
import {
  bot_student,
  bot_teacher,
  inputSlotData,
  setInputSlotData,
  setTimes,
  times,
} from '../../index.js'

class CallbackQueries {
  async handleSubject(ctx, subjectIdString) {
    const subjectId = Number(subjectIdString)
    const teachers = await TeacherService.getTeachersBySubjectId(subjectId)
    const subject = await SubjectService.getSubjectById(subjectId)

    await ctx.reply(' 📘 Предмет: ' + subject.name)

    teachers.map((teacher) => {
      const description = teacher.description
        ? teacher.description
        : 'У пользователя нет описания'
      const price = teacher.price ? teacher.price : 'Уточните у репетитора'
      ctx.reply(teacher.name + '\n' + description + '\nСтоимость: ' + price, {
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
    const { name, fullDescription } = await Teacher.findByPk(teacherId)

    const subjectId = Number(value2)
    const subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(
      subjectId,
      teacherId,
    )

    ctx.reply(
      `${name}\n${
        fullDescription ? fullDescription : 'У пользователя нет описания'
      }`,
      {
        reply_markup: {
          inline_keyboard: SubjectTeacherService.getSubjectTeacherKeyboard(
            subjectTeacher.id,
          ),
        },
      },
    )
  }

  async handleBookLesson(ctx, subjectTeacherId) {
    ctx.reply('Дни недели', {
      reply_markup: {
        inline_keyboard: await SlotService.generateNotExistDaysWeekKeyboard(
          subjectTeacherId,
        ),
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

  async handleTime(ctx, value, userId) {
    const slotId = Number(value)

    if (!userId) {
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

    await ReservationService.createReservation(slotId, userId, 'offline')

    ctx.reply('Ваша заявка отправлена!')
  }

  async handleCancelReservation(ctx, value) {
    await ReservationService.deleteReservation(Number(value))
    ctx.reply('Заявка отменена')
  }

  async handleCreateSlotForm(ctx, date) {
    setInputSlotData(date)

    ctx.reply(`Заявка на ${date}\nВведите время начала и конца занятия в формате:
10:00-11:30`)
  }

  async handleChooseSubjectAndCreateSlot(ctx, subjectIdString, userId) {
    const subjectId = Number(subjectIdString)

    if (!times || !inputSlotData) {
      ctx.reply('Вы уже создали занятие')
      setTimes(null)
      setInputSlotData(null)
      return
    }

    let subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(
      subjectId,
      userId,
    )
    if (!subjectTeacher) {
      await SubjectTeacherService.createSubjectTeacher(subjectId, userId)
      subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(
        subjectId,
        userId,
      )
    }

    await SlotService.createSlot(
      times,
      new Date(inputSlotData),
      subjectTeacher.id,
    )

    ctx.reply('Слот создан')

    setTimes(null)
    setInputSlotData(null)
  }

  async handleDeleteSlot(ctx, slotId) {
    if (!slotId) return ctx.reply('Вы не выбрали слот')
    await SlotService.deleteSlot(Number(slotId))
    ctx.reply('Слот удален')
  }

  async approveReservation(ctx, reservationId) {
    const reservation = await Reservation.findByPk(Number(reservationId), {
      raw: true,
      nest: true,
      include: [
        Student,
        {
          model: Slot,
          include: [
            {
              model: SubjectTeacher,
              include: [Teacher],
            },
          ],
        },
      ],
    })

    reservation.approved = true

    await Reservation.update(reservation, {
      where: {
        id: reservation.id,
      },
    })
    // await ctx.deleteMessage()
    ctx.reply('Заявка успешно принята')
    await bot_student.telegram.sendMessage(
      reservation.Student.id,
      `@${reservation.Slot.SubjectTeacher.Teacher.username} принял у вас заявку\nНа время: ${reservation.Slot.startTime}:${reservation.Slot.endTime}, ${reservation.Slot.date}`,
    )
  }

  async cancelReservation(ctx, reservationId) {
    const reservation = await Reservation.findByPk(Number(reservationId), {
      raw: true,
      nest: true,
      include: [
        Student,
        {
          model: Slot,
          include: [
            {
              model: SubjectTeacher,
              include: [Teacher],
            },
          ],
        },
      ],
    })

    if (!reservation) {
      ctx.reply('Заявка уже отклонена')
      return
    }

    Reservation.destroy({
      where: {
        id: reservation.id,
      },
    })

    bot_student.telegram.sendMessage(
      reservation.Student.id,
      `@${reservation.Slot.SubjectTeacher.Teacher.username} отклонил у вас заявку\nНа время: ${reservation.Slot.startTime}:${reservation.Slot.endTime}, ${reservation.Slot.date}`,
    )

    ctx.reply('Заявка успешно отклонена')
  }
}

export default new CallbackQueries()
