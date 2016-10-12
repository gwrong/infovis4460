var margin = {top: 25, right: 0, bottom: 125, left: 0};
var width = 700 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var padding = 120;
var yAxisPadding = 100;

// Circle size will vary on the scatterplot
var circleSize = function(d) {
  return Math.log(d['num_comments']) / 2;
}

var color = d3.scale.category20();
var cValue = function(d) {
  return d['subreddit'];
}

// Prepare tooltip for the scatterplot
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var subsetSuffix = ''
var xVariableLabel = 'Subreddit'
var xVariable = 'subreddit' + subsetSuffix
var yVariableLabel = 'Number of Comments'
var yVariable = 'num_comments' + subsetSuffix

var axisOptions = {
  'Subreddit': 'subreddit',
  'Number of Comments': 'num_comments',
  'Positive Score': 'positive_score',
  'Negative Score': 'negative_score'
}

// Called if a different axis variable is chosen
var axisChange = function(picker, options, axis) {
    var selectedIndex = picker.property('selectedIndex')
    var selected = options[0][selectedIndex].__data__;
    var varName = axisOptions[selected]
    var prevX = xVariable
    var prevY = yVariable
    if (axis === 'x') {
      xVariableLabel = selected
      xVariable = varName + subsetSuffix
      console.log(xVariable)
    } else {
      yVariableLabel = selected
      yVariable = varName + subsetSuffix
    }
    if (prevX != xVariable || prevY != yVariable) {
      refresh()
    }
}


//Add the select list for department filtering
var xPicker = d3.select(".xPicker")
    .append("select")
    .attr("class", "xDropdown")

//Add the select list for department filtering
var yPicker = d3.select(".yPicker")
    .append("select")
    .attr("class", "yDropdown")

//Load select items from the CSV (departments)
var xDrop = xPicker.selectAll("option")
    .data(Object.keys(axisOptions))
    .enter()
    .append("option");

//Load select items from the CSV (departments)
var yDrop = yPicker.selectAll("option")
    .data(Object.keys(axisOptions))
    .enter()
    .append("option");

xPicker.on("change", function() {
    axisChange(xPicker, xDrop, 'x')
  })
yPicker.on("change", function() {
    axisChange(yPicker, yDrop, 'y')
  })

//Define the option items
xDrop.text(function(d) {
  return d;
})
.attr("value", function(d) {
  return d;
})
.property("selected", function(d) {
  return d === xVariableLabel;
})

//Define the option items
yDrop.text(function(d) {
  return d;
})
.attr("value", function(d) {
  return d;
})
.property("selected", function(d) {
  return d === yVariableLabel;
})

// Refreshes all the data on the screen
var refresh = function() {
  removeCharts()
}

// Removes existing charts
var removeCharts = function() {
  var charts = d3.selectAll("svg")
  console.log(charts.size())
  if (charts.size() > 0) {
    charts.call(prepareRemoveAnimation)
      .transition()
      .duration(1000)
      .style('opacity', 0)
      .each("end", removeAnimation)
  } else {
    createCharts()
  }
}

// Constructs the charts to be shown
var createCharts = function() {
  // Actually load our data
  d3.csv("reddit_RC_2016-01.csv", function(error, data) {
    data.forEach(function(d) {
      keys = Object.keys(d)
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] != 'subreddit') {
          d[keys[i]] = +d[keys[i]]
        }
      }
    });
    data = data.filter(function(d, i) {
      return i < 25
    })
    if (xVariable == 'subreddit') {
      barChart(data)
    } else {
      scatterPlot(data)
    }
  });
}

function prepareRemoveAnimation(selection) {
  counter = selection.size();
}
function removeAnimation() {
  counter--;
  console.log(counter)
  if (counter == 0) {
    d3.selectAll("svg").remove()
    createCharts()
  }
}

function indexOfSubreddit(data, subreddit) {
  for (var i = 0; i < data.length; i++) {
    if (data[i]['subreddit'] == subreddit) {
      return i
    }
  }
  return -1
}

var barChart = function(data) {
  // Create the scales for the bar chart
  var xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding, width - 10], 0.15);
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height, 0])
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

  // Left bar chart
  var barChart = d3.select("body")
  .append("svg")
  .style("width", width + padding + "px") // padding with second scatter
  .style("height", height + margin.bottom + "px")  //svg defalt size: 300*150
  .append("g")

  // Scale the data
  xScale.domain(data.map(function(d) {
    return d['subreddit'];
  }));

  var minY = d3.min(data, function(d) {
    return +d[yVariable];
  }) - 5
  var maxY = d3.max(data, function(d) {
    return +d[yVariable];
  }) + 4
  console.log(maxY)
  yScale.domain([minY, maxY]);

  // Set up the axes and labels
  barChart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .attr("fill", "white")
      .call(xAxis)

  // Rotate labels so they are easier to read
  barChart.selectAll("text")
    .attr("transform", "translate(" + 12 + "," + 5 + ") rotate(70)")
    .style("text-anchor", "start")
    .on("mouseover", function(subreddit) {
      d = data[indexOfSubreddit(data, subreddit)]
      tooltip.style("opacity", 1);
      tooltip.html(d["subreddit"] + "<br/>" 
        + 'Number of Comments: ' + d["num_comments"] + "<br/>"
        + 'Average Word Length: ' + d["avg_word_length"] + "<br/>"
        + 'Words Per Comment: ' + d["avg_words_per_comment"] + "<br/>"
        + 'Positive Score: ' + d["positive_score"] + "<br/>"
        + 'Negative Score: ' + d["negative_score"] + "<br/>"
        + 'Godwin\'s Score: ' + d["godwins_score"])
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })

  barChart.append("text")
      .attr("class", "label")
      .attr("x", width + 35)
      .attr("y", height - 5)
      .attr("fill", "white")
      .attr("transform", "translate(" + (-width + 30) + "," + 40 + ")")
      .style("text-anchor", "end")
      .text("Subreddit");

  // Set up the y axis
  barChart.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding + "," + 0 + ")")
      .attr("fill", "white")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("y", height - 35)
      .attr("x", 0)
      .attr("dy", ".71em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text(yVariable);
  //.attr("transform", "rotate(-90)")
  //Create the bars
  barChart.selectAll(".rect")
    .data(data)
    .enter().append("rect")
    .attr("class", "rect")
    .attr("y", function(d) {
      return yScale(d[yVariable]);
    })
    .attr("x", function(d) {
      return xScale(d['subreddit']);
    })
    .attr("width", xScale.rangeBand())
    .attr("height", function(d) {
        return height - yScale(d[yVariable]);
    })
    .style("fill", function(d) {
      return color(cValue(d));
    })
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(d["subreddit"] + "<br/>" 
        + 'Number of Comments: ' + d["num_comments"] + "<br/>"
        + 'Average Word Length: ' + d["avg_word_length"] + "<br/>"
        + 'Words Per Comment: ' + d["avg_words_per_comment"] + "<br/>"
        + 'Positive Score: ' + d["positive_score"] + "<br/>"
        + 'Negative Score: ' + d["negative_score"] + "<br/>"
        + 'Godwin\'s Score: ' + d["godwins_score"])
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
    .on("mouseout", function() {
      return tooltip.style("opacity", 0);
    });

  // Legend shows us the manufacturer
  var legend = barChart.selectAll(".legend")
      .data(color.domain())
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
        return "translate(" + (padding - 0) + "," + i * 12 + ")";
      });

  legend.append("rect")
      .attr("x", width - 20)
      .attr("width", 18)
      .attr("height", 18)
      .attr("transform", "translate(0," + 0 + ")")
      .style("fill", color);

  legend.append("text")
      .attr("x", width - 23)
      .attr("y", 9)
      .attr("dy", ".35em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("transform", "translate(0," + 0 + ")")
      .text(function(d) { return d;});

}

var scatterPlot = function(data) {
  // Right scatter plot
  var scatter = d3.select("body")
  .append("svg")
  .style("width", width + "px")
  .style("height", height + margin.bottom + "px")  //svg defalt size: 300*150
  .append("g")


  // Now create the scales for the scatterplot
  var xScale = d3.scale.linear().range([yAxisPadding, width - 20])
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height, 0])
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

  var minX = d3.min(data, function(d) {
    return +d[xVariable];
  })
  minX *= 0.9
  var maxX = d3.max(data, function(d) {
    return +d[xVariable];
  })
  maxX *= 1.1
  xScale.domain([minX, maxX]);

  var minY = d3.min(data, function(d) {
    return +d[yVariable];
  })
  minY *= 0.9
  var maxY = d3.max(data, function(d) {
    return +d[yVariable];
  })
  maxY *= 1.1
  yScale.domain([minY, maxY]);

  // Do the axes like we did with the bar chart
  scatter.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .attr("fill", "white")
    .call(xAxis)
  .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .attr("fill", "white")
    .style("text-anchor", "end")
    .text(xVariable);

  scatter.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding + ",0)")
      .attr("fill", "white")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text(yVariable);


  // Draw out the scatterplot
  scatter.selectAll(".dot")
    .data(data)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", circleSize)
    .attr("cx", function(d) {
      return xScale(d[xVariable])
    })
    .attr("cy", function(d) {
      return yScale(d[yVariable])
    })
    .style("fill", function(d) {
      return color(cValue(d));
    })
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(d["subreddit"] + "<br/>" 
        + 'Positive Score: ' + d["positive_score"] + "<br/>"
        + 'Negative Score: ' + d["negative_score"] + "<br/>"
        + 'Godwin\'s Score: ' + d["godwins_score"])
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
}

refresh()

