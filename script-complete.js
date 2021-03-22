const margin = {t: 50, r:50, b: 50, l: 50};
const size = {w: 800, h: 800};
const svg = d3.select('svg');

svg.attr('width', size.w)
    .attr('height', size.h)
    .attr('viewBox', [-size.w / 2, -size.h / 2, size.w, size.h]);

const containerG = svg.append('g').classed('container', true);

// The dataset we have
// is visualised here: https://observablehq.com/@d3/tidy-tree
// you can take a look for better understanding
// NOTE: this is different from the flare dataset we used in one of the previous classes

d3.json('data/flare-processed.json')
.then(function(data) {

    // console.log(data);
    /**
     * structure: {  name: 'flare', children: []  }
     * children: [ structure ]
     * leaf nodes also have an attribute called: imports
     * imports is a String array.
     * It tells which other leafs does a particular leaf node connected to
     */

    // let's add the heirarchy into the dataset
    // this function adds height and depth of each node
    // along with its parent within the existing dataset
    let hierarchy = d3.hierarchy(data);
    // console.log(hierarchy);
    /**
     * {
     *      data: ,
     *      children: [],
     *      depth: ,
     *      height: ,
     *      parent:
     * }
     */

    let bilinks = link2way(hierarchy);
    // console.log(bilinks);
    /**
     * {
     *      data: ,
     *      children: [],
     *      depth: ,
     *      height: ,
     *      parent:
     *      incoming: [], add this attribute to leaf nodes
     *      outgoing: [], add this attribute to leaf nodes
     * }
     * 
     * incoming/outgoing lets the leaf nodes know which other nodes they are directly connected to
     * this is required only because imports array is only strings, which we have translated to nodes now
     */

     // Now we create a layout of the bilinked dataset
     let layout = d3.cluster()
        .size([2*Math.PI, size.w/2 - 100])
        (bilinks);
    // console.log(layout);
    /**
     * this gives us x and y for each node
     * although we are using degree for x and radius for y
     * because we want to create a circular layout.
     * We use radians for angle (instead of degrees)
     * to avoid minor discrepencies in layout.
     * Mostly because we will be rotating text using this.
     * 
     * NOTE:
     * - this gives us the x and y co-ordinates for all nodes
     *      however, we are only going to draw leaf nodes
     * - Secondly, the incoming/outgoing attributes will help us bundle the edges
     */

    const node = svg.append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .selectAll('g')
        .data(layout.leaves()) // only drawing the leaf nodes
        .join('g')
        .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        // in the above line we are using x as angle and rotating each leaf node
        // d.x * (180/Math.PI)
        .append('text')
        .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
        // TO DO: try to change the 'end' to 'start'
        // if angle is on the left (after -90 rotation)
        .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
        .text(d => d.data.name)
        .call(text => text.append('title').text(d => `${id(d)}
            ${d.outgoing.length} outgoing
            ${d.incoming.length} incoming`));

    // using d3 function to draw radial lines
    let line = d3.lineRadial()
        .curve(d3.curveBundle.beta(0.85))
        // TODO: try commenting the above line out
        .radius(d => d.y)
        .angle(d => d.x);

    const link = svg.append('g')
        .attr('stroke', '#aaa')
        .attr('fill', 'none')
        .selectAll('path')
        .data(layout.leaves().flatMap(leaf => leaf.outgoing))
        // we are only drawing the outgoing paths
        // drawing both incoming and outgoing will be just drwaing them twice
        // flatMap function merges multiple arrays into one single array
        // each element in the array is [node, other-connected-leafNode]
        .join('path')
        .style('mix-blend-mode', 'multiply')
        .attr('d', (d) => {
            // refer bilink function
            // line: 148 to know the structure of d
            // and read the comment above that line
            let node = d[0];
            let connectedNode = d[1];
            return line(node.path(connectedNode));
        })
        .each(function(d) { d.path = this; });
    

});

function link2way(root) {
    let obj = {};
    root.leaves().forEach(d => {
        // saving the hierarchy of each leaf node as string
        // so we can later map it to the imports array
        // so for flare > analytics > cluster > MergeEdge
        // we save the node for the key 'flare.analytics.cluster.MergeEdge'
        // in obj variable
        obj[id(d)] = d;
    });
    for (const d of root.leaves()) {
        // create a blank array for incoming for all leafs
        // which we will populate in the next loop
        d.incoming = [];

        // create an array of arrays where
        // [0] = leaf node
        // [1] = other leaf node which it is importing
        // NOTE: both the leaf nodes include an empty incoming array
        d.outgoing = d.data.imports.map(i => [d, obj[i]]);
    }
    // at this point every node has already been
    // connected to its respective outgoing node
    // with d.outgoing
    // THINK:
    // outgoing -> the files that import the node
    // incoming -> the files that this node imports


    for (const d of root.leaves()) {
      for (const o of d.outgoing) {
        o[1].incoming.push(o);
        // this populates the blank incoming array for all nodes
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
    return `${node.parent ? id(node.parent) + '.' : ''}${node.data.name}`;
}