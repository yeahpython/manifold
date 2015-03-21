var mouse = {x: 0, y: 0};

document.addEventListener('mousemove', function(e){ 
    mouse.x = e.clientX || e.pageX; 
    mouse.y = e.clientY || e.pageY 
}, false);


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
	return new THREE.Vector3(vector.x, vector.y, vector.z + Math.sin(vector.y));
}

var fShow33 = function(callback, left, right) {
	var domainPoints = new THREE.Geometry();
	var rangePoints = new THREE.Geometry();
	left.updateMatrixWorld();
	right.updateMatrixWorld();
	var m = 5.5;
	for (var i = -m; i <= m; i+=2) {
		for (var j = -m; j <= m; j+=2) {
			for (var k = -m; k <=m; k+=2) {
				var domainPoint = new THREE.Vector3(i,j,k);
				var rangePoint = callback(domainPoint);

				domainPoints.vertices.push(left.localToWorld(domainPoint));

				rangePoints.vertices.push(right.localToWorld(rangePoint));
			}
		}
	}
	var domainMaterial = new THREE.PointCloudMaterial({color:0x000000, size:0.3});
	scene.add(new THREE.PointCloud(domainPoints, domainMaterial));

	var rangeMaterial = new THREE.PointCloudMaterial({color:0x000000, size:0.3});
	scene.add(new THREE.PointCloud(rangePoints, rangeMaterial));
	//THREE.SceneUtils.attach(domainPoints, scene, left);
	//THREE.SceneUtils.attach(rangePoints, scene, right);


	return {domain:domainPoints, range:rangePoints};
}

fShow33(myFunction, leftPlot, rightPlot);

var bubbleSample = function(callback, left, right) {
	var domainSurface = new THREE.SphereGeometry(5, 20, 20);
	//domainSurface.applyMatrix(new THREE.Matrix4().makeTranslation(left.position.x, left.position.y, left.position.z));
	var material = new THREE.MeshBasicMaterial({color:0xff0000, wireframe:true});
	var domainSphere = new THREE.Mesh( domainSurface, material );
	scene.add( domainSphere );
	THREE.SceneUtils.attach(domainSphere, scene, left);
	domainSphere.position.set(0,0,0);

	var rangeSurface = new THREE.SphereGeometry(5, 20, 20);
	for (var i = 0; i < rangeSurface.vertices.length; i++) {
		rangeSurface.vertices[i] = callback(rangeSurface.vertices[i]);
	}
	//rangeSurface.applyMatrix(new THREE.Matrix4().makeTranslation(right.position.x, right.position.y, right.position.z));
	var rangeShape = new THREE.Mesh(rangeSurface, material);
	scene.add(rangeShape);
	THREE.SceneUtils.attach(rangeShape, scene, right);
	rangeShape.position.set(0,0,0);
	return [domainSphere, rangeShape]
}

surfaces = bubbleSample(myFunction, leftPlot, rightPlot);

var DOMAIN = 0;
var RANGE = 1;

var cursorSurface = new THREE.SphereGeometry(4,20,20);

// Janky and assumes linearity of input -> translation mapping, but whatever.
var updateMeshWithInput = function(mesh, vec) {
	mesh.geometry.dynamic = true;
	if (mesh.geometry.vertices.length == cursorSurface.vertices.length) {
		for (var i = 0; i < cursorSurface.vertices.length; i++) {
			mesh.geometry.vertices[i].copy(cursorSurface.vertices[i]).add(vec);
		}
	} else {
		console.log(["error"][3]);
	}
	//mesh.position.set(x,y,z); // not working because I want to change the vertices, not the position.
	mesh.geometry.verticesNeedUpdate = true;
}

// point camera
camera.position.z = 10;
camera.position.x = 20;
camera.position.y = 20;
camera.up.set(0,0,1);
camera.lookAt(new THREE.Vector3(0,0,0));

var buttonHandler = function(){
	if (animating){
		animating = false;
		document.getElementById("animationToggle").innerHTML = "Start animation";
	} else {
		animating = true;
		document.getElementById("animationToggle").innerHTML = "Stop animation";
		render();
	}
}

var updateRangeWithDomain = function(range,domain,callback) {
	range.geometry.dynamic = true;
	if (range.geometry.vertices.length == domain.geometry.vertices.length) {
		for (var i = 0; i < domain.geometry.vertices.length; i++) {
			range.geometry.vertices[i] = callback(domain.geometry.vertices[i]);
		}
	} else {
		console.log(["error"][3]);
	}
	range.geometry.verticesNeedUpdate = true;
}

var render = function () {
	var t = 0.002 * new Date().getTime();
	inputX = (mouse.x / width) - 0.5;
	inputY = (mouse.y / height) - 0.5
	updateMeshWithInput(surfaces[DOMAIN], new THREE.Vector3( -10*inputX , 10 * inputX, -10 * inputY) );
	updateRangeWithDomain(surfaces[RANGE], surfaces[DOMAIN], myFunction);
	camera.position.x = 20 + 2 * Math.sin(t);
	camera.position.y = 20 - 2 * Math.sin(t);
	camera.lookAt(new THREE.Vector3(0,0,0));
	if (animating) {
		requestAnimationFrame( render );
	}
	renderer.render(scene, camera);
};


var meshDictionary = new Object();
render();