console.clear()

    var w = 1260, h = 500;
     var tooltip = floatingTooltip('gates_tooltip', 240);
    // var radius = 2;
    // var color = d3.scaleOrdinal(d3.schemeCategory20);
      var color = d3.scaleThreshold()
      .domain([-.66, -.33, 0, .33, .66, 1])  
      .range(d3.schemeRdYlBu[7]);

    var centerScale = d3.scalePoint().padding(1).range([0, w]);
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 35])
      .domain([0, 150]);
    
    var forceStrength = 0.03;

    var section = d3.select('#labels').append("svg")
      .attr("height", 100)
      .attr("width", w)

    var svg = d3.select("#vis").append("svg")
      .attr("width", w)
      .attr("height", h)

    
   

    var simulation = d3.forceSimulation()
            .velocityDecay(0.3)
            .force("x", d3.forceX().strength(.03).x(w / 2))
            .force("y", d3.forceY().strength(.03).y(h / 2))
            
            .force("charge", d3.forceManyBody().strength(-2))

            simulation.stop();


    var percentages =  {
      ALL: {pos:49, neg: 51},
      "+": {pos:"", neg: ""},
      "-": {pos:"", neg: ""},
      Yahudu: {pos: 55, neg: 45},
      Murašȗ: {pos: 46, neg: 54},
      Aramean: {pos: 49, neg: 51},
      Babylonian: {pos: 47, neg: 53},
      Iranian: {pos: 56, neg: 44},
      Judean: {pos: 63, neg: 37},
      1: {pos: 50, neg: 50},
      "<6": {pos: 48, neg: 52},
      "<30": {pos: 34, neg: 66},
      "<100": {pos: 50, neg: 50},
      ">100": {pos: 67, neg: 33}
    }
    
    d3.csv("data.csv", function(data){
      
      
      var circles = svg.selectAll("circle")
      	.data(data, function(d){ return d.id ;});
      
      var circlesEnter = circles.enter().append("circle")
      	.attr("r", function(d, i){ return radiusScale(d.Transaction_Count); })
        .attr("fill", function(d){
          return color(d.Weighted_Tendency)
        })
        .on('mouseover', showDetail)
        .on('mouseout', hideDetail);
    
      circles = circles.merge(circlesEnter)

      groupBubbles()
      
      function ticked() {
        circles
            .attr("cx", function(d){ return d.x; })
            .attr("cy", function(d){ return d.y; });
      }   

      simulation
            .nodes(data)
            .on("tick", ticked);
      
           
      function groupBubbles() {
        hideTitles();
        
        // @v4 Reset the 'x' force to draw the bubbles to the center.
        simulation.force('x', d3.forceX().strength(forceStrength).x(w / 2));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(1).restart();
        showSubs(centerScale.domain(), centerScale.domain(["ALL"]))
      }
      
      function splitBubbles(byVar) {
        
        centerScale.domain(data.map(function(d){ return d[byVar]; }));

      
        
        if(byVar == "all"){
          hideTitles()
        } else {
	        showTitles(byVar, centerScale);
        }
        
        // @v4 Reset the 'x' force to draw the bubbles to their year centers
        simulation.force('x', d3.forceX().strength(forceStrength).x(function(d){ 
        	return centerScale(d[byVar]);
        }));

        // @v4 We can reset the alpha value and restart the simulation
        simulation.alpha(2).restart();
      }
      
      



      function hideTitles() {
        section.selectAll('.title').remove();
        section.selectAll('.positive').remove()
        section.selectAll('.negative').remove()
      }

     

      function showTitles(byVar, scale) {
        // Another way to do this would be to create
        // the year texts once and then just hide them.

        var titles = section.selectAll('.title')
          .data(scale.domain())

              
        titles.enter().append('text')
          	.attr('class', 'title')
        	  .merge(titles)
            .attr('x', function (d) { 
              // console.log(d) 
              return scale(d); })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });

        showSubs(scale.domain(), scale)
              // return percentages[d].neg  })
        
        titles.exit().remove() 
        // console.log(section)
       
      }
      
      function showSubs(d, scale) {
        var positive = section.selectAll('.positive')
            .data(scale.domain())
            
        
          positive.enter().append('text')
            .attr('class', 'subtitles')
            .attr('class', 'positive')
            .merge(positive)
            .attr('x', function (d) { return scale(d) - 50; })
            .attr('y', 55)
            // .attr('text-anchor', 'middle')
            // .text("Hello World!")
            .text(function (d) { 
              if((d == "+")||(d == "-")) {console.log("tendency")}  else {
                return  percentages[d].pos + "%"
              }          
              
              })
          var negative = section.selectAll('.negative')
            .data(scale.domain())
          
          negative.enter().append('text')
            .attr('class', 'negative')
            .merge(negative)
            .attr('x', function (d) { return scale(d) +50; })
            .attr('y', 55)
            // .attr('text-anchor', 'end')
            .text(function (d) { 
              if((d == "+")||(d == "-")) {console.log("tendency")}  else {
                return  percentages[d].neg + "%"
              } 
            })

             positive.exit().remove()
             negative.exit().remove()
      }


      function showDetail(d) {
        // change outline to indicate hover state.
        d3.select(this).attr('stroke', 'black');

        var content = '<span class="name">Name: </span><span class="value">' +
                      d.full_name +
                      '</span><br/>' +
                      '<span class="name">Score: </span><span class="value">' +
                      d.Weighted_Tendency+
                      '</span><br/>' +
                      '<span class="name">Transactions: </span><span class="value">' +
                      d.Transaction_Count +
                      '</span><br/>' +
                      '<span class="name">Source: </span><span class="value">' +
                      d.Archive +
                       '</span><br/>' +
                       '<span class="month">Archive: </span><span class="value">' +
                       d.ethnicity +'</span>';

        tooltip.showTooltip(content, d3.event);
      }

      function hideDetail(d) {
        tooltip.hideTooltip();
      }

      function setupButtons() {
        d3.selectAll('.button')
          .on('click', function () {
          	
            // Remove active class from all buttons
            d3.selectAll('.button').classed('active', false);
            // Find the button just clicked
            var button = d3.select(this);

            // Set it as the active button
            button.classed('active', true);

            // Get the id of the button
            var buttonId = button.attr('id');

	          // console.log(buttonId)
            // Toggle the bubble chart based on
            // the currently clicked button.
            splitBubbles(buttonId);
          });
      }
      
      setupButtons()
      

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
              return color(d)
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

    })