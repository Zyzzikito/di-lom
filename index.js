import {initDatabase} from './database.js'
import {Telegraf} from 'telegraf'
import {commandsStudent, commandsTeacher} from './constants/commands.js'
import CallbackQueries from './ui/callbackQuery/CallbackQueries.js'
import CommandsStudent from './ui/commands/CommandsStudent.js'
import dotenv from 'dotenv'
import {Student} from './models.js'
import StudentService from './services/StudentService.js'
import CommandsTeacher from "./ui/commands/CommandsTeacher.js";
import SlotService from "./services/SlotService.js";

dotenv.config()

const TOKEN_STUDENT = process.env.TOKEN_STUDENT
const TOKEN_TEACHER = process.env.TOKEN_TEACHER

initDatabase()

export let user = null
export let isInputSlot = false

export const setIsInputSlot = (value) => {
    isInputSlot = value
}

const authUser = async (msg, role) => {
    if (user === null) {
        const telegramId = msg.message.chat.id

        const student = await StudentService.getStudentByTelegramId(telegramId)

        console.log(JSON.stringify(msg.message, null, 2))

        if (student) {
            user = {
                role: role,
                ...student,
            }
            return
        }
        const newStudent = {
            name: msg.message.chat.first_name,
            telegramId,
        }

        const createdStudent = await Student.create(newStudent)
        user = {
            role: role,
            ...createdStudent,
        }
    }
}

const bot_student = new Telegraf(TOKEN_STUDENT, {})

bot_student.telegram.setMyCommands(commandsStudent)

bot_student.command('school_subject', async (ctx) => {
    await authUser(ctx, "STUDENT")
    await CommandsStudent.handleSchoolSubject(ctx)
})
bot_student.command('reservations', async (ctx) => {
    try {
        await authUser(ctx, "STUDENT")
        await CommandsStudent.handleReservations(ctx)
    } catch (e) {
        console.error(e)
        ctx.answerCbQuery('Error occurred. Please try again.')
    }
})
bot_student.on('message', async (ctx) => {
    try {
        await authUser(ctx, "STUDENT")
        await CommandsStudent.handleWelcome(ctx)
    } catch (e) {
        console.error(e)
        ctx.answerCbQuery('Error occurred. Please try again.')
    }
})

bot_student.on('callback_query', async (ctx) => {
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

bot_student.launch()


// TEACHER

const bot_teacher = new Telegraf(TOKEN_TEACHER, {})

bot_teacher.command('cancel', async (ctx) => {
    await authUser(ctx, "STUDENT")
    setIsInputSlot(false)
})
bot_teacher.command('create_slot', async (ctx) => {
    await authUser(ctx, "STUDENT")
    await CommandsTeacher.handleCreateSlot(ctx)
})

bot_teacher.on('message', async (ctx) => {
    try {
        await authUser(ctx, "TEACHER")
        if (isInputSlot) {
            if (!SlotService.validateSlotString(ctx.message.text)) {
                return ctx.reply('Формат слота неправильный. Попробуйте еще раз.\nДля выхода напиши: /cancel')
            }
            setIsInputSlot(false)
            await SlotService.createSlot(ctx.message.text)
            ctx.reply("Слот успешно добавлен!")
            return;
        }
        await CommandsTeacher.handleWelcome(ctx)
    } catch (e) {
        console.error(e)
        ctx.answerCbQuery('Error occurred. Please try again.')
    }
})

bot_teacher.telegram.setMyCommands(commandsTeacher)
bot_teacher.on('callback_query', async (ctx) => {
    try {
        const data = ctx.callbackQuery.data
        const [key, ...values] = data.split(':')

        const handlers = {
            create_slot_form: CallbackQueries.handleCreateSlotForm,
        }
        const handler = handlers[key]
        await handler(ctx, ...values)

        ctx.answerCbQuery()
    } catch (e) {
        console.error(e)
        ctx.answerCbQuery('Error occurred. Please try again.')
    }
})


bot_teacher.launch()