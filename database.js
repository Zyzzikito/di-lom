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
  Slot.hasMany(Reservation)

  Reservation.belongsTo(Student, { foreignKey: 'studentId' })

  // insertRows()
}

export const insertRows = () => {
  sequelize
    .sync({ force: true }) // Sync models with database

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

      const teachers = []

      const subjectTeachers = []

      const slots = []

      const students = []

      const reservations = []

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
