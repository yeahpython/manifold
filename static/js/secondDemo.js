/*
This function takes planes aligned with the xy plane to spheres.
 */
var spherical = function(vector) {
	//return new THREE.Vector3(vector.x, vector.y + Math.sin(vector.x), vector.z);
	z = vector.z;
	x = vector.x * 0.5;
	y = vector.y * 0.5;
	return new THREE.Vector3(z * Math.sin(x), z * Math.cos(x) * Math.sin(y), z * Math.cos(x) * Math.cos(y));
};

/*
This function takes planes aligned with the xy plane to toruses.
 */
var donut = function(vector) {
	var a = 3;
	var b = 4;
	var exp = Math.exp(vector.z);
	var scaling = 5;
	var inner_radius = scaling + scaling * exp / (1+exp);
	var radius = scaling * 2;
	var t = Math.sin(0.2 * vector.y) * (radius + (radius - inner_radius) * Math.cos(vector.x));
	var u = (radius - inner_radius) * Math.sin(vector.x);
	var v = Math.cos(0.2 * vector.y) * (radius + (radius - inner_radius) * Math.cos(vector.x));
	return new THREE.Vector3(t, u, v);
}

var identity = function(vector) {
	return new THREE.Vector3().copy(vector);
};

var playPauseHander = function(){
	manifold.animating = !manifold.animating;
	document.getElementById("option").innerHTML = manifold.animating ? "Pause" : "Play";
};

var toggleLeapControl = function(){
	if (manifold.cursorControl == "leap") {
		manifold.cursorControl = "mouse";
		document.getElementById("control-button").innerHTML = "Control with Leap Motion";
		document.getElementById("control").innerHTML = "Mouse";
	} else {
		if (!manifold.leapIntialized) {
			manifold.leapIntialized = true;
			manifold.tryToControlInputWithLeap();
		}
		manifold.cursorControl = "leap";
		document.getElementById("control-button").innerHTML = "Control with Mouse";
		document.getElementById("control").innerHTML = "Leap Motion";
	}
};


/*

The interface still seems kind of messy. I'm tempted to turn a lot of these functions into private methods
and instead have the library have public methods such as "VisualizeJacobian(function)"

Also, introducing a language of control points makes sense. In the long run, I expect that we're not going
to want everything to be controlled directly by the cursor.

What do math teachers want? They probably want the function calls to match mathematics as closely as possible.

Need a better idea of what the target usage is
Things to teach:
Dot products
Orthogonality
Null Space
Column Space
Linear transformations

*/

var raycaster = new THREE.Raycaster();

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var foo = function() {
	var board = manifold.board("board", window.innerWidth - 10, window.innerHeight - 10);
	//THREEx.WindowResize(board.renderer, board.camera);
	var space_a = manifold.space3(board, new THREE.Vector3(-11,0,0), "axes");
	var space_b = manifold.space3(board, new THREE.Vector3(11,0,0), "axes");

	// mouse = {x:0, y:0};
	// var selection = null;
	// var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(500, 500, 8, 8), new THREE.MeshBasicMaterial({color: 0x0000ff}));
	// plane.visible = false;
	// board.scene.add(plane);
	// var offset = new THREE.Vector3();

	// document.addEventListener('mousedown', function (e) {
	//     var inputX = e.clientX;
	//     var inputY = e.clientY;

	//     mouse.x = (inputX / $(window).width()) * 2 - 1;
	// 	mouse.y = -(inputY / $(window).height()) * 2 + 1;

	// 	space_a.updateMatrixWorld();
	// 	var intersects = raycaster.intersectObjects( manifold.controlPoints);
	// 	if (intersects.length > 0) {
	// 		board.controls.enabled = false;
	// 		selection = intersects[0].object;
	// 		selection.material.color.set(0x00ff00);
	// 		var plane_intersects = raycaster.intersectObject(plane);
	// 		offset.copy(plane_intersects[0].point).sub(plane.position);
	// 		offset.copy(selection.position);
	// 		offset.sub(plane_intersects[0].point);
	// 	}
	// 	document.getElementById("debug").innerHTML = "detected click on " + intersects.length + " objects";

	// }, false);

	// document.addEventListener('mousemove', function (event) {
	// 	// code adapted from https://www.script-tutorials.com/webgl-with-three-js-lesson-10/
	// 	event.preventDefault();

	// 	// Get mouse position
	// 	var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
	// 	var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

	// 	// Get 3D vector from 3D mouse position using 'unproject' function
	// 	var vector = new THREE.Vector3(mouseX, mouseY, 1);
	// 	vector.unproject(board.camera);

	// 	// Set the raycaster position
	// 	raycaster.set( board.camera.position, vector.sub( board.camera.position ).normalize() );
	// 	if (selection) {
	// 		// Check the position where the plane is intersected
	// 		var intersects = raycaster.intersectObject(plane);
	// 		// Reposition the object based on the intersection point with the plane
	// 		// selection.position.copy(intersects[0].point.sub(offset));
	// 		selection.position.copy(intersects[0].point.add(offset));
	// 	} else {
	// 		for (var i = 0; i < manifold.controlPoints.length; i++) {
	// 			manifold.controlPoints[i].material.color.set(0xff0000);
	// 			manifold.controlPoints[i].material.opacity = 0;
	// 		}
	// 		// Update position of the plane if need
	// 		var object_intersects = raycaster.intersectObjects(manifold.controlPoints);
	// 		if (object_intersects.length > 0) {
	// 			object_intersects[0].object.material.color.set(0xffff00);
	// 			object_intersects[0].object.material.opacity = 0.1;
	// 			// plane.position.copy(object_intersects[0].object.position);
	// 			// console.log(plane.position);
	// 			plane.position.setFromMatrixPosition( object_intersects[0].object.matrixWorld );
	// 			// console.log(plane.position);
	// 			plane.lookAt(board.camera.position);
	// 		}
	// 	}

	// }, false);
	// document.addEventListener('mouseup', function (e) {
	// 	/*if (selection) {
	// 		selection.material.color.set(0xff0000);
	// 	}*/
	// 	board.controls.enabled = true;
	// 	selection = null;
	// }, false);

	/*
	var surface = manifold.surface("cube", space_a);
	manifold.controlSurfacePositionWithCursor(surface);
	var surface2 = manifold.image(spherical, surface, space_b);
	*/

	var cursorSpace = manifold.createCursorSpace(space_a);
	var cursorImageSpace = manifold.imageOfSpace(spherical, cursorSpace, space_b);
	var basicBasis = manifold.unitBasis(3, cursorSpace);

	// How can I make Jacobian operations automatic?
	var D_Spherical = manifold.approximateJacobian(spherical, 0.0001);
	var transformedBasis = manifold.transformBasisWithJacobian(basicBasis, cursorImageSpace, D_Spherical);
	//var pointCloud1 = manifold.genericPointCloud(space_a);
	//var pointCloud2 = manifold.pointCloudImage(space_b, pointCloud1, spherical);
	var sneakyGridLines = manifold.nearbyGridLines(space_a);
	var warpyGridLines = manifold.image(spherical, sneakyGridLines, space_b, true);

	var controlPoint = manifold.controlPoint(board, space_a);
	// manifold.controlSurfacePositionWithControlPoint(surface, controlPoint);

	// User input
	manifold.tryToControlInputWithSomeControlPoint();
	//manifold.tryToControlInputWithLeap();

	// Render loop
	manifold.render(board);
};