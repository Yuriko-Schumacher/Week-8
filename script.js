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


    
});

function link2way(root) {
    
}

function id(node) {
    // creating an id for each leaf node based on it's parents
    // a node which is at
    // flare > analytics > cluster > MergeEdge
    // will have an id of flare.analytics.cluster.MergeEdge
    // refer: https://observablehq.com/@d3/tidy-tree
    return `${node.parent ? id(node.parent) + '.' : ''}${node.data.name}`;
}