// need dayjs
const today = dayjs();

let userLocale = navigator.language || navigator.userLanguage;
dayjs.locale(userLocale);

let calendarEl = document.getElementById('calendar');
document.addEventListener('DOMContentLoaded', async function() {
    await calendarRender();
});

let calendarRender = async () => {
    let calendar = await new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
        // left: 'prevYear,prev,next,nextYear today',
        left: 'prev,next,today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        initialDate: today.format('YYYY-MM-DD'),
        navLinks: true, // can click day/week names to navigate views
        editable: true,
        dayMaxEvents: true, // allow "more" link when too many events
        locale: userLocale,   // Set language to Korean
        datesSet: async function(dateInfo) {
            // Date information when navigating to the previous or next month
            console.log(dateInfo)
            let startMonth = dayjs(dateInfo.startStr).format('YYYY-MM-DD');
            let endMonth = dayjs(dateInfo.endStr).format('YYYY-MM-DD');

            let eventsResult = await loadCalendar(startMonth, endMonth);
            
            console.log(`eventsResult: ${JSON.stringify(eventsResult)}`);

            calendar.removeAllEvents();
            calendar.addEventSource(eventsResult);
        },
        eventClick: function(info) {
            if(!info.event.url) { return; }

            window.open(info.event.url, '_blank');
            info.jsEvent.preventDefault();
        },
        // events: [
        //     {
        //         groupId: 999,
        //         title: 'Repeating Event',
        //         start: '2025-03-09T16:00:00'
        //     },
        //     {
        //         groupId: 999,
        //         title: 'Repeating Event',
        //         start: '2025-03-16T16:00:00'
        //     },
        //     {
        //         title: 'Meeting',
        //         start: '2025-03-12T10:30:00',
        //         end: '2025-03-12T12:30:00'
        //     },
        //     {
        //         title: 'Click for Google',
        //         url: 'http://google.com/',
        //         start: '2025-03-28'
        //     }
        // ],
    });

    calendar.render();
}

let loadCalendar = async (startDate, endDate) => {
    const id = '1KUlOegO2xx2_rYrIuPNgsuTFQnhk4ALSATyrdABSpXA'; // Spreadsheet ID
    const gid = '1386834576'; // Sheet GID
    // Add nocache parameter to ensure fresh data is fetched each time
    // new Date().getTime() returns the current time in milliseconds,
    // generating a unique value to prevent caching.

    // const query = `SELECT * WHERE B >= DATE '${startDate}' AND B < DATE '${endDate}'`; // Assuming column B contains dates

    // Checks if C is within the calendar range or if B and C encompass the calendar range.
    const query = `SELECT * WHERE (C >= DATE '${startDate}' AND C < DATE '${endDate}') OR (B <= DATE '${startDate}' AND C >= DATE '${endDate}')`;

    // let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq&gid=${gid}&nocache=${new Date().getTime()}`;
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${gid}&nocache=${new Date().getTime()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`; // AllOrigins proxy setup
    
    const maxAttempts = 5; // Maximum number of retry attempts
    let attempt = 0;

    while (attempt < maxAttempts) {
        try {
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return await loadCalendarParse(data.contents.slice(47, -2)); // Return data if successfully loaded
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);

            attempt++;
            if (attempt >= maxAttempts) {
                console.error('Max attempts reached. Unable to load calendar data.');
                return []; // Return empty array if maximum attempts are reached
            }

            // Wait a moment before retrying (optional)
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
        }
    }
}

let loadCalendarParse = async (jsonString) => {
    const json = JSON.parse(jsonString);

    let events = [];

    await json.table.rows.forEach(ligne => {
        const ligneC = ligne.c;

        console.log(`${JSON.stringify(ligneC)}`);

        const ligneC0 = ligneC[0].f ? ligneC[0].f : ligneC[0].v;
        const ligneC1 = ligneC[1].f ? ligneC[1].f : ligneC[1].v;
        const ligneC2 = ligneC[2].f ? ligneC[2].f : ligneC[2].v;
        const ligneC3 = ligneC[3].f ? ligneC[3].f : ligneC[3].v;
        const ligneC4 = ligneC[4].f ? ligneC[4].f : ligneC[4].v;
        const ligneC5 = ligneC[5].f ? ligneC[5].f : ligneC[5].v;
        const ligneC6 = ligneC[6].f ? ligneC[6].f : ligneC[6].v;

        
        console.log(dayjs(ligneC1, 'YYYY. M. D A HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss'));

        let event = {
            title: `${ligneC5}(${ligneC3}-${ligneC4})`,
            start: `${dayjs(ligneC1).format('YYYY-MM-DD')}T${ligneC3}:00`,
            end: `${dayjs(ligneC2).format('YYYY-MM-DD')}T${ligneC4}:00`,
            // start: `${dayjs(ligneC1).format('YYYY-MM-DDT00:00:00')}`,
            // end: `${dayjs(ligneC2).format('YYYY-MM-DDT00:00:00')}`,
        };

        if(ligneC0.includes('TRUE')) { event.backgroundColor = 'red'; }
        if(ligneC6) { event.url = ligneC6; }

        events.push(event);
    });

    return events;
}
