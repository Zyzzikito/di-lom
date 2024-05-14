import { Subject } from '../models.js'

class SubjectService {
  async getSubjectsKeyboard() {
    const subjects = await Subject.findAll()

    console.log('--------------------')
    console.log(subjects)

    const keyboard = subjects.map(({ id, name }) => {
      return [{ text: name, callback_data: 'subject:' + id }]
    })

    return keyboard
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
