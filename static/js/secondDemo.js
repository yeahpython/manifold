var spherical = function(vector) {
	z = vector.z;
	x = vector.x * 0.5;
	y = vector.y * 0.5;
	return new THREE.Vector3(z*Math.sin(x), z *Math.cos(x) * Math.sin(y), z*Math.cos(x) * Math.cos(y));
}

var identity = function(vector) {
	return new THREE.Vector3().copy(vector);
}

var playPauseHander = function(){
	manifold.animating = !manifold.animating;
	document.getElementById("option").innerHTML = manifold.animating ? "Pause" : "Play";
}


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
var foo = function() {
	var board = manifold.board("board", window.innerWidth, 800);
	var space_a = manifold.space3(board, new THREE.Vector3(-11,0,0), "axes");
	var space_b = manifold.space3(board, new THREE.Vector3(11,0,0), "axes");
	var surface = manifold.surface("cube", space_a);
	manifold.controlSurfacePositionWithCursor(surface);
	var surface2 = manifold.image(spherical, surface, space_b);
	var cursorSpace = manifold.createCursorSpace(space_a);
	var cursorImageSpace = manifold.imageOfSpace(spherical, cursorSpace, space_b);
	var basicBasis = manifold.unitBasis(3, cursorSpace);
	var D_Spherical = manifold.approximateJacobian(spherical, 0.0001);
	var transformedBasis = manifold.transformBasisWithJacobian(basicBasis, cursorImageSpace, D_Spherical);
	//var pointCloud1 = manifold.genericPointCloud(space_a);
	//var pointCloud2 = manifold.pointCloudImage(space_b, pointCloud1, spherical);
	var sneakyGridLines = manifold.nearbyGridLines(space_a);
	var warpyGridLines = manifold.image(spherical, sneakyGridLines, space_b);

	// User input
	// manifold.tryToControlInputWithLeap();

	// Render loop
	manifold.render(board);
}