import { Op } from 'sequelize'
import { Slot } from '../models.js'

class SlotService {
  async getAvaliableSlots(
    subjectTeacherId,
    { year, month, day },
    reservations,
  ) {
    return await Slot.findAll({
      where: {
        subjectTeacherId,
        date: [year, month, day].join('-'),
        id: {
          [Op.notIn]: reservations.map((row) => row.slotId),
        },
      },
    })
  }

  getAvaliableSlotsKeyboard(slots) {
    return [
      ...slots.map((slot) => [
        {
          text: [slot.startTime, slot.endTime].join('-'),
          callback_data: `time:${slot.id}`,
        },
      ]),
    ]
  }

  validateAvaliableSlots(slots) {
    const errors = []
    if (slots.length === 0) {
      errors.push('Доступных слотов нет')
    }
    return errors
  }
}

export default new SlotService()
