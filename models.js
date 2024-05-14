import { DataTypes, Sequelize } from 'sequelize'

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  query: {
    raw: true
  }
})

export const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

export const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  patronymic: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.STRING,
  },
  fullDescription: {
    type: DataTypes.STRING,
  },
  format: {
    type: DataTypes.STRING,
  },
})

export const SubjectTeacher = sequelize.define('SubjectTeacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  subjectId: {
    type: DataTypes.INTEGER,
    references: {
      model: Subject,
      key: 'id',
    },
  },
  teacherId: {
    type: DataTypes.INTEGER,
    references: {
      model: Teacher,
      key: 'id',
    },
  },
})

export const Slot = sequelize.define('Slot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
  },
  subjectTeacherId: {
    type: DataTypes.INTEGER,
    references: {
      model: SubjectTeacher,
      key: 'id',
    },
  },
  date: {
    type: DataTypes.STRING,
  },
  startTime: {
    type: DataTypes.STRING,
  },
  endTime: {
    type: DataTypes.STRING,
  },
})

export const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  surname: {
    type: DataTypes.STRING,
  },
  patronymic: {
    type: DataTypes.STRING,
  },
  telegramId: {
    type: DataTypes.INTEGER,
  }
})
export const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
  },
  slotId: {
    type: DataTypes.INTEGER,
    references: {
      model: Slot,
      key: 'id',
    },
  },
  format: {
    type: DataTypes.STRING,
  },
  studentId: {
    type: DataTypes.INTEGER,
    references: {
      model: Student,
      key: 'id',
    },
  },
  approved: {
    type: DataTypes.BOOLEAN,
  }
})

// Define associations
