import TeacherService from './TeacherService.js'
import StudentService from './StudentService.js'

class AuthService {
  async authUser(chatId, name, role, username) {
    console.log('username------', username)
    const userByRole = {
      STUDENT: async () => await StudentService.getStudentByTelegramId(chatId),
      TEACHER: async () => await TeacherService.getTeacherByTelegramId(chatId),
    }

    if (!(role in userByRole)) throw new Error(`Роль ${role} не найдена`)
    const studentOrTeacher = await userByRole[role]()

    if (studentOrTeacher !== null) {
      return {
        role,
        ...studentOrTeacher,
      }
    }

    const createUserByRole = {
      TEACHER: async () =>
        await TeacherService.createTeacher({ id: chatId, name, username }),
      STUDENT: async () =>
        await StudentService.createStudent({ id: chatId, name, username }),
    }
    const createdUser = await createUserByRole[role]()
    console.log('AuthService --- createdUser ----', createdUser)
    return {
      role,
      ...createdUser.dataValues,
    }
  }
}

export default new AuthService()
