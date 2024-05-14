import { initDatabase } from './database.js'
import { Telegraf } from 'telegraf'
import { commands } from './constants/commands.js'
import CallbackQueries from './ui/callbackQuery/CallbackQueries.js'
import Commands from './ui/commands/Commands.js'
import dotenv from 'dotenv'
import { Student } from './models.js'
import StudentService from './services/StudentService.js'
dotenv.config()

const TOKEN = process.env.TOKEN

initDatabase()

export let user = null

const authStudent = async (msg) => {
  if (user === null) {
    const telegramId = msg.message.chat.id

    const student = await StudentService.getStudentByTelegramId(telegramId)

    if (student) {
      user = {
        role: 'STUDENT',
        ...student,
      }
      return
    }
    const newStudent = {
      name: 'Иван',
      surname: 'Иванов',
      patronymic: 'Иванович',
      telegramId,
    }

    const createdStudent = await Student.create(newStudent)
    user = {
      role: 'STUDENT',
      ...createdStudent,
    }
  }
}

const bot = new Telegraf(TOKEN, {})

bot.telegram.setMyCommands(commands)

bot.command('school_subject', async (ctx) => {
  await authStudent(ctx)
  await Commands.handleSchoolSubject(ctx)
})
bot.command('reservations', async (ctx) => {
  try {
    await authStudent(ctx)
    await Commands.handleReservations(ctx)
  } catch (e) {
    console.error(e)
    ctx.answerCbQuery('Error occurred. Please try again.')
  }
})
bot.on('message', async (ctx) => {
  try {
    await authStudent(ctx)
    await Commands.handleWelcome(ctx)
  } catch (e) {
    console.error(e)
    ctx.answerCbQuery('Error occurred. Please try again.')
  }
})

bot.on('callback_query', async (ctx) => {
  try {
    const data = ctx.callbackQuery.data
    const [key, ...values] = data.split(':')

    const handlers = {
      subject: CallbackQueries.handleSubject,
      teacher: CallbackQueries.handleTeacher,
      book_lesson: CallbackQueries.handleBookLesson,
      day_week: CallbackQueries.handleDayWeek,
      time: CallbackQueries.handleTime,
      cancel_reservation: CallbackQueries.handleCancelReservation,
    }
    const handler = handlers[key]
    await handler(ctx, ...values)

    ctx.answerCbQuery()
  } catch (e) {
    console.error(e)
    ctx.answerCbQuery('Error occurred. Please try again.')
  }
})

bot.launch()
