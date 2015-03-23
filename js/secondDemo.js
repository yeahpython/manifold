var foo = function() {
	var board = manifold.board("board", 1000, 500);
	var space_a = manifold.space3(board, new THREE.Vector3(-50,0,0));
	var space_b = manifold.space3(board, new THREE.Vector3(-20,0,0));
	var space_c = manifold.space3(board, new THREE.Vector3(10,0,0));
	var space_d = manifold.space3(board, new THREE.Vector3(40,0,0));

	var surface = manifold.surface("cube", space_a, board);
	manifold.controlSurfacePositionWithCursor(surface.mesh);

	board.camera.position.set(0,10,50);
	space_a.updateMatrixWorld();
	board.camera.up.set(0,1,0);


	var light = new THREE.PointLight( 0xff0000, 1, 100 );
	light.position.set( 20, 20, 20 );
	board.scene.add( light );

	var light2 = new THREE.PointLight( 0x0000ff, 1, 100 );
	light2.position.set( 20, -20, 20 );
	board.scene.add( light2 );

	var light3 = new THREE.PointLight( 0xffff00, 1, 100 );
	light3.position.set( -20, 20, 20 );
	board.scene.add( light3 );

	manifold.render(board);
}