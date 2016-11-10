// Spinner to show while loading data
// From http://spin.js.org/
var opts = {
  lines: 13 // The number of lines to draw
, length: 28 // The length of each line
, width: 14 // The line thickness
, radius: 42 // The radius of the inner circle
, scale: 1 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#000' // #rgb or #rrggbb or array of colors
, opacity: 0.25 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '50%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: 'fixed' // Element positioning
}
/*
// Scrolls the page to the top before refreshing
// the page
$(window).on('beforeunload', function() {
   $(window).scrollTop(0);
});
*/

// Creates loading spinner
$( document ).ready(function() {
  var target = document.getElementById('spinner')
  var spinner = new Spinner(opts).spin(target);
});

// Initialize scroll snapping
// https://github.com/guidobouman/jquery-panelsnap
var options;
jQuery(function($) {
  options = {
    $menu: $('body .menu'),
    menuSelector: 'a',
    panelSelector: '> section',
    namespace: '.panelSnap',
    onSnapStart: function(){},
    onSnapFinish: function(){},
    onActivate: function(){},
    directionThreshold: 100,
    slideSpeed: 1000,
    easing: 'swing', // https://matthewlein.com/experiments/easing.html
    offset: 220,
    navigation: {
      keys: {
        nextKey: false,
        prevKey: false,
      },
      buttons: {
        $nextButton: false,
        $prevButton: false,
      },
      wrapAround: false
    }
  };

  $('body').panelSnap(options);
});

// Toggle the static nav bar
d3.select("#toggle").on("click", function(d) {
  var checked = $('#toggle')[0].checked;
  if (!checked) {
    //d3.select(".navbar-fixed-top").transition().duration(1000).style("opacity", 0)
    //d3.select(".navbar-fixed-top").transition().duration(1000).style("height", 0)
    $('.navbar-fixed-top').slideUp();
    d3.select("body").style("padding-top", "25px")
  } else {
    d3.select(".navbar-fixed-top").transition().duration(1000).style("opacity", 1)
    $('.navbar-fixed-top').slideDown();
    d3.select("body").style("padding-top", "220px")
  }
});

// Global variables are changed and graph refreshes
// pick up the new variables
var cur_month_label = 'September 2016';
var cur_subreddit = null;
var cur_subreddit1 = null;
var cur_subreddit2 = null;
var old_cur_subreddit1 = null;
var old_cur_subreddit2 = null;
var cur_filter = null;
var cur_filter_label = null;
var initialized_heatmap = false;
var sort_by = null;
var cur_chosen_subreddits = null;
var initialized_pickers = false;

// Set up some variable defaults
var subsetSuffix = ''
var xVariableLabel = 'Subreddit'
var xVariableBase = 'subreddit'
var xVariable = 'subreddit'
var yVariableLabel = 'Number of Comments'
var yVariableBase = 'num_comments'
var yVariable = 'num_comments'

var core_file_path = 'core_files/combined_core.csv'
var time_file_path = 'time_files/combined_time.csv'
var full_core_dataset = null;
var full_time_dataset = null;
var compare_core_dataset = null;
var compare_time_dataset = null;

var full_chord_lookup_dataset = null;
var full_chord_matrix_dataset = null;

var subreddit_subsets = {
  "Top 25 by Comments": [
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

  "Top 25 by Subscribers": [
    'AskReddit',
    'funny',
    'todayilearned',
    'pics',
    'science',
    'worldnews',
    'IAmA',
    'announcements',
    'videos',
    'gaming',
    'movies',
    'blog',
    'Music',
    'aww',
    'news',
    'gifs',
    'explainlikeimfive',
    'askscience',
    'EarthPorn',
    'books',
    'television',
    'LifeProTips',
    'mildlyinteresting',
    'DIY',
    'Showerthoughts',
  ],

  "Political": [
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
    'PoliticalHumor',
    'HillaryForPrison',
  ],

  "University": [
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

  "Sports": [
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
    'theocho',
  ],

  "Science, History, Technology": [
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
    'wikipedia',
    'EverythingScience',
    'geek',
    'tech',
    'HistoryPorn',
    'badhistory',
  ],

  "NSFW": [
    'gonewild',
    'nsfw',
    'ImGoingToHellForThis',
    'RealGirls',
    'NSFW_GIF',
    'FiftyFifty',
    'holdthemoan',
    'nsfw_gifs',
    'BustyPetite',
    'Amateur',
    'cumsluts',
    'ass',
    'Boobies',
    'milf',
    'GirlsFinishingTheJob',
    'MorbidReality',
    'OnOff',
    'LegalTeens',
    'rule34',
    '60fpsporn',
    'girlsinyogapants',
    'PetiteGoneWild',
    'gonewildcurvy',
    'WatchItForThePlot',
    'dirtysmall',
  ],

  "Miscellaneous": [
    'meirl',
    'nosleep',
    'woahdude',
    'DeepIntoYouTube',
    'SubredditSimulator',
    'depression',
    'cringe',
    'Showerthoughts',
    'travel',
    '4chan',
    'UpliftingNews',
    'creepy',
    'Jokes',
    'cringepics',
    'tifu',
    'WTF',
    'creepyPMs',
    'rage',
    'guns',
    'conspiracy',
  ]
}

// Get an array of all subreddits
var all_subreddits = [];
var subset_keys = Object.keys(subreddit_subsets);
for (var i = 0; i < subset_keys.length; i++) {
  all_subreddits = all_subreddits.concat(subreddit_subsets[subset_keys[i]])
}

// Remove duplicate entries
all_subreddits = Array.from(new Set(all_subreddits))
all_subreddits.sort(function (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase());
})

//We have to hack the bootstrap select picker
//Need to lookup the index of the subreddit later on
all_subreddits_lookup = {}
for (var i = 0; i < all_subreddits.length; i++) {
  all_subreddits_lookup[i] = all_subreddits[i];
}

var dataset_labels = [
  "January 2016",
  "February 2016",
  "March 2016",
  "April 2016",
  "May 2016",
  "June 2016",
  "July 2016",
  "August 2016",
  "September 2016",
]

var chord_files = {
  "January 2016": "mention_adj_matrix_d3_RC_2016-01.json",
  "February 2016": "mention_adj_matrix_d3_RC_2016-02.json",
  "March 2016": "mention_adj_matrix_d3_RC_2016-03.json",
  "April 2016": "mention_adj_matrix_d3_RC_2016-04.json",
  "May 2016": "mention_adj_matrix_d3_RC_2016-05.json",
  "June 2016": "mention_adj_matrix_d3_RC_2016-06.json",
  "July 2016": "mention_adj_matrix_d3_RC_2016-07.json",
  "August 2016": "mention_adj_matrix_d3_RC_2016-08.json",
  "September 2016": "mention_adj_matrix_d3_RC_2016-09.json",
}

var month_label_to_number = function(label) {
  if (label === "January 2016") {
    return 1;
  } else if (label === "February 2016") {
    return 2;
  } else if (label === "March 2016") {
    return 3;
  } else if (label === "April 2016") {
    return 4;
  } else if (label === "May 2016") {
    return 5;
  } else if (label === "June 2016") {
    return 6;
  } else if (label === "July 2016") {
    return 7;
  } else if (label === "August 2016") {
    return 8;
  } else if (label === "September 2016") {
    return 9;
  } 
}

// For the month slider, it is indexed by integers, so here's a lookup
// Slider is index + 1
var month_lookup = {};
for (var i = 0; i < dataset_labels.length; i++) {
  month_lookup[i + 1] = dataset_labels[i];
}

var filter_labels = {
  'All Comments': '',
  'Top Score Comments': '_topcom',
  'Bottom Score Comments': '_botcom',
  'Most Popular Authors': '_topauth',
  'Top Positive Comments': '_toppos',
  'Top Negative Comments': '_topneg',
  'Top Godwin Comments': '_topgod',
  'Top Swearing Comments': '_topswear',

}
var filters = [
  'count',
  'count_topcom',
  'count_botcom',
  'count_topauth',
  'count_toppos',
  'count_topneg',
  'count_topgod',
  'count_topswear'
]
var subreddits = [];

// Circle size will vary on the scatterplot
var circleSize = function(d) {
  return 7;
  //return Math.log(d['num_comments'] / 100) * 0.8;
}

// Assign a color to every subreddit
var color = d3.scale.category20();
var cValue = function(d) {
  if (typeof(d) === 'object') {
    return d['subreddit']
  } else {
    return d;
  }
}

// Prepare tooltip for the scatterplot
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Prepare tooltip for the scatterplot
var tooltip2 = d3.select("body").append("div")
    .attr("class", "tooltip2")
    .style("opacity", 0);

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

// Do our CTRL handling for when we want to compare a second subreddit
var cntrlIsPressed = false;
var qIsPressed = false;
var navBarHidden = false;
var navBarToggled = false;
$(document).keydown(function(event) {
    if (event.which == "17") {
      cntrlIsPressed = true;
    } else if (event.which == "81") {
      qIsPressed = true;
    }
    if (cntrlIsPressed && qIsPressed && !navBarToggled) {
      navBarToggled = true;
      if (!navBarHidden) {
        //d3.select(".navbar-fixed-top").transition().duration(1000).style("opacity", 0)
        //d3.select(".navbar-fixed-top").transition().duration(1000).style("height", 0)
        $('.navbar-fixed-top').slideUp();
        d3.select("body").style("padding-top", "25px")
        options.offset = 0;
        navBarHidden = true;
      } else {
        d3.select(".navbar-fixed-top").transition().duration(1000).style("opacity", 1)
        $('.navbar-fixed-top').slideDown();
        d3.select("body").style("padding-top", "220px")
        navBarHidden = false;
      }
      
    }
});

$(document).keyup(function(event) {
  if (event.which == "17") {
    cntrlIsPressed = false;
    navBarToggled = false;
  } else if (event.which == "81") {
    qIsPressed = false;
    navBarToggled = false;
  }
});

// Shorten long subreddit names if needed
// Useful in small multiples x axis labels
var abbreviateSubreddit = function(subreddit) {
  if (subreddit.length > 9) {
    return subreddit.substring(0, 8) + "...";
  } else {
    return subreddit
  }
}

// Called if a different axis variable (x/y) is chosen
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
    } else {
      yVariableLabel = selected;
      yVariableBase = varName;
      yVariable = yVariableBase + cur_filter
    }
    if (prevX != xVariable || prevY != yVariable) {
      refresh()
    }
}

// Add the select list for department filtering
var xPicker = d3.select("#xPicker")
    .attr("class", "selectpicker xDropdown sameLine")
    .attr("style", "margin-left: 15px;");

// Add the select list for department filtering
var yPicker = d3.select("#yPicker")
    .attr("class", "selectpicker yDropdown sameLine")
    .attr("style", "margin-left: 15px")

// Load select items from the CSV (departments)
var xDrop = xPicker.selectAll("option")
    .data(Object.keys(axisOptions))
    .enter()
    .append("option");

// Load select items from the CSV (departments)
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

// Define the option items
xDrop.text(function(d) {
  return d;
})
.attr("value", function(d) {
  return d;
})
.property("selected", function(d) {
  return d === xVariableLabel;
})

// Define the option items
yDrop.text(function(d) {
  return d;
})
.attr("value", function(d) {
  return d;
})
.property("selected", function(d) {
  return d === yVariableLabel;
})

// Create word clouds
var wordcloud1 = d3.select(".wordcloud1Container")
    .append("img")
    .attr("class", "wordcloud1")
    .attr("src", "RC_2016-08/" + cur_subreddit1)
    .attr("title", "Top occurring words in subreddit " + cur_subreddit1)

var wordcloud2 = d3.select(".wordcloud2Container")
    .append("img")
    .attr("class", "wordcloud2")
    .attr("src", "RC_2016-08/" + cur_subreddit2)
    .attr("title", "Top occurring words in subreddit " + cur_subreddit2)

// Refreshes all the data on the screen
var refresh = function() {
  createCharts()
}

// Load the full files into memory just once
d3.csv(core_file_path, function(error, core_dataset) {
  // Convert data to numeric
  core_dataset.forEach(function(d) {
    keys = Object.keys(d)
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] != 'subreddit') {
        d[keys[i]] = +d[keys[i]]
      }
    }
  });
  full_core_dataset = core_dataset;
  d3.csv(time_file_path, function(error, time_dataset) {
    time_dataset.forEach(function(d) {
      keys = Object.keys(d)
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] != 'subreddit') {
          d[keys[i]] = +d[keys[i]]
        }
      }
    });
    full_time_dataset = time_dataset;
    d3.csv("chord_files/subreddit_lookup.csv", function(subreddit_lookup) {
      full_chord_lookup_dataset = subreddit_lookup;
      load_chord_matrix_data(function() {
        refresh();
        // Kills the loading spinner
        var target = document.getElementById('spinner');
        target.remove();
      });
    });
    
  })
});

var load_chord_matrix_data = function(callback) {
  chord_file = chord_files[cur_month_label];
  d3.json("chord_files/" + chord_file, function(matrix) {
    full_chord_matrix_dataset = matrix;
    if (callback) {
      callback();
    }
  });
}

// Constructs the charts to be shown
var createCharts = function() {

  // Get the correct month's data
  core_dataset = full_core_dataset.filter(function(d) {
    return +d['month'] == month_label_to_number(cur_month_label);
  })

  // Initialize chosen subreddits to a default
  if (cur_chosen_subreddits == null) {
    cur_chosen_subreddits = subreddit_subsets["Top 25 by Comments"];
  }

  load_chord_matrix_data();
  create_chord(full_chord_lookup_dataset, full_chord_matrix_dataset, cur_chosen_subreddits);

  // Get data for only the subreddits that are chosen
  core_dataset = core_dataset.filter(function(d, i) {
    return cur_chosen_subreddits.indexOf(d['subreddit']) > -1;
  })

  time_dataset = full_time_dataset.filter(function(d) {
    return +d['month'] == month_label_to_number(cur_month_label);
  });

  subreddits = [];
  core_dataset.forEach(function(d) {
    subreddits.push(d['subreddit']);
  });
  
  if (cur_subreddit == null) {
    cur_subreddit = subreddits[0];
  }
  if (cur_subreddit1 == null) {
    cur_subreddit1 = subreddits[0];
  } 
  if (cur_subreddit2 == null) {
    cur_subreddit2 = subreddits[1];
  }
  
  // Update the 2 subreddit data set only if it has changed
  // This could be improved by selectively updating when needed
  compare_core_dataset = core_dataset.filter(function(d) {
    return (d['subreddit'] == cur_subreddit1) || (d['subreddit'] == cur_subreddit2);
  })
  compare_time_dataset = time_dataset.filter(function(d) {
    return (d['subreddit'] == cur_subreddit1) || (d['subreddit'] == cur_subreddit2);
  })

  sort_by = yVariable;

  // Sort the data, supports string or numbers
  if (sort_by === 'subreddit') {
    core_dataset.sort(function(a, b) {
      return a[sort_by].localeCompare(b[sort_by]);
    })
  } else {
    core_dataset.sort(function(a, b) {
      return b[sort_by] - a[sort_by];
    })
  }

  if (old_cur_subreddit1 != cur_subreddit1) {
    // Put the actual image path. We set our default comparison subreddits
    d3.select(".wordcloud1")
      .style("opacity", 0)
      .attr("src", "RC_2016-08/" + cur_subreddit1 + "_wordcloud.png")
      .attr("title", "Top occurring words in subreddit " + cur_subreddit1)
      .transition()
      .duration(2000)
      .style("opacity", 1)

    d3.select(".wordcloud1Title")
      .html("Word cloud for " + cur_subreddit1)
    old_cur_subreddit1 = cur_subreddit1
  }
  if (old_cur_subreddit2 != cur_subreddit2) {
    d3.select(".wordcloud2")
    .style("opacity", 0)
    .attr("src", "RC_2016-08/" + cur_subreddit2 + "_wordcloud.png")
    .attr("title", "Top occurring words in subreddit " + cur_subreddit2)
    .transition()
    .duration(2000)
    .style("opacity", 1)

    d3.select(".wordcloud2Title")
      .html("Word cloud for " + cur_subreddit2)
    old_cur_subreddit2 = cur_subreddit2;
  }
  
  if (cur_filter == null) {
    cur_filter_label = 'All Comments';
    cur_filter = filter_labels[cur_filter_label];
  }
  if (!initialized_pickers) {
    initialized_pickers = true;
    initialize_pickers();
  }

  // Preselect our currend subreddit list on the subreddit picker list
  $('#toggleSubreddits').selectpicker('val', cur_chosen_subreddits);

  // Go ahead and actually refresh the graphs as necessary
  if (xVariable == 'subreddit') {
    refreshBarChart(core_dataset)
  } else {
    scatterPlot(core_dataset)
  }

  var keys = Object.keys(axisOptions);
  for (var i = 0; i < keys.length; i++) {
    if (axisOptions[keys[i]] !== 'subreddit') {
      refreshSmallMultiples(compare_core_dataset, axisOptions[keys[i]])
    }
  }
  
  if (!initialized_heatmap) {
    initialized_heatmap = true;
    createHeatMap("#heatmap1");
    createHeatMap("#heatmap2");
  }
  refreshHeatMap("#heatmap1");
  refreshHeatMap("#heatmap2");
}


// Do some one-time HTML setup for input things
var initialize_pickers = function() {
  subreddit_toggle = d3.select("#toggleSubreddits").selectAll("option")
    .data(all_subreddits)
    .enter()
    .append("option")
    .attr("value", function(d) {
      return d;
    })
    .html(function(d) {
      return d;
    })
  //Update the changes in the picker
  $('#toggleSubreddits').selectpicker('refresh');

  //Update the currently picked subreddits (this is pretty inefficient) when toggled
  $('#toggleSubreddits').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    cur_chosen_subreddits = $(e.currentTarget).val();
    //If they remove all subreddits, just go load top 25 again
    if (cur_chosen_subreddits.length == 0) {
      cur_chosen_subreddits = subreddit_subsets['Top 25']
    }
    refresh()
  });

  var subredditsubsetpicker = d3.select("#subredditsubset-picker").selectAll("option")
    .data(Object.keys(subreddit_subsets));

  // Add buttons for each filter
  subredditsubsetpicker.enter()
    .append("option")
    .attr("value", function(d) {
      return "" + d
    })
    .html(function(d) {
      return "" + d
    })
  
  $('#subredditsubset-picker').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    var subreddit_subset = $(e.currentTarget).val();
    cur_chosen_subreddits = subreddit_subsets[subreddit_subset];
    old_cur_subreddit1 = cur_subreddit1
    old_cur_subreddit2 = cur_subreddit2
    cur_subreddit1 = cur_chosen_subreddits[0]
    cur_subreddit2 = cur_chosen_subreddits[1]
    refresh();
  });
  $('#subredditsubset-picker').selectpicker('refresh');

  var datasetpicker = d3.select("#dataset-picker").selectAll(".dataset-button")
    .data(dataset_labels);

  // Add buttons for each month data set
  datasetpicker.enter()
    .append("input")
    .attr("value", function(d){ return "" + d })
    .attr("type", "button")
    .attr("class", "dataset-button btn btn-primary")
    .on("click", function(month) {
      cur_month_label = month;
      refresh();
    });

  $("#month-slider").on("change", function(slideEvt) {
    var month = month_lookup[slideEvt.value.newValue];
    cur_month_label = month;
    refresh();
  });
  
  var filterpicker = d3.select("#filter-picker").selectAll("option")
    .data(Object.keys(filter_labels));

  // Add buttons for each filter
  filterpicker.enter()
    .append("option")
    .attr("value", function(d) {
      return "" + d;
    })
    .attr("title", function(d) {
      return "" + d;
    })
    .html(function(d) {
      return "" + d;
    });
    //.attr("data-icon", "glyphicon-info-sign");

  $('#filter-picker').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    cur_filter_label = $(e.currentTarget).val();
    cur_filter = filter_labels[cur_filter_label];
    if (xVariable != 'subreddit') {
      xVariable = xVariableBase + cur_filter;
    }
    yVariable = yVariableBase + cur_filter
    refresh();
  });
  $('#filter-picker').selectpicker('refresh');

  d3.select(".commentSubsetInfo")
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTipCommentsSubset(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
    .on("mouseout", function(d) {
      tooltip.style("opacity", 0);
    })

  d3.select(".chordInfo")
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.style("width", "200px")
      tooltip.html(getToolTipChord(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
    .on("mouseout", function(d) {
      tooltip.style("opacity", 0);
    })

  d3.selectAll(".mainVizQuestion")
    .on("mouseover", function(d) {
      tooltip.style("opacity", 1);
      tooltip.style("width", "225px")
      tooltip.html(getToolTipMainVizQuestion(d))
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")

    })
    .on("mouseout", function(d) {
      tooltip.style("opacity", 0);
    })
}

// Helper for getting index of subreddit in
// an array of objects
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
var width_batter = 1000 - margin_batter.left - margin_batter.right;
var height_batter = 500 - margin_batter.top - margin_batter.bottom;
var padding = 140;
var yAxisPadding = 150;

var barchart = d3.select(".barchart")
  .append("svg")
  .style("width", width_batter + padding + "px") // padding with second scatter
  .style("height", height_batter + margin_batter.bottom + "px")  //svg defalt size: 300*150
  .append("g")

var scatterplot = d3.select(".scatterplot")
  .append("svg")
  .style("width", width_batter + padding + "px") // padding with second scatter
  .style("height", height_batter + margin_batter.bottom + "px")  //svg defalt size: 300*150
  .append("g")

// Assign the current subreddit based on the type of click
var onclick_compare = function(subreddit) {
  if (!cntrlIsPressed) {
    old_cur_subreddit1 = cur_subreddit1
    cur_subreddit1 = subreddit;
  } else {
    old_cur_subreddit2 = cur_subreddit2
    cur_subreddit2 = subreddit;
  }
  flash_subreddit_change();
  refresh();
}

// http://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
var format_decimal = function(number) {
  return Number(Math.round(number + 'e2') + 'e-2').toFixed(2)
}

function abbreviate_thousands(num) {
  if (typeof(num) === 'object') {
    return num['subreddit']
  }
  if (num >= 1000000)
    return num / 1000000 + 'm';
  if (num >= 1000)
    return num / 1000 + 'k';
  return num;
}

// Align table elements on the decimal
var align_decimal = function(decimal) {
  decimal = decimal.toString();
  var parts = decimal.split(".")
  var result = "";
  result = result + "<td margin-left='10px'>" + parts[0] + "</td>"
  if (parts.length > 1) {
    result = result + "<td>." + parts[1] + "</td>"
  } else {
    result = result + "<td></td>"
  }
  return result
}

// Centralized tooltip function
var getToolTip = function(d) {
  return "<center><b>" + d["subreddit"] +'</b>: ' + numberWithCommas(d["num_comments" + cur_filter]) + ' comments'  + '<hr style="margin-top: 5px; margin-bottom: 5px"><table class="hoverTooltip">'
  + '<tr><td align="middle" width="150px">Average Word Length: </td>' + align_decimal(format_decimal(d["avg_word_length" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Words Per Comment: </td>' + align_decimal(format_decimal(d["avg_words_per_comment" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Positive Score: </td>' + align_decimal(format_decimal(d["positive_score" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Negative Score: </td>' + align_decimal(format_decimal(d["negative_score" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Godwin\'s Score: </td>' + align_decimal(format_decimal(d["godwins_score" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Swear Score: </td>' + align_decimal(format_decimal(d["swear_score" + cur_filter])) + "</tr></table></center>"
}


// Centralized tooltip function
var getToolTipCommentsSubset = function(d) {
  return "<p>Here we can filter on special subsets of the comments within each subreddit:<br><br>" + 
  "<b>All Comments</b>: All the comments!<br>" + 
  "<b>Top Score Comments</b>: Top 5% of comments by score<br>" + 
  "<b>Bottom Score Comments</b>: Bottom 5% of comments by score<br>" + 
  "<b>Most Popular Authors</b>: Top 5% of authors by comment volume<br>" + 
  "<b>Top Positive Comments</b>: Comments with positive score >= 25<br>" + 
  "<b>Top Negative Comments</b>: Comments with negative score >= 15<br>" + 
  "<b>Top Godwin Comments</b>: Comments with positive Godwin's scores<br>" + 
  "<b>Top Swear Comments</b>: Comments with swear score >= 35" + 
  "</p>"
}

// Centralized tooltip function
var getToolTipChord = function(d) {
  return "<b>Tip</b>: Hover over a subreddit arc to view its network of subreddit mentions. Press the <b>esc</b> key to unfade all chords."
}

var getToolTipMainVizQuestion = function(d) {
  return "<p><b>Tip</b>: Choose the x and y variables that interest you. Hover over the data for more details. Left click one subreddit and ctrl/cmd + left click another subreddit to compare them further down the page.</p>"
}

// Highlight the chosen subreddit
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

// Only fade away the popup if we haven't
// clicked for another subreddit while it has been up
var flash_count = 0;

// Flashes a popup saying a new subreddit was chosen
var flash_subreddit_change = function() {
  flash_count = flash_count + 1;
  tooltip2.remove();
  tooltip2 = d3.select("body").append("div")
      .attr("class", "tooltip2")
      .style("opacity", 0);
  tooltip2.style("opacity", 1);
  tooltip2.html('<table style="width: 250px"><tr><td rowspan="2"><i style="font-size: 22px" class="glyphicon glyphicon-arrow-down"></i></td><td style="text-align: center;">Updated compare subreddits to:</td></tr><tr><td style="text-align: center;"><b>' + cur_subreddit1 + '</b> vs <b>' + cur_subreddit2 + '</b></td></tr></table>')
    .style("left", (1300 / 2) + "px")
    .style("top", (700 / 2) + "px")
  setTimeout(function() {
      flash_count = flash_count - 1;
      if (flash_count == 0) {
        tooltip2.transition().duration(1000).style("opacity", 0);
      }
    }, 1500)
}

// Wraps text to multiple lines
//Taken from https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

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

  if (!barChartInit) {
    barChartInit = true;
    xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding, width_batter - 15], 0.15);
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

    if (barchart.selectAll(".barTitle").size() < 1) {
      barchart.append("text")
      .attr("x", width_batter / 2 + 100)             
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
  minY *= 0.75
  yScale.domain([minY, maxY]).nice();

  xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  yAxis = d3.svg.axis().scale(yScale).orient("left");

  barchart.select(".barTitle")
    .text(inverseAxisOptions[yVariableBase] + " vs " + inverseAxisOptions[xVariableBase]);

  //Create the bars
  var barDataSelection = barchart.selectAll(".rect")
    .data(data)

  var popupToggled = false;

  //basePlot.selectAll('.legend').remove()
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
      tooltip.style("opacity", 1);
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
    });

  barchart.selectAll(".y.axis .tick text")
      .text(function(d) {
        return abbreviate_thousands(d);
      })

  barchart.selectAll(".yVariable")
    .text(inverseAxisOptions[yVariableBase])
    .call(wrap, 100)

  makeBatterLegend(data, barchart, '.rect')
}

var makeBatterLegend = function(data, selector, element) {
  selector.selectAll(".legend")
    .remove();
  
  var legendSelection = selector.selectAll(".legend")
    .data(data)

  legendSelection.enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) {
      return "translate(" + (padding - 0) + "," + i * 12 + ")";
    })

  legendSelection.append("rect")
      .attr("x", width_batter - 20)
      .attr("width", 18)
      .attr("height", 18)
      .attr("transform", "translate(0," + 25 + ")")
      .style("fill", function(d) {
        return color(cValue(d));
      })
      .style("opacity", 0)
      .on("mouseover", function(d) {
        highlight(selector, element, d['subreddit'])
      })
      .on("mouseout", function(d) {
        unHighlight(selector, element, d['subreddit'])
      })
      .transition()
      .duration(2000)
      .style("opacity", 1);

  legendSelection.append("text")
      .attr("x", width_batter - 23)
      .attr("y", 9)
      .attr("dy", "0em")
      .attr("fill", "white")
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
      .transition()
      .duration(2000)
      .style("opacity", 1);
}

var scatterPlotInit = false;

var scatterPlot = function(data) {

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

  // Hide the scatterplot
  d3.select(".barchart")
    .style("display", "none")
  d3.select(".scatterplot")
    .style("display", "inline")
  barChartInit = false;

  // Now create the scales for the scatterplot
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
      return "hsl(" + Math.random() * 360 + ",100%,50%)"
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

var count_accessor = function(d) {
    return d['count' + cur_filter]
}

var margin_heat = {top: 50, right: 0, bottom: 25, left: 30};
var width_heat = 659 - margin_heat.left - margin_heat.right;
var height_heat = 300 - margin_heat.top - margin_heat.bottom;
var gridSize = Math.floor(width_heat / 24);
var legendElementWidth = gridSize *2 ;
var buckets = 12;
var days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
var times = ["12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am", "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"];
var heat_map_colors_lookup = {}
var heat_svg1 = null;
var heat_svg2 = null;

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
        //.attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

  if (id_selector === '#heatmap1') {
    heat_svg1 = heat_svg;
  } else {
    heat_svg2 = heat_svg;
  }
}


// Create a custom gradient from the subreddit color
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

    if (!(cur_subreddit in heat_map_colors_lookup)) {
      heat_map_colors_lookup[cur_subreddit] = create_color_scale(d3.rgb(color(cValue(cur_subreddit))))
    }

    console.log(heat_map_colors_lookup[cur_subreddit].length)
    
    heat_svg.selectAll(".scale").remove();
    heat_svg.selectAll(".cur_subreddit").remove();
    heat_svg.selectAll(".heatTitle").remove();
    heat_svg.append("text")
      .text("Number of comments gradient thresholds")
      .attr("class", "cur_subreddit")
      .attr("x", width_heat / 2 - 130)
      .attr("y", height_heat - 29)
      .style('fill', 'white')

    heat_svg.append("text")
      .attr("x", width_heat / 2 - 5)             
      .attr("y", margin_heat.top - 75)
      .attr("class", "heatTitle")
      .style("font-size", "14px") 
      .style("text-anchor", "middle")
      .attr("fill", "white")
      .text("Time distribution of comments for " + cur_subreddit);

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
          tooltip.html("<center>Comments from " + hour + " to " + nextHour + "<br> on " + day + "s: " + numberWithCommas(count) + "</center>")
            .style("left", d3.event.pageX + 5 + "px")
            .style("top", d3.event.pageY + 5 + "px")
        })
        .on("mouseout", function() {
          return tooltip.style("opacity", 0);
        });

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
        .attr("class", "heatLegend");

    legend.append("rect")
      .attr("x", function(d, i) {
        return legendElementWidth * i;
      })
      .attr("y", height_heat - 25)
      .attr("width", legendElementWidth)
      .attr("height", gridSize / 2)
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
  };

// small multiples constants
var margin_multiples = {top: 25, right: 0, bottom: 10, left: 0};
var width_multiples = 200 - margin_multiples.left - margin_multiples.right;
var height_multiples = 200 - margin_multiples.top - margin_multiples.bottom;
var padding_multiples = 60;
var yAxisPadding_multiples = 45;

var smallMultiplesInit = 0;

var refreshSmallMultiples = function(data, yMultiples) {
  multiplesData = data;
  if (multiplesData[0].subreddit !== cur_subreddit1) {
    multiplesData.reverse();
  }

  var xScale = d3.scale.ordinal().rangeRoundBands([yAxisPadding_multiples, width_multiples + 40], 0.25);
  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");

  var yScale = d3.scale.linear().range([height_multiples, margin_multiples.top])
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

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
      .attr("x", width_multiples - 65)             
      .attr("y", margin_multiples.top - 10)
      .attr("class", "smallMultiplesTitle")
      .style("font-size", "14px") 
      .style("text-anchor", "middle")
      .attr("fill", "white")
      .text(inverseAxisOptions[yMultiples]);
  }

  multiplesPlot = d3.select("." + yMultiples)

  // Scale the data
  xScale.domain(multiplesData.map(function(d) {
    return d['subreddit'];
  }));

  var minY = d3.min(multiplesData, function(d) {
    return +d[yMultiples + cur_filter];
  })
  minY *= 0.4
  var maxY = d3.max(multiplesData, function(d) {
    return +d[yMultiples + cur_filter];
  })
  yScale.domain([minY, maxY]).nice();

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
      highlight(multiplesPlot, ".rect", d['subreddit'])
    })
    .on("mouseout", function(d) {
      unHighlight(multiplesPlot, ".rect", d['subreddit'])
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

  // Scale the data
  xScale.domain(multiplesData.map(function(d) {
    return d['subreddit'];
  }));

  var minY = d3.min(multiplesData, function(d) {
    return +d[yMultiples + cur_filter];
  })
  minY *= 0.4
  var maxY = d3.max(multiplesData, function(d) {
    return +d[yMultiples + cur_filter];
  })
  yScale.domain([minY, maxY]).nice();

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

  multiplesPlot.selectAll(".x.axis .tick text")
    .style("text-anchor", "left")
    .style("font-size", function(d) {
        size = 12;
        if ((cur_subreddit1.length > 13 && cur_subreddit2.length > 13) || (cur_subreddit1.length > 15 || cur_subreddit2.length > 15)) {
          size = 8;
        }
        else if (cur_subreddit1.length > 9 || cur_subreddit2.length > 9) {
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
      return d;
      //return abbreviateSubreddit(d);
    })

  multiplesPlot.selectAll(".y.axis .tick text")
  .text(function(d) {
    return abbreviate_thousands(d);
  });
}

