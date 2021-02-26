var OSM_mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

var Stamen_Toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

var OSM_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	maxZoom: 18,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> '
});

var Thunderforest_TransportDark = L.tileLayer('https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey={apikey}', {
	attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	apikey: 'a00a69ca12ad40ee891f0e98e60dd005',
	maxZoom: 22
});

var baselayers = {
  "OSM B&W": OSM_BlackAndWhite,
	"Stamen Toner": Stamen_Toner,
  "Dark Transportation": Thunderforest_TransportDark
};

var overlay = null;

var map = L.map("map", {
  center: [38.897609, -77.036444],
  zoom: 13,
  layers: OSM_BlackAndWhite
});

var layercontrol = L.control.layers(baselayers, null, {position: 'bottomleft'}).addTo(map);

//L.control.scale().addTo(map);

var infowindow = L.Control.extend({
	options: {
		position: "topright"
	},
	onAdd: addInfoWindow
});

var infowd = new infowindow();

function addInfoWindow(map){
	this._div = L.DomUtil.create('div', 'infowindow');
	var innerHTML = ``;
	this._div.innerHTML = innerHTML;
	L.DomEvent.disableClickPropagation(this._div);
	L.DomEvent.disableScrollPropagation(this._div);
	return this._div;
}

var fieldprefix = ["highspeed", "lowspeed", "unsafedriving", "unsafeoper", "unsafevehicle", "other"];
var fieldsuffix = ["_am_norush", "_am_rush", "_evening", "_no_time", "_overnight", "_pm_norush", "_pm_rush"];
var fields = [];
for(var i = 0; i < fieldprefix.length; i++){
	for(var j = 0; j< fieldsuffix.length; j++){
		fields.push(fieldprefix[i] + fieldsuffix[j]);
	}
}
infowd.update = function (selected) {
	var totalcount = 0;
	var prop = {};
	for(var n = 0; n < fields.length; n++){
		prop[fields[n]] = 0;
	};
	for(var i = 0; i < selected.length; i++){
		for(var j = 0; j < fields.length; j++){
			var tempval = selected[i].properties[fields[j]];
			if(tempval >= 0) {
				prop[fields[j]] += tempval;
				totalcount += tempval;
			}
		}


	};

  var info = '<div style="padding-left: 10px; width: 100%; height: 100%; overflow-y: scroll;"><h4>Violation Summary:  ' +
												totalcount + '</h4>' +
												'<table class="table table-condense" id="msg"><thead><tr>' +
												'<th>' + 'Condition' + '</th>' +
												'<th onClick="sortTable(1)">' + 'Counts' + '</th>' +
												'</tr></thead>' + '<tbody>';

	for(var i = 0; i < fields.length; i++){
		info += '<tr><td>' + fields[i] + '</td>' +
						'<td>' + prop[fields[i]] + '</td>';
	}
	info += '</tbody></table>';

	this._div.innerHTML = info;

	sortTable(1);
};

map.addControl(infowd);

function sortTable(n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("msg");
  switching = true;
  // Set the sorting direction to ascending:
  dir = "desc";
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      /* Check if the two rows should switch place,
      based on the direction, asc or desc: */
      if (dir == "asc") {
        if (Number.parseInt(x.innerHTML) > Number.parseInt(y.innerHTML)) {
          // If so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if (Number.parseInt(x.innerHTML) < Number.parseInt(y.innerHTML)) {
          // If so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      // Each time a switch is done, increase this count by 1:
      switchcount ++;
    } else {
      /* If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again. */
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
}
