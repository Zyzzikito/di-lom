import {initDatabase} from './database.js'
import {Telegraf} from 'telegraf'
import {commandsStudent, commandsTeacher} from './constants/commands.js'
import CallbackQueries from './ui/callbackQuery/CallbackQueries.js'
import CommandsStudent from './ui/commands/CommandsStudent.js'
import dotenv from 'dotenv'
import StudentService from './services/StudentService.js'
import CommandsTeacher from "./ui/commands/CommandsTeacher.js";
import SlotService from "./services/SlotService.js";
import SubjectService from "./services/SubjectService.js";
import TeacherService from "./services/TeacherService.js";

dotenv.config()

const TOKEN_STUDENT = process.env.TOKEN_STUDENT
const TOKEN_TEACHER = process.env.TOKEN_TEACHER

initDatabase()

export let user = null
export let inputSlotData = null
export let times = null

export let setTimes = (data) => {
    if (data === null) return times = null
    times = data.split("-")
}

export const setInputSlotData = (data) => {
    inputSlotData = data
}

const authUser = async (msg, role) => {
    if (user === null) {
        const telegramId = msg.message.chat.id

        let client = null

        if (role === "STUDENT") client = await StudentService.getStudentByTelegramId(telegramId)
        if (role === "TEACHER") client = await TeacherService.getTeacherByTelegramId(telegramId)

        if (client)
            return user = {
                role: role,
                ...client,
            }

        const newTeacher = {
            name: msg.message.chat.first_name,
            telegramId,
        }

        let createdClient = null

        console.log("------------------------------", newTeacher)

        if (role === "STUDENT") createdClient = await StudentService.createStudent(newTeacher)
        if (role === "TEACHER") createdClient = await TeacherService.createTeacher({
            ...newTeacher,
            description: "",
            fullDescription: "",
            format: "",
        }, {})

        user = {
            role: role,
            ...createdClient,
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
    await authUser(ctx, "TEACHER")
    setInputSlotData(null)
})
bot_teacher.command('create_slot', async (ctx) => {
    await authUser(ctx, "TEACHER")
    await CommandsTeacher.handleCreateSlot(ctx)
})

bot_teacher.on('message', async (ctx) => {
    try {
        await authUser(ctx, "TEACHER")
        if (inputSlotData !== null) {
            if (!SlotService.validateSlotString(ctx.message.text)) {
                return ctx.reply('Формат слота неправильный. Попробуйте еще раз.\nДля выхода напиши: /cancel')
            }
            const subjectsKeyboard = await SubjectService.getSubjectsKeyboard('choose_subject_and_create_slot')
            setTimes(ctx.message.text)

            ctx.reply("Выберите предмет", {
                reply_markup: {
                    inline_keyboard: subjectsKeyboard,
                }
            })
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
            choose_subject_and_create_slot: CallbackQueries.handleChooseSubjectAndCreateSlot,
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