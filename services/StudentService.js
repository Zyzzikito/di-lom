import { Student } from '../models.js'

class StudentService {
  async getStudentByTelegramId(telegramId) {
    return await Student.findOne({
      where: {
        telegramId,
      },
    })
  }
}

export default new StudentService()
