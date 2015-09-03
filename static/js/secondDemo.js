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

var spherical2D = function(vector) {
	//return new THREE.Vector3(vector.x, vector.y + Math.sin(vector.x), vector.z);
	z = 5;
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

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

var foo = function() {
	var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
	renderer.setClearColor(0x000000, 1.0);

	//var board = manifold.board("board", window.innerWidth / 2, window.innerHeight - 10);
	var board = manifold.board("board", window.innerWidth, window.innerHeight, 0.6, 0, 0.4, 0.5, renderer);
	var board_2 = manifold.board("board", window.innerWidth, window.innerHeight, 0.6, 0.5, 0.4, 0.5, renderer);
	var board_3 = manifold.board("board", window.innerWidth, window.innerHeight, 0, 0, 0.6, 1, renderer, 2);
	var space_a = manifold.space3(board, new THREE.Vector3(0,0,0), "axes", "C");
	var space_b = manifold.space3(board_2, new THREE.Vector3(0,0,0), "axes", "B");
	var space_c = manifold.space2(board_3, new THREE.Vector3(0,0,0), "axes", "A");

	var controlPoint2D = manifold.controlPoint(board_3, space_c, 2, "x");

	var tangentSpace2D = manifold.createTangentSpace(space_c, controlPoint2D);
	var basicBasis2D = manifold.addUnitBasis(2, tangentSpace2D);

	// var controlPoint = manifold.controlPoint(board, space_a, 3, "y");

	/*
	// Add a surface that is mapped through the function
	var surface = manifold.surface("cube", space_a);
	manifold.controlSurfacePositionWithCursor(surface);
	var surface2 = manifold.image(spherical, surface, space_b);
	// manifold.controlSurfacePositionWithControlPoint(surface, controlPoint);
	*/

	//var tangentSpace = manifold.createTangentSpace(space_a, controlPoint);
	//var basicBasis = manifold.addUnitBasis(3, tangentSpace);

	var f = manifold.mathFunction(spherical2D, "f");

	// How can I make Jacobian operations automatic?
	var D_Spherical = manifold.approximateJacobian(f, 0.0001);
	var transformedTangentSpace = manifold.warpTangentSpaceWithJacobian(tangentSpace2D, space_b, D_Spherical, f, controlPoint2D);

	var double_spherical = function(input) {
		return spherical(spherical2D(input));
	};

	var g = manifold.mathFunction(double_spherical, "g");
	var D_double_spherical = manifold.approximateJacobian(g, 0.0001);

	var transformedTangentSpace2 = manifold.warpTangentSpaceWithJacobian(transformedTangentSpace, space_a, D_double_spherical, g, controlPoint2D);
	var jacobianMatrixDisplay = manifold.showJacobian(D_Spherical, controlPoint2D, 2);

	var sneakyGridLines = manifold.nearbyGridLines(space_c, controlPoint2D, 2);
	var warpyGridLines = manifold.image(f, sneakyGridLines, space_b, true, board_3, board_2);
	var warpyGridLines2 = manifold.image(g, sneakyGridLines, space_a, true, board_3, board);

	manifold.render();
};