/*
.-------------.
| manifold.js |
'-------------'
Explain multivariable calculus in the browser!

The latest version of this project may be found at github.com/yeahpython/manifold
*/

(function(manifold, $, THREE, undefined){

	// Materials
	var xAxisMaterial = new THREE.LineBasicMaterial({
		color: 0xff0000,
		linewidth: 2
	});

	var yAxisMaterial = new THREE.LineBasicMaterial({
		color: 0x00ff00,
		linewidth: 2
	});

	var zAxisMaterial = new THREE.LineBasicMaterial({
		color: 0x0000ff,
		linewidth: 2
	});

	var linematerial = new THREE.LineBasicMaterial({
		color: 0xffffff,
		linewidth: 4
	});

	var parallelogramLineMaterial = new THREE.LineBasicMaterial({
		color: 0x444444,
		linewidth: 2
	});

	var surfaceMaterial = new THREE.MeshBasicMaterial({
		color:0xffffff,
		transparent:true,
		opacity:0.1
	});

	var controlPointMaterial = new THREE.MeshBasicMaterial({
		color:0xffffff,
		transparent:true,
		opacity:0.3,
		blending: THREE.AdditiveBlending,
		depthWrite:false
	});

	var gridMaterial = new THREE.LineBasicMaterial({
		color: 0xaaaaaa,
		vertexColors: THREE.VertexColors,
		transparent: true,
		blending: THREE.AdditiveBlending
	});

	var pointCloudMaterial = new THREE.PointCloudMaterial({
		color:0x000000,
		size:0.3
	});



	var boards = [];

	var cursorSurface = (function() {
		cursorSurface = new THREE.SphereGeometry(6,100,100);
		var min = new THREE.Vector3(-1.5,-1.5,-1.5);
		var max = new THREE.Vector3(1.5,1.5,1.5);
		for (var i = 0; i < cursorSurface.vertices.length; i++) {
			cursorSurface.vertices[i] = cursorSurface.vertices[i].clamp(min,max);
		}
		return cursorSurface
	})();

	// inputs
	manifold.cursorControl = "mouse";
	// values range from -1 to 1
	var mouse = {x: 0, y: 0};
	manifold.controlPoints = [];
	var mouse3d = new THREE.Vector3(0,0,0);
	var cursor = new THREE.Vector3(0,0,0);

	var leapCursor3d = new THREE.Vector3(0,0,0);

	manifold.animating = true;
	var updateRules = [
	{
		update:function() {
			get3DCursor();
		}
	}];


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
		var camera = new THREE.PerspectiveCamera( 30, width / height, 0.1, 1000 );
		camera.position.setZ(40);

		// Prepare Orbit controls
		controls = new THREE.OrbitControls(camera);
		controls.target = new THREE.Vector3(0, 0, 0);
		controls.maxDistance = 150;

		// fastest
		//var renderer = new THREE.WebGLRenderer();

		// fast
		var renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});

		renderer.setClearColor(0x000000, 1.0);

		// slower, with rounded line caps
		//var renderer = new THREE.CanvasRenderer({alpha:true, antialias:true});

		renderer.setSize( width, height );
		var box = document.getElementById(id);
		box.appendChild( renderer.domElement );
		var board = {
			scene: scene,
			camera: camera,
			renderer: renderer,
			controls: controls
		};
		boards.push(board);
		return board;
	};

	// Adds an object representing three-dimensional space to the board.
	// Adds axes by default, although this may change.
	manifold.space3 = function(board, origin, spaceOption) {
		//okay for spaceOption to be undefined
		return space(3, board, origin, spaceOption);
	};

	// Returns an approximate Jacobian of function userFunc
	// so if userfunc takes an n-vector and returns a m-vector,
	// this takes an n-vector and returns an m by n matrix
	manifold.approximateJacobian = function(userFunc, epsilon) {
		// assuming 3x3 for now.
		return function(input) {
			col1 = userFunc(new THREE.Vector3(epsilon, 0, 0).add(input)).sub(userFunc(input)).divideScalar(epsilon);
			col2 = userFunc(new THREE.Vector3(0, epsilon, 0).add(input)).sub(userFunc(input)).divideScalar(epsilon);
			col3 = userFunc(new THREE.Vector3(0,0, epsilon).add(input)).sub(userFunc(input)).divideScalar(epsilon);
			return new THREE.Matrix3().set(col1.x, col2.x, col3.x,
				                           col1.y, col2.y, col3.y,
				                           col1.z, col2.z, col3.z);
		};
	};


	/*
	  basis: the original basis that you want to transform
	  space: the space in which you place the transformed basis
	  jacobian: a function that takes 3D points as input and returns 3x3 matrices

	  currently assumes that the jacobian should be determined by the cursor position by default,
	  although odds are that at some point this will become an incorrect assumption.
	*/
	manifold.transformBasisWithJacobian = function(basis, space, jacobian) {
		//var newBasis = basis.clone();
		var newBasis = manifold.unitBasis(3, space);
		for (var i = 0; i < basis.children.length; i++) {
			newBasis.children[i].geometry.dynamic = true;
		}
		updateRules.push({
			update:function(){
				var m = jacobian(cursor);
				for (var i = 0; i < basis.children.length; i++) {
					for (var j = 0; j < newBasis.children[i].geometry.vertices.length; j++) {
						newBasis.children[i].geometry.vertices[j].copy(basis.children[i].geometry.vertices[j]);
						newBasis.children[i].geometry.vertices[j].applyMatrix3(m);
					}
					newBasis.children[i].geometry.verticesNeedUpdate = true;
				}
			}
		});
		return newBasis;
	};

	// Shows the matrix of values in the jacobian.
	manifold.showJacobian = function(jacobian) {
		var matrixBox = $("<div/>")
			.html("jacobian matrix appears here")
			.attr("id", "jacobian_matrix")
			.css({
				"max-width": "500px",
				padding: "5px",
				position: "absolute",
				left: "10px",
				bottom: "10px",
				display: "block",
				"background-color": "black",
				color:"white"
			})
			.prependTo($("body"));
		updateRules.push({
			update: function() {
				matrixBox.html("jacobian matrix:<br>");
				var m = jacobian(cursor);
				var M = m.toArray();
				var brackets = $("<div/>")
					.css({
						display: "inline-block",
						"border-right": "1px solid",
						"border-left": "1px solid",
						"border-radius": "5px",
						"text-align": "right",
						padding:"3px"
						})
					.appendTo(matrixBox);

				for (var i = 0; i < 3; i++) {
					var column = $("<div/>")
						.css({
							display: "inline-block",
							"text-align": "right",
							padding:"3px"
							})
						.appendTo(brackets);
					for (var j = 0; j < 3; j++) {
						column.append(M[i * 3 + j].toFixed(2));
						column.append("<br>");
					}
				}

				/*for (var i = 0; i < 3; i++) {
					for (var j = 0; j < 3; j++) {
						matrixBox.append(M[i + j * 3].toFixed(2));
						matrixBox.append(" ");
					}
					matrixBox.append("<br>")
				}*/
			}
		});
	}

	// Utility function for creating surfaces with excessively many polygons
	manifold.surface = function(type, space) {
		if (type == "cube") {
			// make a cube that moves around in the space according to user input
			var mesh = new THREE.Mesh(createCursorSurface(), surfaceMaterial);
			space.add(mesh);
			return mesh;
		} else {
			throw "Unrecognized surface type";
		}
	};

	// Create the image of object under userFunc in space
	manifold.image = function(userFunc, object, space, copyColors) {
		var mesh = object.clone();
		mesh.geometry = object.geometry.clone();
		space.add(mesh);
		mesh.geometry.dynamic = true;
		updateRules.push({
			update:function(){
				for (var i = 0; i < object.geometry.vertices.length; i++) {
					mesh.geometry.vertices[i] = userFunc(object.geometry.vertices[i]);
				}
				mesh.geometry.verticesNeedUpdate = true;
			}
		});
		if (copyColors) {
			updateRules.push({
			update:function(){
				for (var i = 0; i < object.geometry.vertices.length; i++) {
					mesh.geometry.colors[i] = object.geometry.colors[i];
				}
				mesh.geometry.colorsNeedUpdate = true;
			}
		});
		}
		return mesh;
	};

	manifold.translateBasisWithFunction = function(basis, space, userFunc) {
		var basisCopy = basis.clone();
		basisCopy.position = new THREE.Vector3();
		space.add(basisCopy);

		updateRules.push({
			update:function(){
				basisCopy.position.copy(userFunc(cursor));
			}
		});
		return basisCopy;
	};

	manifold.controlPoint = function(board, space) {
		var cursorSurface = new THREE.SphereGeometry(2.5, 100, 100);
		var funMesh = new THREE.Mesh(cursorSurface, controlPointMaterial);
		space.add(funMesh);
		funMesh.position.set(2,2,2);
		manifold.controlPoints.push(funMesh);


		//mouse = {x:0, y:0};
		var selection = null;
		var plane = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(500, 500, 8, 8),
			new THREE.MeshBasicMaterial({color: 0x0000ff}));
		plane.visible = false;
		space.add(plane);
		var offset = new THREE.Vector3();

		document.addEventListener('mousedown', function (e) {
		    var inputX = e.clientX;
		    var inputY = e.clientY;

		    mouse.x = (inputX / $(window).width()) * 2 - 1;
			mouse.y = -(inputY / $(window).height()) * 2 + 1;

			space.updateMatrixWorld();
			var intersects = raycaster.intersectObjects( manifold.controlPoints);
			if (intersects.length > 0) {
				board.controls.enabled = false;
				selection = intersects[0].object;
				selection.material.color.set(0x00ff00);
				var plane_intersects = raycaster.intersectObject(plane);
				offset.copy(plane_intersects[0].point).sub(plane.position);
				offset.copy(selection.position);
				offset.sub(plane_intersects[0].point);
			}
			//document.getElementById("debug").innerHTML = "detected click on " + intersects.length + " objects";

		}, false);


		document.addEventListener('mousemove', function (event) {
			// code adapted from https://www.script-tutorials.com/webgl-with-three-js-lesson-10/
			event.preventDefault();

			// Get mouse position
			var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
			var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

			// Get 3D vector from 3D mouse position using 'unproject' function
			var vector = new THREE.Vector3(mouseX, mouseY, 1);
			vector.unproject(board.camera);

			// Set the raycaster position
			raycaster.set( board.camera.position, vector.sub( board.camera.position ).normalize() );
			if (selection) {
				// Check the position where the plane is intersected
				var intersects = raycaster.intersectObject(plane);
				// Reposition the object based on the intersection point with the plane
				// selection.position.copy(intersects[0].point.sub(offset));
				selection.position.copy(intersects[0].point.add(offset));
			} else {
				for (var i = 0; i < manifold.controlPoints.length; i++) {
					manifold.controlPoints[i].material.color.set(0xff0000);
					manifold.controlPoints[i].material.opacity = 0;
				}
				// Update position of the plane if need
				var object_intersects = raycaster.intersectObjects(manifold.controlPoints);
				if (object_intersects.length > 0) {
					object_intersects[0].object.material.color.set(0xffff00);
					object_intersects[0].object.material.opacity = 0.1;
					plane.position.copy(object_intersects[0].object.position);
					// console.log(plane.position);

					//plane.position.setFromMatrixPosition( object_intersects[0].object.matrixWorld );
					// console.log(plane.position);
					plane.lookAt(board.camera.position);
				}
			}

		}, false);
		document.addEventListener('mouseup', function (e) {
			board.controls.enabled = true;
			selection = null;
		}, false);
		return funMesh;
	};

	manifold.nearbyGridLines = function(space) {
		var gridLines = new THREE.Geometry();
		var m = 1;
		var gridSize = 1;
		var cuts = 10;
		var step = gridSize / cuts;
		for (var i = -m; i <= m; i++) {
			for (var j = -m; j <= m; j++) {
				for (var k = -m; k <= m; k++) {
					for (var s = 0; s < cuts; s++) {
						gridLines.vertices.push(
							new THREE.Vector3(i+s*step, j, k),
							new THREE.Vector3(i+(s+1)*step, j, k),
							new THREE.Vector3(i, j+s*step, k),
							new THREE.Vector3(i, j+(s+1)*step, k),
							new THREE.Vector3(i, j, k+s*step),
							new THREE.Vector3(i, j, k+(s+1)*step));
					}
				}
			}
		}


		var gridMesh = new THREE.Line( gridLines, gridMaterial, THREE.LinePieces);
		gridMesh.geometry.dynamic = true;

		space.add(gridMesh);

		updateRules.push({
			update: function() {
				var f = 2 * m + 1;
				// Move each line segment to the position nearest to the cursor
				// with the constraint that the line segment is only allowed to
				// occupy a lattice of locations
				for (var i = 0; i < gridMesh.geometry.vertices.length; i+=2) {
					var motion = new THREE.Vector3(0,0,0).copy(cursor).sub(gridMesh.geometry.vertices[i]);
					var t = Math.max(0, 2 - 1.5 * motion.length());
					t = Math.min(1, t);
					var color = new THREE.Color( 0xffffff );
					color.setRGB(t,t,t);
					gridMesh.geometry.colors[i] = color;

					//var color = new THREE.Color( 0xffffff );
					//color.setRGB(Math.random(),Math.random(),Math.random());
					gridMesh.geometry.colors[i+1] = color;


					motion.divideScalar(f);
					// snap movement to the nearest multiple of 2m + 1
					motion.x = Math.round(motion.x);
					motion.y = Math.round(motion.y);
					motion.z = Math.round(motion.z);
					motion.multiplyScalar(f);
					gridMesh.geometry.vertices[i].add(motion);
					gridMesh.geometry.vertices[i+1].add(motion);

				}
				gridMesh.geometry.verticesNeedUpdate = true;
				gridMesh.geometry.colorsNeedUpdate = true;
			}
		});

		return gridMesh;
	};

	manifold.unitBasis = function(dimensions, space) {
		if (dimensions != 3) {
			throw "Not dealing with less than three dimensions at the moment";
		}

		var basisLength = 1.5;

		var basis = new THREE.Object3D();

		var xUnit = new THREE.Geometry();
		xUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( basisLength, 0, 0 ));
		var i = new THREE.Line( xUnit, xAxisMaterial, THREE.LinePieces);

		var yUnit = new THREE.Geometry();
		yUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, basisLength, 0 ));
		var j = new THREE.Line( yUnit, yAxisMaterial, THREE.LinePieces);

		var zUnit = new THREE.Geometry();
		zUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, 0, basisLength ));
		var k = new THREE.Line( zUnit, zAxisMaterial, THREE.LinePieces);

		space.add(basis);
		basis.add(i);
		basis.add(j);
		basis.add(k);

		var extraLines = new THREE.Geometry();
		var b = basisLength;
		extraLines.vertices.push(
			new THREE.Vector3(b, 0, 0),
			new THREE.Vector3(b, b, 0),
			new THREE.Vector3(b, 0, 0),
			new THREE.Vector3(b, 0, b),
			new THREE.Vector3(0, b, 0),
			new THREE.Vector3(b, b, 0),
			new THREE.Vector3(0, b, 0),
			new THREE.Vector3(0, b, b),
			new THREE.Vector3(0, 0, b),
			new THREE.Vector3(b, 0, b),
			new THREE.Vector3(0, 0, b),
			new THREE.Vector3(0, b, b),
			new THREE.Vector3(0, b, b),
			new THREE.Vector3(b, b, b),
			new THREE.Vector3(b, 0, b),
			new THREE.Vector3(b, b, b),
			new THREE.Vector3(b, b, 0),
			new THREE.Vector3(b, b, b)
			);
		var additionalLines = new THREE.Line(extraLines, parallelogramLineMaterial, THREE.LinePieces);

		basis.add(additionalLines);

		return basis;
	};

	// Draws a line between two spaces, with text showing label over it.
	manifold.arrow = function(source, target, label) {
		// Not written yet.
	};

	manifold.render = function() {
		// lazy (as a programmer) solution for turning off animations.
		// frames keep on going but I don't do anythin about it.
		if (manifold.animating) {
			updateAll();
			var inputX = cursor.x;
			var inputY = cursor.y;
			// update the picking ray with the camera and mouse position
			for (var i = 0; i < boards.length; i++) {
				boards[i].renderer.render(boards[i].scene, boards[i].camera);
				/*var cameraTarget = new THREE.Vector3(6 *inputX,6 * inputY, 20 );
				boards[i].camera.position.lerp(cameraTarget, 0.01);*/
				boards[i].camera.lookAt(new THREE.Vector3(0,0,0));
			}
		}
		requestAnimationFrame(manifold.render);
	};

	manifold.controlSurfacePositionWithCursor = function(surface) {
		updateRules.push(
			{
				update :
				function()
				{
					updateMeshWithInput(surface, cursor);
				}
			}
		);
	};

	manifold.getCursor = function(){
		return new THREE.Vector3(cursor);
	};

	manifold.tryToControlInputWithLeap = function() {
		document.getElementById("control").innerHTML = "Leap Motion Controller";
		manifold.cursorControl = "leap";
		Leap.loop(function (frame) {
		    if (frame.hands.length) {
		    	p = frame.hands[0].palmPosition;
				leapCursor3d.set(p[0], p[1]-100, p[2]+100).divideScalar(40);
			}
		});
	};

	manifold.tryToControlInputWithSomeControlPoint = function() {
		document.getElementById("control").innerHTML = "Control Point";
		manifold.cursorControl = "some control point";
	};

	manifold.genericPointCloud = function(space) {
		points = new THREE.Geometry();
		var m = 6;
		for (var i = -m; i <= m; i+=2) {
			for (var j = -m; j <= m; j+=2) {
				for (var k = -m; k <=m; k+=2) {
					var point = new THREE.Vector3(i,j,k);
					points.vertices.push(space.localToWorld(point));
				}
			}
		}
		var pointCloud = new THREE.PointCloud(points, pointCloudMaterial);
		space.add(pointCloud);
		return pointCloud;
	};

	manifold.pointCloudImage = function(space, pointCloud, userFunc) {
		space.updateMatrixWorld();
		var newPointCloud = new THREE.PointCloud(pointCloud.geometry.clone(), pointCloud.material);
		for (var i = 0; i < newPointCloud.geometry.vertices.length; i++) {
			newPointCloud.geometry.vertices[i] = userFunc(newPointCloud.geometry.vertices[i]);
		}
		space.add(newPointCloud);
	};

	// Creates a THREE.js space as a child of a given space, tracking the position of the cursor at every frame
	manifold.createCursorSpace = function(parent) {
		var space = new THREE.Object3D();
		parent.add(space);
		updateRules.push(
		{	update:function(){
				space.position.copy(cursor);
			}
		});
		return space;
	};

	manifold.imageOfSpace = function(userFunc, originalSpace, parent) {
		var space = new THREE.Object3D();
		parent.add(space);
		updateRules.push({update:function(){
			space.position.copy(userFunc(originalSpace.position));
		}});
		return space;
	};

	document.addEventListener('mousemove', function(e){
	    // TODO: investigate this oddness
	    // var inputX = e.clientX || e.pageX;
	    // var inputY = e.clientY || e.pageY;
	    var inputX = e.clientX;
	    var inputY = e.clientY;
	    mouse.x = (inputX / $(window).width()) * 2 - 1;
		mouse.y = -(inputY / $(window).height()) * 2 + 1;
		mouse3d.set( 5*mouse.x , 5 * mouse.y, 5);
	}, false);

	// Private Methods

	/*
	Makes a space (Secretly a glorified THREE.Object3D)
	gives the space axes, and puts the space in board at the given origin
	*/
	function space(dimension, board, origin, spaceOption) {
		// okay for spaceOption to be undefined

		if (dimension != 3) {
			throw "Dimensions other than 3 not supported";
		}
		var plot = new THREE.Object3D();
		var axes = new THREE.Geometry();

		var line = undefined;
		if (spaceOption == "axes") {
			axes.vertices.push(
				new THREE.Vector3( -10, 0, 0 ),
				new THREE.Vector3( 10, 0, 0 ),
				new THREE.Vector3( 0, -10, 0 ),
				new THREE.Vector3( 0, 10, 0 ),
				new THREE.Vector3( 0, 0, -10 ),
				new THREE.Vector3( 0, 0, 10 ));
			line = new THREE.Line( axes, linematerial, THREE.LinePieces);
		} else if (spaceOption == "box"){
			axes.vertices.push(
				//triple
				new THREE.Vector3( -10, -10, -10 ),
				new THREE.Vector3( 10, -10, -10 ),

				new THREE.Vector3( -10, -10, -10 ),
				new THREE.Vector3( -10, 10, -10 ),
				new THREE.Vector3( -10, -10, -10 ),
				new THREE.Vector3( -10, -10, 10 ),

				// L-shape
				new THREE.Vector3( 10, -10, -10 ),
				new THREE.Vector3( 10, 10, -10 ),

				new THREE.Vector3( 10, -10, -10 ),
				new THREE.Vector3( 10, -10, 10 ),

				// L-shape
				new THREE.Vector3( -10, 10, -10 ),
				new THREE.Vector3( 10, 10, -10 ),

				new THREE.Vector3( -10, 10, -10 ),
				new THREE.Vector3( -10, 10, 10 ),

				// L-shape
				new THREE.Vector3( -10, -10, 10 ),
				new THREE.Vector3( 10, -10, 10 ),

				new THREE.Vector3( -10, -10, 10 ),
				new THREE.Vector3( -10, 10, 10 ),

				// triple
				new THREE.Vector3( -10, 10, 10 ),
				new THREE.Vector3( 10, 10, 10 ),

				new THREE.Vector3( 10, -10, 10 ),
				new THREE.Vector3( 10, 10, 10 ),

				new THREE.Vector3( 10, 10, -10 ),
				new THREE.Vector3( 10, 10, 10 ));
			line = new THREE.Line( axes, linematerial, THREE.LinePieces);
		}

		board.scene.add( plot );

		if (line) {
			plot.add(line);
			plot.axes = line;
		}

		plot.position.add(origin);
		return plot;
	}


	// Updates the meshes in the scene according to UpdateRules.
	// Does not sort according to dependencies. This should be okay
	// because updateRules should be added in topological order for
	// now.
	function updateAll() {
		// TODO: Detect and skip redundant updates.
		for (var i = 0; i < updateRules.length; i++) {
			updateRules[i].update();
		}
	}

	function get3DCursor(){
		if (manifold.cursorControl == "leap") {
			cursor.copy(leapCursor3d);
		} else if (manifold.cursorControl == "mouse") {
			cursor.copy(mouse3d);
		} else if (manifold.controlPoints){
			cursor.copy(manifold.controlPoints[0].position);
		} else {
			console.log("didn't know what to do to with cursorControl");
		}
	}

	/*
	This function moves a mesh around per-vertex instead of moving the
	overall position.
	*/
	function updateMeshWithInput(mesh, vec) {
		mesh.geometry.dynamic = true;
		if (mesh.geometry.vertices.length == cursorSurface.vertices.length) {
			for (var i = 0; i < cursorSurface.vertices.length; i++) {
				mesh.geometry.vertices[i].copy(cursorSurface.vertices[i]).add(vec);
			}
		} else {
			throw "Error: Mesh has incorrect length";
		}
		mesh.geometry.verticesNeedUpdate = true;
	}

	function createCursorSurface() {
		var cursorSurface = new THREE.SphereGeometry(6,100,100);
		var min = new THREE.Vector3(-1.5,-1.5,-1.5);
		var max = new THREE.Vector3(1.5,1.5,1.5);
		for (var i = 0; i < cursorSurface.vertices.length; i++) {
			cursorSurface.vertices[i] = cursorSurface.vertices[i].clamp(min,max);
		}
		return cursorSurface;
	}


}(window.manifold = window.manifold || {}, jQuery, THREE));