/*
.-------------.
| manifold.js |
'-------------'
A free javascript library built on THREE.js that makes it
easier to create demos of linear algebra and multivariable calculus.

The latest version of this project may be found at github.com/yeahpython/manifold

*/


/* (Uh, this is a 'self-executing anonymous function' that helps ensure that
    I can use private and publics methods and variables.)*/
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
			//document.getElementById("debug").innerHTML = col1.x;
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
			//newBasis.children[i].geometry = basis.children[i].geometry.clone();
			newBasis.children[i].geometry.dynamic = true;
		}
		updateRules.push({
			update:function(){
				var m = jacobian(cursor);
				for (var i = 0; i < basis.children.length; i++) {
					newBasis.children[i].geometry.vertices[1].copy(basis.children[i].geometry.vertices[1]);
					newBasis.children[i].geometry.vertices[1].applyMatrix3(m);
					newBasis.children[i].geometry.verticesNeedUpdate = true;
				}
			}
		});
		return newBasis;
	};

	// Make a new surface in a given space
	manifold.surface = function(type, space) {
		if (type == "cube") {
			// make a cube that moves around in the space according to user input
			var mesh = new THREE.Mesh(cursorSurface.clone(), paper);
			space.add(mesh);
			return mesh;
		} else {
			throw "Unrecognized surface type";
		}
	};

	// Create the image of object under userFunc in space
	// currently compatible with the following objects:
	//
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

	var xAxisMaterial = new THREE.LineBasicMaterial({
		color: 0xff0000,
		linewidth: 2,
		linecap:'round'
	});

	var yAxisMaterial = new THREE.LineBasicMaterial({
		color: 0x00ff00,
		linewidth: 2
	});

	var zAxisMaterial = new THREE.LineBasicMaterial({
		color: 0x0000ff,
		linewidth: 2
	});

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

	var gridMaterial = new THREE.LineBasicMaterial({
		color: 0xaaaaaa,
		vertexColors: THREE.VertexColors,
		//blending: THREE.AdditiveBlending,
		depthWrite:false,
	});

	/*gridMaterial.blending = THREE.CustomBlending;
	gridMaterial.blendEquation = THREE.MaxEquation;
	gridMaterial.blendSrc = THREE.DstColorFactor;
	gridMaterial.blendDst = THREE.OneFactor;
	gridMaterial.needsUpdate = true;*/

	manifold.controlPoint = function(space) {
		var cursorSurface = new THREE.SphereGeometry(0.5,100,100);
		var funMesh = new THREE.Mesh(cursorSurface, paper2);
		space.add(funMesh);
		funMesh.position.set(2,2,2);
		manifold.controlPoints.push(funMesh);
		return funMesh;
	}

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
				var f = 2*m + 1;
				document.getElementById("debug").innerHTML = "";
				var motions = 0;
				for (var i = 0; i < gridMesh.geometry.vertices.length; i+=2) {
					// desired movement
					var motion = new THREE.Vector3(0,0,0).copy(cursor).sub(gridMesh.geometry.vertices[i]);

					var t = motion.length();
					//document.getElementById("debug").innerHTML = "gridMesh.geometry.vertices[" + i + "].x: " + gridMesh.geometry.vertices[i].x + "<br>";
					t *= 0.5;
					t = Math.max(0, 2 - 3 * t);
					t = Math.min(1, t);
					/*
					if (t < 1) {
						t = 1;
					}
					else {
						t = 0;
					}*/
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

					if (motion.x != 0) {
						motions += 1;
					}

					gridMesh.geometry.vertices[i].add(motion);
					gridMesh.geometry.vertices[i+1].add(motion);

				}
				console.log(motions);
				gridMesh.geometry.verticesNeedUpdate = true;
				gridMesh.geometry.colorsNeedUpdate = true;
			}
		});

		return gridMesh;
	}

	manifold.unitBasis = function(dimensions, space) {
		if (dimensions != 3) {
			throw "Not dealing with less than three dimensions at the moment";
		}

		var basisLength = 1.5;

		var basis = new THREE.Object3D();

		var xUnit = new THREE.Geometry();
		xUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( basisLength, 0, 0 )
		);
		var i = new THREE.Line( xUnit, xAxisMaterial, THREE.LinePieces);

		var yUnit = new THREE.Geometry();
		yUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, basisLength, 0 )
		);
		var j = new THREE.Line( yUnit, yAxisMaterial, THREE.LinePieces);

		var zUnit = new THREE.Geometry();
		zUnit.vertices.push(
			new THREE.Vector3( 0, 0, 0 ),
			new THREE.Vector3( 0, 0, basisLength )
		);
		var k = new THREE.Line( zUnit, zAxisMaterial, THREE.LinePieces);


		space.add(basis);
		basis.add(i);
		basis.add(j);
		basis.add(k);
		return basis;
	}

	// draws a line between two spaces, with text showing label over it.
	manifold.arrow = function(source, target, label) {

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

	function updateAll() {
		// future: sort according to dependencies
		// future: find redundant updates.
		for (var i = 0; i < updateRules.length; i++) {
			updateRules[i].update();
		}
	};

	/*
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

		if (object.updateRule.lastSearch == updateIteration) {
			// We've really screwed up, and there's a cyclic dependency.
			throw "Error: Cyclic dependency detected";
		}

		object.updateRule.lastSearch = updateIteration;

		for (var i = 0; i < object.children.length; i++) {
			enforceUpdate(object.children[i]);
		}

		if (object.updateRule.position != undefined) {
			inputX = (mouse.x / $(window).width()) - 0.5;
			inputY = (mouse.y / $(window).height()) - 0.5;
			updateMeshWithInput(object, new THREE.Vector3( 10*inputX , -10 * inputY, 0) );
		}

		if (object.updateRule.surface != undefined) {

		}

		object.updateRule.lastUpdate = updateIteration;
	}*/

	// This thing looks like it's going to become a huge series of things that depend on each other.
	// I want to make it automatic, so that the user can just declare what depends on what, and have
	// everything work out visually.

	// I also want it to be modular, because I don't know what exactly depends on what.

	// I also need this thing to know when something doesn't need to be changed.

	// I don't want to build too much infrastructure outside of THREE.js, but I don't want to
	// simply hack into the existing THREE.js structure either.
	var updateRules = [
	{
		update:function() {
			get3DCursor();
		}
	}];

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
	}

	manifold.cursorControl = "mouse";

	var cursor = new THREE.Vector3(0,0,0);
	manifold.getCursor = function(){
		return new THREE.Vector3(cursor);
	};

	var leapCursor3d = new THREE.Vector3(0,0,0);

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

	var pointCloudMaterial = new THREE.PointCloudMaterial({color:0x000000, size:0.3});

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

	/*manifold.controlSurfacePositionWithCursor = function(surface) {
		// Rig things up so that every time we need to compute geometry of this surface,
		// we use the mouseInput
		if (surface.updateRule == undefined) {
			surface.updateRule = {};
		}
		surface.updateRule.position = function() {
			inputX = (mouse.x / $(window).width()) - 0.5;
			inputY = (mouse.y / $(window).height()) - 0.5;
			updateMeshWithInput(surface.mesh, new THREE.Vector3( -10*inputX , 10 * inputX, -10 * inputY) );
		};
	}*/

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

	var updateIteration = 0;

	var boards = [];
	manifold.controlPoints = [];


	// load a texture, set wrap mode to repeat
	var texture = THREE.ImageUtils.loadTexture( "../static/texture.png" );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 30, 30 );

	//var paper = new THREE.MeshLambertMaterial({color:0xffffff});
	//var paper = new THREE.MeshBasicMaterial({color:0xffffff, map:texture, transparent:true});
	var paper = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.1});
	var paper2 = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.3});
	//var paper = new THREE.MeshLambertMaterial({color:0xffffff, wireframe:true});


	var linematerial = new THREE.LineBasicMaterial({
		color: 0x333333,
		linewidth: 4
	});

	var cursorSurface = new THREE.SphereGeometry(6,100,100);
	var min = new THREE.Vector3(-1.5,-1.5,-1.5);
	var max = new THREE.Vector3(1.5,1.5,1.5);
	for (var i = 0; i < cursorSurface.vertices.length; i++) {
		cursorSurface.vertices[i] = cursorSurface.vertices[i].clamp(min,max);
	}

	var mouse = {x: 0, y: 0};
	var mouse3d = new THREE.Vector3(0,0,0);

	document.addEventListener('mousemove', function(e){
	    var inputX = e.clientX || e.pageX;
	    var inputY = e.clientY || e.pageY;
	    var inputX = e.clientX;
	    var inputY = e.clientY;
	    mouse.x = (inputX / $(window).width()) * 2 - 1;
		mouse.y = -(inputY / $(window).height()) * 2 + 1;
		mouse3d.set( 5*mouse.x , 5 * mouse.y, 5);
	}, false);


	manifold.animating = true;

	// Private Methods

	/*

	manifold.space
	--------------
	Makes a space (Secretly a glorified THREE.Object3D)
	gives the space axes
	puts the space in board at the given origin

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
				new THREE.Vector3( 0, 0, 10 )
			);
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


}(window.manifold = window.manifold || {}, jQuery, THREE));