import { Sequelize } from 'sequelize'
import {
  Reservation,
  Slot,
  Student,
  Subject,
  SubjectTeacher,
  Teacher,
  sequelize,
} from './models.js'
import { generateSlots } from './generate-slots.js'

export const initDatabase = () => {
  Subject.hasMany(SubjectTeacher, { foreignKey: 'subjectId' })
  Teacher.hasMany(SubjectTeacher, { foreignKey: 'teacherId' })
  SubjectTeacher.belongsTo(Subject, { foreignKey: 'subjectId' })
  SubjectTeacher.belongsTo(Teacher, { foreignKey: 'teacherId' })
  Slot.belongsTo(SubjectTeacher, { foreignKey: 'subjectTeacherId' })
  Reservation.belongsTo(Slot, { foreignKey: 'slotId' })
  Reservation.belongsTo(Student, { foreignKey: 'studentId' })

  // insertRows()
}

export const insertRows = () => {
  sequelize
    .sync({ force: true })  // Sync models with database

    //   sequelize
    //     .sync({ force: true })
    //     .then(() => {
    //       console.log('Models synchronized successfully.')
    //     })
    //     .catch((error) => {
    //       console.error('Error synchronizing models:', error)
    //     })
    .then(() => {
      // Create sample data
      const subjects = [
        { name: 'Математика' },
        { name: 'Науки' },
        { name: 'Английский' },
        { name: 'Немецкий' },
      ]

      const teachers = [
        {
          name: 'Иван',
          surname: 'Иванов',
          patronymic: 'Иванович',
          description: 'Преподаватель математики',
          fullDescription:
            'Иван Иванович Иванов - преподаватель математики с 10-летним опытом.',
          format: 'онлайн',
        },
        {
          name: 'Мария',
          surname: 'Иванова',
          patronymic: 'Ивановна',
          description: 'Преподаватель английского',
          fullDescription:
            'Мария Ивановна Иванова - преподаватель английского с 5-летним опытом.',
          format: 'офлайн',
        },
        {
          name: 'Пётр',
          surname: 'Петров',
          patronymic: 'Петрович',
          description: 'Преподаватель наук',
          fullDescription:
            'Пётр Петрович Петров - преподаватель наук с 15-летним опытом.',
          format: 'онлайн',
        },
        {
          name: 'Анна',
          surname: 'Сидорова',
          patronymic: 'Сергеевна',
          description: 'Преподаватель истории',
          fullDescription:
            'Анна Сергеевна Сидорова - преподаватель истории с 8-летним опытом.',
          format: 'офлайн',
        },
        {
          name: 'Люся',
          surname: 'Балабошич',
          patronymic: 'шка',
          description: 'Преподаватель новейшей хронологии',
          fullDescription: 'Суперпреподаватель новейшей хронологии',
          format: 'онлайн',
        },
      ]

      const subjectTeachers = [
        { subjectId: 1, teacherId: 1 },
        { subjectId: 1, teacherId: 2 },
        { subjectId: 2, teacherId: 3 },
        { subjectId: 2, teacherId: 4 },
        { subjectId: 2, teacherId: 5 },
        { subjectId: 3, teacherId: 5 },
      ]

      const slots = generateSlots(teachers)
      // const slots = [
      //   {
      //     subjectTeacherId: 1,
      //     date: '2023-03-01',
      //     startTime: '09:00',
      //     endTime: '10:00',
      //   },
      //   {
      //     subjectTeacherId: 1,
      //     date: '2023-03-01',
      //     startTime: '10:00',
      //     endTime: '11:00',
      //   },
      //   {
      //     subjectTeacherId: 2,
      //     date: '2023-03-02',
      //     startTime: '09:00',
      //     endTime: '10:00',
      //   },
      // ]

      const students = [
      ]

      const reservations = [
      ]

      // Create subjects
      Subject.bulkCreate(subjects).then(() => {
        // Create teachers
        Teacher.bulkCreate(teachers).then(() => {
          // Create subject teachers
          SubjectTeacher.bulkCreate(subjectTeachers).then(() => {
            // Create slots
            Slot.bulkCreate(slots).then(() => {
              // Create students
              Student.bulkCreate(students).then(() => {
                // Create reservations
                Reservation.bulkCreate(reservations).then(() => {
                  console.log('Data populated successfully!')
                })
              })
            })
          })
        })
      })
    })
    .catch((error) => {
      console.error('Error populating data:', error)
    })
}
