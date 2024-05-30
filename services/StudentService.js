import { Student } from '../models.js'

class StudentService {
  async getStudentByTelegramId(telegramId) {
    return await Student.findByPk(telegramId)
  }

  async createStudent(student) {
    return Student.create(student)
  }
}

export default new StudentService()
