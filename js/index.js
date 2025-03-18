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