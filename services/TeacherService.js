import {SubjectTeacher, Teacher} from '../models.js'

class TeacherService {
    async getTeacherByTelegramId(telegramId) {
        return await Teacher.findOne({
            where: {
                telegramId,
            },
        })
    }

    async getTeachersBySubjectId(subjectId) {
        const teachers = await Teacher.findAll({
            raw: false,
            nest: true,
            include: [
                {
                    model: SubjectTeacher,
                    where: {
                        subjectId,
                    },
                },
            ],
        })

        return teachers
    }

    getTeacherKeyboard(teacherId, subjectId) {
        return [
            [
                {
                    text: 'Подробнее',
                    callback_data: ['teacher', teacherId, subjectId].join(':'),
                },
            ],
        ]
    }

    async createTeacher(teacher) {
        return Teacher.create(teacher, {
            raw: false,
            nest: true,
        })
    }
}

export default new TeacherService()
