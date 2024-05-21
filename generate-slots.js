export const generateSlots = (teachers) => {
    const slots = [];

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (let i = 0; i < 4; i++) {
        slots.push({
            subjectTeacherId: 1,
            date: tomorrow.toISOString().slice(0, 10), // get date in YYYY-MM-DD format
            startTime: "09:00",
            endTime: "10:00",
        });

        slots.push({
            subjectTeacherId: 2,
            date: tomorrow.toISOString().slice(0, 10), // get date in YYYY-MM-DD format
            startTime: "10:00",
            endTime: "11:00",
        });

        tomorrow.setDate(tomorrow.getDate() + 1);
    }

    return slots;
};
