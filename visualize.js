var prequery = "https://zhiqiyu.carto.com/api/v2/sql?format=GeoJSON&q=";
var sql = "select * from moving_violations_summary_for_2015";
var search = ""
var query = prequery + sql + search;

//var geojsondata = null;
var geojsonlayer = null;
var selectedfeatures = null;
var filtereddata = null;
var selectedlayer = null;
var totalfeatures = 0;
var totalvio = 0;
var streetsegs = [];

function onMouseOver(e){
  var latlng = e.latlng;
  selectedlayer = e.target;
  selectedlayer.setStyle({
    color: "gold",
    opacity: 1
  });

  var streetseg = selectedlayer.feature.properties["streetseg"];
  selectedfeatures = filtereddata.filter(function(feature){
    return feature.properties["streetseg"] == streetseg;
  });

  infowd.update(selectedfeatures);
}

function onMouseOut(e){
  //debugger;
  geojsonlayer.resetStyle(e.target);
}

////////////////////////////////////////////////////////////////////////////////
// Add the functionality that when clicking a feature, lock selection and release
// selection only when Enter key is pressed
///////////////////////////////////////////////////////////////////////////////
function onClick(e){
  selectedlayer = e.target;
  geojsonlayer.eachLayer(function (layer) {
    layer.off({mouseout: onMouseOut, mouseover: onMouseOver});
  });
}

var keydown = function(e){
  e = e || window.event;
  if (e.originalEvent.code == 'Enter') {
    // enter key
    geojsonlayer.eachLayer(function(layer){
      layer.on({
        mouseover: onMouseOver,
        mouseout: onMouseOut
      });
    });
    geojsonlayer.resetStyle(selectedlayer);
  }
}
map.on("keypress", keydown);
////////////////////////////////////////////////////////////////////////////////

function getOpacity(val){
  return val < 0.10*totalfeatures ? 0.5 :
         val < 0.50*totalfeatures ? 0.3 :
         val < 0.75*totalfeatures ? 0.2 :
                                    0.1;
}

function computeStats(filtered){
  streetsegs = [];
  for(var i = 0; i < filtered.length; i++){
    streetsegs.push(filtered[i].properties["streetseg"]);
  }
  streetsegs = Array.from(new Set(streetsegs));

  var streetsegstats = {};
  for(var n = 0; n < streetsegs.length; n++){
    streetsegstats[streetsegs[n]] = 0;
  }

  for(var j = 0; j < filtered.length; j++){
    var total = 0;
    for(var n = 0; n < fields.length; n++){
      var temp = filtered[j].properties[fields[n]];
      if(temp > 0) {total += temp;}
    }
    streetsegstats[filtered[j].properties["streetseg"]] += total;
  }

  return streetsegstats;
}

function getQuantiles(stats){
  var arr = Object.values(stats).sort(function(a, b) {return a-b;});
  var len = arr.length;
  var quantiles = [arr[Math.floor(len*0.2) - 1], arr[Math.floor(len*0.4) - 1], arr[Math.floor(len*0.6) - 1], arr[Math.floor(len*0.8) - 1], arr[Math.floor(len*0.99)-1]];

  return quantiles;
}

function getColor(feature, quantiles, stats){
  var total = stats[feature.properties["streetseg"]];

  return total <= quantiles[0] ? '#ffffb2' :
         total <= quantiles[1] ? '#fed976' :
         total <= quantiles[2] ? '#feb24c' :
         total <= quantiles[3] ? '#fd8d3c' :
         total <= quantiles[4] ? '#f03b20':
                              '#800026';
}

// load data
d3.json(query, function(err, data){
  filtereddata = data.features;
  totalfeatures = data.features.length;
  // for(var i = 0; i < totalfeatures; i++){
  //   streetsegs.push(filtereddata[i].properties["streetseg"]);
  // }
  // streetsegs = Array.from(new Set(streetsegs));

  var stats = computeStats(filtereddata);
  var quantiles = getQuantiles(stats);

  // create Geojson layer using loaded data
  geojsonlayer = L.geoJson(data, {
    style: function(feature){
      return {
        opacity: 0.1,
        color: getColor(feature, quantiles, stats)
      }
    },
    onEachFeature: function(feature, layer){
      layer.on({
        mouseover: onMouseOver,
        mouseout: onMouseOut,
        click: onClick
      });

    }
  }).addTo(map);
  map.fitBounds(geojsonlayer.getBounds());
  overlay = {"Violations": geojsonlayer};
  layercontrol.addOverlay(geojsonlayer, "violations");
  setBrush(data);
});

//map.on("click", onClick);

function setBrush(data) {

  var container = d3.select('#timecontainer'),
      width = container.node().offsetWidth,
      margin = {top: 0, right: 0, bottom: 0, left: 0},
      height = 100;

  var timeExtent = d3.extent(data.features, function(d) {
      return d.properties["weeknumber"];
  });

  var weeks = new Array(timeExtent[1]);
  for(var i = 1; i<= weeks.length; i++){ weeks[i-1] = i;}

  var svg = container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

  var context = svg.append('g')
      .attr('class', 'context')
      .attr('transform', 'translate(' +
          margin.left + ',' +
          margin.top + ')');

  var x = d3.scaleLinear()
      .range([0, width])
      .domain(timeExtent);

  context.selectAll('circle.violation')
      .data(weeks)
      .enter()
      .append('circle')
      .attr('transform', function(d) {
          return 'translate(' + [x(d), height / 2] + ')';
      })
      .attr('r', "3px")
      .attr('opacity', 0.5)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('fill', "red");

  var xbrush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on('end', brushed);

  context.append('g')
      .attr('class', 'brush')
      .call(xbrush)
      .selectAll("rect");

  // //Add key down events for left and right key to move brush
  // container.on("onKeyDown", keydown);
  // var keydown = function(e){
  //   e = e || window.event;
  //   debugger;
  //   if (e.keyCode == '37') {
  //     // left arrow
  //     if(range[0] > 0.5){
  //
  //       d3.select("selection").transision().call(d3.event.target.move, range)
  //     }
  //   }
  //   else if (e.keyCode == '39') {
  //      // right arrow
  //
  //   }
  // }

  function brushed() {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    var selection = d3.event.selection;
    var range = [Math.ceil(x.invert(selection[0])) - 0.2, Math.floor(x.invert(selection[1])) + 0.2];


    // make transition to set selection to integers
    if(range[1] - range[0] > 0.5){
      d3.select(this).transition().call(d3.event.target.move, range.map(x));
    }
    else if(range[1] - range[0] < 0.5){
      range[0] = range[0] - 0.5;
      range[1] = range[1] + 0.5;
      d3.select(this).transition().call(d3.event.target.move, range.map(x));
    }
    else if(range[0] > range[1]){
      alert("nothing to query");
    }

    var filter = function(feature) {
      return feature.properties["weeknumber"] >= +range[0] &&
        feature.properties["weeknumber"] <= (+range[1]);
    };

    filtereddata = data.features.filter(filter);
    geojsonlayer.clearLayers();
    var stats = computeStats(filtereddata);
    var quantiles = getQuantiles(stats);
    debugger;
    geojsonlayer = L.geoJson(filtereddata, {
      style: function(feature){
        return {
          opacity: getOpacity(filtereddata.length),
          color: getColor(feature, quantiles, stats)
        }
      },
      onEachFeature: function(feature, layer){
        layer.on({
          mouseover: onMouseOver,
          mouseout: onMouseOut,
          click: onClick
        });

      }
    }).addTo(map);

  }
}
