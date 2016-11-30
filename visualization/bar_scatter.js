/*
bar_scatter.js: Just bar/scatter plot specific stuff

100% of this code was written by our team.
*/

// Highlight the chosen subreddit in the graphs (bar/scatter)
var highlight = function(selector, theClass, subreddit) {
  var chosen_subreddit = subreddit;
  selector.selectAll(theClass)
    .filter(function(e) {
      if (e['subreddit'] == chosen_subreddit) {
        return false;
      } else {
        return true;
      }
    })
    .transition()
    .duration(250)
    .delay(function(e, i) {
      return i * 8;
    })
    .style("opacity", 0.25);

  selector.selectAll('.dot')
    .filter(function(e) {
      if (e['subreddit'] == chosen_subreddit) {
        return true;
      } else {
        return false;
      }
    })
    .attr("r", function(e) {
      return circleSize(e) * 2
    });
}

// Make all the subreddits return to normal opacity
var unHighlight = function(selector, theClass, subreddit) {
  var chosen_subreddit = subreddit;
  selector.selectAll(theClass)
    .filter(function(e) {
      if (e['subreddit'] == chosen_subreddit) {
        return false;
      } else {
        return true;
      }
    })
    .transition()
    .duration(250)
    .delay(function(e, i) {
      return i * 8
    })
    .style("opacity", 1)

  selector.selectAll('.dot')
    .filter(function(e) {
      if (e['subreddit'] == chosen_subreddit) {
        return true;
      } else {
        return false;
      }
    })
    .attr("r", function(e) {
      return circleSize(e)
    });
}

// batter = scatter/bar chart
var margin_batter = {top: 25, right: 0, bottom: 115, left: 0};
var width_batter = 1000 - margin_batter.left - margin_batter.right;
var height_batter = 500 - margin_batter.top - margin_batter.bottom;
var scatter_padding = 140;
var bar_padding = 65;
var yAxisPadding = 150;

// Initialize the bar/scatter svg elements
var barchart = d3.select(".barchart")
  .append("svg")
  .style("width", width_batter + bar_padding + "px")
  .style("height", height_batter + margin_batter.bottom + "px")
  .append("g")

var scatterplot = d3.select(".scatterplot")
  .append("svg")
  .style("width", width_batter + scatter_padding + "px")
  .style("height", height_batter + margin_batter.bottom + "px")
  .append("g")

var hasBatterLegend = false;
var barChartInit = false;

var xScale, xAxis, yScale, yAxis;
var refreshBarChart = function(data) {
  // Hide the scatterplot
  d3.select(".scatterplot")
    .style("display", "none")
  d3.select(".barchart")
    .style("display", "inline")
  scatterPlotInit = false;

  // Do some initialization if we haven't
  if (!barChartInit) {
    barChartInit = true;
    xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding, width_batter], 0.15);
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    yScale = d3.scale.linear().range([height_batter, margin_batter.top])
    yAxis = d3.svg.axis().scale(yScale).orient("left");

    // Set up the axes and labels
    barchart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height_batter + ")")
        .attr("fill", "white")
        .call(xAxis)

    // Set up the y axis
    barchart.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + yAxisPadding + "," + 0 + ")")
        .attr("fill", "white")
        .call(yAxis)
        .append("text")
        .attr("class", "yVariable")
        .attr("y", height_batter - 268)
        .attr("x", 0)
        .attr("dy", ".71em")
        .attr("transform", "translate(" + -45 + "," + 75 + ")")
        .attr("fill", "white")
        .style("text-anchor", "end")
        .text(inverseAxisOptions[yVariableBase]);

    barchart.append("text")
      .attr("class", "label subreddit_text")
      .attr("x", width_batter + 35)
      .attr("y", height_batter - 5)
      .attr("fill", "white")
      .attr("transform", "translate(" + (-10) + "," + 20 + ")")
      .style("text-anchor", "end")
      .text("Subreddit");

    // Set the bar chart title
    if (barchart.selectAll(".barTitle").size() < 1) {
      barchart.append("text")
      .attr("x", width_batter / 2 + 50)             
      .attr("y", margin_batter.top - 10)
      .style("font-size", "14px") 
      .style("text-anchor", "middle")
      .attr("fill", "white")
      .attr("class", "barTitle")
      .text(inverseAxisOptions[yVariableBase] + " vs " + inverseAxisOptions[xVariableBase]);
    }
  }

  // Scale the data
  xScale.domain(data.map(function(d) {
    return d['subreddit'];
  }));

  var minY = d3.min(data, function(d) {
    return +d[yVariable];
  })
  var maxY = d3.max(data, function(d) {
    return +d[yVariable];
  })
  minY = 0;
  yScale.domain([minY, maxY]).nice();

  xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  barchart.select(".barTitle")
    .text(inverseAxisOptions[yVariableBase] + " vs " + inverseAxisOptions[xVariableBase]);

  //Create the bars
  var barDataSelection = barchart.selectAll(".rect")
    .data(data);

  var popupToggled = false;

  barDataSelection.exit().remove();

  barDataSelection.enter().append("rect")
    .attr("y", function(d) {
      return height_batter;
    })
    .attr("height", function(d) {
        return 0;
    })
    .attr("fill", function() {
      return "hsl(" + Math.random() * 360 + ",100%,50%)"
    });
  
  barDataSelection.attr("class", "rect subreddit")
    .attr("x", function(d) {
      return xScale(d['subreddit']);
    })
    .attr("width", xScale.rangeBand())
    .on("mouseover", function(d) {
      tooltip.style("opacity", .9);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      highlight(barchart, '.rect', d['subreddit'])
    })
    .on("mouseout", function(d) {
      unHighlight(barchart, '.rect', d['subreddit'])
      tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d['subreddit']);
    })
    .transition("grow")
    .duration(2500)
    .attr("height", function(d) {
      return height_batter - yScale(d[yVariable]);
    })
    .attr("y", function(d) {
      return yScale(d[yVariable]);
    })
    .style("fill", function(d) {
      return color(cValue(d));
    })
    .style("stroke", function(d) {
      if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
        return "white"
      } else {
        return color(cValue(d));
      }
    })
    .style("stroke-width", function(d) {
      if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
        return 1;
      } else {
        return 0;
      }
    });

  // Set up the axes and labels
  barchart.selectAll("g.x.axis")
    .transition()
    .duration(1000)
    .call(xAxis)

  // Set up the y axis
  barchart.selectAll("g.y.axis")
    .transition()
    .duration(1000)
    .call(yAxis)

  // Rotate labels so they are easier to read
  barchart.selectAll(".x.axis .tick text")
    .attr("transform", "translate(" + 10 + "," + 5 + ") rotate(50)")
    .style("text-anchor", "start")
    .on("mouseover", function(subreddit) {
      d = data[indexOfSubreddit(data, subreddit)]
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      highlight(barchart, '.rect', subreddit)
    })
    .on("mouseout", function(subreddit) {
      unHighlight(barchart, '.rect', subreddit)
      return tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d);
    })
    .style("fill", function(d) {
      if (d == cur_subreddit1 || d == cur_subreddit2) {
        return "gold"
      } else {
        return "white";
      }
    });

  // Abbreviate the axis labels so they are prettier
  barchart.selectAll(".y.axis .tick text")
      .text(function(d) {
        return abbreviate_thousands(d);
      })

  barchart.selectAll(".yVariable")
    .text(inverseAxisOptions[yVariableBase])
    .call(wrap, 100) // Wrap the y axis labels if too long
}

// Makes the scatterplot legend
// Used to also make the bar chart legend, but we removed that
var makeBatterLegend = function(data, selector, element) {

  // Enter/update/exit with legend gets really finicky
  selector.selectAll(".legend")
    .remove();

  // Have scatterplot in alphabetical order
  data.sort(function (a, b) {
    return a['subreddit'].toLowerCase().localeCompare(b['subreddit'].toLowerCase());
  });
  
  var legendSelection = selector.selectAll(".legend")
    .data(data)

  legendSelection.enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      return "translate(" + (scatter_padding - 0) + "," + i * 13 + ")";
    })

  // Little rectangles on the legend for each subreddit
  legendSelection.append("rect")
      .attr("x", width_batter - 20)
      .attr("width", 18)
      .attr("height", 14)
      .attr("transform", "translate(0," + 25 + ")")
      .style("fill", function(d) {
        return color(cValue(d));
      })
      .style("stroke", function(d) {
        if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
          return "white"
        } else {
          return color(cValue(d));
        }
      })
      .style("stroke-width", function(d) {
        if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
          return 1;
        } else {
          return 0;
        }
      })
      .style("opacity", 0)
      .on("mouseover", function(d) {
        highlight(selector, element, d['subreddit'])
      })
      .on("mouseout", function(d) {
        unHighlight(selector, element, d['subreddit'])
      })
      .on("click", function(d) {
        onclick_compare(d['subreddit']);
      })
      .transition()
      .duration(2000)
      .style("opacity", 1);

  legendSelection.append("text")
      .attr("x", width_batter - 23)
      .attr("y", 9)
      .attr("dy", "0em")
      .attr("fill", function(d) {
        if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
          return "gold"
        } else {
          return "white";
        }
      })
      .style("text-anchor", "end")
      .attr("transform", "translate(0," + 25 + ")")
      .text(function(d) {
        return d['subreddit'];
      })
      .style("opacity", 0)
      .on("mouseover", function(d) {
        highlight(selector, element, d['subreddit'])
      })
      .on("mouseout", function(d) {
        unHighlight(selector, element, d['subreddit'])
      })
      .on("click", function(d) {
        onclick_compare(d['subreddit']);
      })
      .transition()
      .duration(2000)
      .style("opacity", 1);
}

var scatterPlotInit = false;

var scatterPlot = function(data) {

  // Do the initial scatter plot stuff
  if (!scatterPlotInit) {
    scatterPlotInit = true;
    xScale = d3.scale.linear().range([yAxisPadding, width_batter - 20])
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

    yScale = d3.scale.linear().range([height_batter, margin_batter.top])
    yAxis = d3.svg.axis().scale(yScale).orient("left");

    // Do the axes like we did with the bar chart
    scatterplot.append("g")
      .attr("class", "x axis scatterX")
      .attr("transform", "translate(0," + height_batter + ")")
      .attr("fill", "white")
      .call(xAxis)
    .append("text")
      .attr("class", "label")
      .attr("x", width_batter / 2 + 125)
      .attr("y", 40)
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("class", "xVariable")
      .text(inverseAxisOptions[xVariableBase]);

    scatterplot.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding + ",0)")
      .attr("fill", "white")
      .call(yAxis)
    .append("text")
      .attr("class", "label yVariable")
      .attr("transform", "translate(" + -45 + "," + 160 + ")")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("class", "yVariable")
      .text(inverseAxisOptions[yVariableBase]);


    scatterplot.append("text")
      .attr("x", width_batter / 2 + 100)             
      .attr("y", margin_batter.top - 10)
      .style("font-size", "14px") 
      .style("text-anchor", "middle")
      .attr("fill", "white")
      .attr("class", "scatterTitle")
      .text(inverseAxisOptions[yVariableBase] + " vs " + inverseAxisOptions[xVariableBase]);
  }

  // Hide the bar chart
  d3.select(".barchart")
    .style("display", "none")
  d3.select(".scatterplot")
    .style("display", "inline")
  barChartInit = false;

  // Now create the scales for the scatterplot
  // Don't have min at 0, otherwise the dots get too cluttered
  var minX = d3.min(data, function(d) {
    return +d[xVariable];
  })
  minX *= 0.9
  var maxX = d3.max(data, function(d) {
    return +d[xVariable];
  })
  maxX *= 1.1
  xScale.domain([0, maxX]);

  var minY = d3.min(data, function(d) {
    return +d[yVariable];
  })
  minY *= 0.75
  var maxY = d3.max(data, function(d) {
    return +d[yVariable];
  })
  yScale.domain([0, maxY]).nice();

  xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  // Set up the axes and labels
  scatterplot.selectAll("g.x.axis")
    .transition()
    .duration(1000)
    .call(xAxis)

  // Set up the y axis
  scatterplot.selectAll("g.y.axis")
    .transition()
    .duration(1000)
    .call(yAxis)

  scatterplot.selectAll("text")
    .text(function(d) {
      return abbreviate_thousands(d);
    })

  //Create the bars
  var scatterSelection = scatterplot.selectAll(".dot")
    .data(data)

  // Do some wacky exit animations
  scatterSelection.exit()
    .transition("disappear")
    .duration(1500)
    .style("opacity", 0)
    .attr("cx", function(d) {
      return Math.random() * (width_batter - 100) + 100;
    })
    .attr("cy", function(d) {
      return Math.random() * (height_batter - 15);
    })
    .remove();

  scatterSelection.enter().append("circle")
    .attr("fill", function() {
      return "hsl(" + Math.random() * 360 + ", 100%, 50%)"
    })
    .attr("cx", function(d) {
      return Math.random() * (width_batter - 100) + 100;
    })
    .attr("cy", function(d) {
      return Math.random() * (height_batter - 15);
    })
    .style("opacity", 0)

  scatterplot.select(".scatterTitle")
    .text(inverseAxisOptions[yVariableBase] + " vs " + inverseAxisOptions[xVariableBase]);

  scatterSelection.attr("class", "dot")
    .attr("r", circleSize)
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      d3.select(this).attr("r", circleSize(d) * 2)
      highlight(scatterplot, ".dot", d['subreddit'])
    })
    .on("mouseout", function(d) {
      d3.select(this).attr("r", circleSize(d))
      unHighlight(scatterplot, ".dot", d['subreddit'])
      return tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d['subreddit']);
    })
    .transition("scatter")
    .duration(2000)
    .style("fill", function(d) {
        return color(cValue(d));
    })
    .style("stroke", function(d) {
      if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
        return "white"
      } else {
        return "none";
      }
    })
    .style("stroke-width", function(d) {
      if (d.subreddit == cur_subreddit1 || d.subreddit == cur_subreddit2) {
        return 2;
      } else {
        return 0;
      }
    })
    .attr("cx", function(d) {
      return xScale(d[xVariable])
    })
    .attr("cy", function(d) {
      return yScale(d[yVariable])
    })
    .style("opacity", 1);

    scatterplot.selectAll(".yVariable")
      .text(inverseAxisOptions[yVariableBase])
      .call(wrap, 100)
    scatterplot.selectAll(".xVariable")
      .text(inverseAxisOptions[xVariableBase])

  makeBatterLegend(data, scatterplot, '.dot')
}
