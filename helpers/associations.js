import {
  Reservation,
  Slot,
  Student,
  Subject,
  SubjectTeacher,
  Teacher,
} from '../models.js'

export const getAssiciations = () => {
  Subject.hasMany(SubjectTeacher, { foreignKey: 'subjectId' })
  Teacher.hasMany(SubjectTeacher, { foreignKey: 'teacherId' })
  SubjectTeacher.belongsTo(Subject, { foreignKey: 'subjectId' })
  SubjectTeacher.belongsTo(Teacher, { foreignKey: 'teacherId' })
  Slot.belongsTo(SubjectTeacher, { foreignKey: 'subjectTeacherId' })
  Reservation.belongsTo(Slot, { foreignKey: 'slotId' })
  Reservation.belongsTo(Student, { foreignKey: 'studentId' })
}
