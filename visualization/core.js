/*
core.js has core logic for the visualization page.
This includes things like loading data sets,
initializing dropdowns, listening for keys,
and in general any one time initializations.

Approximately 94% of the lines in this file were
written by our team.
The remaining 6% was copied from online resources or libraries.
*/

// Spinner to show while loading data
// Options copied from http://spin.js.org/ just for easier tweaking
// These are just the defaults anyways
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

// Scrolls the page to the top before refreshing
// the page
$(window).on('beforeunload', function() {
   $(window).scrollTop(0);
});

// Creates loading spinner
$(document).ready(function() {
  var target = document.getElementById('spinner')
  var spinner = new Spinner(opts).spin(target);
});

// Initialize scroll snapping
// Outline of options copied from https://github.com/guidobouman/jquery-panelsnap
// We modified many of the options ourselves
var options;
jQuery(function($) {
  options = {
    $menu: $('body .menu'),
    menuSelector: 'a',
    panelSelector: '> section',
    namespace: '.panelSnap',
    onSnapStart: function(){},
    onSnapFinish: function(){},
    onActivate: function($target){
      // Contains css class of panel
      var activatedPanel = $target[0].attributes[0].nodeValue;
      if (activatedPanel == 'mainVizPanel') {
        if (show_chord) {
          $(".xPickerHolder, .yPickerHolder .filterHolder").hide(500);
          $(".toggleSubredditsHolder, .subredditSubsetHolder").show(500);
        } else {
          $(".xPickerHolder, .yPickerHolder, .filterHolder, .toggleSubredditsHolder, .subredditSubsetHolder").show(500);
        }
      } else if (activatedPanel == 'comparePanel') {
        $(".xPickerHolder, .yPickerHolder, .toggleSubredditsHolder, .subredditSubsetHolder").hide(500);
        $(".filterHolder").show(500);
      }
    },
    directionThreshold: 100,
    slideSpeed: 800,
    easing: 'linear', // Easing examples: https://matthewlein.com/experiments/easing.html
    offset: 50, // 160 for Graham's laptop
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
  // Initialize the panel snapping
  $('body').panelSnap(options);
});

// When you refresh when the button is open, it keeps open since css
// doesn't update
$("#toggle").prop("checked", true).css({"background": "#dd6149;"});

// Keep these selections so we can reuse them throughout the code
var nav_bar = d3.select(".navbar-fixed-top");
var body = d3.select("body");

// Toggle the static nav bar through the Show Menu button
d3.select("#toggle").on("click", function(d) {
  var checked = $('#toggle')[0].checked;
  if (!checked) {
    $('.navbar-fixed-top').slideUp(500);
    $(".aboutButton").hide(500)
    body.style("padding-top", "50px")
  } else {
    nav_bar.transition().duration(1000).style("opacity", 1);
    $('.navbar-fixed-top').slideDown(500);
    $(".aboutButton").show(500)
    body.style("padding-top", "160px")
  }
});

// Global variables are changed and graph refreshes
// pick up the new variables
var cur_month_label = 'October 2016';
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

var month_changed = false;

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

var show_chord = false;

// This is where we lookup the subreddit presets
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

  "Science/History/Tech": [
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
  /*
  // NSFW subreddits are a core part of Reddit. We figure in order to not
  // surprise the professor/TAs/students, we should keep this excluded
  // for the project itself. However, uncommenting this block will include
  // them again.
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
  */

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

// We have to hack the bootstrap select picker
// Need to lookup the index of the subreddit later on
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
  "October 2016"
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
  "October 2016": "mention_adj_matrix_d3_RC_2016-10.json",
}

// Our time data uses indices for months
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
  } else if (label === "October 2016") {
    return 10;
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

// Controls the circle size of the scatterplot
var circleSize = function(d) {
  return 7;
  //return Math.log(d['num_comments'] / 100) * 0.8;
}

// Assign a color to every subreddit
// You can pass in the subreddit name or the object
var color = d3.scale.category20();
var cValue = function(d) {
  if (typeof(d) === 'object') {
    return d['subreddit']
  } else {
    return d;
  }
}

// Prepare tooltip for the scatterplot
var tooltip = body.append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Prepare tooltip for the scatterplot
var tooltip2 = body.append("div")
    .attr("class", "tooltip2")
    .style("opacity", 0);

// Provide labels for the data base variables
var axisOptions = {
  'Subreddit': 'subreddit',
  'Avg. Word Length': 'avg_word_length',
  'Avg. Comment Length': 'avg_words_per_comment',
  'Number of Comments': 'num_comments',
  'Positive Score': 'positive_score',
  'Negative Score': 'negative_score',
  'Godwin\'s Score': 'godwins_score',
  'Swear Score': 'swear_score',
}

var inverseAxisOptions = {
  'subreddit': 'Subreddit',
  'avg_word_length': 'Avg. Word Length',
  'avg_words_per_comment': 'Avg. Comment Length',
  'num_comments': 'Number of Comments',
  'positive_score': 'Positive Score',
  'negative_score': 'Negative Score',
  'godwins_score': 'Godwin\'s Score',
  'swear_score': 'Swear Score',
}


// Do our CTRL handling for when we want to compare a second subreddit (ctrl+left click)
// CTRL+q toggles the menu (this could be phased out)
var cntrlIsPressed = false;
var qIsPressed = false;
var navBarHidden = false;
var navBarToggled = false;
$(document).keydown(function(event) {
    if (event.which == "17") {
      cntrlIsPressed = true;
    } else if (event.which == "81") {
      qIsPressed = true;
    } else if (event.which == "13") {
      // Scroll to compare subreddits if enter is chosen
      var offset = 105;
      $('html, body').animate({
          scrollTop: $("#compare").offset().top - offset
      }, 800);
    }
    if (cntrlIsPressed && qIsPressed && !navBarToggled) {
      navBarToggled = true;
      if (!navBarHidden) {
        $('.navbar-fixed-top').slideUp();
       body.style("padding-top", "25px")
        options.offset = 0;
        navBarHidden = true;
      } else {
        nav_bar.transition().duration(1000).style("opacity", 1)
        $('.navbar-fixed-top').slideDown();
        body.style("padding-top", "220px")
        navBarHidden = false;
      }
    }
});

// Track if we press a key of interest
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
// however we stopped using this
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

// Keep the selection for reuse
var filter_label = $(".filterLabel")

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
    .append("option")
    .attr("title", "X Variable");

// Load select items from the CSV (departments)
var yDrop = yPicker.selectAll("option")
    .data(Object.keys(axisOptions).filter(function(d) {
      return d != 'Subreddit';
    }))
    .enter()
    .append("option")
    .attr("title", "Y Variable");

// Respond to changes in x and y variables
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

// Initialize word clouds
var wordcloud1 = d3.select(".wordcloud1")
    .attr("src", "word_clouds/" + cur_month_label + "/" + cur_subreddit1)
    .attr("title", "Top occurring words in subreddit " + cur_subreddit1)
    .attr("width", "10%")
    .attr("height", "50%")

var wordcloud2 = d3.select(".wordcloud2")
    .attr("src", "word_clouds/" + cur_month_label + "/" + cur_subreddit2)
    .attr("title", "Top occurring words in subreddit " + cur_subreddit2)
    .attr("width", "10%")
    .attr("height", "50%")

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
        // Kills the loading spinner since we are done loading stuff
        var target = document.getElementById('spinner');
        target.remove();
      });
    });
    
  })
});

// Load the chord data into memory once
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
  
  if (!show_chord) {
    $(".chordContainer").hide();
  } else {
    create_chord(full_chord_lookup_dataset, full_chord_matrix_dataset, cur_chosen_subreddits);
  }

  // Get data for only the subreddits that are chosen
  core_dataset = core_dataset.filter(function(d, i) {
    return cur_chosen_subreddits.indexOf(d['subreddit']) > -1;
  })

  // Grab the current month's time data
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

  // We will selectively update the word clouds when appropriate
  if (old_cur_subreddit1 != cur_subreddit1 || month_changed) {
    // Put the actual image path. We set our default comparison subreddits
    wordcloud1.style("opacity", 0)
      .attr("src", "word_clouds/" + cur_month_label + "/" + cur_subreddit1 + "_wordcloud.png")
      .attr("title", "Top occurring words in subreddit " + cur_subreddit1)
      .transition()
      .duration(2000)
      .style("opacity", 1)

    wordcloud1.on("mouseover", function() {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTipImage(cur_subreddit1))
        .style("left", d3.event.pageX - 840 + "px")
        .style("top", d3.event.pageY - 500 + "px")
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
      })

    d3.select(".wordcloud1Title")
      .html("Word cloud for " + cur_subreddit1)
    old_cur_subreddit1 = cur_subreddit1
  }
  if (old_cur_subreddit2 != cur_subreddit2 || month_changed) {

    wordcloud2.style("opacity", 0)
    .attr("src", "word_clouds/" + cur_month_label + "/" + cur_subreddit2 + "_wordcloud.png")
    .attr("title", "Top occurring words in subreddit " + cur_subreddit2)
    .transition()
    .duration(2000)
    .style("opacity", 1)

    wordcloud2.on("mouseover", function() {
      tooltip.style("opacity", 1);
      tooltip.html(getToolTipImage(cur_subreddit2))
        .style("left", d3.event.pageX - 840 + "px")
        .style("top", d3.event.pageY - 500 + "px")
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
    })

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
      if (i == keys.length / 2 + 1 && !month_changed) {
        refreshSmallMultiplesLegend(compare_core_dataset)
      }
      refreshSmallMultiples(compare_core_dataset, axisOptions[keys[i]])
    }
  }
  /*
  // Don't update legend if just the month changed
  if (!month_changed) {
    refreshSmallMultiplesLegend(compare_core_dataset)
  }
  */
  month_changed = false;
  
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

  // Set up the arrow which transitions from the bar/scatter plot to the chord diagram
  d3.select("#arrow").on("click", function (e) {
      if (!show_chord) {
          $("#arrow").css("transform", "rotate(90deg)");
          show_chord = true;
          $(".mainVizContainer").hide(500);
          $(".chordContainer").show(500);
          $(".xPickerHolder, .yPickerHolder, .filterHolder").hide(500);
          $(".toggleSubredditsHolder, .subredditSubsetHolder").show(500);
          d3.select(this).attr("title", "Click to view an overview of subreddit data")
          filter_label.hide();
          refresh();
      } else {
          $("#arrow").css("transform", "rotate(-90deg)");
          show_chord = false;
          $(".chordContainer").hide(500);
          $(".mainVizContainer").show(500);
          $(".xPickerHolder, .yPickerHolder, .toggleSubredditsHolder, .subredditSubsetHolder, .filterHolder").show(500);
          d3.select(this).attr("title", "Click to view subreddit network data")
          filter_label.show();
          refresh();
      }
  })
  .attr("title", "Click to view subreddit network data");

  // Populate the dropdown which lets you select which subreddits to show
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

  // Set up the dropdown to let the user set preset subreddit subsets
  var subredditsubsetpicker = d3.select("#subredditsubset-picker").selectAll("option")
    .data(Object.keys(subreddit_subsets));

  // Add buttons for each filter
  subredditsubsetpicker.enter()
    .append("option")
    .attr("title", "Subreddit Presets")
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

  $("#month-slider").on("change", function(slideEvt) {
    var month = month_lookup[slideEvt.value.newValue];
    cur_month_label = month;
    month_changed = true;
    refresh();
  });
  
  // Set up the dropdown which selects the subset of comments we are
  // looking at
  var filterpicker = d3.select("#filter-picker").selectAll("option")
    .data(Object.keys(filter_labels));

  // Add buttons for each filter
  filterpicker.enter()
    .append("option")
    .attr("value", function(d) {
      return "" + d;
    })
    //.attr("title", "Comment Filters")
    .html(function(d) {
      return "" + d;
    });
    //.attr("data-icon", "glyphicon-info-sign");

  $('#filter-picker').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
    cur_filter_label = $(e.currentTarget).val();
    filter_label.text("Current Filter: " + cur_filter_label)
    cur_filter = filter_labels[cur_filter_label];
    if (xVariable != 'subreddit') {
      xVariable = xVariableBase + cur_filter;
    }
    yVariable = yVariableBase + cur_filter
    refresh();
  });
  $('#filter-picker').selectpicker('refresh');

  // Set up the info button next to the comment subset dropdown
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

  // Set up the info hover icon by the chord
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

  // Set up the info hover on the man viz
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


// Assign the current subreddit based on the type of click
var chosen = false;
var onclick_compare = function(subreddit) {
  if (!cntrlIsPressed) {
    old_cur_subreddit1 = cur_subreddit1
    cur_subreddit1 = subreddit;
  } else {
    var offset = 105;
    $('html, body').animate({
        scrollTop: $("#compare").offset().top - offset
    }, 800);
    old_cur_subreddit2 = cur_subreddit2
    cur_subreddit2 = subreddit;
  }
  flash_subreddit_change();
  refresh();
}

// Copied from http://stackoverflow.com/questions/6134039/format-number-to-always-show-2-decimal-places
// Just show 2 decimal places on numbers
var format_decimal = function(number) {
  return Number(Math.round(number + 'e2') + 'e-2').toFixed(2)
}

// Abbreviate numbers to use k for 1000s, m for millions
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

// Align table elements on the decimal to make it prettier
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

// Centralized tooltip function for regular bar/scatter elements
var getToolTip = function(d) {
  return "<center><b>" + d["subreddit"] +'</b>: ' + numberWithCommas(d["num_comments" + cur_filter]) + ' comments'  + '<hr style="margin-top: 5px; margin-bottom: 5px"><table class="hoverTooltip">'
  + '<tr><td align="middle" width="150px">Average Word Length: </td>' + align_decimal(format_decimal(d["avg_word_length" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Words Per Comment: </td>' + align_decimal(format_decimal(d["avg_words_per_comment" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Positive Score: </td>' + align_decimal(format_decimal(d["positive_score" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Negative Score: </td>' + align_decimal(format_decimal(d["negative_score" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Godwin\'s Score: </td>' + align_decimal(format_decimal(d["godwins_score" + cur_filter])) + "</tr>"
  + '<tr><td align="middle">Swear Score: </td>' + align_decimal(format_decimal(d["swear_score" + cur_filter])) + "</tr></table></center>"
}


// Centralized tooltip function for the comment subset info hover
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

// Centralized tooltip function for images
var getToolTipImage = function(subreddit) {
  return '<center><b>Word cloud for ' + subreddit + '</b></center><br><img src="word_clouds/' + cur_month_label + '/' + subreddit + '_wordcloud.png"/>'
}

// Centralized tooltip function for chord info hover
var getToolTipChord = function(d) {
  return "<b>Tip</b>: Hover over a subreddit arc to view its network of subreddit mentions. The " + getColoredColor() + " of the chord indicates the source of the subreddit mention. Press the <b>esc</b> key to unfade all chords. Left click one subreddit and ctrl/cmd + left click another subreddit to compare them further down the page."
}

var getColoredColor = function(d) {
  return '<b><span style="color: DarkBlue">c</span><span style="color: Orange">o</span><span style="color: Black">l</span><span style="color: Maroon">o</span><span style="color: Green">r</span></b>'
}

// Info tooltip for main viz
var getToolTipMainVizQuestion = function(d) {
  return "<p><b>Tip</b>: Choose the x and y variables that interest you. Hover over the data for more details. Left click one subreddit and ctrl/cmd + left click another subreddit to compare them further down the page.</p>"
}

// Only fade away the popup if we haven't
// clicked for another subreddit while it has been up
var flash_count = 0;

// Flashes a popup saying a new subreddit was chosen
var flash_subreddit_change = function() {
  flash_count = flash_count + 1;
  tooltip2.remove();
  tooltip2 = body.append("div")
      .attr("class", "tooltip2")
      .style("opacity", 0);
  tooltip2.style("opacity", 1);
  tooltip2.html('<table style="width: 250px"><tr><td rowspan="2"><i style="font-size: 22px" class="glyphicon glyphicon-arrow-down"></i></td><td style="text-align: center;">Updated compare subreddits to:</td></tr><tr><td style="text-align: center;"><b>' + cur_subreddit1 + '</b> vs <b>' + cur_subreddit2 + '</b></td></tr></table>')
    .style("left", (1300 / 2) + "px")
    .style("top", (700 / 2) + "px")
    .style("position", "fixed")
  setTimeout(function() {
    flash_count = flash_count - 1;
    if (flash_count == 0) {
      tooltip2.transition().duration(1000).style("opacity", 0);
    }
  }, 1500)
}

// Wraps text to multiple lines
// Taken from https://bl.ocks.org/mbostock/7555321
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

// Access the count of comments, dynamically based on the current comment subset
var count_accessor = function(d) {
    return d['count' + cur_filter]
}

// 1000000 -> 1,000,000
// Taken from http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}