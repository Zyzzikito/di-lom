export const generateDaysWeekKeyboard = (callbackData) => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentWeek = [];

    const formatter = new Intl.DateTimeFormat('ru-RU', {
        weekday: 'long',
        month: '2-digit',
        day: '2-digit',
    })

    for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate.getTime());
        date.setDate(currentDay + i);

        currentWeek.push([
            {
                text: `${formatter.format(date)}`,
                callback_data: [...(callbackData ? callbackData(date) : [])].join(':'),
            },
        ]);
    }

    return currentWeek;
};