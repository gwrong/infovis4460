
// Also fade word cloud and heatmap
var highlightMultiples = function(selector, theClass, subreddit, otherSubreddit) {
  highlight(selector, theClass, subreddit)

  d3.selectAll("#" + otherSubreddit + "WordCloud")
    .transition()
    .duration(250)
    .style("opacity", 0.25);

  d3.selectAll("#" + otherSubreddit + "HeatMap")
    .transition()
    .duration(250)
    .style("opacity", 0.25);
}

// Also unfade word cloud and heatmap
var unHighlightMultiples = function(selector, theClass, subreddit, otherSubreddit) {
  unHighlight(selector, theClass, subreddit);

  d3.selectAll("#" + otherSubreddit + "WordCloud")
    .transition()
    .duration(250)
    .style("opacity", 1);

  d3.selectAll("#" + otherSubreddit + "HeatMap")
    .transition()
    .duration(250)
    .style("opacity", 1);
}


// Small multiples constants
var margin_multiples = {top: 25, right: 0, bottom: 10, left: 0};
var width_multiples = 140 - margin_multiples.left - margin_multiples.right;
var height_multiples = 170 - margin_multiples.top - margin_multiples.bottom;
var padding_multiples = 25;
var yAxisPadding_multiples = 40;

var smallMultiplesInit = 0;

var refreshSmallMultiples = function(data, yMultiples) {
  var multiplesData = data;
  // Have the first subreddit be on the left at all times
  if (multiplesData[0].subreddit !== cur_subreddit1) {
    multiplesData.reverse();
  }

  var xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding_multiples, width_multiples + 25], 0.2);
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height_multiples, margin_multiples.top])
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

  // Go through and initialize each small multiples - use counter to know
  // which one we are at. The variable name is on the class name to know
  // which one we modify
  if (smallMultiplesInit < 7) {
    smallMultiplesInit += 1;
    var multiplesPlot = d3.select(".smallMultiples")
      .append("svg")
      .attr("class", "smallMultiplesGraph " + yMultiples)
      .style("width", width_multiples + padding_multiples + "px") // padding with second scatter
      .style("height", height_multiples + margin_multiples.bottom + margin_multiples.top + "px")  //svg defalt size: 300*150
      .append("g")

    // Set up the axes and labels
    multiplesPlot.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height_multiples + ")")
      .attr("fill", "white")
      .call(xAxis)

    // Set up the y axis
    multiplesPlot.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding_multiples + "," + 0 + ")")
      .attr("fill", "white")
      .call(yAxis)

    multiplesPlot.append("text")
      .attr("x", width_multiples - 50)             
      .attr("y", margin_multiples.top - 10)
      .attr("class", "smallMultiplesTitle")
      .style("font-size", "13px") 
      .style("text-anchor", "middle")
      .attr("fill", "white")
      .text(inverseAxisOptions[yMultiples]);
  }

  multiplesPlot = d3.select("." + yMultiples)

  // Scale the data
  xScale.domain(multiplesData.map(function(d) {
    return d['subreddit'];
  }));

  var maxY = d3.max(multiplesData, function(d) {
    return +d[yMultiples + cur_filter];
  })
  yScale.domain([0, maxY]).nice()

  xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  multiplesPlot.select(".smallMultiplesTitle")
    .text(inverseAxisOptions[yMultiples]);

  var smallMultiplesSelection = multiplesPlot.selectAll(".rect")
    .data(multiplesData)

  smallMultiplesSelection.exit().remove();

  smallMultiplesSelection.enter().append("rect")
    .attr("y", function(d) {
      return height_multiples;
    })
    .attr("height", function(d) {
        return 0;
    })
    .attr("class", "rect")
  
  //Create the bars
  smallMultiplesSelection
    .attr("x", function(d) {
      return xScale(d['subreddit']);
    })
    .attr("width", xScale.rangeBand())
    .style("fill", function(d) {
      return color(cValue(d));
    })
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      highlightMultiples(multiplesPlot, ".rect", d['subreddit'], multiplesData[0].subreddit == d['subreddit'] ? cur_subreddit2 : cur_subreddit1)
    })
    .on("mouseout", function(d) {
      unHighlightMultiples(multiplesPlot, ".rect", d['subreddit'], multiplesData[0].subreddit == d['subreddit'] ? cur_subreddit2 : cur_subreddit1)
      return tooltip.style("opacity", 0);
    })
    .transition("grow")
    .duration(2000)
    .attr("y", function(d) {
      return yScale(d[yMultiples + cur_filter]);
    })
    .attr("height", function(d) {
      return height_multiples - yScale(d[yMultiples + cur_filter]);
    })

  // Set up the axes and labels
  multiplesPlot.selectAll("g.x.axis")
    .transition()
    .duration(1000)
    .call(xAxis)

  // Set up the y axis
  multiplesPlot.selectAll("g.y.axis")
    .transition()
    .duration(1000)
    .call(yAxis)

  // No x labels, just use legend
  multiplesPlot.selectAll(".x.axis .tick text").remove()
  multiplesPlot.selectAll(".x.axis .tick").remove()

  multiplesPlot.selectAll(".y.axis .tick text")
  .text(function(d) {
    return abbreviate_thousands(d);
  })
  .style("font-size", "9px");

  // Remove .5 for average word length
  multiplesPlot.selectAll(".y.axis .tick")
  .filter(function(d) {
    if (d.toString().indexOf(".") > -1) {
      return true;
    }
    return false
  }).remove();

}

// Add DOM element placeholder for legend in middle
var smallMultiplesLegendPlaceholder = function() {
  
  multiplesPlot = d3.selectAll(".smallMultiples")
  multiplesPlot.select(".smallMultiplesLegend")
    .remove();

  multiplesPlot.append("svg")
    .attr("class", "smallMultiplesLegend")
    .style("width", width_multiples + padding_multiples + "px") // padding with second scatter
    .style("height", height_multiples + margin_multiples.bottom + margin_multiples.top + "px")  //svg defalt size: 300*150
    .append("g")
}

// Have a small legend at the end which shows the 2 subreddits by color
// They got too small to have a horizontal subreddit label
var refreshSmallMultiplesLegend = function(data) {
  var multiplesData = data;
  var legendSelection = d3.select(".smallMultiplesLegend").selectAll(".smallMultiplesLegendElement")
    .data(multiplesData)

  smallMultiplesPlots = d3.selectAll(".smallMultiplesGraph");


  legendSelection.enter().append("g")
    .attr("class", "smallMultiplesLegendElement")
    .attr("transform", function(d, i) {
      return "translate(" + (padding_multiples - 0) + "," + i * 13 + ")";
    })

  legendSelection.exit().remove();

  legendSelection.append("rect")
      .attr("x", width_multiples - 50)
      .attr("width", 18)
      .attr("height", 14)
      .attr("transform", "translate(0," + 50 + ")")
      .style("fill", function(d) {
        return color(cValue(d));
      })
      .style("opacity", 0)
      .on("mouseover", function(d) {
        highlightMultiples(smallMultiplesPlots, ".rect", d['subreddit'], multiplesData[0].subreddit == d['subreddit'] ? cur_subreddit2 : cur_subreddit1)
      })
      .on("mouseout", function(d) {
        unHighlightMultiples(smallMultiplesPlots, ".rect", d['subreddit'], multiplesData[0].subreddit == d['subreddit'] ? cur_subreddit2 : cur_subreddit1)
      })
      .transition()
      .duration(2000)
      .style("opacity", 1);;

  legendSelection.append("text")
      .attr("x", width_multiples - 55)
      .attr("y", 10)
      .attr("dy", "0em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("transform", "translate(0," + 50 + ")")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("transform", "translate(0," + 50 + ")")
      .text(function(d) {
        return d['subreddit'];
      })
      .style("opacity", 0)
      .on("mouseover", function(d) {
        highlightMultiples(smallMultiplesPlots, ".rect", d['subreddit'], multiplesData[0].subreddit == d['subreddit'] ? cur_subreddit2 : cur_subreddit1)
      })
      .on("mouseout", function(d) {
        unHighlightMultiples(smallMultiplesPlots, ".rect", d['subreddit'], multiplesData[0].subreddit == d['subreddit'] ? cur_subreddit2 : cur_subreddit1)
      })
      .transition()
      .duration(2000)
      .style("opacity", 1);
}