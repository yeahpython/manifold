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
		var renderer = new THREE.WebGLRenderer();
		renderer.setSize( width, window.height );
		document.getElementByID(id).appendChild( renderer.domElement );
		return {
			scene:scene;
			camera:camera;
			renderer:renderer;
		}
	}

	// Adds an object representing three-dimensional space to the board.
	manifold.space3 = function(board) {
		return space(3, board);
	}

	// Returns an approximate Jacobian of function userFunc
	// so if userfunc takes an n-vector and returns a m-vector,
	// this takes an n-vector and returns an m by n matrix
	manifold.approximateJacobian = function(userFunc, epsilon) {
		return {userFunc:userFunc, epsilon:epsilon}
	}

	// Make a new surface in a given space
	manifold.surface = function(type, space) {
		return {type:type, space:space}
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

	// Public Properties

	// Private Methods

	// Private Methods
	function space(dimension, board) {
		
	}


}(window.manifold = window.manifold || {}, jQuery));