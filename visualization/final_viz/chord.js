var width = 700,
    height = 700,
    outerRadius = Math.min(width, height) / 2 - 105,
    innerRadius = outerRadius - 20;

var formatPercent = d3.format(".1%");

var arc = d3.svg.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

var layout = d3.layout.chord()
    .padding(.044)
    .sortSubgroups(d3.descending)
    .sortChords(d3.ascending);

var path = d3.svg.chord()
    .radius(innerRadius);

var svg = d3.select(".redditChord").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("id", "circle")
    .attr("transform", "translate(" + (width  ) / 2 + "," + height / 2 + ")");

var chord;

svg.append("circle")
    .attr("r", outerRadius);

d3.csv("subreddit_lookup.csv", function(cities) {
  d3.json("subreddit_mentions.json", function(matrix) {

    console.log(matrix)
    var overall_mentions = 0;
    var dest_mention_totals = []
    for (var i = 0; i < matrix.length; i++) {
      dest_mention_totals.push(0);
    }
    for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix[i].length; j++) {
        overall_mentions += matrix[i][j];
        dest_mention_totals[j] += matrix[i][j];
      }
    }

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
      return cities[i].name + ": " + d.value + " mention origins (" + formatPercent(d.value / overall_mentions) + " of all mention origins)";
    });

    // Add the group arc.
    var groupPath = group.append("path")
      .attr("id", function(d, i) {
        return "group" + i;
      })
      .attr("d", arc)
      .style("fill", function(d, i) {
        return cities[i].color;
      });

    group.append("text")
      .each(function(d) {
        d.angle = ((d.startAngle + d.endAngle) / 2);
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
      .text(function(d,i) { return cities[i].name; });

    // Add the chords.
    chord = svg.selectAll(".chord")
        .data(layout.chords)
      .enter().append("path")
        .attr("class", "chord")
        .style("fill", function(d) {
          return cities[d.source.index].color;
        })
        .attr("d", path)

    // Mouseover
    chord.append("title").text(function(d) {
      if (cities[d.source.index].name === "AskReddit") {
        console.log(d)
        console.log(cities[d.source.index])
        console.log(cities[d.target.index])
      }
      return cities[d.source.index].name
          + " → " + cities[d.target.index].name
          + ": " + d.source.value + " mentions (" + formatPercent(d.source.value / dest_mention_totals[d.target.index]) +  " of destination mentions)"
          + "\n" + cities[d.target.index].name
          + " → " + cities[d.source.index].name
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
  });
});