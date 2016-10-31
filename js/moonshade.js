document.title = "Moon shade :: ver. 0.1";

const side   = 320
	, side2  = side / 2
	, unit   =  20
	, margin = 
		{
			top:    2 * unit, 
			left:   2 * unit,
			right:  2 * unit, 
			bottom: 2 * unit 
		}
	, width  = side + margin.left + margin.right
	, height = side + 7 * unit + margin.top + margin.bottom;

// create svg
const svg = d3.select("#picture")
	.append("svg")
		.attrs({
			"width":  width  + margin.left + margin.right,
			"height": height + margin.top  + margin.bottom
		})
	.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// draw moon with shade placeholder
const rMoon = side2;
svg.append("circle")
	.attrs({
		"class": "moonbg",
		"cx": side2,
		"cy": side2,
		"r":  rMoon,
	});
svg.append("image")
	.attrs({
		"id":         "moonImg",
		"x":          0,
		"y":          0,
		"width":      side,
		"height":     side,
		"xlink:href": "./img/r320.png"
	});
const shade = svg.append("path")
	.attr("id", "shade");
	
// draw slider axis
const EPSILON = 0.0001
	, yAxis   = side + 2 * unit
	, toAxis  = "translate(0," + yAxis + ")"
	, quarter = d3.scaleOrdinal()
		.domain(["New Moon", "First Quarter", "Full Moon", "Last Quarter", "Next Cycle"])
		.range( [ 0,         side / 4,        side2,       3 * side / 4,   side        ])
	, waxing = d3.scaleLinear()
		.domain([0, 1    ])
		.range( [0, side2])
	, waning = d3.scaleLinear()
		.domain([-1 + EPSILON,    0   ])
		.range( [side2 - EPSILON, side]);
		
svg.append("g")
	.attrs({
		"class":     "axis quarter",
		"transform": toAxis
	})
	.call(d3.axisTop()
		.scale(quarter)
		.tickSize(unit / 2));
svg.selectAll(".axis.quarter .tick")
	.on("click", clickQuarter);

svg.append("g")
	.attrs({
		"class":     "axis phase",
		"transform": toAxis
	})
	.call(d3.axisBottom()
		.scale(waxing)
		.tickSize(unit / 2)
		.tickValues([0, .2, .4, .6, .8, 1]));
svg.append("g")
	.attrs({
		"class":     "axis phase",
		"transform": toAxis
	})
	.call(d3.axisBottom()
		.scale(waning)
		.tickSize(unit / 2)
		.tickValues([-.8, -.6, -.4, -.2 , 0]));
svg.selectAll(".axis.phase .tick")
	.on("click", clickTick);
	
// draw phaser plaseholder
svg.append("text")
	.attrs({
		"id":    "phase",
		"class": "phaser",
		"x":  side2,
		"y":  side + 5 * unit
	});
svg.append("text")
	.attrs({
		"id":    "quarter",
		"class": "phaser",
		"x":  side2,
		"y":  side + 6 * unit
	});
svg.append("text")
	.attrs({
		"id":    "visibility",
		"class": "phaser",
		"x":  side2,
		"y":  side + 7 * unit
	});
	
// draw handler
var phaseInvert = function(x) {
	return (x >= waning.range()[0]) ? waning.invert(x) : waxing.invert(x);
	},
	curPhase = waxing.domain()[0],
	oldPhase = waning.domain()[1] - 1;
	
const rHandler =  unit / 4
	, handler = svg.append("circle")
		.attrs({
			"class": "handler",
			"cx"   : phaseInvert(curPhase),
			"cy"   : yAxis,
			"r":     rHandler
		})
		.call(d3.drag()
			.on("drag", dragHandler));
		
function dragHandler() {
	let x = d3.event.x;
	if(x < waxing.range()[0])
		x = waxing.range()[0];
	else
		if(x > waning.range()[1])
			x = waning.range()[1];

	curPhase = phaseInvert(x);
	updatePicture();
	d3.select(this).attr("cx", x);
};
	
// axis tools
function clickQuarter(tick) {
	let ph = 0;
	switch(tick) {
		case quarter.domain()[1]:
			ph = 0.5;
			break;
		case quarter.domain()[2]:
			ph =  1;
			break;
		case quarter.domain()[3]:
			ph =  -0.5;
			break;
	};
	
	curPhase = ph;
	oldPhase = curPhase;
	updateShade();
	updatePhaser();
	handler.attr("cx", (curPhase < 0) ? waning(curPhase) : waxing(curPhase));
};
function clickTick(tick) {
	curPhase = parseFloat(tick);
	oldPhase = curPhase;
	updateShade();
	updatePhaser();
	handler.attr("cx", (curPhase < 0) ? waning(curPhase) : waxing(curPhase));
};

// phaser tools
function isWaning(ph) {
	return (ph < 0);
};
function isGibbous(ph) {
	return ((ph <= -0.5) || (ph >= 0.5));
};
function quarterName(ph) {
	if((ph == -0) || (ph == 0))
		return quarter.domain()[0];
	
	if(ph == 0.5)
		return quarter.domain()[1];
	
	if(Math.abs(ph) == 1)
		return quarter.domain()[2];
	
	if(ph == -0.5)
		return quarter.domain()[3];
	
	var name = (isWaning(ph)) ? "Waning " : "Waxing ";
	name += (isGibbous(ph)) ? "Gibbous " : "Crescent ";
	
	return "\n" + name + "Moon";
};
function visibility(ph) {
	var v = 0;
	switch(ph) {
		case  0:
			break;
		case   1:
			v = 100;
			break;
		default:
			v = Math.round(Math.abs(100 * ph));
			break;
	};
	return v + "%";
};

function updatePhaser() {
	svg.select("#phase")
		.text("Phase: " + curPhase.toFixed(3));
	svg.select("#quarter")
		.text(quarterName(curPhase));
	svg.select("#visibility")
		.text("Visibility: " + visibility(curPhase));
};

function shadePath(cx, cy) {
	// full moon -> transparent
	if(curPhase == 1) { 
		return "";
	};
	
	// new moon -> circle at center cx, cy
	if(Math.abs(curPhase) == 0) {
		return "M" + (cx - rMoon) + "," + cy +
			"A" + rMoon + "," + rMoon +
			" 180 0 1 " +
			(cx + rMoon) + "," + cy +
			"A" + rMoon + "," + rMoon +
			" 180 0 1 " +
			(cx - rMoon) + "," + cy;
	};
	
	let d = "M" + cx + "," + (cy - rMoon) +
		"A" + rMoon + "," + rMoon +
		" 0 1 " + ((curPhase > 0) ? "0 " : "1 ") +
		cx + "," + (cy + rMoon);
		
	if(Math.abs(curPhase) == 0.5) {
		// half moon
		d += "Z";
	}
	else {
		let h = 2 * rMoon * (
			(
				(curPhase > -0.5)
				&&
				(curPhase < 0.5) ? 1 - Math.abs(curPhase) : Math.abs(curPhase)
			) - 0.5);
		let leg = Math.sqrt(rMoon * rMoon + h * h);
	
		let bigR = leg * leg / (2 * Math.sqrt(leg * leg - rMoon * rMoon));
	
		d += "A" + bigR + "," + bigR +
			" 0 0 " + 
			((curPhase < -0.5) || ((curPhase > 0) && (curPhase < 0.5)) ? "0 " : "1 ") +
			cx + "," + (cy - rMoon);
	};
	
	return d;
};

function updateShade() {
	shade.attr("d", shadePath(side2, side2));
};

function updatePicture() {
	if(curPhase != oldPhase) {
		oldPhase = curPhase;
		updateShade();
		updatePhaser();
	};
};

updatePicture();
