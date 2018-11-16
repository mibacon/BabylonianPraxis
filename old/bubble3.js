/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
 
 var fillColor, radiusScale, myNodes;


function bubbleChart() {
  // Constants for sizing
  var width = 940;
  var height = 600;

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('gates_tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

 
  var ethCenters = {
    Babylonian: { x: width *.2, y: height / 2 },
    Aramean: { x: width *.4, y: height / 2 },
    Judean: { x: width* .6, y: height / 2 },
    Iranian: {x: width *.8, y: height/2}
  };

  // X locations of the year titles.
  var ethTitleX = {
    Babylonian: width*.2,
    Aramean: width *.4,
    Judean: width*.6,
    Iranian: width*.8
  };


  var ethTitles = {
    Babylonian: {x: width*.2, text: "50% positive, 50% negative"},
    Aramean: {x: width*.4, text: "20% positive, 80% negative"},
    Judean:{x: width*.6, text: "70% positive, 30% negative"},
    Iranian: {x: width*.8, text: "10% positive, 90% negative"}
  }

  var sourceCenters = {
    Murašȗ: {x: width *.3, y: height/2},
    Yahudu: {x: width *.6, y: height/2}
  }
  
  var sourceTitleX = {
    Murašȗ: width *.3, 
    Yahudu: width *.6
  }
 
  var tendencyCenters = {
    '+': {x: width *.3, y: height/2},
    '-': {x: width *.6, y: height/2}
  }
  
  var tendencyTitleX = {
    '+': width *.3, 
    '-': width *.6
  }
  
  // @v4 strength to apply to the position forces
  var forceStrength = 0.03;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];
  
  

  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.3)
    .force('x', d3.forceX().strength(forceStrength).x(width/2))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  // Nice looking colors - no reason to buck the trend
  // @v4 scales now have a flattened naming scheme
  // var fillColor = d3.scaleOrdinal()
  //   .domain([-1, 1])
  //   .range(['#d84b2a', '#7aa25c']);
  
 
  fillColor = d3.scaleThreshold()
    	.domain([-.66, -.33, 0, .33, .66, 1])  //[-.6, -.2, .2, .6]
    	// .range(d3.schemeRdYlBu[7]); //=> 5 colors in an array
    // var fillColor = d3.scaleSequential(d3.interpolateSpectral)
      .range(["#440154", "#9467bd", "#e377c2", "#8c564b",  "#2ca02c", "#ff7f0e",  "#d62728"])
 
 
 
  function createNodes(rawData) {
    
       
    
    var maxAmount = d3.max(rawData, function (d) { return +d.Transaction_Count; });

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 35])
      .domain([0, maxAmount]);

    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
     myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.Transaction_Count),
        value: +d.Transaction_Count,
        score: d.Weighted_Tendency,
        archive: d.Archive,
        tendency: d.Tendency,
        ethnicity: d.new_eth,
        name: d.full_name,
        // x: Math.random() * 900,
        // y: Math.random() * 800,
        "x": function () {
          if(d.Tendency == "+") {
            return Math.random()*300
          } else {
            return Math.random()*600
          }
        }, 
               
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.score - a.score; });

    return myNodes;
    
  } //end of createNodes

  
  
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.score); })
      // .attr('stroke', function (d) { return d3.rgb(fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(500)
      .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    // Set initial layout to single group.
    groupBubbles();
  
    
  }; //end of chart

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  /*
   * Provides a x value for each node to be used with the split by year
   * x force.
   */
  function nodeEthPos(d) {
    return ethCenters[d.ethnicity].x
  }


  function nodeSourcePos(d) {
    return sourceCenters[d.archive].x
    
    
  }
  
  function nodeTendencyPos(d) {
    return tendencyCenters[d.tendency].x
  }
  /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    hideTitles();
    // splitTendencyBubbles()
    // @v4 Reset the 'x' force to draw the bubbles to the center.
    // simulation.force('x', d3.forceX().strength(forceStrength).x(nodeTendencyPos));
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }

  function sortBubbles(){
    myNodes.sort(function (a, b) { return b.score - a.score; });
    console.log(myNodes)
  }
  /*
   * Sets visualization in "split by year mode".
   * The year labels are shown and the force layout
   * tick function is set to move nodes to the
   * yearCenter of their data's year.
   */
  function splitEthBubbles() {
    hideTitles();
    showEthTitles();
    sortBubbles()
    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeEthPos));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(2).restart();
  }


  function splitSourceBubbles() {
    hideTitles();
    showSourceTitles();
    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeSourcePos));
    // simulation.force('y', d3.forceY().strength(forceStrength).y(nodeMonthPos));
    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(2).restart();
  }
  
  
  function splitTendencyBubbles() {
    hideTitles();
    showTendencyTitles();
    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeTendencyPos));
    // simulation.force('y', d3.forceY().strength(forceStrength).y(nodeMonthPos));
    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(2).restart();
  }
  
  
  // * Hides Year title displays.
  
  function hideTitles() {
    svg.selectAll('.eth').remove();
    svg.selectAll('.source').remove()
    svg.selectAll('.tendency').remove()
  }

  /*
   * Shows Year title displays.
   */
  function showEthTitles() {
    var ethData = ethTitles
    // var ethData = d3.keys(ethTitleX);
    // var eth = svg.selectAll('.eth')
    //   .data(ethData);

    var eth = d3.select('#vis').append('div').attr("class", "new").select('.new')

      eth.select('.new')
        .data([ethData])
      
      eth.selectAll('.eth').enter()

    
   eth.enter().append('text')
      .attr('class', 'eth')
      .attr('x', function (d) {return d.x})
        // return ethTitles[d].x; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text('function (d) { return Object.keys(d);})');

    eth.enter().append('text')
      .attr('class', 'eth')
      .attr('x', function (d) { return ethTitles[d].x; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d.text; });
  }

  function showSourceTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    var sourceData = d3.keys(sourceTitleX);
    var source = svg.selectAll('.source')
      .data(sourceData);

    source.enter().append('text')
      .attr('class', 'source')
      .attr('x', function (d) { return sourceTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }

    function showTendencyTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    var tendencyData = d3.keys(tendencyTitleX);
    var tendency = svg.selectAll('.tendency')
      .data(tendencyData);

    tendency.enter().append('text')
      .attr('class', 'tendency')
      .attr('x', function (d) { return tendencyTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }
  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Name: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Score: </span><span class="value">' +
                  d.score +
                  '</span><br/>' +
                  '<span class="name">Transactions: </span><span class="value">' +
                  d.value +
                  '</span><br/>' +
                  '<span class="name">Source: </span><span class="value">' +
                  d.archive +
                   '</span><br/>' +
                   '<span class="month">Archive: </span><span class="value">' +
                   d.ethnicity +'</span>';

    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   

   */
  function hideDetail(d) {
    // // reset outline
    // d3.select(this)
    //   .attr('stroke', d3.rgb(fillColor(d.group)).darker());

    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    if (displayName == 'Ethnicity') {
      splitEthBubbles();
    } else if(displayName == 'Archive') {
      splitSourceBubbles()
    } else if (displayName == 'Tendency' ) {
      splitTendencyBubbles() 
    } else {
       groupBubbles();
    }
  };


  // return the chart function from closure.
  return chart;

  
} //end of bubblechart

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data.csv', display);

              // NEW


// setup the buttons.
setupButtons();



var legendRectSize = 10
var legendSpacing = 4
  

var thresholds = [-1, -.66, -.33, 0, .33, .66, 1]
var sizes = [1, 3, 10, 30, 124]

var bandScale = d3.scaleBand()
   .range([0, 200])
   .domain(thresholds)
  
radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 35])
      .domain([0, 124]);
      
var pointScale = d3.scalePoint()
    .domain(sizes)
    .range([10, 200]);


var legend = d3.select('#color').append('svg').attr("height", 30).selectAll('.rect')
    .data(thresholds)
    
    
    legend.enter().append('rect')
      .attr("height", 30)
      .attr("width", 30)
      .attr("x", function(d, i) {
        return bandScale(d)
      })
      .attr("y", 0)
      .attr("fill", function(d){
        return fillColor(d)
      })
      
      legend.enter().append('text')
        .attr("x", function(d, i) {
          return bandScale(d)
        })
        .attr("y", 15)
        .text(function(d){return d})
        .attr("alignment-baseline", "middle")
        
    var sizeLegend = d3.select('#radius')
      .append("svg").attr("height", 65)
      .selectAll("circle")
      .data(sizes)
      
     
      sizeLegend.enter().append("circle")
        .attr("cx", function(d){
          return pointScale(d) + radiusScale(d)
        })
        .attr("cy", 35)
        .attr("r", function(d) {
          return radiusScale(d)
        })
      
       sizeLegend.enter().append('text')
        .attr("x", function(d, i) {
          return pointScale(d)
        })
        .attr("y", 60)
        .text(function(d){return d})
        .attr("alignment-baseline", "middle")
        .style("fill", "red")