import {Subject} from '../models.js'

class SubjectService {
    async getSubjectsKeyboard(callbackKey = 'subject') {
        const subjects = await Subject.findAll()

        return subjects.map(({id, name}) => {
            return [{text: name, callback_data: [callbackKey, id].join(':')}]
        })
    }

    async getTeacherReplyMarkup(teacherId, subjectId) {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Подробнее',
                            callback_data: ['teacher', teacherId, subjectId].join(':'),
                        },
                    ],
                ],
            },
        }
    }

    async getSubjectById(subjectId) {
        return await Subject.findByPk(subjectId)
    }
}

export default new SubjectService()
