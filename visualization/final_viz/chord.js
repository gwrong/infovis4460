var chord;

var create_chord = function(subreddit_lookup, matrix, cur_subreddits) {

  // enter-update-exit is nearly impossible for the chord
  d3.selectAll(".redditChord").remove()
  
  var indices = []
  var new_subreddit_lookup = []
  var new_matrix = []
  for (var i = 0; i < subreddit_lookup.length; i++) {
    var subreddit = subreddit_lookup[i].subreddit;
    if (cur_subreddits.indexOf(subreddit) > -1) {
      indices.push(i);
      new_subreddit_lookup.push(subreddit_lookup[i])
    }
  }

  var cur_index = -1;
  for (var i = 0; i < matrix.length; i++) {
    if (indices.indexOf(i) < 0) {
      continue;
    } else {
      new_matrix.push([])
      cur_index = cur_index + 1;
    }
    for (var k = 0; k < indices.length; k++) {
      if (i == k) {
        new_matrix[cur_index].push(0)
      } else {
        new_matrix[cur_index].push(matrix[i][indices[k]])
      }
      
    }
  }

  matrix = new_matrix;
  subreddit_lookup = new_subreddit_lookup;

  var overall_mentions = 0;
  var dest_mention_totals = []
  for (var i = 0; i < matrix.length; i++) {
    dest_mention_totals.push(0);
  }
  for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j]) {
        overall_mentions += matrix[i][j];
        dest_mention_totals[j] += matrix[i][j];
      }
    }
  }

  if (overall_mentions == 0) {
    d3.select(".chordContainer").append("div")
      .attr("class", "redditChord")
    d3.select(".redditChord")
      .append("h5").html("<br><br><br><br><br><br><br><br><br><br><br><br>No mentions between chosen subreddits :(<br><br><br><br><br><br><br><br><br><br><br><br>")
      return;
  }

  var width = 500
  var height = 500
  var outerRadius = Math.min(width, height) / 2 - 105
  var innerRadius = outerRadius - 20;

  var formatPercent = d3.format(".2%");

  var arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  var layout = d3.layout.chord()
      .padding(.044)
      .sortSubgroups(d3.descending)
      .sortChords(d3.ascending);

  var path = d3.svg.chord()
      .radius(innerRadius);

  // Change this to enter-update-exit
  d3.select(".chordContainer").append("div")
    .attr("class", "redditChord")

  var svg = d3.select(".redditChord").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("id", "circle")
      .attr("transform", "translate(" + (width  ) / 2 + "," + height / 2 + ")");
  svg.append("circle")
    .attr("r", outerRadius);

  // Compute the chord layout.
  layout.matrix(matrix);

  // Add a group per neighborhood.
  var group = svg.selectAll(".group")
    .data(layout.groups)
    .enter().append("g")
      .attr("class", "group")
      .on("mouseover", mouseover);

  // Add a mouseover title.
  group.append("title").text(function(d, i) {
    return subreddit_lookup[i].subreddit + ": " + d.value + " mention origins (" + formatPercent(d.value / overall_mentions) + " of all mention origins)";
  });

  // Add the group arc.
  var groupPath = group.append("path")
    .style("fill", function(d) {
      return "hsl(" + Math.random() * 360 + ",100%,50%)"
    })
    .transition().duration(2500)
    .attr("id", function(d, i) {
      return "group" + i;
    })
    .attr("d", arc)
    .style("fill", function(d, i) {
      return color(cValue(subreddit_lookup[i].subreddit));
    });

  group.append("text")
    .attr("transform", function(d,i) {
        return "rotate(0)";
    })
    .attr("fill", "white")
    .transition().duration(2500)
    .each(function(d) {
      d.angle = ((d.startAngle + d.endAngle) / 2);
      if (!d.angle) {
        d.angle = 0;
      }
    })
    .attr("dy", ".35em")
    .attr("class", "chordTitles")
    .attr("text-anchor", function(d) {
      return d.angle > Math.PI ? "end" : null;
    })
    .attr("fill", "white")
    .attr("transform", function(d,i) {
        var c = arc.centroid(d + 10);
        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                + "translate(" + (innerRadius + 30) + ")"
                + (d.angle > Math.PI ? "rotate(180)" : "")
    })
    .text(function(d,i) {
      return subreddit_lookup[i].subreddit;
    });

  // Add the chords.
  chord = svg.selectAll(".chord")
      .data(layout.chords)

  chord.enter().append("path")
      .attr("class", "chord")
      .style("fill", function(d) {
        return "hsl(" + Math.random() * 360 + ",100%,50%)"
      })
      .style("opacity", 0)
      .transition().duration(1200).delay(function(d, i) {
        return i * 5
      })
      .style("fill", function(d) {
        return color(cValue(subreddit_lookup[d.source.index].subreddit));
      })
      .style("opacity", 1)
      .attr("d", path)

  // Mouseover
  chord.append("title").text(function(d) {
    return subreddit_lookup[d.source.index].subreddit
        + " → " + subreddit_lookup[d.target.index].subreddit
        + ": " + d.source.value + " mentions (" + formatPercent(d.source.value / dest_mention_totals[d.target.index]) +  " of destination mentions)"
        + "\n" + subreddit_lookup[d.target.index].subreddit
        + " → " + subreddit_lookup[d.source.index].subreddit
        + ": " + d.target.value + " mentions (" + formatPercent(d.target.value / dest_mention_totals[d.source.index]) + " of destination mentions)";
  });

  function mouseover(d, i) {
    chord.transition()
      .delay(function(p, j) {
        return j;
      })
      .duration(500)
      .style("opacity",function(p) {
        if (p.source.index != i && p.target.index != i) {
          return 0;
        } else {
          return 1;
        }
    });
  }

  function remove_fade() {
    chord.transition()
      .delay(function(p, j) {
        return j;
      })
      .duration(500)
      .style("opacity",function(p) {
        return 1;
    });
  }

  // Remove fade on chord diagram
  // if you press the esc key
  $(document).keyup(function(e) {
   if (e.keyCode == 27) {
      remove_fade()
    }
  });
}

//create_chord();