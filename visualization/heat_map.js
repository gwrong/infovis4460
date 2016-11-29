/*
heat_map.js: Just heat map specific stuff

Approximately 40% of the lines in this file were
modified from the following online example: http://bl.ocks.org/tjdecke/5558084
The remaining 60% was written all by our team.
*/

var margin_heat = {top: 40, right: 0, bottom: 50, left: 22};
var width_heat = 500 - margin_heat.left - margin_heat.right;
var height_heat = 198 - margin_heat.top - margin_heat.bottom;
var gridSize = Math.floor(width_heat / 24);
var legendElementWidth = gridSize *2 ;
var buckets = 12;
var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
var times = ["12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p"];
var heat_map_colors_lookup = {}
var heat_svg1 = null;
var heat_svg2 = null;

// 0 -> Monday
function dayOfWeekAsString(dayIndex) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayIndex];
}

// Modified from http://bl.ocks.org/tjdecke/5558084
// Produces heat maps of time distribution of comments
var createHeatMap = function(id_selector) {
  var heat_svg = d3.select(id_selector).append("svg")
      .attr("width", width_heat + margin_heat.left + margin_heat.right)
      .attr("height", height_heat + margin_heat.top + margin_heat.bottom)
      .append("g")
      .attr("transform", "translate(" + margin_heat.left + "," + margin_heat.top + ")");

  var dayLabels = heat_svg.selectAll(".dayLabel")
      .data(days)
      .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", function (d, i) { return i * gridSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
        .attr("class", function (d, i) {
          return "dayLabel mono axis";
        });
  var timeLabels = heat_svg.selectAll(".timeLabel")
      .data(times)
      .enter().append("text")
        .text(function(d) {
          return d;
        })
        .attr("x", function(d, i) {
          return i * gridSize;
        })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .attr("class", function(d, i) {
          return "timeLabel mono axis";
        });

  if (id_selector === '#heatmap1') {
    heat_svg1 = heat_svg;
  } else {
    heat_svg2 = heat_svg;
  }
}


// Create a custom gradient on the heat map from the subreddit color
var create_color_scale = function(rgb) {
  var orig_red = rgb.r >= 255 ? 255 : rgb.r;
  var orig_green = rgb.g >= 255 ? 255 : rgb.g;
  var orig_blue = rgb.b >= 255 ? 255 : rgb.b;

  var red_step = (255 - orig_red) / 6;
  var green_step = (255 - orig_green) / 6;
  var blue_step = (255 - orig_blue) / 6;

  var cur_red = 255;
  var cur_green = 255;
  var cur_blue = 255;

  var color_scale = []

  color_scale.push("rgb(255, 255, 255)");
  //color_scale.push["rgb(" + red + "," + green + "," + blue + ")"];
  for (var i = 0; i < 5; i++) {
    cur_red = cur_red - red_step;
    cur_green = cur_green - green_step;
    cur_blue = cur_blue - blue_step;
    color_scale.push("rgb(" + Math.round(cur_red) + "," + Math.round(cur_green) + "," + Math.round(cur_blue) + ")");
  }
  color_scale.push["rgb(" + orig_red + "," + orig_green + "," + orig_blue + ")"];

  cur_red = orig_red;
  cur_green = orig_green;
  cur_blue = orig_blue;

  red_step = orig_red / 6;
  green_step = orig_green / 6;
  blue_step = orig_blue / 6;

  for (var i = 0; i < 5; i++) {
    cur_red = cur_red - red_step;
    cur_green = cur_green - green_step;
    cur_blue = cur_blue - blue_step;
    color_scale.push("rgb(" + Math.round(cur_red) + "," + Math.round(cur_green) + "," + Math.round(cur_blue) + ")");
  }
  color_scale.push("rgb(0, 0, 0)");
  return color_scale;
}

var refreshHeatMap = function(id_selector) {

    if (id_selector === '#heatmap1') {
      var heat_svg = heat_svg1;
      var cur_subreddit = cur_subreddit1;
    } else {
      var heat_svg = heat_svg2;
      var cur_subreddit = cur_subreddit2;
    }

    cur_subreddit_data = compare_time_dataset.filter(function(d) {
      return d['subreddit'] == cur_subreddit;
    })

    // We keep track of the color scales for each subreddit, if we don't have it then go make it
    if (!(cur_subreddit in heat_map_colors_lookup)) {
      heat_map_colors_lookup[cur_subreddit] = create_color_scale(d3.rgb(color(cValue(cur_subreddit))))
    }

    heat_svg.selectAll(".scale").remove();
    heat_svg.selectAll(".cur_subreddit").remove();
    heat_svg.selectAll(".heatTitle").remove();

    /*
    heat_svg.append("text")
      .text("Number of comments gradient thresholds")
      .attr("class", "cur_subreddit")
      .attr("x", width_heat / 2 - 130)
      .attr("y", height_heat - 0)
      .style('fill', 'white')
    */

    heat_svg.append("text")
      .attr("x", width_heat / 2 - 5)             
      .attr("y", margin_heat.top - 64)
      .attr("class", "heatTitle")
      .style("font-size", "14px") 
      .style("text-anchor", "middle")
      .attr("fill", "white")
      .text("Time distribution of comments for " + cur_subreddit);

    // Set up the color gradient for the heat map
    var colorScale = d3.scale.quantile()
        .domain([0, d3.max(cur_subreddit_data, function (d) {
          return count_accessor(d);
        })])
        .range(heat_map_colors_lookup[cur_subreddit]);

    var cards = heat_svg.selectAll(".hour")
        .data(cur_subreddit_data, function(d) {
          return d.weekday + ':' + d.hour;
        });

    cards.append("title");

    cards.enter().append("rect")
        .attr("x", function(d) {
          return (d.hour) * gridSize;
        })
        .attr("y", function(d) {
          return (d.weekday) * gridSize;
        })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("class", "hour bordered")
        .attr("width", gridSize)
        .attr("height", gridSize)
        .style("fill", heat_map_colors_lookup[cur_subreddit][0])
        .on("mouseover", function(d) {
          count = count_accessor(d);
          day = dayOfWeekAsString(d['weekday']);
          hour = times[d['hour']];
          nextHour = times[(d['hour'] + 1) % 24];
          tooltip.style("opacity", 1);
          tooltip.html("<center>Comments from " + hour + " to " + nextHour + "<br> on " + day + "s: <b>" + numberWithCommas(count) + "</b></center>")
            .style("left", d3.event.pageX + 5 + "px")
            .style("top", d3.event.pageY + 5 + "px")
        })
        .on("mouseout", function() {
          return tooltip.style("opacity", 0);
        });

    // Animate the colors of the heat map squares as they come in
    cards.style("fill", function(d) {
          return "white"
        })
        .transition().duration(1000)
        .delay(function(d, i) {
          //return count_accessor(d)
          return (Math.random() * 1000) + 100
          //return ((24 * d.weekday) + d.hour) * 10
          //return 6 * i + 2 * d.hour
        })
        .style("fill", function(d) {
          return colorScale(count_accessor(d));
        });

    cards.exit().remove();

    var legend = heat_svg.selectAll(".heatLegend")
        .data([0].concat(colorScale.quantiles()), function(d) { return d; });

    legend.enter().append("g")
      .attr("class", "heatLegend")
      .append("title").html("Gradient colors for number of comments thresholds");

    legend.append("rect")
      .attr("x", function(d, i) {
        return legendElementWidth * i;
      })
      .attr("y", height_heat + 27)
      .attr("width", legendElementWidth)
      .attr("height", gridSize / 2 - 2)
      .style("fill", function(d, i) {
        return heat_map_colors_lookup[cur_subreddit][i];
      });

    legend.append("text")
      .attr("class", "heatLegendLabel scale")
      .style("opacity", 0.25)
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .text(function(d) {
        return "≥" + Math.round(d);
      })
      .attr("x", function(d, i) {
        return legendElementWidth * i + (legendElementWidth / 2);
      })
      .attr("y", height_heat + gridSize + 27)
      .style("text-anchor", "middle");

    legend.exit().remove();

    if (id_selector === '#heatmap1') {
      heat_svg1 = heat_svg;
    } else {
      heat_svg2 = heat_svg;
    } 
};