// Load the data from socialMedia.csv
const socialMedia = d3.csv("socialMedia.csv");
socialMedia.then(function(data) {
  // Convert string values to numbers
  data.forEach(function(d) {
    d.Likes = +d.Likes;
  });

  // Define the dimensions and margins for the SVG
  const margin = { top: 40, right: 30, bottom: 40, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define the x scale and y scale for Box Plot
  const xScale = d3.scaleBand().range([0, width]).padding(0.1);
  const yScale = d3.scaleLinear().range([height, 0]);

  // Set the domain for x and y scales
  xScale.domain([...new Set(data.map(d => d.Platform))]);
  yScale.domain([0, d3.max(data, d => d.Likes)]);

  // Rollup data to calculate quantiles for each platform
  const rollupFunction = function(groupData) {
    const values = groupData.map(d => d.Likes).sort(d3.ascending);
    const min = d3.min(values);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const max = d3.max(values);
    return { min, q1, median, q3, max };
  };

  const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

  // Add bars to the box plot
  quantilesByGroups.forEach((quantiles, Platform) => {
    const x = xScale(Platform);
    const boxWidth = xScale.bandwidth();
    
    // Draw vertical lines (min and max)
    svg.append("line")
      .attr("x1", x + boxWidth / 2)
      .attr("x2", x + boxWidth / 2)
      .attr("y1", yScale(quantiles.max))
      .attr("y2", yScale(quantiles.min))
      .attr("stroke", "black");

    // Draw the box (q1 to q3)
    svg.append("rect")
      .attr("x", x)
      .attr("y", yScale(quantiles.q3))
      .attr("width", boxWidth)
      .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
      .attr("fill", "steelblue");

    // Draw the median line
    svg.append("line")
      .attr("x1", x)
      .attr("x2", x + boxWidth)
      .attr("y1", yScale(quantiles.median))
      .attr("y2", yScale(quantiles.median))
      .attr("stroke", "white")
      .attr("stroke-width", 2);
  });

  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Platform");

  // Add y-axis label
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Likes");

  // Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  // Add the y-axis
  svg.append("g")
    .call(d3.axisLeft(yScale));
});

// Load the data from socialMediaAvg.csv (Side-by-Side Bar Plot)
const socialMediaAvg = d3.csv("socialMediaAvg.csv");
socialMediaAvg.then(function(data) {
  // Define the dimensions and margins for the SVG
  const margin = { top: 20, right: 30, bottom: 40, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales for the bar plot
  const x0 = d3.scaleBand().range([0, width]).padding(0.1);
  const x1 = d3.scaleBand().padding(0.05);
  const y = d3.scaleLinear().range([height, 0]);
  const color = d3.scaleOrdinal()
    .domain([...new Set(data.map(d => d.PostType))])
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  x0.domain([...new Set(data.map(d => d.Platform))]);
  x1.domain([...new Set(data.map(d => d.PostType))]).rangeRound([0, x0.bandwidth()]);
  y.domain([0, d3.max(data, d => +d.AvgLikes)]);

  // Group container for bars
  const barGroups = svg.selectAll(".bar-group")
    .data(data)
    .enter().append("g")
    .attr("transform", d => `translate(${x0(d.Platform)},0)`);

  // Draw bars
  barGroups.append("rect")
    .attr("x", d => x1(d.PostType))
    .attr("y", d => y(d.AvgLikes))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.AvgLikes))
    .attr("fill", d => color(d.PostType));

  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Platform");

  // Add y-axis label
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Likes");

  // Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  // Add the y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add the legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 150},${margin.top})`);
  const types = [...new Set(data.map(d => d.PostType))];
  types.forEach((type, i) => {
    legend.append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", color(type));
    legend.append("text")
      .attr("x", 30)
      .attr("y", i * 20 + 10)
      .text(type);
  });
});

// Load the data from socialMediaTime.csv (Line Plot)
const socialMediaTime = d3.csv("socialMediaTime.csv");
socialMediaTime.then(function(data) {
  // Define the dimensions and margins for the SVG
  const margin = { top: 20, right: 30, bottom: 40, left: 40 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales for the line plot
  const x = d3.scaleBand().range([0, width]).padding(0.1);
  const y = d3.scaleLinear().range([height, 0]);

  // Set the domain for x and y scales
  x.domain(data.map(d => d.Date));
  y.domain([0, d3.max(data, d => d.AvgLikes)]);

  // Define the line
  const line = d3.line()
    .x(d => x(d.Date))
    .y(d => y(d.AvgLikes))
    .curve(d3.curveNatural);

  // Draw the line
  svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);

  // Add x-axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Date");

  // Add y-axis label
  svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Average Likes");

  // Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add the y-axis
  svg.append("g")
    .call(d3.axisLeft(y));
});
