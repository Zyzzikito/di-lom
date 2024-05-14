import {initDatabase} from "./database.js";
import {Telegraf} from "telegraf";
import {Reservation, sequelize, Slot, Student, Subject, SubjectTeacher, Teacher,} from "./models.js";
import {generateDaysWeekKeyboard} from "./generate-days-week-keyboard.js";
import {dateRuFormatter} from "./constants.js";
import {Op} from "sequelize";
// const TOKEN = "7185054995:AAGWu8MRHmiPFdXwo8QJErf87zhr5eOxjXM";
const TOKEN = "6810110321:AAHqZrowFdcW52HY6VrrawhnWXBThQFDGJI";

initDatabase();

let user = null;

const authStudent = async (msg) => {
    if (user === null) {
        const telegramId = msg.message.chat.id;

        const student = await Student.findOne({
            where: {
                telegramId,
            },
        });

        console.log(student)

        if (student) {
            user = {
                role: "STUDENT",
                ...student,
            };
            return;
        }
        const newStudent = {
            name: "Иван",
            surname: "Иванов",
            patronymic: "Иванович",
            telegramId,
        };

        const createdStudent = await Student.create(newStudent);
        user = {
            role: "STUDENT",
            ...createdStudent,
        };
    }
};

const bot = new Telegraf(TOKEN, {});
const commands = [
    {
        command: "reservations",
        description: "Посмотреть список бронирований",
    },
    {
        command: "school_subject",
        description: "Посмотреть список предметов",
    },
]

bot.telegram.setMyCommands(commands);
bot.command("school_subject", async (ctx) => {
    await authStudent(ctx);
    const subjects = await Subject.findAll();

    const keyboard = subjects.map(({id, name}) => {
        return [{text: name, callback_data: "subject:" + id}];
    });

    ctx.reply("Выберите предмет:", {
        reply_markup: {
            inline_keyboard: keyboard,
        },
    });
});
bot.command("reservations", async (ctx) => {
    await authStudent(ctx);

    const reservations = await Reservation.findAll({
        raw: true,
        nest: true,
        order: [["approved", "DESC"]],
        include: [{
            model: Slot,
            include: [{
                model: SubjectTeacher,
                include: [{
                    model: Subject,
                    attributes: ['name']
                }, {
                    model: Teacher,
                    attributes: ['name', 'surname', 'patronymic']
                }]
            }]
        }]
    })

    await ctx.reply("Все заявки:")


    reservations.forEach((reservation) => {
        const slot = reservation.Slot;
        const subjectTeacher = slot.SubjectTeacher;
        const subject = subjectTeacher.Subject;
        const teacher = subjectTeacher.Teacher;
        const fullDescription = `<b>Репетитор:</b> ${teacher.name} ${teacher.surname} ${teacher.patronymic}\n<b>Предмет:</b> ${subject.name}\n<b>Дата:</b> ${dateRuFormatter.format(reservation.date)} \n<b>Время:</b> ${slot.startTime} - ${slot.endTime}\n\n${reservation.approved ? "Принята" : "Не принята"}`;
        ctx.reply(fullDescription, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [[{
                    text: "Отмена",
                    callback_data: "cancel_reservation:" + reservation.id
                }]]
            }
        })
    })
})
bot.on("message", async (msg) => {
    await authStudent(msg);

    msg.reply(`ПРИВЕЕЕТ 😊 

Я - бот для бронирования репетиторов 🤖. Если вам нужна помощь в выборе репетитора или бронировании занятий, я готов помочь 🤝. 

Пожалуйста, выберите интересующий вас вариант:
 🔹 Бронировать репетитора 📅;
 🔹 Получить список доступных репетиторов 👥;
 🔹 Узнать стоимость занятий 💸

Выберите один из вариантов, и я помогу вам в бронировании репетитора или ответлю на ваши вопросы 🤔.

${commands.map((command) => {
        return `/${command.command} - ${command.description}`;
    }).join("\n")
    }
`);
});

bot.on("callback_query", async (ctx) => {
    const data = ctx.callbackQuery.data;

    const [key, value, value2] = data.split(":");
    console.log(key, value, value2);

    switch (key) {
        case "subject":
            try {
                const teachers = await Teacher.findAll({
                    raw: false,
                    nest: true,
                    include: [
                        {
                            model: SubjectTeacher,
                            where: {
                                subjectId: Number(value),
                            },
                        },
                    ],
                });
                const {name, id} = await Subject.findByPk(Number(value));

                await ctx.reply(" 📘 Предмет: " + name);

                teachers.map((teacher) => {
                    ctx.reply(teacher.name + "\n" + teacher.description, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "Подробнее",
                                        callback_data: ["teacher", teacher.id, id].join(":"),
                                    },
                                ],
                            ],
                        },
                    });
                });
            } catch (e) {
                console.error(e);
            }

            break;
        case "teacher": {
            const teacherId = Number(value);
            const {name, surname, patronymic, fullDescription} =
                await Teacher.findByPk(teacherId);

            const subjectId = Number(value2);
            const subjectTeacher = await SubjectTeacher.findOne({
                where: {
                    subjectId,
                    teacherId,
                },
            });

            ctx.reply(`${surname} ${name} ${patronymic}\n${fullDescription}`, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Записаться на урок",
                                callback_data: ["book_lesson", subjectTeacher.id].join(":"),
                            },
                        ],
                    ],
                },
            });
            break;
        }
        case "book_lesson":
            ctx.reply("Дни недели", {
                reply_markup: {
                    inline_keyboard: generateDaysWeekKeyboard(value),
                },
            });
            break;
        case "day_week": {
            const [month, day, year] = value.split("/");
            const reservations = await Reservation.findAll({
                attributes: [
                    [sequelize.fn("DISTINCT", sequelize.col("slotId")), "slotId"],
                ],
            });
            const avaliableSlots = await Slot.findAll({
                where: {
                    subjectTeacherId: Number(value2),
                    date: [year, month, day].join("-"),
                    id: {
                        [Op.notIn]: reservations.map((row) => row.slotId),
                    },
                },
            });

            if (avaliableSlots.length === 0) {
                ctx.reply("Доступных слотов нет");
                break;
            }

            ctx.reply(
                "Выберите время на " + dateRuFormatter.format(new Date(value)),
                {
                    reply_markup: {
                        inline_keyboard: [
                            ...avaliableSlots.map((slot) => [
                                {
                                    text: [slot.startTime, slot.endTime].join("-"),
                                    callback_data: `time:${slot.id}`,
                                },
                            ]),
                        ],
                    },
                }
            );
            break;
        }
        case "time":
            const slotId = Number(value);

            if (!user) {
                ctx.reply("Вы не авторизованы");
                break;
            }

            const alreadyReserved = await Reservation.findOne({
                where: {
                    slotId: slotId,
                }
            })

            if (alreadyReserved) {
                ctx.reply("Вы уже забронировали это время");
                break
            }

            await Reservation.create({
                slotId,
                format: 'offline',
                studentId: user.id,
                approved: false,
            })

            ctx.reply("Ваша заявка отправлена!");

            break;

        case "cancel_reservation":
            await Reservation.destroy({
                where: {
                    id: Number(value),
                },
            });
            ctx.reply("Заявка отменена");
            break;
    }

    ctx.answerCbQuery();
});

bot.launch();
