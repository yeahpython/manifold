


var scene = new THREE.Scene();
var width = window.innerWidth;
var height = window.innerHeight;
var animating = true;
//var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var camera = new THREE.PerspectiveCamera( 40, width/height, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer({alpha:true});
renderer.setSize( width, height );

var initialize = function () {
	document.getElementById("3D").appendChild( renderer.domElement );
}
var offset = 7;
var axesSize = 1;

var linematerial = new THREE.LineBasicMaterial({
	color: 0x000000,
	linewidth: 10
});

var constructPlot = function(x,y,z) {
	var plot = new THREE.Object3D();
	axes = new THREE.Geometry();
	axes.vertices.push(
		new THREE.Vector3( -10, 0, 0 ),
		new THREE.Vector3( 10, 0, 0 ),
		new THREE.Vector3( 0, -10, 0 ),
		new THREE.Vector3( 0, 10, 0 ),
		new THREE.Vector3( 0, 0, -10 ),
		new THREE.Vector3( 0, 0, 10 )
	);
	var line = new THREE.Line( axes, linematerial, THREE.LinePieces);
	scene.add( line );
	scene.add( plot );
	THREE.SceneUtils.attach(line, scene, plot);
	plot.translateX(x);
	plot.translateY(y);
	plot.translateZ(z);
	return plot;
}
var leftPlot = constructPlot(offset, -offset, 0);
var rightPlot = constructPlot(-offset, offset, 0);

var myFunction = function(vector) {
	return new THREE.Vector3(vector);
}

var fShow33 = function(callback, left, right) {
	var points = new THREE.Geometry();
	for (var i = -5; i < 5; i++) {
		for (var j = -5; j < 5; j++) {
			for (var k = -5; k < 5; k++) {
				var domainPoint = new THREE.Vector3(i,j,k);
				var rangePoint = callback(domainPoint);
				console.log(left.position);
				console.log(right.position);
				points.vertices.push(left.localToWorld(domainPoint), right.localToWorld(rangePoint));
			}
		}
	}
	var material = new THREE.PointCloudMaterial({color:0x000000});
	var pointcloud = new THREE.PointCloud(points,material);
	console.log(scene);
	scene.add(pointcloud);
	return pointcloud;
}

fShow33(myFunction, leftPlot, rightPlot);

// point camera
camera.position.z = 10;
camera.position.x = 20;
camera.position.y = 20;
camera.up.set(0,0,1);
camera.lookAt(new THREE.Vector3(0,0,0));

var buttonHandler = function(){
	animating = false;
}

var render = function () {
	/*if (animating) {
		requestAnimationFrame( render );
	}*/
	renderer.render(scene, camera);
};


var meshDictionary = new Object();
render();