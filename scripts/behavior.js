const season_list = ['season1', 'season2', 'season3', 'season4', 'season5', 'season6', 'season7', 'season8', 'season9', 'season10'];
var presence = "/data/presence.csv";
var characters = "/data/characters.csv";
var technical = "/data/technical-boxplot-fav.csv";
var rachel = "/data/rachel_interactions.csv";
var ross = "/data/ross_interactions.csv";
var monica = "/data/monica_interactions.csv";
var chandler = "/data/chandler_interactions.csv";
var joey = "/data/joey_interactions.csv";
var phoebe = "/data/phoebe_interactions.csv";
var anger = "/data/angry_emotion.csv";
var fear = "/data/fear_emotion.csv"; 
var happiness = "/data/happy_emotion.csv";
var sadness = "/data/sad_emotion.csv";
var surprise = "/data/surprise_emotion.csv";
var charSelected = '';

function init() {
    Promise.all([d3.csv(presence), d3.csv(characters), d3.csv(technical), d3.csv(rachel), d3.csv(ross), d3.csv(chandler), d3.csv(phoebe), d3.csv(monica), d3.csv(joey), d3.csv(anger), d3.csv(fear), d3.csv(happiness), d3.csv(sadness), d3.csv(surprise)]).then(function ([presence, /*emotions,*/ characters, technical, rachel, ross, chandler, phoebe, monica, joey, anger, fear, happiness, sadness, surprise]) {
            createBarChart(presence, characters, false); // false is an update variable (its false because we want to create an idiom from scratch)
            createNetworkGraph(characters, rachel, ross, chandler, phoebe, monica, joey, false);
            createBoxPlot(technical, false);
            createFavoriteEpisode(technical, false);
            createWordCloud(anger, fear, happiness, sadness, surprise, characters, false);
        })
        .catch((error) => {
            console.log(error);
        });
}

// Idioms

function createBarChart(data, dataChars, update) {
    width = 500;

    height = 200;

    margin = { top: 20, right: 20, bottom: 20, left: 40 };

    var sumP = [0, 0, 0, 0, 0, 0];
    for (i = 0; i < data.length; i++) {
        sumP[0] = sumP[0] + parseInt(data[i].Monica);
        sumP[1] = sumP[1] + parseInt(data[i].Joey);
        sumP[2] = sumP[2] + parseInt(data[i].Chandler);
        sumP[3] = sumP[3] + parseInt(data[i].Phoebe);
        sumP[4] = sumP[4] + parseInt(data[i].Ross);
        sumP[5] = sumP[5] + parseInt(data[i].Rachel);
    }

    dataChars = dataChars.filter(function (d) {
        if (d.character == 'Monica') {
            d['presence'] = sumP[0];
        }
        else if (d.character == 'Joey') {
            d['presence'] = sumP[1];
        }
        else if (d.character == 'Chandler') {
            d['presence'] = sumP[2];
        }
        else if (d.character == 'Phoebe') {
            d['presence'] = sumP[3];
        }
        else if (d.character == 'Ross') {
            d['presence'] = sumP[4];
        }
        else if (d.character == 'Rachel') {
            d['presence'] = sumP[5];
        }
        return d;
    });

    // sort data
    dataChars.sort(function (b, a) {
        return a.presence - b.presence;
    });


    x = d3
        .scaleBand()
        .domain(dataChars.map(d => d.character))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.2);


    y = d3
        .scaleLinear()
        .domain([d3.max(sumP), 0])
        .range([margin.top, height - margin.bottom])


    function xAxis(g) {
        g.attr("transform", `translate(${margin.left},${height-margin.bottom})`).call(
            d3
            .axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "center");
    }

    function yAxis(g) {
        g.attr("transform", `translate(${2*margin.left},0)`).call(
            d3
                .axisLeft(y)
        );
    }

    if (!update) {
        d3.select("div#barChart").append("svg").append("g").attr("class", "bars");
    }

    const svg = d3
        .select("div#barChart")
        .select("svg")
        .attr("width", width+50)
        .attr("height", height+20);

    var Tooltip = d3
        .select("body")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        //.style("text-align","left");

    svg
        .select("g.bars") //selects the bars of bar chart
        .selectAll("rect") //at first there are none but after updating, there will be more
        .data(dataChars, function (d) { //bind the data
            return d.character;
        })
        .join(
            (enter) => { //creates a new rectangule for every new data item that is not yet represented 
                return enter
                    .append("rect")
                    .attr("x", (d, i) => x(d.character)) // bars all next to eachother
                    .attr("y", d => y(d.presence))
                    .attr("width", x.bandwidth())
                    .attr("height", d => height - 20 - y(d.presence))
                    .attr("transform", `translate(${margin.left},0)`)
                    .style("fill", function (d) {
                        return d.colour;
                    })
                    //.on("mouseover", handleMouseOver) //on event bounds it together 
                    //.on("mouseleave", handleMouseLeave)
                    .on("click", handleClick)
                    .on("mouseover", function (d) { Tooltip.style("opacity", 1) })
                    .on("mousemove", function (d, i) {
                            Tooltip.html("" + i.presence + " words");
                            Tooltip.style("left", d.x + 10 + "px");
                            Tooltip.style("top", d.y + "px");
                            Tooltip.style("width",'100px');
                            Tooltip.style("background",'#EFEFEF');
                        })
                    .on("mouseleave", function (d) { Tooltip.style("opacity", 0) })
                    .transition()
                    .duration(2000)
                    .style("opacity", "100%");
            },
            (update) => { //represents the set of rectangules that already exists 
                update
                    .transition()
                    .duration(1000)
                    .attr("x", (d, i) => x(d.character))
                    .attr("y", d => y(d.presence))
                    .attr("width", x.bandwidth())
                    .attr("height", d => height - 20 - y(d.presence))
                    .attr("transform", `translate(${margin.left},0)`)
                    .style("fill", function (d) {
                        return d.colour;
                    })
            },
            (exit) => { //the rectangules that already have no data bound to them can be removed 
                return exit.remove();
            }
        );

    if (!update) { //if we do not have an update
        svg.append("g").attr("class", "xAxis");
        svg.append("text")
            .attr("class", "xAxis")
            .attr("transform", "translate(" + (width/2 + 15) + " ," + (height + 20) + ")")
            .style("text-anchor", "center")
            .text("Characters");
        
        svg.append("g").attr("class", "yAxis");
        
        svg.append("text")
            .attr("class", "yAxis")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.left - 40)
            .attr("x", (-height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of tokens");  
    }

    d3.select("g.xAxis").call(xAxis);
    d3.select("g.yAxis").call(yAxis);
}


function createNetworkGraph(dataChars, dataRa, dataRo, dataC, dataP, dataM, dataJ, update) {
    width = 580;
    
    height = 500;
    
    margin = { top: 20, right: 20, bottom: 20, left: 40 };

    radius = 50;

    data = 
    {
      "nodes": [
        {
          "id": 1,
          "name": "Rachel"
        },
        {
          "id": 2,
          "name": "Ross"
        },
        {
          "id": 3,
          "name": "Monica"
        },
        {
          "id": 4,
          "name": "Chandler"
        },
        {
          "id": 5,
          "name": "Joey"
        },
        {
          "id": 6,
          "name": "Phoebe"
        }
      ],
      "links": [

        {
          "source": 1,
          "target": 2
        },
        {
          "source": 1,
          "target": 3
        },
        {
          "source": 1,
          "target": 4
        },
        {
          "source": 1,
          "target": 5
        },
        {
          "source": 1,
          "target": 6
        },
        {
          "source": 2,
          "target": 1
        },
        {
          "source": 2,
          "target": 3
        },
        {
          "source": 2,
          "target": 4
        },
        {
          "source": 2,
          "target": 5
        },
        {
          "source": 2,
          "target": 6
        },
        {
          "source": 3,
          "target": 1
        },
        {
          "source": 3,
          "target": 2
        },
        {
          "source": 3,
          "target": 4
        },
        {
          "source": 3,
          "target": 5
        },
        {
          "source": 3,
          "target": 6
        },
        {
          "source": 4,
          "target": 1
        },
        {
          "source": 4,
          "target": 2
        },
        {
          "source": 4,
          "target": 3
        },
        {
          "source": 4,
          "target": 5
        },
        {
          "source": 4,
          "target": 6
        },
        {
          "source": 5,
          "target": 1
        },
        {
          "source": 5,
          "target": 2
        },
        {
          "source": 5,
          "target": 3
        },
        {
          "source": 5,
          "target": 4
        },
        {
          "source": 5,
          "target": 6
        },
        {
          "source": 6,
          "target": 1
        },
        {
          "source": 6,
          "target": 2
        },
        {
          "source": 6,
          "target": 3
        },
        {
          "source": 6,
          "target": 4
        },
        {
          "source": 6,
          "target": 5
        }
      ]
    }

    var max = 0;
    dataRa = countInter(dataRa);
    maxTemp = Math.max(...Object.values(dataRa));
    if (maxTemp > max) { max = maxTemp; }

    dataRo = countInter(dataRo);
    maxTemp = Math.max(...Object.values(dataRo));
    if (maxTemp > max) { max = maxTemp; }

    dataM = countInter(dataM);
    maxTemp = Math.max(...Object.values(dataM));
    if (maxTemp > max) { max = maxTemp; }

    dataC = countInter(dataC);
    maxTemp = Math.max(...Object.values(dataC));
    if (maxTemp > max) { max = maxTemp; }

    dataJ = countInter(dataJ);
    maxTemp = Math.max(...Object.values(dataJ));
    if (maxTemp > max) { max = maxTemp; }

    dataP = countInter(dataP);
    maxTemp = Math.max(...Object.values(dataP));
    if (maxTemp > max) { max = maxTemp; }


    if (!update) {
        d3.select("div#networkGraph").append("svg").append("g").attr("class", "nodes");
    }

    const svg = d3
        .select("div#networkGraph")
        .select("svg")
        .attr("width", width/* + margin.left + margin.right*/)
        .attr("height", height+26/* + margin.top + margin.bottom*/);
        //.append("g")
        //.attr("transform",`translate(${margin.left}, ${margin.top})`);

    var force = 
        d3.forceSimulation(data.nodes); // Force algorithm is applied to data.nodes

    
    x_nodes = [0.33*width, 0.67*width, 0.83*width, 0.67*width, 0.33*width, 0.17*width];
    y_nodes = [0.17*height, 0.17*height, 0.5*height, 0.83*height, 0.83*height, 0.5*height];
    for (index in data.nodes) {
        data.nodes[index].x = x_nodes[index];
        data.nodes[index].y = y_nodes[index];
    }

    force.force("link", d3.forceLink() // This force provides links between nodes
        .id(function(d) { return d.id; }) // This provide  the id of a node
        .links(data.links) // and this the list of links
    )

    var Tooltip = d3
        .select("body")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        //.style("text-align","left");


    // Initialize the nodes
    svg
        .select("g.nodes")
        .selectAll("circle")
        .data(data.nodes)
        .join(
            (enter) => {
                return enter
                    .append("circle")
                    .attr("r", radius)
                    .attr("cx", function (d) { return d.x; })
                    .attr("cy", function(d) { return d.y; })
                    .style("fill", function (d) {
                        for (index in dataChars) {
                            if (dataChars[index].character == d.name) {
                                return dataChars[index]['colour'];
                            }
                        }
                    });
            },
            (update) => {
                update
                    .attr("r", radius)
                    .attr("cx", function (d) { return d.x; })
                    .attr("cy", function(d) { return d.y; })
                    .style("fill", function (d) {
                        for (index in dataChars) {
                            if (dataChars[index].character == d.name) {
                                return dataChars[index]['colour'];
                            }
                        }
                    });
            },
            (exit) => {
                return exit.remove();
            }
        );

    if (!update) {
        svg.append("g").attr("class", "links");
    }

    // Initialize the links
    svg
        .select("g.links")
        .selectAll("line")
        .data(data.links)
        .join(
            (enter) => {
                return enter
                    .append("line")
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; })
                    .style("stroke", "#aaa")
                    .style("stroke-width", function (d) {
                        if (d.source.name == 'Rachel') { return ((dataRa[d.target.name]*15)/max); }
                        else if (d.source.name == 'Ross') { return ((dataRo[d.target.name]*15)/max); }
                        else if (d.source.name == 'Monica') { return ((dataM[d.target.name]*15)/max); }
                        else if (d.source.name == 'Chandler') { return ((dataC[d.target.name]*15)/max); }
                        else if (d.source.name == 'Joey') { return ((dataJ[d.target.name]*15)/max); }
                        else if (d.source.name == 'Phoebe') { return ((dataP[d.target.name]*15)/max); }
                    })
                    .on("mouseover", function (d) { Tooltip.style("opacity", 1) })
                    .on("mousemove", function (d, i) {
                        if (i.source.name == 'Rachel') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataRa[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Ross') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataRo[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Monica') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataM[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Chandler') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataC[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Joey') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataJ[i.target.name] + " interactions")}
                        else if (i.source.name == 'Phoebe') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataP[i.target.name] + " interactions"); }
                        Tooltip.style("left", d.x + 20 + "px");
                        Tooltip.style("top", d.y + "px");
                        Tooltip.style("width",'150px');
                        Tooltip.style("background",'#EFEFEF')
                        Tooltip.style("font-family", "calibri");

                    })
                    .on("mouseleave", function (d) { Tooltip.style("opacity", 0) })
                    //.transition()
                    //.duration(2000)
                    .style("opacity", "100%");
            },
            (update) => {
                update
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; })
                    .style("stroke", "#aaa")
                    .style("stroke-width", function (d) {
                        if (d.source.name == 'Rachel') { return ((dataRa[d.target.name]*15)/max); }
                        else if (d.source.name == 'Ross') { return ((dataRo[d.target.name]*15)/max); }
                        else if (d.source.name == 'Monica') { return ((dataM[d.target.name]*15)/max); }
                        else if (d.source.name == 'Chandler') { return ((dataC[d.target.name]*15)/max); }
                        else if (d.source.name == 'Joey') { return ((dataJ[d.target.name]*15)/max); }
                        else if (d.source.name == 'Phoebe') { return ((dataP[d.target.name]*15)/max); }
                    })
                    .on("mouseover", function (d) { Tooltip.style("opacity", 1) })
                    .on("mousemove", function (d, i) {
                        if (i.source.name == 'Rachel') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataRa[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Ross') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataRo[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Monica') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataM[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Chandler') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataC[i.target.name] + " interactions"); }
                        else if (i.source.name == 'Joey') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataJ[i.target.name] + " interactions")}
                        else if (i.source.name == 'Phoebe') { Tooltip.html(i.source.name + "-" + i.target.name + ": <br>" + dataP[i.target.name] + " interactions"); }
                        Tooltip.style("left", d.x + 20 + "px");
                        Tooltip.style("top", d.y + "px");
                        Tooltip.style("width",'150px');
                        Tooltip.style("background",'#EFEFEF')
                        Tooltip.style("font-family", "calibri");

                    })
                    .on("mouseleave", function (d) { Tooltip.style("opacity", 0) })
                    //.transition()
                    //.duration(2000)
                    .style("opacity", "100%");
            },
            (exit) => {
                return exit.remove();
            }
        );

    if (!update) {
        svg.append("g").attr("class", "logos");
    }        

    svg
        .select("g.logos")
        .selectAll("image")
        .data(data.nodes)
        .join(
            (enter) => {
                return enter
                    .append("image")
                    .attr("xlink:href", function (d) {
                        if (d.name == 'Rachel') { return "/img/rachel.png"; }
                        else if (d.name == 'Monica') { return "/img/monica.png"; }
                        else if (d.name == 'Ross') { return "/img/ross.png"; }
                        else if (d.name == 'Chandler') { return "/img/chandler.png"; }
                        else if (d.name == 'Joey') { return "/img/joey.png"; }
                        else if (d.name == 'Phoebe') { return "/img/phoebe.png"; }
                    })
                    //.style("filter", grayscale(100%))
                    .attr("width", 2*radius)
                    .attr("height", 2*radius)
                    .attr("x", function(d) { return (d.x - radius); })
                    .attr("y", function(d) { return (d.y - radius); })
                    .on("click", handleClick);
            },
            (update) => {
                update
                    .attr("xlink:href", function (d) {
                        if (d.name == 'Rachel') { return "/img/rachel.png"; }
                        else if (d.name == 'Monica') { return "/img/monica.png"; }
                        else if (d.name == 'Ross') { return "/img/ross.png"; }
                        else if (d.name == 'Chandler') { return "/img/chandler.png"; }
                        else if (d.name == 'Joey') { return "/img/joey.png"; }
                        else if (d.name == 'Phoebe') { return "/img/phoebe.png"; }
                    })
                    //.style("filter", grayscale(100%))
                    .attr("width", 2*radius)
                    .attr("height", 2*radius)
                    .attr("x", function(d) { return (d.x - radius); })
                    .attr("y", function(d) { return (d.y - radius); });
            },
            (exit) => {
                return exit.remove();
            } 
        );
        
}


function createBoxPlot(data, update) {
    width = 600;
    
    height = 300;
    
    margin = { top: 20, right: 20, bottom: 20, left: 40 };
    
    boxwidth = 15;

    var directors = d3.groups(data, d => d.Director);
    var stats = [];

    for (i = 0; i < directors.length; i++) {
        directors[i][1].sort(function (a, b) {
            return a.Rating - b.Rating;
        });

        ratings_sorted = d3.map(directors[i][1], function (d) {
            return d.Rating;
        });

        q1 = d3.quantile(ratings_sorted, 0.25);
        median = d3.quantile(ratings_sorted, 0.5);
        q3 = d3.quantile(ratings_sorted, 0.75);
        iqr = q3 - q1;
        min = q1 - 1.5 * iqr;
        max = q1 + 1.5 * iqr;

        const info = {key:directors[i][0], value:{q1: q1, median: median, q3: q3, min: min, max: max}};
        stats.push(info);
    }

    x = d3
        .scaleBand()
        .domain(data.map(d => d.Director))
        .range([margin.left, width /*+ 100*/ - margin.right])
        .padding(0.9);
    
    y = d3
        .scaleLinear()
        .domain([10, 7])
        .range([margin.top, height - margin.bottom]);

    function xAxis(g) {
        g.attr("transform", `translate(${margin.left/2},${height-margin.bottom})`).call(
            d3
            .axisBottom(x))
            .selectAll("text")
            .attr("transform", `translate(${-boxwidth},10)rotate(-90)`)
            .style("text-anchor", "end");
    }

    function yAxis(g) {
        g.attr("transform", `translate(${1.5*margin.left},0)`).call(d3.axisLeft(y));
    }


    if (!update) {
        d3.select("div#boxPlot").append("svg").append("g").attr("class", "vertLines");
    }

    var Tooltip = d3
        .select("body")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        //.style("text-align","left");

    const svg = d3
        .select("div#boxPlot")
        .select("svg")
        .attr("width", width +10)
        .attr("height", height+100);
    
    svg
        .select("g.vertLines")
        .selectAll("line")
        .data(stats)
        .join(
            (enter) => {
                return enter
                    .append("line")
                    .attr("x1", function (d) { return x(d.key); })
                    .attr("x2", function (d) { return x(d.key); })
                    .attr("y1", function (d) { return y(d.value.min); })
                    .attr("y2", function (d) { return y(d.value.max); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black")
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x1", function (d) { return x(d.key); })
                    .attr("x2", function (d) { return x(d.key); })
                    .attr("y1", function (d) { return y(d.value.min); })
                    .attr("y2", function (d) { return y(d.value.max); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black");
            },
            (exit) => {
                return exit.remove();
            }
        );

    if (!update) {
        svg.append("g").attr("class", "boxes");
    }
    
    svg
        .select("g.boxes")
        .selectAll("rect")
        .data(stats)
        .join(
            (enter) => {
                return enter
                    .append("rect")
                    .attr("x", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("y", function (d) { return y(d.value.q3); })
                    .attr("height", function (d) { return (y(d.value.q1) - y(d.value.q3)); })
                    .attr("width", boxwidth)
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black")
                    .style("fill", "#cfc8b8")
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("y", function (d) { return y(d.value.q3); })
                    .attr("height", function (d) { return (y(d.value.q1) - y(d.value.q3)); })
                    .attr("width", boxwidth)
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black")
                    .style("fill", "#cfc8b8");
            },
            (exit) => {
                return exit.remove();
            }
        );
        
    if (!update) {
        svg.append("g").attr("class", "medianLines");
    }

    svg
        .select("g.medianLines")
        .selectAll("line")
        .data(stats)
        .join(
            (enter) => {
                return enter
                    .append("line")
                    .attr("x1", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("x2", function (d) { return (x(d.key) + boxwidth / 2); })
                    .attr("y1", function (d) { return y(d.value.median); })
                    .attr("y2", function (d) { return y(d.value.median); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black")
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x1", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("x2", function (d) { return (x(d.key) + boxwidth / 2); })
                    .attr("y1", function (d) { return y(d.value.median); })
                    .attr("y2", function (d) { return y(d.value.median); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black");
            },
            (exit) => {
                return exit.remove();
            }
        );

    if (!update) {
        svg.append("g").attr("class", "minLines");
    }

    svg
        .select("g.minLines")
        .selectAll("line")
        .data(stats)
        .join(
            (enter) => {
                return enter
                    .append("line")
                    .attr("x1", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("x2", function (d) { return (x(d.key) + boxwidth / 2); })
                    .attr("y1", function (d) { return y(d.value.min); })
                    .attr("y2", function (d) { return y(d.value.min); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black")
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x1", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("x2", function (d) { return (x(d.key) + boxwidth / 2); })
                    .attr("y1", function (d) { return y(d.value.min); })
                    .attr("y2", function (d) { return y(d.value.min); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black");
            },
            (exit) => {
                return exit.remove();
            }
        );

    if (!update) {
        svg.append("g").attr("class", "maxLines");
    }

    svg
        .select("g.maxLines")
        .selectAll("line")
        .data(stats)
        .join(
            (enter) => {
                return enter
                    .append("line")
                    .attr("x1", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("x2", function (d) { return (x(d.key) + boxwidth / 2); })
                    .attr("y1", function (d) { return y(d.value.max); })
                    .attr("y2", function (d) { return y(d.value.max); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black")
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x1", function (d) { return (x(d.key) - boxwidth / 2); })
                    .attr("x2", function (d) { return (x(d.key) + boxwidth / 2); })
                    .attr("y1", function (d) { return y(d.value.max); })
                    .attr("y2", function (d) { return y(d.value.max); })
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .attr("stroke", "black");
            },
            (exit) => {
                return exit.remove();
            }
        );    
    
    if (!update) {
        svg.append("g").attr("class", "indPoints");
    }

    svg
        .select("g.indPoints")
        .selectAll("circle")
        .data(data)
        .join(
            (enter) => {
                return enter
                    .append("circle")
                    .attr("cx", function (d) {
                        return (x(d.Director)); // '- 25 + Math.random()*50' is jitter so that the circles dont overlap
                    })
                    .attr("cy", function (d) { return y(d.Rating); })
                    .attr("r", 4)
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .style("fill", function (d) { return d.Colour; })
                    .on("click", handleClick)
                    .on("mouseover", function (d) { Tooltip.style("opacity", 1) })
                    .on("mousemove", function (d, i) {
                            Tooltip.html("S" + i.Season + "E" + i.Episode + ": <br>" + i.Title + " (" + i.Rating + ")");
                            Tooltip.style("left", d.x + 10 + "px");
                            Tooltip.style("top", d.y + "px");
                            Tooltip.style("width",'300px');
                            Tooltip.style("background",'#EFEFEF')
                            Tooltip.style("font-family", "calibri");
                        })
                    .on("mouseleave", function (d) { Tooltip.style("opacity", 0) })
                    .transition()
                    .duration(2000)
                    .style("opacity", "100%");
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("cx", function (d) {
                        return (x(d.Director)); // '- 25 + Math.random()*50' is jitter so that the circles dont overlap
                    })
                    .attr("cy", function (d) { return y(d.Rating); })
                    .attr("r", 4)
                    .attr("transform", `translate(${margin.left/2},0)`)
                    .style("fill", function (d) { return d.Colour; });
            },
            (exit) => {
                return exit.remove();
            }
        );
        
    if (!update) {
        svg.append("g").attr("class", "xAxis");
        svg.append("text")
            .attr("class", "xAxis")
            .attr("transform", "translate(" + (width/2) + " ," + (height + 100) + ")")
            .style("text-anchor", "center")
            .text("Directors");

        svg.append("g").attr("class", "yAxis");
        svg.append("text")
            .attr("class", "yAxis")
            .attr("transform", "rotate(-90)")
            .attr("y", margin.left - 40)
            .attr("x", (-height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Ratings");  
    }        
    
    svg.select("g.xAxis").call(xAxis);
    svg.select("g.yAxis").call(yAxis);

}


function createFavoriteEpisode(data, update) {
    width = 600;
    
    height = 300;
    
    margin = { top: 20, right: 20, bottom: 20, left: 40 };

    boxwidth = 250;

    maxRating = d3.max(data, (d) => d.Rating);

    var ratings = d3.groups(data, d => d.Rating);

    ratings = ratings.filter(function (d, i) {
        if (d[0] == maxRating) { return d[1]; }
    });

    ratings = ratings[0][1];
    console.log(ratings.length + " episodes with max rating");
    
    x = d3
        .scaleBand()
        .domain(data.map(d => d.Title))
        .rangeRound([margin.left, width - margin.right])
        .padding(1);

    y = d3
        .scaleLinear()
        .domain(1)
        .range([margin.top, height - margin.bottom]);

    function xAxis(g) {
        g.attr("transform", `translate(0,${height-margin.bottom})`).call(d3.axisBottom(x));
    }

    function yAxis(g) {
        g.attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
    }

    /*if (!update) {
        d3.select("div#preferred").append("svg").append("g").attr("class", "boxes");
    }

    const svg = d3
        .select("div#preferred")
        .select("svg")
        .attr("width", ratings.length*(boxwidth+10))
        .attr("height", height);*/

    /*var Tooltip = d3
        .select("body")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        //.style("text-align","left");*/

    /*var bar = svg
        .select("g.boxes")
        .selectAll("rect")
        .data(ratings)
        .join(
            (enter) => {
                return enter
                    .append("rect")
                    .attr("x", function (d, i) { return i*(boxwidth+10); })
                    .attr("y", 1)
                    .attr("height", 100)
                    .attr("width", boxwidth)
                    .attr("stroke", "black")
                    .style("fill", "#FFFFFF")
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x", function (d, i) { return i*(boxwidth+10); })
                    .attr("y", 1)
                    .attr("height", 100)
                    .attr("width", boxwidth)
                    .attr("stroke", "black")
                    .style("fill", "#FFFFFF");
            },
            (exit) => {
                return exit.remove();
            }
        );


    svg
        .select("g.boxes")
        .selectAll("text")
        .data(ratings)
        .join(
            (enter) => {
                return enter
                    .append("text")
                    .attr("x", function (d, i) { return i*(boxwidth+10); })
                    .attr("y", 10)
                    .attr("dx", ".35em")
                    .attr("dy", ".35em")
                    .attr("width", boxwidth)
                    .text(function (d) {
                        str = "Fan Favorite (" + d.Rating + ") \\n";
                        title = d.Title;
                        var i;
                        for (i = 0; (i+35) < title.length; i+36) {
                            str = str + title.substr(i,36) + "\\n";
                        }
                        str = str + title.substr(i, ) + "\nS" + d.Season + " E" + d.Episode;

                    return str;
                    })
                    .transition()
                    .duration(2000);
            },
            (update) => {
                update
                    .transition()
                    .duration(2000)
                    .attr("x", function (d, i) { return i*(boxwidth+10); })
                    .attr("y", 1)
                    .attr("height", 100)
                    .attr("width", boxwidth)
                    .attr("stroke", "black")
                    .style("fill", "#FFFFFF");
            },
            (exit) => {
                return exit.remove();
            }
        );

    if (!update) { //if we do not have an update
        svg.append("g").attr("class", "xAxis");
        svg.append("g").attr("class", "yAxis");
    }

    d3.select("g.xAxis").call(xAxis);
    d3.select("g.yAxis").call(yAxis);*/
}


function createWordCloud(angerData, fearData, happinessData, sadnessData, surpriseData, dataChars, update) {
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 10, bottom: 10, left: 10};

    width = 400;

    height = 200;

    angerData = countEmotion(angerData, dataChars);
    fearData = countEmotion(fearData, dataChars);
    happinessData = countEmotion(happinessData, dataChars);
    sadnessData = countEmotion(sadnessData, dataChars);
    surpriseData = countEmotion(surpriseData, dataChars);

    var data = [{"text":"anger", "size":angerData.totalCount, "char":angerData.char, "color":angerData.colour}, {"text":"fear", "size":fearData.totalCount, "char":fearData.char, "color":fearData.colour}, {"text":"happiness", "size":happinessData.totalCount, "char":happinessData.char, "color":happinessData.colour}, {"text":"sadness", "size":sadnessData.totalCount, "char":sadnessData.char, "color":sadnessData.colour}, {"text":"surprise", "size":surpriseData.totalCount, "char":surpriseData.char, "color":surpriseData.colour}];

    maxEm = d3.max(data, (d) => d.size);

    if (!update) {
        d3.select("div#wordCloud").append("svg")/*.append("g").attr("class", "words")*/;
    }

    // append the svg object to the body of the page
    const svg = d3
        .select("div#wordCloud")
        .select("svg")
        .attr("width", width)
        .attr("height", height)
        /*.append("g")
        .attr("transform","translate(" + margin.left + "," + margin.top + ")")*/;

    // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
    const layout = d3.layout.cloud()
        .size([width, height])
        .words(data/*myWords.map(function(d) { return {text: d}; })*/)
        .padding(10)
        .rotate(0)
        .fontSize(function (d) { return (d.size*60)/maxEm; })
        .font("calibri")
        .on("end", draw);
    
    layout.start();

    // This function takes the output of 'layout' above and draw the words
    // Better not to touch it. To change parameters, play with the 'layout' variable above
    function draw(words) {
        if (!update) {
            svg.append("g").attr("class", "words");
        }

        svg
            //.append("g")
            .select("g.words")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            //.enter()
            .join(
                (enter) => {
                    return enter
                        .append("text")
                        .style("font-size", function(d) { return d.size + "px"; })
                        .style("font-family", (d) => d.font)
                        .style("fill", function (d) { return d.color; } /*(d, i) => fill(i)*/)
                        .attr("text-anchor", "middle")
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(function(d) { return d.text; })
                        .on("click", handleClick)
                        .transition()
                        .duration(2000);
                },
                (update) => {
                    update
                        .transition()
                        .duration(2000)
                        .style("font-size", function(d) { return d.size + "px"; })
                        .style("font-family", (d) => d.font)
                        .style("fill", function (d) { return d.color; } /*(d, i) => fill(i)*/)
                        .attr("text-anchor", "middle")
                        .attr("transform", function(d) {
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .text(function(d) { return d.text; });
                },
                (exit) => {
                    return exit.remove();
                }
            );
            
    }
}


// Update data

function dataChange(value) { //this function is triggered when i press one of the buttons (reset, new, old)
    Promise.all([d3.csv(presence), d3.csv(characters), d3.csv(technical), d3.csv(rachel), d3.csv(ross), d3.csv(chandler), d3.csv(phoebe), d3.csv(monica), d3.csv(joey), d3.csv(anger), d3.csv(fear), d3.csv(happiness), d3.csv(sadness), d3.csv(surprise)]).then(function ([presence, /*emotions,*/ characters, technical, rachel, ross, chandler, phoebe, monica, joey, anger, fear, happiness, sadness, surprise]) {

        if (value == 'all') {
            document.getElementById('allseasons').style.borderWidth = "2px";
            for(i = 1; i <= 10; i++) {
                seas = 'season' + i;
                if (season_list.includes(seas) == false) {
                    season_list.push(seas);
                }
            }
        }

    	else {
            if (season_list.includes(value) == false) {
        		season_list.push(value);
        	}
        	else { //if season_list.includes(value) == true
        		if (season_list.length > 1) {
                    let index = season_list.indexOf(value);
            		season_list.splice(index, 1);
                }
        	}
        }

        if (season_list.length == 10) {
            document.getElementById('allseasons').style.borderWidth = "2px";
        }
        else {
            document.getElementById('allseasons').style.borderWidth = "0px";
        }

        for(i = 1; i <= 10; i++) {
            seas = 'season' + i;
            if (season_list.includes(seas)) {
                document.getElementById(seas).style.borderWidth = "2px";
            }
            else {
                document.getElementById(seas).style.borderWidth = "0px";
            }
        }
        
        // barchart
        var presenceTemp;
        presenceTemp = presence.filter(function (d, i) {
            if((i == 0) && (season_list.includes('season1'))) { return d; }
            else if((i == 1) && (season_list.includes('season2'))) { return d; }
            else if((i == 2) && (season_list.includes('season3'))) { return d; }
            else if((i == 3) && (season_list.includes('season4'))) { return d; }
            else if((i == 4) && (season_list.includes('season5'))) { return d; }
            else if((i == 5) && (season_list.includes('season6'))) { return d; }
            else if((i == 6) && (season_list.includes('season7'))) { return d; }
            else if((i == 7) && (season_list.includes('season8'))) { return d; }
            else if((i == 8) && (season_list.includes('season9'))) { return d; }
            else if((i == 9) && (season_list.includes('season10'))) { return d; }
        });

        // network graph
        var rachelTemp, rossTemp, chandlerTemp, phoebeTemp, monicaTemp, joeyTemp;

        rachelTemp = filterData(rachel, season_list);
        rossTemp = filterData(ross, season_list);
        chandlerTemp = filterData(chandler, season_list);
        phoebeTemp = filterData(phoebe, season_list);
        monicaTemp = filterData(monica, season_list);
        joeyTemp = filterData(joey, season_list);

        // boxplot
        var boxTemp;
        boxTemp = technical.filter(function (d) {
            if((d.Season == 1) && (season_list.includes('season1'))) { return d; }
            else if((d.Season == 2) && (season_list.includes('season2'))) { return d; }
            else if((d.Season == 3) && (season_list.includes('season3'))) { return d; }
            else if((d.Season == 4) && (season_list.includes('season4'))) { return d; }
            else if((d.Season == 5) && (season_list.includes('season5'))) { return d; }
            else if((d.Season == 6) && (season_list.includes('season6'))) { return d; }
            else if((d.Season == 7) && (season_list.includes('season7'))) { return d; }
            else if((d.Season == 8) && (season_list.includes('season8'))) { return d; }
            else if((d.Season == 9) && (season_list.includes('season9'))) { return d; }
            else if((d.Season == 10) && (season_list.includes('season10'))) { return d; }
        });

        // word cloud
        var angerTemp, fearTemp, happinessTemp, sadnessTemp, surpriseTemp;

        angerTemp = filterData(anger, season_list);
        fearTemp = filterData(fear, season_list);
        happinessTemp = filterData(happiness, season_list);
        sadnessTemp = filterData(sadness, season_list);
        surpriseTemp = filterData(surprise, season_list);

        //here we call the functions again but with a different value for the parameter (true) because now its an update
        createBarChart(presenceTemp, characters, true);
        createNetworkGraph(characters, rachelTemp, rossTemp, chandlerTemp, phoebeTemp, monicaTemp, joeyTemp, true);
        createBoxPlot(boxTemp, true);
        //createFavoriteEpisode(boxTemp, true);
        createWordCloud(angerTemp, fearTemp, happinessTemp, sadnessTemp, surpriseTemp, characters, true);

    })
    .catch((error) => {
        console.log(error);
    });
}


function handleClick(event, d) {
    barChart = d3.select("div#barChart").select("svg");
    networkGraph = d3.select("div#networkGraph").select("svg");
    boxPlot = d3.select("div#boxPlot").select("svg");
    //favorite = d3.select("div#preferred").select("svg");
    wordCloud = d3.select("div#wordCloud").select("svg");

    //if apenas para alterar a personagem selecionada
    if (('character' in d == false) && ('name' in d == false) && ('char' in d == false)) { //this means we clicked the boxplot
        char = d.Character;
        boxPlot
            .selectAll("circle")
            .filter(function (b) {
                if ((char == b.Character) && (d.Season == b.Season) && (d.Episode == b.Episode)) {
                    if (char == charSelected) { charSelected = ''; }
                    else { charSelected = char; }
                }
            });
    }
    else if (('character' in d == false) && ('Character' in d == false)  && ('char' in d == false)) { //this means we clicked the network graph
        char = d.name;
        networkGraph
            .selectAll("image")
            .filter(function (b) {
                if (char == b.name) {
                    if (char == charSelected) { charSelected = ''; }
                    else { charSelected = char; }
                }
            });
    }
    else if (('Character' in d == false) && ('name' in d == false) && ('char' in d == false)) { //this means we clicked the barchart
        char = d.character;
        barChart
            .selectAll("rect")
            .filter(function (b) {
                if (char == b.character) {
                    if (char == charSelected) { charSelected = ''; }
                    else { charSelected = char; }
                }
            });
    }
    else if (('character' in d == false) && ('name' in d == false) && ('Character' in d == false)) { //this means we clicked the world cloud 
        char = d.char;
        wordCloud
            .selectAll("text")
            .filter(function (b) {
                if ((char == b.char) && (d.text == b.text)) { // pode haver mais que uma emotion por character
                    if (char == charSelected) { charSelected = ''; }
                    else { charSelected = char; }
                }
            });
    }

    var tmpColor = '';

    barChart
        .selectAll("rect")
        .filter(function (b) {
            if (charSelected == b.character) { 
                tmpColor = b.colour;
                return b;
            }
        })
        .style("fill", tmpColor);

    barChart
        .selectAll("rect")
        .filter(function (b) {
            if (charSelected != b.character) { return b; }
        })
        .style("fill", "grey");  

    barChart
        .selectAll("rect")
        .filter(function (b) {
            if (charSelected == '') { return b; }
        })
        .style("fill", function (b) { return b.colour; });


    tmpColor = '';

    networkGraph
        .selectAll("line")
        .filter(function (b) {
            if ((b.source.name == charSelected) || (b.target.name == charSelected)) {
                if (charSelected == 'Rachel') { tmpColor = '#eab913'; } 
                else if (charSelected == 'Ross') { tmpColor = '#85a2be'; } 
                else if (charSelected == 'Monica') { tmpColor = '#be0a09'; } 
                else if (charSelected == 'Chandler') { tmpColor = '#d8873a'; } 
                else if (charSelected == 'Joey') { tmpColor = '#76a47d'; } 
                else if (charSelected == 'Phoebe') { tmpColor = '#B88194'; }
                return b;
            }
        })
        .style("stroke", tmpColor);

    tmpImg = '';

    networkGraph
        .selectAll("image")
        .filter(function (b) {
            if (b.name == charSelected) {
                if (charSelected == 'Rachel') { tmpImg = '/img/rachel.png'; } 
                else if (charSelected == 'Ross') { tmpImg = '/img/ross.png'; } 
                else if (charSelected == 'Monica') { tmpImg = '/img/monica.png'; } 
                else if (charSelected == 'Chandler') { tmpImg = '/img/chandler.png'; } 
                else if (charSelected == 'Joey') { tmpImg = '/img/joey.png'; } 
                else if (charSelected == 'Phoebe') { tmpImg = '/img/phoebe.png'; }
                return b;
            }
        })
        .attr("xlink:href", tmpImg);

    networkGraph
        .selectAll("line")
        .filter(function (b) {
            if ((b.source.name != charSelected) && (b.target.name != charSelected)) { return b; }
        })
        .style("stroke", "#aaa");

    networkGraph
        .selectAll("image") 
        .filter(function (b) {
            if (b.name != charSelected) {
                return b;
            }
        })
        .attr("xlink:href", function (b) {
            if (b.name == 'Rachel') { return "/img/rachel bw.png"; }
            else if (b.name == 'Monica') { return "/img/monica bw.png"; }
            else if (b.name == 'Ross') { return "/img/ross bw.png"; }
            else if (b.name == 'Chandler') { return "/img/chandler bw.png"; }
            else if (b.name == 'Joey') { return "/img/joey bw.png"; }
            else if (b.name == 'Phoebe') { return "/img/phoebe bw.png"; }
        });

    networkGraph
        .selectAll("image")
        .filter(function (b) {
            if (charSelected == '') { return b; }
        })
        .attr("xlink:href", function (b) {
            if (b.name == 'Rachel') { return "/img/rachel.png"; }
            else if (b.name == 'Monica') { return "/img/monica.png"; }
            else if (b.name == 'Ross') { return "/img/ross.png"; }
            else if (b.name == 'Chandler') { return "/img/chandler.png"; }
            else if (b.name == 'Joey') { return "/img/joey.png"; }
            else if (b.name == 'Phoebe') { return "/img/phoebe.png"; }
        });
    

    tmpColor = '';

    boxPlot
        .selectAll("circle")
        .filter(function (b) {
            if (charSelected == b.Character) {
                tmpColor = b.Colour;
                return b;
            }
        })
        .style("fill", tmpColor);

    boxPlot
        .selectAll("circle")
        .filter(function (b) {
            if (charSelected != b.Character) { return b; }
        })
        .style("fill", "grey");  

    boxPlot
        .selectAll("circle")
        .filter(function (b) {
            if (charSelected == '') { return b; }
        })
        .style("fill", function (b) { return b.Colour; });

    tmpColor = '';

    wordCloud
        .selectAll("text")
        .filter(function (b) {
            if (charSelected == b.char) {
                tmpColor = b.color;
                return b;
            }
        })
        .style("fill", tmpColor);

    wordCloud
        .selectAll("text")
        .filter(function (b) {
            if (charSelected != b.char) { return b; }
        })
        .style("fill", "grey");  

    wordCloud
        .selectAll("text")
        .filter(function (b) {
            if (charSelected == '') { return b; }
        })
        .style("fill", function (b) { return b.color; });

}


// Auxiliary functions

function filterData(data, list) {
    return data.filter(function (d, i) {
        if((i == 0) && (list.includes('season1'))) { return d; }
        else if((i == 1) && (list.includes('season2'))) { return d; }
        else if((i == 2) && (list.includes('season3'))) { return d; }
        else if((i == 3) && (list.includes('season4'))) { return d; }
        else if((i == 4) && (list.includes('season5'))) { return d; }
        else if((i == 5) && (list.includes('season6'))) { return d; }
        else if((i == 6) && (list.includes('season7'))) { return d; }
        else if((i == 7) && (list.includes('season8'))) { return d; }
        else if((i == 8) && (list.includes('season9'))) { return d; }
        else if((i == 9) && (list.includes('season10'))) { return d; }
    });
}

function countInter(dataset) {
    columns = Object.keys(dataset[0]);
    if (dataset.length > 1) {
        for (i = 1; i < dataset.length; i++) {
            for (j in columns) {
                dataset[0][columns[j]] = parseInt(dataset[0][columns[j]]) + parseInt(dataset[i][columns[j]]);
            }
        }
    }
    else if (dataset.length == 1) {
        for (j in columns) {
            dataset[0][columns[j]] = parseInt(dataset[0][columns[j]])
        }
    }
    return dataset[0];
}

function countEmotion(dataset, dataChars) {
    columns = Object.keys(dataset[0]);
    if (dataset.length > 1) {
        for (i = 1; i < dataset.length; i++) {
            for (j in columns) {
                dataset[0][columns[j]] = parseFloat(dataset[0][columns[j]]) + parseFloat(dataset[i][columns[j]]);
            }
        }
    }
    else if (dataset.length == 1) {
        for (j in columns) {
            dataset[0][columns[j]] = parseFloat(dataset[0][columns[j]])
        }
    }

    dataset[0].Rachel = dataset[0].Rachel / dataset[0].RachelCount;
    dataset[0].Ross = dataset[0].Ross / dataset[0].RossCount;
    dataset[0].Monica = dataset[0].Monica / dataset[0].MonicaCount;
    dataset[0].Joey = dataset[0].Joey / dataset[0].JoeyCount;
    dataset[0].Chandler = dataset[0].Chandler / dataset[0].ChandlerCount;
    dataset[0].Phoebe = dataset[0].Phoebe / dataset[0].PhoebeCount;

    columns = ['Monica', 'Ross', 'Rachel', 'Joey', 'Chandler', 'Phoebe'];
    countTmp = 0;
    chars = '';
    color = '';

    for (i in columns) {
        if (dataset[0][columns[i]] > countTmp) {
            countTmp = dataset[0][columns[i]];
            chars = columns[i];
        }
    }

    for (j in dataChars) {
        if ((dataChars[j] != 'columns') && (dataChars[j].character == chars)) {
            color = dataChars[j].colour;
        }
    }

    const info = {totalCount:dataset[0].totalCount, char:chars, colour:color/*Monica:dataset[0].Monica, Ross:dataset[0].Ross, Rachel:dataset[0].Rachel, Joey:dataset[0].Joey, Chandler:dataset[0].Chandler, Phoebe:dataset[0].Phoebe*/};

    return info;
}

//for when we mouse houver something
/*function handleMouseOver(event, d) {

    barChart = d3.select("div#barChart").select("svg"); //loads barchart into a variable

    barChart
        .selectAll("rect")
        .filter(function (b) {
            if (d.character == b.character) { //d represents the data item associated with the element that triggered the event
                return b;
            }
        })
        .style("fill", "red");

}



function handleMouseLeave(event, d) { //will only change the red to steelblue
    d3.select("div#barChart")
        .select("svg")
        .selectAll("rect")
        .style("fill", function (d) {
            return d.colour;
        });
}*/
