var cur_dataset = null;
var cur_time_dataset = null;
var cur_subreddit = null;
var cur_subreddit1 = null;
var cur_subreddit2 = null;
var cur_filter = null;
var cur_filter_label = null;
var initialized_heatmap = false;
var sort_by = null;
var cur_chosen_subreddits = null;
var initialized_pickers = false;

var subreddit_subsets = {
  'Top 25': [
    'relationships',
    'gifs',
    'nba',
    'GlobalOffensive',
    'wow',
    'nfl',
    'todayilearned',
    'gaming',
    'pcmasterrace',
    'soccer',
    'pics',
    'movies',
    'videos',
    'DotA2',
    'funny',
    'news',
    'SquaredCircle',
    'worldnews',
    'leagueoflegends',
    'The_Donald',
    'Overwatch',
    'pokemongo',
    'NoMansSkyTheGame',
    'politics',
    'AskReddit',
  ],
  'Political': [
    'politics',
    'The_Donald',
    'Libertarian',
    'Anarchism',
    'socialism',
    'progressive',
    'Conservative',
    'democrats',
    'Republican',
    'hillaryclinton',
  ],
  'Science, History, Technology': [
    'science',
    'askscience',
    'space',
    'Astronomy',
    'gadgets',
    'Futurology',
    'technology',
    'Android',
    'iphone',
    'history',
    'AskHistorians',
    'engineering',
  ],
  'University': [
    'rit',
    'ucla',
    'berkeley',
    'UIUC',
    'VirginiaTech',
    'RPI',
    'rutgers',
    'aggies',
    'gatech',
    'UCSantaBarbara',
    'msu',
    'uofm',
    'UCSD',
    'UVA',
    'uofmn',
  ],
  'Miscellaneous': [
    'meirl',
    'nosleep',
    'woahdude',
    'DeepIntoYouTube',
    'SubredditSimulator',
    'depression',
    'cringe',
    'Showerthoughts',
    'travel',
    'wikipedia',
  ],
  'Sports': [
    'nba',
    'soccer',
    'hockey',
    'nfl',
    'NASCAR',
    'formula1',
    'baseball',
    'tennis',
    'golf',
    'MMA',
    'Archery',
    'Boxing',
    'lacrosse',
    'Cricket',
    'SquaredCircle',
    'fantasyfootball',
    'olympics',
    'tabletennis',
    'Bowling',
    'volleyball',
  ]
}

var all_subreddits = [];
var subset_keys = Object.keys(subreddit_subsets);
for (var i = 0; i < subset_keys.length; i++) {
  all_subreddits = all_subreddits.concat(subreddit_subsets[subset_keys[i]])
}

var dataset_labels = {
  'January 2016': "reddit_RC_2016-01.csv",
  'February 2016': "reddit_RC_2016-02.csv",
  'March 2016': "reddit_RC_2016-03.csv",
  'April 2016': "reddit_RC_2016-04.csv",
  'May 2016': "reddit_RC_2016-05.csv",
  'June 2016': "reddit_RC_2016-06.csv",
  'July 2016': "reddit_RC_2016-07.csv",
  'August 2016': "reddit_RC_2016-08.csv",
}

var time_dataset_labels = {
  'January 2016': "reddit_RC_2016-01_time_series.csv",
  'February 2016': "reddit_RC_2016-02_time_series.csv",
  'March 2016': "reddit_RC_2016-03_time_series.csv",
  'April 2016': "reddit_RC_2016-04_time_series.csv",
  'May 2016': "reddit_RC_2016-05_time_series.csv",
  'June 2016': "reddit_RC_2016-06_time_series.csv",
  'July 2016': "reddit_RC_2016-07_time_series.csv",
  'August 2016': "reddit_RC_2016-08_time_series.csv",
}

var filter_labels = {
  'All Comments': '',
  'Top Score Comments': '_topcom',
  'Bottom Score Comments': '_botcom',
  'Most Popular Authors': '_topauth',
  'Top Positive Comments': '_toppos',
  'Top Negative Comments': '_topneg',
  'Top Godwin Comments': '_topgod',

}
var time_datasets = ["reddit_RC_2016-08_time_series.csv", "reddit_RC_2016-01_time_series.csv"];
var datasets = ["reddit_RC_2016-08.csv", "reddit_RC_2016-01.csv"];
var filters = [
  'count',
  'count_topcom',
  'count_botcom',
  'count_topauth',
  'count_toppos',
  'count_topneg',
  'count_topgod'
]
var subreddits = [];

// Circle size will vary on the scatterplot
var circleSize = function(d) {
  return Math.log(d['num_comments'] / 100) * 0.8;
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
var xVariableBase = 'subreddit'
var xVariable = 'subreddit'
var yVariableLabel = 'Number of Comments'
var yVariableBase = 'num_comments'
var yVariable = 'num_comments'

var axisOptions = {
  'Subreddit': 'subreddit',
  'Average Word Length': 'avg_word_length',
  'Average Comment Length': 'avg_words_per_comment',
  'Number of Comments': 'num_comments',
  'Positive Score': 'positive_score',
  'Negative Score': 'negative_score',
  'Godwin\'s Score': 'godwins_score',
  'Swear Score': 'swear_score',
}

var inverseAxisOptions = {
  'subreddit': 'Subreddit',
  'avg_word_length': 'Average Word Length',
  'avg_words_per_comment': 'Average Comment Length',
  'num_comments': 'Number of Comments',
  'positive_score': 'Positive Score',
  'negative_score': 'Negative Score',
  'godwins_score': 'Godwin\'s Score',
  'swear_score': 'Swear Score',
}

var cntrlIsPressed = false;
$(document).keydown(function(event) {
    if (event.which == "17")
        cntrlIsPressed = true;
});

$(document).keyup(function() {
    cntrlIsPressed = false;
});

//Shorten long subreddit names if needed
var abbreviateSubreddit = function(subreddit) {
  if (subreddit.length > 9) {
    return subreddit.substring(0, 8) + "...";
  } else {
    return subreddit
  }
  
}

// Called if a different axis variable is chosen
var axisChange = function(picker, options, axis) {
    var selectedIndex = picker.property('selectedIndex')
    var selected = options[0][selectedIndex].__data__;
    var varName = axisOptions[selected]
    var prevX = xVariable
    var prevY = yVariable
    if (axis === 'x') {
      xVariableLabel = selected;
      xVariableBase = varName;
      xVariable = xVariableBase
      if (xVariable != 'subreddit') {
        xVariable = xVariable + cur_filter;
        d3.selectAll(".sorter-button")
          .style("display", "none");
      } else {
        d3.selectAll(".sorter-button")
          .style("display", "inline");
      }
    } else {
      yVariableLabel = selected;
      yVariableBase = varName;
      yVariable = yVariableBase + cur_filter
    }
    if (prevX != xVariable || prevY != yVariable) {
      refresh()
    }
}

d3.selectAll(".sorter")
  .append("input")
  .attr("value", "Sort Data")
  .attr("type", "button")
  .attr("class", "sorter-button btn btn-primary")
  .on("click", function() {
    sort_by = yVariable;
    refresh()
  })

//Add the select list for department filtering
var xPicker = d3.select(".xPicker")
    .append("select")
    .attr("class", "xDropdown form-control sameLine")
    .attr("style", "margin-left: 15px")

//Add the select list for department filtering
var yPicker = d3.select(".yPicker")
    .append("select")
    .attr("class", "yDropdown form-control sameLine")
    .attr("style", "margin-left: 15px")

//Load select items from the CSV (departments)
var xDrop = xPicker.selectAll("option")
    .data(Object.keys(axisOptions))
    .enter()
    .append("option");

//Load select items from the CSV (departments)
var yDrop = yPicker.selectAll("option")
    .data(Object.keys(axisOptions).filter(function(d) {
      return d != 'Subreddit';
    }))
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

var wordcloud1 = d3.select(".wordcloud1Container")
    .append("img")
    .attr("class", "wordcloud1")
    .attr("src", "RC_2016-08/" + cur_subreddit2)

var wordcloud2 = d3.select(".wordcloud2Container")
    .append("img")
    .attr("class", "wordcloud2")
    .attr("src", "RC_2016-08/" + cur_subreddit1)

// Refreshes all the data on the screen
var refresh = function() {
  createCharts()
}

// Constructs the charts to be shown
var createCharts = function() {
  if (cur_dataset == null) {
    cur_dataset = datasets[0];
  }

  // Actually load our data
  d3.csv(cur_dataset, function(error, data) {
    data.forEach(function(d) {
      keys = Object.keys(d)
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] != 'subreddit') {
          d[keys[i]] = +d[keys[i]]
        }
      }
    });
    if (cur_chosen_subreddits == null) {
      cur_chosen_subreddits = subreddit_subsets["Top 25"];
    }
    data = data.filter(function(d, i) {
      return cur_chosen_subreddits.indexOf(d['subreddit']) > -1;
    })


    if (sort_by == null) {
      sort_by = 'subreddit';
    }
    if (sort_by === 'subreddit') {
      data.sort(function(a, b) {
        return a[sort_by].localeCompare(b[sort_by]);
      })
    } else {
      data.sort(function(a, b) {
        return b[sort_by] - a[sort_by];
      })
    }
    
    subreddits = [];
    data.forEach(function(d) {
      subreddits.push(d['subreddit']);
    });
    
    if (cur_time_dataset == null) {
      cur_time_dataset = time_datasets[0];
    }
    if (cur_subreddit == null) {
      cur_subreddit = subreddits[0];
    }
    if (cur_subreddit1 == null) {
      cur_subreddit1 = subreddits[0];
    } 
    if (cur_subreddit2 == null) {
      cur_subreddit2 = subreddits[1];
    }

    d3.select(".wordcloud1")
      .attr("src", "RC_2016-08/" + cur_subreddit1 + "_wordcloud.png")

    d3.select(".wordcloud1Title")
      .html("Word cloud for " + cur_subreddit1)

    d3.select(".wordcloud2")
      .attr("src", "RC_2016-08/" + cur_subreddit2 + "_wordcloud.png")

    d3.select(".wordcloud2Title")
      .html("Word cloud for " + cur_subreddit2)



    if (cur_filter == null) {
      cur_filter_label = 'All Comments';
      cur_filter = filter_labels[cur_filter_label];
    }
    if (!initialized_pickers) {
      initialized_pickers = true;
      initialize_pickers();
    }

    d3.select(".toggleSubreddits").selectAll("option")
      .property("selected", function(d) {
        if (cur_chosen_subreddits.indexOf(d) > -1) {
          console.log(d)
          return true;
        } else {
          return false;
        }
      })

    if (xVariable == 'subreddit') {
      refreshBarChart(data)
    } else {
      scatterPlot(data)
    }
    clearSmallMultiples();
    var keys = Object.keys(axisOptions);
    for (var i = 0; i < keys.length; i++) {
      if (axisOptions[keys[i]] !== 'subreddit') {
        refreshSmallMultiples(data, axisOptions[keys[i]])
      }
    }
    
    if (!initialized_heatmap) {
      initialized_heatmap = true;
      createHeatMap("#heatmap1");
      createHeatMap("#heatmap2");
    }
    refreshHeatMap("#heatmap1");
    refreshHeatMap("#heatmap2");


  });
}



var initialize_pickers = function() {

  subreddit_toggle = d3.select(".toggleSubreddits").selectAll("option")
  .data(all_subreddits)
  .enter()
  .append("option")
  .attr("value", function(d) {
    return d;
  })
  .html(function(d) {
    return d;
  })

  d3.select(".toggleSubreddits").attr("size", all_subreddits.length / 4)

  //http://stackoverflow.com/questions/2096259/how-to-toggle-selection-of-an-option-in-a-multi-select-with-jquery 
  $("select[multiple] option").mousedown(function(){
    var $self = $(this);

    var subreddit = $self[0].__data__

    if ($self.prop("selected")) {
      var index = cur_chosen_subreddits.indexOf(subreddit);
      if (index > -1) {
        cur_chosen_subreddits.splice(index, 1);
      }
      $self.prop("selected", false);
    } else {
      cur_chosen_subreddits.push(subreddit)
      $self.prop("selected", true);
    }
    refresh()
    return false;
  });

  $('#month-name').text('Dataset: August 2016')
  $('#filter-name').text('Filter: ' + cur_filter_label)

  var subredditsubsetpicker = d3.select("#subredditsubset-picker").selectAll(".subredditsubset-button")
    .data(Object.keys(subreddit_subsets));

  subredditsubsetpicker.enter()
    .append("input")
    .attr("value", function(d){ return "" + d })
    .attr("type", "button")
    .attr("class", "dataset-button btn btn-primary")
    .on("click", function(subreddit_subset) {
      cur_chosen_subreddits = subreddit_subsets[subreddit_subset];
      cur_subreddit1 = cur_chosen_subreddits[0]
      cur_subreddit2 = cur_chosen_subreddits[1]
      refresh();
    });

  var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
    .data(Object.keys(dataset_labels));

  datasetpicker.enter()
    .append("input")
    .attr("value", function(d){ return "" + d })
    .attr("type", "button")
    .attr("class", "dataset-button btn btn-primary")
    .on("click", function(month) {
      cur_time_dataset = time_dataset_labels[month]
      cur_dataset = dataset_labels[month]
      $('#month-name').text('Dataset: ' + month)
      refresh();
    });

  var filterpicker = d3.select("#filter-picker").selectAll(".filter-button")
    .data(Object.keys(filter_labels));

  filterpicker.enter()
    .append("input")
    .attr("value", function(d) {
      return "" + d
    })
    .attr("type", "button")
    .attr("class", "filter-button btn btn-primary")
    .on("click", function(d) {
      cur_filter_label = d;
      cur_filter = filter_labels[cur_filter_label];
      if (xVariable != 'subreddit') {
        xVariable = xVariableBase + cur_filter;
      }
      yVariable = yVariableBase + cur_filter
      $('#filter-name').text('Filter: ' + cur_filter_label);
      refresh();
    });
}

function indexOfSubreddit(data, subreddit) {
  for (var i = 0; i < data.length; i++) {
    if (data[i]['subreddit'] == subreddit) {
      return i
    }
  }
  return -1
}

// batter = scatter/bar chart
var margin_batter = {top: 25, right: 0, bottom: 115, left: 0};
var width_batter = 750 - margin_batter.left - margin_batter.right;
var height_batter = 500 - margin_batter.top - margin_batter.bottom;
var padding = 140;
var yAxisPadding = 100;

var basePlot = d3.select(".basePlot")
  .append("svg")
  .style("width", width_batter + padding + "px") // padding with second scatter
  .style("height", height_batter + margin_batter.bottom + "px")  //svg defalt size: 300*150
  .append("g")

var hasLegend = false;


var onclick_compare = function(subreddit) {
  if (!cntrlIsPressed) {
    cur_subreddit1 = subreddit;
  } else {
    cur_subreddit2 = subreddit;
  }
  refresh()
}

var getToolTip = function(d) {
  return d["subreddit"] + "<br/>" 
  + 'Number of Comments: ' + d["num_comments"] + "<br/>"
  + 'Average Word Length: ' + d["avg_word_length"] + "<br/>"
  + 'Words Per Comment: ' + d["avg_words_per_comment"] + "<br/>"
  + 'Positive Score: ' + d["positive_score"] + "<br/>"
  + 'Negative Score: ' + d["negative_score"] + "<br/>"
  + 'Godwin\'s Score: ' + d["godwins_score"] + "<br/>"
  + 'Swear Score: ' + d["swear_score"]
}

var refreshBarChart = function(data) {
  basePlot.selectAll(".axis").remove()
  basePlot.selectAll('.rect').remove()
  basePlot.selectAll('.dot').remove()
  basePlot.selectAll('.barTitle').remove()

  var xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding, width_batter - 10], 0.15);
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height_batter, margin_batter.top])
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

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
  minY *= 0.75
  yScale.domain([minY, maxY]).nice();

  // Set up the axes and labels
  basePlot.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height_batter + ")")
      .attr("fill", "white")
      .call(xAxis)

  // Rotate labels so they are easier to read
  basePlot.selectAll("text")
    .attr("transform", "translate(" + 10 + "," + 5 + ") rotate(50)")
    .style("text-anchor", "start")
    .on("mouseover", function(subreddit) {
      d = data[indexOfSubreddit(data, subreddit)]
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
    .on("mouseout", function() {
      return tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d);
    });

  basePlot.append("text")
    .attr("x", width_batter / 2 + 100)             
    .attr("y", margin_batter.top - 10)
    .style("font-size", "14px") 
    .style("text-anchor", "middle")
    .attr("fill", "white")
    .attr("class", "barTitle")
    .text(inverseAxisOptions[yVariable] + " vs " + inverseAxisOptions[xVariable]);

  basePlot.append("text")
      .attr("class", "label subreddit_text")
      .attr("x", width_batter + 35)
      .attr("y", height_batter - 5)
      .attr("fill", "white")
      .attr("transform", "translate(" + (-10) + "," + 20 + ")")
      .style("text-anchor", "end")
      .text("Subreddit");

  // Set up the y axis
  basePlot.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding + "," + 0 + ")")
      .attr("fill", "white")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("y", height_batter - 268)
      .attr("x", 0)
      .attr("dy", ".71em")
      .attr("transform", "translate(" + -91 + "," + 25 + ")" + "rotate(-90)")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text(yVariable);

  //Create the bars
  basePlot.selectAll(".rect")
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
        return height_batter - yScale(d[yVariable]);
    })
    .style("fill", function(d) {
      return color(cValue(d));
    })
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      d3.select(this)
        .attr("width", xScale.rangeBand() * 1.5)
        .attr("x", function(d) {
          return xScale(this.__data__['subreddit']) - (data.length >= 20 ? 5 : 10);
        })
        .attr("y", function(d) {
          return yScale(this.__data__[yVariable]) - 25;
        })
        .attr("height", (height_batter - yScale(this.__data__[yVariable])) + 25);
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("width", xScale.rangeBand())
        .attr("x", function(d) {
          return xScale(this.__data__['subreddit']) ;
        })
        .attr("y", function(d) {
          return yScale(this.__data__[yVariable]);
        })
        .attr("height", height_batter - yScale(this.__data__[yVariable]));
      return tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d['subreddit']);
    });

  basePlot.selectAll('.legend').remove()

  var legend = basePlot.selectAll(".legend")
      .data(data)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
        return "translate(" + (padding - 0) + "," + i * 12 + ")";
      });

  legend.append("rect")
      .attr("x", width_batter - 20)
      .attr("width", 18)
      .attr("height", 18)
      .attr("transform", "translate(0," + 25 + ")")
      .style("fill", function(d) {
        return color(cValue(d));
      });

  legend.append("text")
      .attr("x", width_batter - 23)
      .attr("y", 9)
      .attr("dy", "0em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("transform", "translate(0," + 25 + ")")
      .text(function(d) {
        return d['subreddit'];
      });
}

var scatterPlot = function(data) {

  basePlot.selectAll('.rect').remove()
  basePlot.selectAll(".axis").remove()
  basePlot.selectAll('.dot').remove()
  basePlot.selectAll('.subreddit_text').remove()

  // Now create the scales for the scatterplot
  var xScale = d3.scale.linear().range([yAxisPadding, width_batter - 20])
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height_batter, margin_batter.top])
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
  minY *= 0.75
  var maxY = d3.max(data, function(d) {
    return +d[yVariable];
  })
  yScale.domain([minY, maxY]).nice();

  // Do the axes like we did with the bar chart
  basePlot.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height_batter + ")")
    .attr("fill", "white")
    .call(xAxis)
  .append("text")
    .attr("class", "label")
    .attr("x", width_batter)
    .attr("y", -6)
    .attr("fill", "white")
    .style("text-anchor", "end")
    .text(xVariable);

  basePlot.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding + ",0)")
      .attr("fill", "white")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "translate(" + 0 + "," + 25 + ")" + "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .text(yVariable);

  // Draw out the basePlotplot
  basePlot.selectAll(".dot")
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
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      d3.select(this).attr("r", circleSize(d) * 2)
    })
    .on("mouseout", function(d) {
      d3.select(this).attr("r", circleSize(d))
      return tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d['subreddit']);
    });
}

var count_accessor = function(d) {
    return d['count' + cur_filter]
}

var margin_heat = { top: 50, right: 0, bottom: 25, left: 30 },
    width_heat = 659 - margin_heat.left - margin_heat.right,
    height_heat = 300 - margin_heat.top - margin_heat.bottom,
    gridSize = Math.floor(width_heat / 24),
    legendElementWidth = gridSize*2,
    buckets = 12,
    days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    times = ["12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"],
    colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58", "#081d78", "#081e05", "#000000"],
    heat_svg1 = null,
    heat_svg2 = null

function dayOfWeekAsString(dayIndex) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayIndex];
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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
        //.attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

  var timeLabels = heat_svg.selectAll(".timeLabel")
      .data(times)
      .enter().append("text")
        .text(function(d) { return d; })
        .attr("x", function(d, i) { return i * gridSize; })
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", "translate(" + gridSize / 2 + ", -6)")
        .attr("class", function(d, i) {
          return "timeLabel mono axis";
        });
        //.attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

  if (id_selector === '#heatmap1') {
    heat_svg1 = heat_svg;
  } else {
    heat_svg2 = heat_svg;
  }
}

var refreshHeatMap = function(id_selector) {
    if (id_selector === '#heatmap1') {
      var heat_svg = heat_svg1;
      var cur_subreddit = cur_subreddit1;
    } else {
      var heat_svg = heat_svg2;
      var cur_subreddit = cur_subreddit2;
    }
    d3.csv(cur_time_dataset,
    function(d) {
      if (d['subreddit'] == cur_subreddit) {
        return {
          weekday: +d.weekday,
          hour: +d.hour,
          count: +count_accessor(d)
        };
      }
    },
    function(error, data) {
      heat_svg.selectAll(".scale").remove();
      heat_svg.selectAll(".cur_subreddit").remove();
      heat_svg.selectAll(".heatTitle").remove();
      heat_svg.append("text")
        .text(cur_subreddit)
        .attr("class", "cur_subreddit")
        .attr("x", width_heat / 2 - 25)
        .attr("y", height_heat - 29)
        .style('fill', 'darkOrange')

      heat_svg.append("text")
        .attr("x", width_heat / 2)             
        .attr("y", margin_heat.top - 75)
        .attr("class", "heatTitle")
        .style("font-size", "14px") 
        .style("text-anchor", "middle")
        .attr("fill", "white")
        .text("Time distribution of comments for " + cur_subreddit);


      var colorScale = d3.scale.quantile()
          .domain([0, d3.max(data, function (d) {
            return d.count;
          })])
          .range(colors);

      var cards = heat_svg.selectAll(".hour")
          .data(data, function(d) {
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
          .style("fill", colors[0])
          .on("mouseover", function(d) {
            count = d['count'];
            day = dayOfWeekAsString(d['weekday']);
            hour = times[d['hour']];
            nextHour = times[(d['hour'] + 1) % 24];
            tooltip.style("opacity", 1);
            tooltip.html("<center>Comments from " + hour + " to " + nextHour + "<br> on " + day + "s: " + numberWithCommas(count) + "</center>")
              .style("left", d3.event.pageX + 5 + "px")
              .style("top", d3.event.pageY + 5 + "px")
          })
          .on("mouseout", function() {
            return tooltip.style("opacity", 0);
          });

      cards.transition().duration(1000)
          .delay(function(d, i) {
            return 6 * i + 2 * d.hour
          })
          .style("fill", function(d) {
            return colorScale(d.count);
          });

      cards.exit().remove();

      var legend = heat_svg.selectAll(".heatLegend")
          .data([0].concat(colorScale.quantiles()), function(d) { return d; });

      legend.enter().append("g")
          .attr("class", "heatLegend");

      legend.append("rect")
        .attr("x", function(d, i) {
          return legendElementWidth * i;
        })
        .attr("y", height_heat - 25)
        .attr("width", legendElementWidth)
        .attr("height", gridSize / 2)
        .style("fill", function(d, i) {
          return colors[i];
        });

      legend.append("text")
        .attr("class", "heatLegendLabel scale")
        .text(function(d) {
          return "≥ " + Math.round(d);
        })
        .attr("x", function(d, i) {
          return legendElementWidth * i + (legendElementWidth / 2);
        })
        .attr("y", height_heat + gridSize - 25)
        .style("text-anchor", "middle");

      legend.exit().remove();

      if (id_selector === '#heatmap1') {
        heat_svg1 = heat_svg;
      } else {
        heat_svg2 = heat_svg;
      }

    });  
  };

// small multiples constants
var margin_multiples = {top: 25, right: 0, bottom: 10, left: 0};
var width_multiples = 200 - margin_multiples.left - margin_multiples.right;
var height_multiples = 200 - margin_multiples.top - margin_multiples.bottom;
var padding_multiples = 200;
var yAxisPadding_multiples = 100;

var clearSmallMultiples = function() {
  d3.selectAll(".smallMultiplesGraph").remove()
}

var refreshSmallMultiples = function(data, yMultiples) {
  multiplesData = data.slice();
  multiplesData = multiplesData.filter(function(d) {
    return d['subreddit'] === cur_subreddit1 || d['subreddit'] == cur_subreddit2;
  })

  //multiplesPlot.selectAll(".axis").remove()
  //multiplesPlot.selectAll('.rect').remove()
  //multiplesPlot.selectAll('.dot').remove()

  var multiplesPlot = d3.select(".smallMultiples")
    .append("svg")
    .attr("class", "smallMultiplesGraph")
    .style("width", width_multiples + padding_multiples + "px") // padding with second scatter
    .style("height", height_multiples + margin_multiples.bottom + margin_multiples.top + "px")  //svg defalt size: 300*150
    .append("g")

  var xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding_multiples, width_multiples + 40], 0.25);
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height_multiples, margin_multiples.top])
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

  // Scale the data
  xScale.domain(multiplesData.map(function(d) {
    return d['subreddit'];
  }));

  var minY = d3.min(multiplesData, function(d) {
    return +d[yMultiples];
  })
  minY *= 0.4
  var maxY = d3.max(multiplesData, function(d) {
    return +d[yMultiples];
  })
  yScale.domain([minY, maxY]).nice();

  // Set up the axes and labels
  multiplesPlot.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height_multiples + ")")
      .attr("fill", "white")
      .call(xAxis)


  multiplesPlot.selectAll("text")
    .style("text-anchor", "left")
    .style("font-size", function(d) {
        size = 12;
        if (cur_subreddit1.length > 9 || cur_subreddit2.length > 9) {
          size = 10;
        }
        return size + "px"
    })
    .on("mouseover", function(subreddit) {
      d = multiplesData[indexOfSubreddit(multiplesData, subreddit)]
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
    .on("mouseout", function() {
      return tooltip.style("opacity", 0);
    })
    .text(function(d) {
      return abbreviateSubreddit(d);
    })

  // Set up the y axis
  multiplesPlot.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + yAxisPadding + "," + 0 + ")")
      .attr("fill", "white")
      .call(yAxis)

  multiplesPlot.append("text")
    .attr("x", width_multiples - 30)             
    .attr("y", margin_multiples.top - 10)
    .style("font-size", "14px") 
    .style("text-anchor", "middle")
    .attr("fill", "white")
    .text(inverseAxisOptions[yMultiples]);

  //Create the bars
  multiplesPlot.selectAll(".rect")
    .data(multiplesData)
    .enter().append("rect")
    .attr("class", "rect")
    .attr("y", function(d) {
      return yScale(d[yMultiples]);
    })
    .attr("x", function(d) {
      return xScale(d['subreddit']);
    })
    .attr("width", xScale.rangeBand())
    .attr("height", function(d) {
        return height_multiples - yScale(d[yMultiples]);
    })
    .style("fill", function(d) {
      return color(cValue(d));
    })
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTip(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
      d3.select(this)
        .attr("width", xScale.rangeBand() * 1.25)
        .attr("x", function(d) {
          return xScale(this.__data__['subreddit']) - 5;
        })
        .attr("y", function(d) {
          return yScale(this.__data__[yMultiples]) - 10;
        })
        .attr("height", (height_multiples - yScale(this.__data__[yMultiples])) + 10);
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("width", xScale.rangeBand())
        .attr("x", function(d) {
          return xScale(this.__data__['subreddit']) ;
        })
        .attr("y", function(d) {
          return yScale(this.__data__[yMultiples]);
        })
        .attr("height", height_multiples - yScale(this.__data__[yMultiples]));
      return tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
      onclick_compare(d['subreddit']);
    });

  multiplesPlot.selectAll('.legend').remove()

  var legend = multiplesPlot.selectAll(".legend")
      .data(multiplesData)
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
        return "translate(" + (padding - 0) + "," + i * 18 + ")";
      });

  legend.append("rect")
      .attr("x", width_multiples - 20)
      .attr("width", 18)
      .attr("height", 18)
      .attr("transform", "translate(17," + 25 + ")")
      .style("fill", function(d) {
        return color(cValue(d));
      });

  legend.append("text")
      .attr("x", width_multiples - 23)
      .attr("y", 9)
      .attr("dy", ".4em")
      .attr("fill", "white")
      .style("text-anchor", "end")
      .attr("transform", "translate(17," + 25 + ")")
      .text(function(d) {
        return d['subreddit'];
      }).style("font-size", function(d) {
        size = 12;
        if (cur_subreddit1.length > 10 || cur_subreddit2.length > 10) {
          size = 10;
        }
        return size + "px"
      });
}

refresh()

