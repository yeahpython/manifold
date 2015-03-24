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

var foo = function() {
	var board = manifold.board("board", 800, 800);
	var space_a = manifold.space3(board, new THREE.Vector3(-11,11,0));
	var space_b = manifold.space3(board, new THREE.Vector3(11,11,0));
	var space_c = manifold.space3(board, new THREE.Vector3(-11,-11,0));
	var space_d = manifold.space3(board, new THREE.Vector3(11,-11,0));

	//space_a.position.set(0,0,0);

	var surface = manifold.surface("cube", space_a, board);
	manifold.controlSurfacePositionWithCursor(surface);


	var surface2 = manifold.image(spherical, surface, space_b, board);

	var basis_1 = manifold.unitBasis(3, board.scene, space_c);

	var D_Spherical = manifold.approximateJacobian(spherical, 0.0001);

	var basis_2 = manifold.transformBasisWithJacobian(basis_1, board.scene, space_d, space_c, D_Spherical);

	var basis_3 = manifold.translateBasisWithFunction(basis_2, board.scene, space_b, spherical);

	var basis_4 = manifold.translateBasisWithFunction(basis_1, board.scene, space_a, identity);

	manifold.tryToControlInputWithLeap();

	/*
	// Prettification stuff.
	//board.camera.position.set(0,0,30);
	//board.camera.up.set(0,1,0);

	var light = new THREE.PointLight( 0xff0000, 1, 100 );
	light.position.set( 20, 20, 20 );
	board.scene.add( light );

	var light2 = new THREE.PointLight( 0x0000ff, 1, 100 );
	light2.position.set( 20, -20, 20 );
	board.scene.add( light2 );

	var light3 = new THREE.PointLight( 0xffff00, 1, 100 );
	light3.position.set( -20, 20, 20 );
	board.scene.add( light3 );
	*/

	// Render loop
	manifold.render(board);
}