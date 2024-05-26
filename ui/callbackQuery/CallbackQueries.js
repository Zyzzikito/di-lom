import {Teacher} from '../../models.js'
import {dateRuFormatter} from '../../constants.js'
import SubjectService from '../../services/SubjectService.js'
import ReservationService from '../../services/ReservationService.js'
import SlotService from '../../services/SlotService.js'
import SubjectTeacherService from '../../services/SubjectTeacherService.js'
import TeacherService from '../../services/TeacherService.js'
import {inputSlotData, setInputSlotData, setTimes, times, user} from '../../index.js'

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
        const {name, fullDescription} =
            await Teacher.findByPk(teacherId)

        const subjectId = Number(value2)
        const subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(
            subjectId,
            teacherId,
        )

        ctx.reply(`${name}\n${fullDescription}`, {
            reply_markup: {
                inline_keyboard: SubjectTeacherService.getSubjectTeacherKeyboard(
                    subjectTeacher.id,
                ),
            },
        })
    }

    async handleBookLesson(ctx, subjectTeacherId) {
        ctx.reply('Дни недели', {
            reply_markup: {
                inline_keyboard: await SlotService.generateNotExistDaysWeekKeyboard(subjectTeacherId),
            },
        })
    }

    async handleDayWeek(ctx, value, value2) {
        const [month, day, year] = value.split('/')
        const reservations = await ReservationService.getAllReservations()

        const avaliableSlots = await SlotService.getAvaliableSlots(
            Number(value2),
            {year, day, month},
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

    async handleCreateSlotForm(ctx, date) {
        setInputSlotData(date)
        ctx.reply(`Заявка на ${date}\nВведите время начала и конца занятия в формате:
10:00-11:30`)
    }

    async handleChooseSubjectAndCreateSlot(ctx, subjectIdString) {
        const subjectId = Number(subjectIdString)

        if (!times || !inputSlotData) {
            ctx.reply('Вы уже создали занятие')
            setTimes(null)
            setInputSlotData(null)
            return;
        }

        let subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(subjectId, user.id)
        if (!subjectTeacher) {
            await SubjectTeacherService.createSubjectTeacher(subjectId, user.id)
            subjectTeacher = await SubjectTeacherService.getSubjectTeacherId(subjectId, user.id)
        }

        await SlotService.createSlot(times, new Date(inputSlotData), subjectTeacher.id)

        ctx.reply('Слот создан')

        setTimes(null)
        setInputSlotData(null)
    }

    async handleDeleteSlot(ctx, slotId) {
        if (!slotId) return ctx.reply('Вы не выбрали слот')
        await SlotService.deleteSlot(Number(slotId))
        ctx.reply('Слот удален')
    }
}

export default new CallbackQueries()
