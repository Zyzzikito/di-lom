import {dateRuFormatter} from '../constants.js'
import {
    Reservation,
    Slot,
    Subject,
    SubjectTeacher,
    Teacher,
    sequelize,
} from '../models.js'

class ReservationService {
    async createReservation(slotId, studentId, format) {
        const reservation = await Reservation.create({
            slotId,
            studentId,
            format,
            approved: false,
        })
        return reservation
    }

    async getAllReservations() {
        return await Reservation.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('slotId')), 'slotId'],
            ],
        })
    }

    async getReservationsByStudentId(studentId) {
        const reservations = await Reservation.findAll({
            where: {
                studentId,
            },
            include: [
                {
                    model: Slot,
                    include: [
                        {
                            model: SubjectTeacher,
                            include: [
                                {
                                    model: Subject,
                                    attributes: ['name'],
                                },
                                {
                                    model: Teacher,
                                    attributes: ['name', 'surname', 'patronymic'],
                                },
                            ],
                        },
                    ],
                },
            ],
        })
        return reservations
    }

    async getReservationsWithSubjectTeacher() {
        return await Reservation.findAll({
            raw: true,
            nest: true,
            order: [['approved', 'DESC']],
            include: [
                {
                    model: Slot,
                    include: [
                        {
                            model: SubjectTeacher,
                            include: [
                                {
                                    model: Subject,
                                    attributes: ['name'],
                                },
                                {
                                    model: Teacher,
                                    attributes: ['name'],
                                },
                            ],
                        },
                    ],
                },
            ],
        })
    }

    async deleteReservation(reservationId) {
        await Reservation.destroy({
            where: {
                id: reservationId,
            },
        })
    }

    async getIsAlreadyReserved(slotId) {
        return Boolean(
            await Reservation.findOne({
                where: {
                    slotId,
                },
            }),
        )
    }

    getReservationDescription(reservation) {
        const slot = reservation.Slot
        const subjectTeacher = slot.SubjectTeacher
        const subject = subjectTeacher.Subject
        const teacher = subjectTeacher.Teacher

        return `<b>Репетитор:</b> ${teacher.name}\n<b>Предмет:</b> ${subject.name}\n<b>Дата:</b> ${dateRuFormatter.format(
            reservation.date,
        )} \n<b>Время:</b> ${slot.startTime} - ${slot.endTime}\n\n${
            reservation.approved ? 'Принята' : 'Не принята'
        }`
    }

    getReservationKeyboard(reservationId) {
        return [
            [
                {
                    text: 'Отмена',
                    callback_data: 'cancel_reservation:' + reservationId,
                },
            ],
        ]
    }
}

export default new ReservationService()
