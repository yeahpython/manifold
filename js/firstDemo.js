


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
	var domainSurface = new THREE.SphereGeometry(5, 32, 32);
	domainSurface.applyMatrix(new THREE.Matrix4().makeTranslation(left.position.x, left.position.y, left.position.z));
	var material = new THREE.MeshBasicMaterial({color:0xff0000, wireframe:true});
	var domainSphere = new THREE.Mesh( domainSurface, material );
	scene.add( domainSphere );

	var rangeSurface = new THREE.SphereGeometry(5, 32, 32);
	for (var i = 0; i < rangeSurface.vertices.length; i++) {
		rangeSurface.vertices[i] = callback(rangeSurface.vertices[i]);
	}
	rangeSurface.applyMatrix(new THREE.Matrix4().makeTranslation(right.position.x, right.position.y, right.position.z));
	var rangeShape = new THREE.Mesh(rangeSurface, material);
	scene.add(rangeShape);
	return domainSphere
}

domainSphere = bubbleSample(myFunction, leftPlot, rightPlot);

var updateMeshWithInput = function(mesh, x, y, z) {
	mesh.geometry.dynamic = true;
	mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(x,y,z));
	mesh.geometry.verticesNeedUpdate = true;
}

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
	var t = 0.002 * new Date().getTime();
	//updateMeshWithInput(domainSphere, 0.005,0.005,0.005);
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