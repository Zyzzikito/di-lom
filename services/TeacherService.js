import { SubjectTeacher, Teacher } from '../models.js'

class TeacherService {
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
}

export default new TeacherService()
