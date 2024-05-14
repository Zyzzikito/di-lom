export const generateDaysWeekKeyboard = (subjectTeacherId) => {
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentWeek = [];
  const dayNamesRu = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];

  for (let i = 0; i < 7; i++) {
    const day = currentDay + i;
    const dayOfWeek = (currentDate.getDay() + i) % 7; // calculate day of week
    const date = new Date(currentDate.getTime());
    date.setDate(currentDay + i);
    const dayOfMonth = date.getDate();
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    currentWeek.push([
      {
        text: `${dayOfMonth.toString().padStart(2, "0")}.${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")} ${dayNamesRu[dayOfWeek]}`,
        callback_data: ["day_week" , formatter.format(date), subjectTeacherId].join(':'),
      },
    ]);
  }

  return currentWeek;
};
