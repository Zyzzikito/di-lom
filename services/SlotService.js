import {Op} from 'sequelize'
import {Slot} from '../models.js'
import ReservationService from "./ReservationService.js";

const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});
const textFormatter = new Intl.DateTimeFormat("ru-RU", {
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
})

class SlotService {
    async getAvailableSlotsCurrentWeek(subjectTeacherId) {
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const reservations = await ReservationService.getAllReservations()

        return await Slot.findAll({
            where: {
                subjectTeacherId,
                date: {
                    [Op.between]: [startOfWeek, endOfWeek],
                },
                id: {
                    [Op.notIn]: reservations.map((row) => row.slotId),
                },
            },
        })
    }

    async getAvaliableSlots(
        subjectTeacherId,
        {year, month, day},
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

    async generateNotExistDaysWeekKeyboard(subjectTeacherId) {
        const currentWeek = [];
        const dates = [];

        const slots = await this.getAvailableSlotsCurrentWeek(Number(subjectTeacherId))

        slots.forEach((slot) => {
            const date = new Date(slot.date);

            const text = textFormatter.format(date);
            const formattedDate = formatter.format(date);

            if (dates.includes(formattedDate)) return;

            dates.push(formattedDate);
            currentWeek.push([
                {
                    text: text,
                    callback_data: ["day_week", formattedDate, subjectTeacherId].join(':'),
                },
            ]);
        })

        return currentWeek;
    };

    validateAvaliableSlots(slots) {
        const errors = []
        if (slots.length === 0) {
            errors.push('Доступных слотов нет')
        }
        return errors
    }

    validateSlotString(slotString) {
        const regex = /^(0[0-9]|1[0-2]):[0-5][0-9]-(0[0-9]|1[0-2]):[0-5][0-9]$/;

        return regex.test(slotString)
    }

    createSlot(slotString, date) {

    }
}

export default new SlotService()
