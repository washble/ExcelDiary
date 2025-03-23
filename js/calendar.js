// need dayjs
const today = dayjs();

let userLocale = navigator.language || navigator.userLanguage;
dayjs.locale(userLocale);

let calendarEl = document.getElementById('calendar');
let loadingSpinnerEl = document.getElementById('loading-spinner');
let loadingErrorMessageEl = document.getElementById('error-message');

document.addEventListener('DOMContentLoaded', async function() {
    await calendarRender();
});

let calendarRender = async () => {
    let calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
        // left: 'prevYear,prev,next,nextYear today',
        left: 'dayGridMonth,dayGridWeek',
        center: 'title',
        right: 'today,prev,next'
        //right: 'dayGridMonth,dayGridWeek,dayGridDay'
        },
        views: {
            dayGrid: {
                // options apply to dayGridMonth, dayGridWeek, and dayGridDay views
                titleFormat: { year: 'numeric', month: 'short' }
            },
            timeGrid: {
                // options apply to timeGridWeek and timeGridDay views
            },
            week: {
                // options apply to dayGridWeek and timeGridWeek views
                titleFormat: { year: 'numeric', month: 'short' }
            },
            day: {
                // options apply to dayGridDay and timeGridDay views
            }
        },
        initialDate: today.format('YYYY-MM-DD'),
        navLinks: true, // can click day/week names to navigate views
        // editable: true,
        dayMaxEvents: true, // allow "more" link when too many events
        displayEventTime: false, // Display event time
        locale: userLocale,   // Set language to Korean
        datesSet: async function(dateInfo) {
            // Date information when navigating to the previous or next month
            let startMonth = dayjs(dateInfo.startStr).format('YYYY-MM-DD');
            let endMonth = dayjs(dateInfo.endStr).format('YYYY-MM-DD');

            let eventsResult = await loadCalendar(startMonth, endMonth);

            calendar.removeAllEvents();
            calendar.addEventSource(eventsResult);
        },
        eventClick: function(info) {
            if(!info.event.url) { return; }

            window.open(info.event.url, '_blank');
            info.jsEvent.preventDefault();
        },
        eventDidMount: function(info) {
            const tooltip = document.createElement('div');
            tooltip.innerHTML = info.event.title;
            tooltip.className = 'tooltip';

            // Set the background color of the tooltip based on the event's background color
            tooltip.style.backgroundColor = info.event.backgroundColor || 'rgba(55, 136, 216, 0.9)'; // Default value

            document.body.appendChild(tooltip);

            info.el.addEventListener('mouseenter', function() {
                tooltip.style.display = 'block';
                const rect = info.el.getBoundingClientRect();
                tooltip.style.left = rect.left + 'px';
                tooltip.style.top = (rect.top + rect.height + 10) + 'px'; // Position 10px below
            });

            info.el.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
            });
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

let getSpreadSheetId = (urlParams) => {
    const id = urlParams.get('id');

    return id;
}

let getSpreadSheetGid = (urlParams) => {
    const gid = urlParams.get('gid');

    return gid;
}

let loadingSpinnerPosition = () => {
    loadingSpinnerEl.style.top = `${calendarEl.offsetHeight * 0.5}px`;
    loadingSpinnerEl.style.left = `${calendarEl.offsetWidth * 0.5}px`;
    loadingSpinnerEl.style.transform = 'translate(-50%, -50%)';
}

let loadingErrorMessagePosition = () => {
    loadingErrorMessageEl.style.top = `${calendarEl.offsetHeight * 0.5}px`;
    loadingErrorMessageEl.style.left = `${calendarEl.offsetWidth * 0.5}px`;
    loadingErrorMessageEl.style.transform = 'translate(-50%, -50%)';
}

let loadingSpinning = () => {
    // Show loading spinner
    loadingSpinnerPosition();
    loadingSpinnerEl.style.display = 'block';

    // Hide error massage
    loadingErrorMessageEl.style.display = 'none';
}

let loadingSuccessSpinning = () => {
    // Hide loading spinner
    loadingSpinnerEl.style.display = 'none';
}

let loadingErrorSpinning = () => {
    // Hide loading spinner
    loadingSpinnerEl.style.display = 'none';

    // Show loadingErrorMessage
    loadingErrorMessagePosition();
    loadingErrorMessageEl.innerText = 'Failed to load.\n Please retry.';
    loadingErrorMessageEl.style.display = 'block';
}

let loadCalendar = async (startDate, endDate) => {
    // Test : ?id=1KUlOegO2xx2_rYrIuPNgsuTFQnhk4ALSATyrdABSpXA&gid=1386834576
    const urlParams = new URLSearchParams(window.location.search);
    const id = getSpreadSheetId(urlParams);
    const gid = getSpreadSheetGid(urlParams);

    // Add nocache parameter to ensure fresh data is fetched each time
    // new Date().getTime() returns the current time in milliseconds,
    // generating a unique value to prevent caching.

    // const query = `SELECT * WHERE B >= DATE '${startDate}' AND B < DATE '${endDate}'`; // Assuming column B contains dates

    // Check1 : if Schedule Start Day is within the calendar range
    // Check2 : if Schedule End Day is within the calendar range 
    // Check3 : if Schedule Start and Schedule End Day encompass the calendar range.
    const query = `SELECT * WHERE (B >= DATE '${startDate}' AND B < DATE '${endDate}') OR (C >= DATE '${startDate}' AND C < DATE '${endDate}') OR (B <= DATE '${startDate}' AND C >= DATE '${endDate}')`;

    // let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq&gid=${gid}&nocache=${new Date().getTime()}`;
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${gid}&nocache=${new Date().getTime()}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`; // AllOrigins proxy setup
    
    const maxAttempts = 5; // Maximum number of retry attempts
    let attempt = 0;

    while (attempt < maxAttempts) {
        loadingSpinning();
        try {
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const result = await loadCalendarParse(data.contents.slice(47, -2)); // Return data if successfully loaded

            loadingSuccessSpinning();

            return result;
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error);

            attempt++;
            if (attempt >= maxAttempts) {
                loadingErrorSpinning();
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

        const ligneC0 = ligneC[0].f ? ligneC[0].f : ligneC[0].v;
        const ligneC1 = ligneC[1].f ? ligneC[1].f : ligneC[1].v;
        const ligneC2 = ligneC[2].f ? ligneC[2].f : ligneC[2].v;
        const ligneC3 = ligneC[3].f ? ligneC[3].f : ligneC[3].v;
        const ligneC4 = ligneC[4].f ? ligneC[4].f : ligneC[4].v;
        const ligneC5 = ligneC[5].f ? ligneC[5].f : ligneC[5].v;
        const ligneC6 = ligneC[6].f ? ligneC[6].f : ligneC[6].v;

        let event = {
            title: `${ligneC5} (${ligneC3}-${ligneC4})`,
            start: `${dayjs(ligneC1).format('YYYY-MM-DD')}T${ligneC3}:00`,
            end: `${dayjs(ligneC2).format('YYYY-MM-DD')}T${ligneC4}:01`,
            // start: `${dayjs(ligneC1).format('YYYY-MM-DDT00:00:00')}`,
            // end: `${dayjs(ligneC2).format('YYYY-MM-DDT00:00:00')}`,
        };

        if(ligneC6) { event.url = ligneC6; }

        // Set background color
        event.backgroundColor = ligneC0.includes('TRUE') ? 'rgba(225, 0, 0, 0.7)' : 'rgba(55, 136, 216, 0.7)';
        event.borderColor = event.backgroundColor; // Set the border color to match the event's background color

        events.push(event);
    });

    return events;
}
