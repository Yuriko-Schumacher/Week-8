const margin = { t: 50, r: 50, b: 50, l: 50 };
const size = { w: 800, h: 800 };
const svg = d3.select("svg");

svg.attr("width", size.w)
	.attr("height", size.h)
	.attr("viewBox", [-size.w / 2, -size.h / 2, size.w, size.h]);

const containerG = svg.append("g").classed("container", true);

// The dataset we have
// is visualised here: https://observablehq.com/@d3/tidy-tree
// you can take a look for better understanding
// NOTE: this is different from the flare dataset we used in one of the previous classes

d3.json("data/flare-processed.json").then(function (data) {
	console.log(data);
	let hierarchy = d3.hierarchy(data);
	console.log(hierarchy);
	console.log(hierarchy.leaves());
	let bilinks = link2way(hierarchy);
	console.log(bilinks);

	let layout = d3.cluster().size([2 * Math.PI, size.w / 2 - 100])(bilinks);

	let node = svg
		.append("g")
		.attr("font-family", "sans-serif")
		.attr("font-size", 10)
		.selectAll("g")
		.data(layout.leaves()) // only drawing the leaf node
		.join("g")
		.attr(
			"transform",
			(d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y}, 0)`
		)
		.append("text")
		.attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
		.attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null))
		.text((d) => d.data.name);

	let line = d3
		.lineRadial()
		.curve(d3.curveBundle.beta(0.9))
		.radius((d) => d.y)
		.angle((d) => d.x);

	let link = svg
		.append("g")
		.attr("stroke", "#aaa")
		.attr("fill", "none")
		.selectAll("path")
		.data(layout.leaves().flatMap((leaf) => leaf.outgoing))
		.join("path")
		.style("mix-blend-mode", "multiply")
		.attr("d", (d) => {
			let node = d[0];
			let connectedNode = d[1];
			return line(node.path(connectedNode));
		});
});

function link2way(root) {
	let obj = {};
	root.leaves().forEach((d) => {
		let nodeId = id(d);
		obj[nodeId] = d;
	});
	console.log(obj);

	for (const d of root.leaves()) {
		d.incoming = [];
		d.outgoing = d.data.imports.map((e) => [d, obj[e]]);
		// console.log(d.incoming, d.outgoing);
		for (const o of d.outgoing) {
			// console.log(o);
			o[0].incoming.push(o);
		}
	}

	return root;
}

function id(node) {
	// creating an id for each leaf node based on it's parents
	// a node which is at
	// flare > analytics > cluster > MergeEdge
	// will have an id of flare.analytics.cluster.MergeEdge
	// refer: https://observablehq.com/@d3/tidy-tree
	return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
}
