// need dayjs
const today = dayjs();

document.addEventListener('DOMContentLoaded', function() {
    calendar_render();
});

calendar_render = () => {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
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
        locale: navigator.language || navigator.userLanguage,   // Set language to Korean
        events: [
            {
                title: 'All Day Event',
                start: '2025-03-01'
            },
            {
                title: 'Long Event',
                start: '2025-03-07',
                end: '2025-03-10'
            },
            {
                groupId: 999,
                title: 'Repeating Event',
                start: '2025-03-09T16:00:00'
            },
            {
                groupId: 999,
                title: 'Repeating Event',
                start: '2025-03-16T16:00:00'
            },
            {
                title: 'Conference',
                start: '2025-03-11',
                end: '2025-03-13'
            },
            {
                title: 'Meeting',
                start: '2025-03-12T10:30:00',
                end: '2025-03-12T12:30:00'
            },
            {
                title: 'Lunch',
                start: '2025-03-12T12:00:00'
            },
            {
                title: 'Meeting',
                start: '2025-03-12T14:30:00'
            },
            {
                title: 'Happy Hour',
                start: '2025-03-12T17:30:00'
            },
            {
                title: 'Dinner',
                start: '2025-03-12T20:00:00'
            },
            {
                title: 'Birthday Party',
                start: '2025-03-13T07:00:00'
            },
            {
                title: 'Click for Google',
                url: 'http://google.com/',
                start: '2025-03-28'
            }
        ]
    });

    calendar.render();
}

let loadBtn = document.getElementById('loadBtn');
loadBtn.addEventListener('click', function() {
    let id = '1KUlOegO2xx2_rYrIuPNgsuTFQnhk4ALSATyrdABSpXA'; // Spreadsheet ID
    let gid = '1386834576'; // Sheet GID
    // Add nocache parameter to ensure fresh data is fetched each time
    // new Date().getTime() returns the current time in milliseconds,
    // generating a unique value to prevent caching.

    let desiredYear = 2025; // Set the desired year
    let query = `SELECT * WHERE B >= DATE '${desiredYear}-01-01' AND B < DATE '${desiredYear + 1}-01-01'`; // Assuming column B contains dates

    // let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq&gid=${gid}&nocache=${new Date().getTime()}`;
    let url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&tq=${encodeURIComponent(query)}&gid=${gid}&nocache=${new Date().getTime()}`;
    let proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`; // AllOrigins proxy setup

    fetch(proxyUrl)
        .then(response => response.json())
        .then(data => {
            // Remove unnecessary metadata from the response data that is not needed for JSON conversion
            // Example output:
            // /*O_o*/
            // google.visualization.Query.setResponse( 
            // {
            //   ...
            // });
            // The first 47 characters are metadata and unnecessary information,
            // and the last 2 characters are additional characters that do not conform to JSON format.
            document.getElementById("json").innerHTML = myItems(data.contents.slice(47, -2));
        })
        .catch(error => console.error('Error:', error));
});

function myItems(jsonString) {
    var json = JSON.parse(jsonString);
    var table = '<table border="1"><tr>';
    json.table.cols.forEach(colonne => table += '<th>' + colonne.label + '</th>');
    table += '</tr>';
    json.table.rows.forEach(ligne => {
        table += '<tr>';
        ligne.c.forEach(cellule => {
            try {
                var valeur = cellule.f ? cellule.f : cellule.v;
            } catch (e) {
                var valeur = '';
            }
            table += '<td>' + valeur + '</td>';
        });
        table += '</tr>';
    });
    table += '</table>';
    return table;
}