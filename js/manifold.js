/* 
.-------------.
| manifold.js |
'-------------'
A free javascript library built on THREE.js (and jQuery??) that makes it 
easier to create demos of linear algebra and multivariable calculus.

*/

(function(manifold, $, THREE, undefined){
	
	// Public Methods
	/*
	manifold.board
	--------------
	Makes a board (secretly a THREE.js scene, camera and renderer).
	   
	Parameters:
	       id: a string indicating the DOM element where we want to put the board
	    width: width in pixels of the board
	   height: height in pixels of the board
	*/
	manifold.board = function(id, width, height) {
		var scene = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
		var renderer = new THREE.WebGLRenderer({alpha:true});
		renderer.setSize( width, height );
		var box = document.getElementById(id);
		box.appendChild( renderer.domElement );
		var board = {
			scene:scene,
			camera:camera,
			renderer:renderer
		}
		boards.push(board);
		return board;
	}

	// Adds an object representing three-dimensional space to the board.
	// Adds axes by default, although this may change.
	manifold.space3 = function(board, origin) {
		return space(3, board, origin);
	}

	// Returns an approximate Jacobian of function userFunc
	// so if userfunc takes an n-vector and returns a m-vector,
	// this takes an n-vector and returns an m by n matrix
	manifold.approximateJacobian = function(userFunc, epsilon) {
		return {userFunc:userFunc, epsilon:epsilon}
	}

	// Make a new surface in a given space
	manifold.surface = function(type, space, board) {
		if (type == "cube") {
			// make a cube that moves around in the space according to user input
			var mesh = new THREE.Mesh(cursorSurface, paper);
			board.scene.add(mesh);
			THREE.SceneUtils.attach(mesh, board.scene, space);
			space.updateMatrixWorld();
			mesh.position.set(0,0,0);
			return {
				mesh:mesh,
				updateRule:{}
			};
		} else {
			throw "Unrecognized surface type";
		}
	}

	// Create the image of object under userFunc in space
	// currently compatible with the following objects:
	//
	manifold.image = function(userFunc, object, space) {

	}

	manifold.unitBasis = function(dimensions, space) {

	}

	// draws a line between two spaces, with text showing label over it.
	manifold.arrow = function(source, target, label) {

	}

	manifold.render = function(board) {
		updateAll();
		board.renderer.render(board.scene, board.camera);
	}

	function updateAll() {
		// The right thing to do is to do a topological sort of everything based on dependencies and do them in order.
		// I'm probably not going to do that...
		updateIteration++;
		var l = boards.length;
		for (var i = 0; i < l; i++) {
			enforceUpdate(boards[i].scene);
		}
	}

	function enforceUpdate(object) {
		// recurse through the children, updating everything!

		// Right now, everything is tree-shaped, so updateIteration doesn't really matter.

		// if it doesn't have an updateRule, give it one. Its children might have updateRules.
		if (object.updateRule == undefined) {
			object.updateRule = {};
		}

		if (object.updateRule.lastUpdate == updateIteration) {
			return;
		}

		for (var i = 0; i < object.children.length; i++) {
			enforceUpdate(object.children[i]);
		}

		if (object.updateRule.position = "cursor") {
			inputX = (mouse.x / $(window).width()) - 0.5;
			inputY = (mouse.y / $(window).height()) - 0.5;
			updateMeshWithInput(object, new THREE.Vector3( -10*inputX , 10 * inputX, -10 * inputY) );
		}

		object.updateRule.lastUpdate = updateIteration;
	}

	manifold.controlSurfacePositionWithCursor = function(surface) {
		// Rig things up so that every time we need to compute geometry of this surface,
		// we use the mouseInput
		if (surface.updateRule == undefined) {
			surface.updateRule = {};
		}
		surface.updateRule.position = "cursor";
	}

	function updateMeshWithInput(mesh, vec) {
		mesh.geometry.dynamic = true;
		if (mesh.geometry.vertices.length == cursorSurface.vertices.length) {
			for (var i = 0; i < cursorSurface.vertices.length; i++) {
				mesh.geometry.vertices[i].copy(cursorSurface.vertices[i]).add(vec);
			}
		} else {
			console.log(["error"][3]);
		}
		mesh.geometry.verticesNeedUpdate = true;
	}


	var updateIteration = 0;
	// Public Properties

	// Private Properties
	var boards = [];

	var paper = new THREE.MeshLambertMaterial({color:0xffffff});


	var linematerial = new THREE.LineBasicMaterial({
		color: 0x000000,
		linewidth: 5
	});

	var cursorSurface = new THREE.SphereGeometry(10,32,32);
	var min = new THREE.Vector3(-4,-4,-4);
	var max = new THREE.Vector3(4,4,4);
	for (var i = 0; i < cursorSurface.vertices.length; i++) {
		cursorSurface.vertices[i] = cursorSurface.vertices[i].clamp(min,max);
	}

	var mouse = {x: 0, y: 0};

	document.addEventListener('mousemove', function(e){ 
	    mouse.x = e.clientX || e.pageX; 
	    mouse.y = e.clientY || e.pageY 
	}, false);

	// Private Methods

	/*

	manifold.space
	--------------
	Makes a space (Secretly a glorified THREE.Object3D)
	gives the space axes
	puts the space in board at the given origin

	*/
	function space(dimension, board, origin) {
		if (dimension != 3) {
			throw "Dimensions other than 3 not supported";
		}
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
		board.scene.add( line );
		board.scene.add( plot );
		THREE.SceneUtils.attach(line, board.scene, plot);

		plot.position.add(origin);
		plot.axes = line;
		return plot;
	}


}(window.manifold = window.manifold || {}, jQuery, THREE));