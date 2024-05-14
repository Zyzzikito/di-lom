export const generateSlots = (teachers) => {
  const slots = [];

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  for (const teacher of teachers) {
    for (let i = 0; i < 1; i++) {
      let slot = {
        subjectTeacherId: 1,
        date: tomorrow.toISOString().slice(0, 10), // get date in YYYY-MM-DD format
        startTime: "09:00",
        endTime: "10:00",
      };
      slots.push(slot);

      slot = {
        subjectTeacherId: 2,
        date: dayAfterTomorrow.toISOString().slice(0, 10), // get date in YYYY-MM-DD format
        startTime: "10:00",
        endTime: "11:00",
      };
      slots.push(slot);
    }
  }

  return slots;
};
