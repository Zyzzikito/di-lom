import { SubjectTeacher } from '../models.js'

class SubjectTeacherService {
  async getSubjectTeacherId(subjectId, teacherId) {
    return await SubjectTeacher.findOne({
      where: {
        subjectId,
        teacherId,
      },
    })
  }

  getSubjectTeacherKeyboard(subjectTeacherId) {
    return [
      [
        {
          text: 'Записаться на урок',
          callback_data: ['book_lesson', subjectTeacherId].join(':'),
        },
      ],
    ]
  }

  async createSubjectTeacher(subjectId, teacherId) {
    const response = await SubjectTeacher.create({
      subjectId,
      teacherId,
    })
    return response.dataValues
  }
}

export default new SubjectTeacherService()
