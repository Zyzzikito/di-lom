import { initDatabase } from './database.js'
import { Telegraf } from 'telegraf'
import { commandsStudent, commandsTeacher } from './constants/commands.js'
import CallbackQueries from './ui/callbackQuery/CallbackQueries.js'
import CommandsStudent from './ui/commands/CommandsStudent.js'
import dotenv from 'dotenv'
import StudentService from './services/StudentService.js'
import CommandsTeacher from './ui/commands/CommandsTeacher.js'
import SlotService from './services/SlotService.js'
import SubjectService from './services/SubjectService.js'
import TeacherService from './services/TeacherService.js'
import AuthService from './services/AuthService.js'

dotenv.config()

const TOKEN_STUDENT = process.env.TOKEN_STUDENT
const TOKEN_TEACHER = process.env.TOKEN_TEACHER

initDatabase()

export let inputSlotData = null
export let times = null

export let setTimes = (data) => {
  if (data === null) return (times = null)
  times = data.split('-')
}

export const setInputSlotData = (data) => {
  inputSlotData = data
}

const bot_student = new Telegraf(TOKEN_STUDENT, {})

bot_student.telegram.setMyCommands(commandsStudent)

bot_student.command('school_subject', async (ctx) => {
  await CommandsStudent.handleSchoolSubject(ctx)
})
bot_student.command('reservations', async (ctx) => {
  try {
    await CommandsStudent.handleReservations(ctx)
  } catch (e) {
    console.error(e)
  }
})
bot_student.on('message', async (ctx) => {
  try {
    await CommandsStudent.handleWelcome(ctx)
  } catch (e) {
    console.error(e)
  }
})

bot_student.on('callback_query', async (ctx) => {
  const user = await AuthService.authUser(
    ctx.chat.id,
    ctx.chat.first_name,
    'STUDENT',
  )

  try {
    const data = ctx.callbackQuery.data
    const [key, ...values] = data.split(':')

    const handlers = {
      subject: CallbackQueries.handleSubject,
      teacher: CallbackQueries.handleTeacher,
      book_lesson: CallbackQueries.handleBookLesson,
      day_week: CallbackQueries.handleDayWeek,
      time: (ctx, value) => CallbackQueries.handleTime(ctx, value, user.id),
      cancel_reservation: CallbackQueries.handleCancelReservation,
    }
    const handler = handlers[key]
    await handler(ctx, ...values)

    ctx.answerCbQuery()
  } catch (e) {
    console.error(e)
  }
})

bot_student.launch()

// TEACHER

const bot_teacher = new Telegraf(TOKEN_TEACHER, {})

bot_teacher.command('cancel', async (ctx) => {
  setInputSlotData(null)
})
bot_teacher.command('create_slot', async (ctx) => {
  await CommandsTeacher.handleCreateSlot(ctx)
})
bot_teacher.command('my_slots', async (ctx) => {
  const user = await AuthService.authUser(
    ctx.chat.id,
    ctx.chat.first_name,
    'TEACHER',
  )
  if (!user.id) return ctx.reply('Вы не авторизованы')
  await CommandsTeacher.handleMySlots(ctx, user.id)
})

bot_teacher.on('message', async (ctx) => {
  try {
    if (inputSlotData !== null) {
      if (!SlotService.validateSlotString(ctx.message.text)) {
        return ctx.reply(
          'Формат слота неправильный. Попробуйте еще раз.\nДля выхода напиши: /cancel',
        )
      }
      const subjectsKeyboard = await SubjectService.getSubjectsKeyboard(
        'choose_subject_and_create_slot',
      )
      setTimes(ctx.message.text)

      ctx.reply('Выберите предмет', {
        reply_markup: {
          inline_keyboard: subjectsKeyboard,
        },
      })
      return
    }
    await CommandsTeacher.handleWelcome(ctx)
  } catch (e) {
    console.error(e)
  }
})

bot_teacher.telegram.setMyCommands(commandsTeacher)
bot_teacher.on('callback_query', async (ctx) => {
  try {
    const user = await AuthService.authUser(
      ctx.chat.id,
      ctx.chat.first_name,
      'TEACHER',
    )

    const data = ctx.callbackQuery.data
    const [key, ...values] = data.split(':')

    const handlers = {
      create_slot_form: CallbackQueries.handleCreateSlotForm,
      choose_subject_and_create_slot: (ctx, subjectTeacherId) =>
        CallbackQueries.handleChooseSubjectAndCreateSlot(
          ctx,
          subjectTeacherId,
          user.id,
        ),
      delete_slot: CallbackQueries.handleDeleteSlot,
      toggle_reservation: CallbackQueries.toggleReservation,
    }
    const handler = handlers[key]
    console.log(handler)
    await handler(ctx, ...values)

    ctx.answerCbQuery()
  } catch (e) {
    console.error(e)
  }
})

bot_teacher.launch()
