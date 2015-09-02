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
};

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
	var space_a = manifold.space3(board, new THREE.Vector3(-11,0,0), "axes");
	var space_b = manifold.space3(board, new THREE.Vector3(11,0,0), "axes");

	var controlPoint = manifold.controlPoint(board, space_a);

	/*
	// Add a surface that is mapped through the function
	var surface = manifold.surface("cube", space_a);
	manifold.controlSurfacePositionWithCursor(surface);
	var surface2 = manifold.image(spherical, surface, space_b);
	// manifold.controlSurfacePositionWithControlPoint(surface, controlPoint);
	*/

	var tangentSpace = manifold.createTangentSpace(space_a, controlPoint);
	var basicBasis = manifold.addUnitBasis(3, tangentSpace);

	// How can I make Jacobian operations automatic?
	var D_Spherical = manifold.approximateJacobian(spherical, 0.0001);
	var transformedTangentSpace = manifold.warpTangentSpaceWithJacobian(tangentSpace, space_b, D_Spherical, spherical, controlPoint);
	var jacobianMatrixDisplay = manifold.showJacobian(D_Spherical, controlPoint);

	var sneakyGridLines = manifold.nearbyGridLines(space_a, controlPoint);
	var warpyGridLines = manifold.image(spherical, sneakyGridLines, space_b, true);

	manifold.render(board);
};