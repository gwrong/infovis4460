var margin = {top: 25, right: 0, bottom: 125, left: 0};
var width = 600 - margin.left - margin.right;
var height = 650 - margin.top - margin.bottom;
var padding = 120;
var yAxisPadding = 50;

// Circle size will vary on the scatterplot
var circleSize = function(d) {
  return Math.log(d['num_comments']) / 2;
}

// Create the scales for the bar chart
var xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding, width - 10], 0.15);
var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

var yScale = d3.scale.linear().range([height, 0])
var yAxis = d3.svg.axis().scale(yScale).orient("left");

var color = d3.scale.category20();
var cValue = function(d) {
  return d['subreddit'];
}

// Prepare tooltip for the scatterplot
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Left bar chart
var barChart = d3.select("body")
.append("svg")
.style("width", width + padding + "px") // padding with second scatter
.style("height", height + margin.bottom + "px")  //svg defalt size: 300*150
.append("g")

// Right scatter plot
var scatter = d3.select("body")
.append("svg")
.style("width", width + "px")
.style("height", height + margin.bottom + "px")  //svg defalt size: 300*150
.append("g")

// Actually load our data
d3.csv("reddit_august_2016.csv", function(error, data) {

  // Scale the data
  xScale.domain(data.map(function(d) {
    return d['subreddit'];
  }));

  var minY = d3.min(data, function(d) {
    return d['positive_score'];
  }) - 5
  var maxY = d3.max(data, function(d) {
    return d['positive_score'];
  }) + 4
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

  barChart.append("text")
      .attr("class", "label")
      .attr("x", width + 35)
      .attr("y", height - 5)
      .attr("fill", "white")
      .attr("transform", "translate(" + 0 + "," + 0 + ")")
      .style("text-anchor", "end")
      .text("Subreddit");

  // Set up the y axis
  barChart.append("g")
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
      .text("Positive Scores");

  //Create the bars
  barChart.selectAll(".rect")
    .data(data)
    .enter().append("rect")
    .attr("class", "rect")
    .attr("y", function(d) {
      return yScale(d['positive_score']);
    })
    .attr("x", function(d) {
      return xScale(d['subreddit']);
    })
    .attr("width", xScale.rangeBand())
    .attr("height", function(d) {
        return height - yScale(d['positive_score']);
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


  // Now create the scales for the scatterplot
  xScale = d3.scale.linear().range([yAxisPadding, width - 20])
  xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  yScale = d3.scale.linear().range([height, 0])
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  var minX = d3.min(data, function(d) {
    return +d['negative_score'];
  }) - 5
  var maxX = d3.max(data, function(d) {
    return +d['negative_score'];
  }) + 5
  xScale.domain([minX, maxX]);

  var minY = d3.min(data, function(d) {
    return +d['godwins_score'];
  }) - 100
  var maxY = d3.max(data, function(d) {
    return +d['godwins_score'];
  }) + 100
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
    .text("Negative Score");

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
      .text("Godwin's score");

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


  // Draw out the scatterplot
  scatter.selectAll(".dot")
    .data(data)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", circleSize)
    .attr("cx", function(d) {
      return xScale(d['negative_score'])
    })
    .attr("cy", function(d) {
      return yScale(d['godwins_score'])
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
});