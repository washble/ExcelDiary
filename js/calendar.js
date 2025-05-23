// need dayjs
const today = dayjs();

const userLocale = navigator.language || navigator.userLanguage || 'ko';
dayjs.locale(userLocale);

const calendarEl = document.getElementById('calendar');
const loadingSpinnerEl = document.getElementById('loading-spinner');
const loadingErrorMessageEl = document.getElementById('error-message');

document.addEventListener('DOMContentLoaded', async function() {
    await calendarRender();
});

const calendarRender = async () => {
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
            // Display none all tooltips
            hideAllEventTooltip();

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
            eventTooltip(info);
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
    calendarSwipe(calendar);
}

const eventTooltip = (info) => {
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
        tooltip.style.top = (rect.top + rect.height + 5) + 'px'; // Position 10px below
    });

    info.el.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
    });
}

const hideAllEventTooltip = () => {
    const existingTooltips = document.getElementsByClassName('tooltip');
    for (let i = 0; i < existingTooltips.length; i++) {
        existingTooltips[i].style.display = 'none';
    }
}

const calendarSwipe = (calendar) => {
    let startX;
    const swipeSensitivity = Math.max(120, window.innerWidth * 0.15);

    // Checking has scrollbar
    const hasScrollbar = () => {
        const hasHorizontalScrollbar = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        const hasVerticalScrollbar = document.documentElement.scrollHeight > document.documentElement.clientHeight;
        
        return hasHorizontalScrollbar;
    };

    // Don't operation in mobile
    const isAtScreenEdge = () => {
        let scrollX = window.scrollX;

        return scrollX < 5 || scrollX > window.innerWidth - 5;
    };

    // Mobile Swipe
    calendarEl.addEventListener('touchstart', function(event) {
        startX = event.touches[0].clientX;
    });

    calendarEl.addEventListener('touchend', function(event) {
        const endX = event.changedTouches[0].clientX;
        
        // if (hasScrollbar()) { return; }
        // if (hasScrollbar() && !isAtScreenEdge(startX)) { return; }

        if (startX > endX + swipeSensitivity) {
            calendar.next();
        } else if (startX < endX - swipeSensitivity) {
            calendar.prev();
        }
    });

    // PC Swipe
    calendarEl.addEventListener('mousedown', function(event) {
        startX = event.clientX;
    });
    
    calendarEl.addEventListener('mouseup', function(event) {
        const endX = event.clientX;
    
        // if (hasScrollbar()) { return; }
        // if (hasScrollbar() && !isAtScreenEdge(startX)) { return; }
    
        if (startX > endX + swipeSensitivity) {
            calendar.next();
        } else if (startX < endX - swipeSensitivity) {
            calendar.prev();
        }
    });
}

const getSpreadSheetId = (urlParams) => {
    const id = urlParams.get('id');

    return id;
}

const getSpreadSheetGid = (urlParams) => {
    const gid = urlParams.get('gid');

    return gid;
}

const loadingSpinning = () => {
    // Show loading spinner
    loadingSpinnerEl.style.display = 'block';

    // Hide error massage
    loadingErrorMessageEl.style.display = 'none';
}

const loadingSuccessSpinning = () => {
    // Hide loading spinner
    loadingSpinnerEl.style.display = 'none';
}

const loadingErrorSpinning = () => {
    // Hide loading spinner
    loadingSpinnerEl.style.display = 'none';

    // Show loadingErrorMessage
    loadingErrorMessageEl.innerText = 'Failed to load.\n Please retry.';
    loadingErrorMessageEl.style.display = 'block';
}

const loadCalendar = async (startDate, endDate) => {
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
    const query = `SELECT * WHERE (B >= DATE '${startDate}' AND B < DATE '${endDate}') OR (C >= DATE '${startDate}' AND C < DATE '${endDate}') OR (C >= DATE '${endDate}' AND B <= DATE '${startDate}')`;

    // let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq&gid=${gid}&nocache=${new Date().getTime()}`;
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${gid}&nocache=${new Date().getTime()}`;
    // const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`; // AllOrigins proxy setup
    const proxyUrl = `https://all-origins-eta.vercel.app/get?url=${encodeURIComponent(url)}`; // Custom AllOrigins proxy setup
    
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

const loadCalendarParse = async (jsonString) => {
    const json = JSON.parse(jsonString);

    let events = [];

    await json.table.rows.forEach(ligne => {
        // Get ligne.c's elements
        const ligneC = ligne.c;

        const ligneC0 = ligneC[0].f ? ligneC[0].f : ligneC[0].v;
        const ligneC1 = ligneC[1].f ? ligneC[1].f : ligneC[1].v;
        const ligneC2 = ligneC[2].f ? ligneC[2].f : ligneC[2].v;
        const ligneC3 = ligneC[3] != null ? (ligneC[3].f ? ligneC[3].f : ligneC[3].v) : null;
        const ligneC4 = ligneC[4] != null ? (ligneC[4].f ? ligneC[4].f : ligneC[4].v) : null;
        const ligneC5 = ligneC[5].f ? ligneC[5].f : ligneC[5].v;
        const ligneC6 = ligneC[6].f ? ligneC[6].f : ligneC[6].v;

        // Event settings
        let event = {};

        if(ligneC3 != null) {
            // Start time exists
            event.start = dateTimeFormat(ligneC1, `${ligneC3}:00`);
            event.title = `${ligneC5} (${ligneC3}`;

            if(ligneC4 != null) {
                // Start and end times exist
                event.end = dateTimeFormat(ligneC2, `${ligneC4}:01`);
                event.title = titleStartEndFormat(ligneC5, ligneC3, ligneC4);
            } else {
                // No end time, using start time instead.
                event.end = dateTimeFormat(ligneC2, `${ligneC3}:01`);
                event.title = titleStartEndFormat(ligneC5, ligneC3);
            }
        } else {
            // No start time; using default start and end times
            event.start = dateTimeFormat(ligneC1, `00:00:00`);
            event.end = dateTimeFormat(ligneC2, `00:00:01`);
            event.title = `${ligneC5}`;
        }

        if(ligneC6) { event.url = ligneC6; }

        // Set background color
        event.backgroundColor = ligneC0.includes('TRUE') ? 'rgba(225, 0, 0, 0.7)' : 'rgba(55, 136, 216, 0.7)';
        event.borderColor = event.backgroundColor; // Set the border color to match the event's background color

        events.push(event);
    });

    return events;
}

const titleStartEndFormat = (title, startDate, endDate = null) => {
    const formatTitle 
        = endDate ? `${title} (${startDate} - ${endDate})` : `${title} (${startDate})`;

    return formatTitle;
}

const dateTimeFormat = (day, time) => {
    // const dateTime = `${dayjs(day).format('YYYY-MM-DD')}T${time}`;

    const formattedDay = day.replace(/. /g, "/");    // Change for safari date format
    const dateTime = `${formattedDay}T${time}`;
    const formattedDateTime = dayjs(dateTime).toISOString();

    return formattedDateTime;
}
