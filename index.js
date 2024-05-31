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
import { Teacher } from './models.js'

dotenv.config()

const TOKEN_STUDENT = process.env.TOKEN_STUDENT
const TOKEN_TEACHER = process.env.TOKEN_TEACHER

initDatabase()

export let inputSlotData = null
export let times = null
export let isSetFullDescription = false
export let isSetShortDescription = false

export let setTimes = (data) => {
  if (data === null) return (times = null)
  times = data.split('-')
}

export const setInputSlotData = (data) => {
  inputSlotData = data
}

export const bot_student = new Telegraf(TOKEN_STUDENT, {})

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
    ctx.chat.username,
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
    await ctx.deleteMessage()

    ctx.answerCbQuery()
  } catch (e) {
    console.error(e)
  }
})

bot_student.launch()

// TEACHER

export const bot_teacher = new Telegraf(TOKEN_TEACHER, {})

bot_teacher.command('change_short_description', async (ctx) => {
  const user = await AuthService.authUser(
    ctx.chat.id,
    ctx.chat.first_name,
    'TEACHER',
    ctx.chat.username,
  )

  isSetShortDescription = true
  ctx.reply(
    `Текущее краткое описание: ${
      user.description ?? ''
    }\nВведите новое описание. \nДля отмены нажмите /cancel`,
  )
})
bot_teacher.command('change_full_description', async (ctx) => {
  const user = await AuthService.authUser(
    ctx.chat.id,
    ctx.chat.first_name,
    'TEACHER',
    ctx.chat.username,
  )

  isSetFullDescription = true
  ctx.reply(
    `Текущее полное описание: ${
      user.fullDescription ?? ''
    }\nВведите новое описание. \nДля отмены нажмите /cancel`,
  )
})
bot_teacher.command('cancel', async (ctx) => {
  setInputSlotData(null)
  isSetFullDescription = false
  isSetShortDescription = false
})
bot_teacher.command('create_slot', async (ctx) => {
  await CommandsTeacher.handleCreateSlot(ctx)
})
bot_teacher.command('my_slots', async (ctx) => {
  const user = await AuthService.authUser(
    ctx.chat.id,
    ctx.chat.first_name,
    'TEACHER',
    ctx.chat.username,
  )
  if (!user.id) return ctx.reply('Вы не авторизованы')
  await CommandsTeacher.handleMySlots(ctx, user.id)
})

bot_teacher.on('message', async (ctx) => {
  console.log(ctx.chat.username)
  try {
    if (isSetShortDescription) {
      const user = await AuthService.authUser(
        ctx.chat.id,
        ctx.chat.first_name,
        'TEACHER',
        ctx.chat.username,
      )
      const teacher = await Teacher.findByPk(user.id)
      await Teacher.update(
        { ...teacher, description: ctx.message.text },
        {
          where: {
            id: teacher.id,
          },
        },
      )
      isSetShortDescription = false
      ctx.reply('Краткое описание успешно применено')
      return
    }
    if (isSetFullDescription) {
      const user = await AuthService.authUser(
        ctx.chat.id,
        ctx.chat.first_name,
        'TEACHER',
        ctx.chat.username,
      )
      const teacher = await Teacher.findByPk(user.id)
      await Teacher.update(
        { ...teacher, fullDescription: ctx.message.text },
        {
          where: {
            id: teacher.id,
          },
        },
      )
      isSetFullDescription = false
      ctx.reply('Полное описание успешно применено')
      return
    }
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
      ctx.chat.username,
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
      approve_reservation: CallbackQueries.approveReservation,
      cancel_reservation: CallbackQueries.cancelReservation,
    }
    const handler = handlers[key]
    await handler(ctx, ...values)
    await ctx.deleteMessage()

    ctx.answerCbQuery()
  } catch (e) {
    console.error(e)
  }
})

bot_teacher.launch()
