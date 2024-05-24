import {Student} from '../models.js'

class StudentService {
    async getStudentByTelegramId(telegramId) {
        return await Student.findOne({
            where: {
                telegramId,
            },
        })
    }

    async createStudent(student) {
        return await Student.create(student)
    }
}

export default new StudentService()
