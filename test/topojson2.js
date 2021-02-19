var width = 1000;
var height = 600;
var scale = 500000;
var zoomlevel = 14;

d3.json("../town/h27ka13208.topojson")
.then(

  function(topoChofu){
    var geoChofu = topojson.feature(topoChofu, topoChofu.objects.town);
    var n = topoChofu.bbox[3], e = topoChofu.bbox[2];
    var s = topoChofu.bbox[1], w = topoChofu.bbox[0];
    console.log("north bound: ", n);
    console.log("east bound: ", e);
    console.log("south bound: ", s);
    console.log("west bound: ", w);
    console.log("nw tile: ", get_tile(n, w, zoomlevel));
    console.log("ne tile: ", get_tile(n, e, zoomlevel));
    console.log("se tile: ", get_tile(s, e, zoomlevel));
    console.log("sw tile: ", get_tile(s, w, zoomlevel));
    var center_latitude = (s+n)/2;
    var center_longitude = (e+w)/2;
    console.log("center_latitude: ", center_latitude);
    console.log("center_longitude: ", center_longitude);
    var aProjection = d3.geoMercator()
    .center([center_longitude, center_latitude])
    .translate([width/2, height/2])
    .scale(scale);
    console.log(aProjection([e, n]));
    var geoPath = d3.geoPath().projection(aProjection);
    var svg = d3.select("svg").attr("width", width).attr("height", height);
    var mapObject = svg.append("g")
    .attr("class", "mapObject");

    var nw_tile = get_tile(n, w, zoomlevel);
    var se_tile = get_tile(s, e, zoomlevel);
    var se_tile_2 = [se_tile[0]+1, se_tile[1]+1];
    var mesh_array = [];
    mesh_array.push([nw_tile[0], nw_tile[1]]);
    console.log(mesh_array[0]);
    console.log(get_lonlat(mesh_array[0], zoomlevel));
    console.log(aProjection(get_lonlat(mesh_array[0], zoomlevel)));

    var req = new XMLHttpRequest();
    var res;
    var requestURI = "./concat_tile.cgi?x1="+nw_tile[0]+"&x2="+se_tile[0]+"&y1="+nw_tile[1]+"&y2="+se_tile[1]+"&z="+zoomlevel;
    console.log("requestURI:", requestURI);
    req.addEventListener("load", function(){
      res = this.responseText;
      bgmap.attr("href", res);
    });
    req.open("GET", requestURI);
    req.send();

    var bgmap = mapObject.selectAll("image").data(mesh_array)
    .enter()
    .append("image")
    .attr("x", function(d){
      return aProjection(get_lonlat(d, zoomlevel))[0];
    })
    .attr("y", function(d){
      return aProjection(get_lonlat(d, zoomlevel))[1];
    })
    .attr("width", function(d){
      return Math.abs(aProjection(get_lonlat(d, zoomlevel))[0] - aProjection(get_lonlat(se_tile_2, zoomlevel))[0]);
    })
    .attr("height", function(d){
      return Math.abs(aProjection(get_lonlat(d, zoomlevel))[1] - aProjection(get_lonlat(se_tile_2, zoomlevel))[1]);
    });

    var townObject = mapObject.selectAll("g").data(geoChofu.features)
    .enter()
    .append("g")
    .attr("class", function(d){
      const {properties} = d;
      return "townObject" + " " + "town-" + properties["KEY_CODE"];
    })
    .attr("transform", "translate(0,0) rotate(0)")
    .on("mouseover", function(event, d){
      const {properties} = d;
      d3.selectAll("g.town-"+properties["KEY_CODE"]+" path")
      .attr("class", "townPath-hover");
    })
    .on("mouseout", function(event, d){
      const {properties} = d;
      d3.selectAll("g.town-"+properties["KEY_CODE"]+" path")
      .attr("class", "townPath");
    });


    var townPath = townObject
    .append("path")
    .attr("d", geoPath)
    .attr("class", "townPath");

    var townLabel = townObject
    .append("text")
    .text(function(d){
      const {properties} = d;
      return fullDigitToHalfDigit(properties["S_NAME"]);
    })
    .attr("x", function(d){
      const {properties} = d;
      return aProjection([properties["X_CODE"], properties["Y_CODE"]])[0];
    })
    .attr("y", function(d){
      const {properties} = d;
      return aProjection([properties["X_CODE"], properties["Y_CODE"]])[1];
    })
    .attr("dx", "-20")
    .attr("dy", "-5")
    .attr("class", "townLabel");

    /*var town_labels = mapObjects.selectAll("text").data(geoChofu.features)
    .enter()
    .select("g")
    .append("text")
    .text(function(d){return "123"});*/

    var zoom = d3.zoom().on('zoom', zoomEvent);
    function zoomEvent(event){
      console.log(event);
      const {transform} = event;
      mapObject.attr("transform", transform);
      //aProjection.scale(scale * event.transform.k);
      //towns.attr('d', geoPath);
    }
    svg.call(zoom);

    var drag = d3.drag().on('drag', dragEvent);
    function dragEvent(event, d){
      //console.log(event);
      //console.log(townObject.transform());
      //console.log(this);
      //townObject.select(this).attr("transform", "translate("+event.dx+","+event.dy+")");
    //townObject.attr("transform", 
    //var tl = aProjection.translate();
    //aProjection.translate([tl[0] + event.dx, tl[1] + event.dy]);
    //towns.attr('d', geoPath);
    }
    //townObject.call(drag);
  });

function fullDigitToHalfDigit(str){
  return str.replace(/[０-９]/g, function(s){
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

function get_tile(latitude, longitude, zoomlevel){
  var lt = latitude / 180 * Math.PI;
  var lo = 180 + longitude;
  var mesh = Math.pow(2, zoomlevel);
  var tile_x = Math.floor(mesh * lo / 360);
  var tile_y = Math.floor(mesh * (1 - (Math.log(Math.tan(lt) + (1/Math.cos(lt))) / Math.PI)) / 2);
  return [tile_x, tile_y];
}

function get_lonlat(arr,  zoomlevel){
  var tile_x = arr[0], tile_y = arr[1];
  var mesh = Math.pow(2, zoomlevel);
  var lon_deg = tile_x / mesh * 360 - 180;
  var lat_rad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tile_y / mesh)));
  var lat_deg = lat_rad * 180 / Math.PI;
  return [lon_deg, lat_deg];
}
