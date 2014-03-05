////////////////////////////////////////////////////////////////////////////////
// Road Bike Demo
////////////////////////////////////////////////////////////////////////////////
/*
Notes
-do lathe geometry to get hour shaped front hub
*/
/*global THREE, requestAnimationFrame, dat, window */

var camera, scene, renderer;
var cameraControls;
var effectController;
var clock = new THREE.Clock();
var teacupSize = 200;
var ambientLight, light, particleLight;
var tess = -1;  // force initialization
var bCup ;
var bSaucer;
var wire;
var flat;
var phong;
var flatGouraudMaterial, flatPhongMaterial, gouraudMaterial, phongMaterial, wireMaterial;
var bikePosX = 0;
var bike;

/*
Bike part measurements
*/
var topTubeL = 570;
var seatTubeVirtualL = 530;
var topTubeA = 95;
var topTubeHeadR = 19; 
var topTubeSeatR = 17.5; 
var seatTubeL = 570;
var seatTubeA = 17;
var seatTubeR = 17.5;
var seatStemR = 14;
var seatStemL = 200;
var headTubeL = 186;
var headTubeA = 17;
var headTubeR = 25;
var headTubeOverTopTubeL = 10;
var downTubeR = 25;
var chainStayL = 404;
var chainStayTopR = 13.5;
var chainStayBotR = 9.5;
var wheelDiam = 670;	//This was measured (not 700 cc)
var bottomBracketH = 270;
var chainStayArad = Math.asin((wheelDiam / 2 - bottomBracketH) / chainStayL);
var rearAxelL = 150;
var rearAxelR = 9;
var rearHubR = 21.5;
var rearHubL = 100;
var rearHubFlangL = 2;
var rearHubFlangR = 28.5;
var rearHubCentreToRightFlang = 17.4;
var rearHubCentreToLeftFlang = 35;
var rearHubD = rearHubCentreToRightFlang + rearHubCentreToLeftFlang;
var seatStayR = 9;
var stemR = 17.5;
var stemL = 120;
var stemA = 6;
var headSetR = 17.5;
var headSetL = 80 + headTubeL;
var forkTopR = 19;
var forkBotR = 12;
var forkRake = 45;
var seatStemR = 14;
var frontAxelL = 130;
var frontAxelR = 9;
var frontHubL = 80;
var frontHubR = 12;
var frontHubFlangL = 2;
var frontHubFlangR = 19;
var frontHubCentreToFlang = 35;
var spokeR = 1;
var tireW = 23;
var tireR = wheelDiam / 2 - tireW/2;
var rimW = 19;
var rimD = 50;
var numFrontSpokes = 10;
var numRearSpokes = 12;
var rimTireOverlap = 5;
var insideTireR = tireR - tireW / 2 + rimTireOverlap;
var handleBarR = 16;

function init() {
    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;

    // CAMERA

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
    //camera.position.set( -1000, 900, 2100 );
    camera.position.set( 100, 250, 2000 );

    // LIGHTS

    //ambientLight = new THREE.AmbientLight( 0x333333 );  // 0.2
	ambientLight = new THREE.AmbientLight( 0xFFFFFF );  // 0.2

    light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
    // direction is set in GUI

    // RENDERER

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( canvasWidth, canvasHeight );
    renderer.setClearColorHex( 0xAAAAAA, 1.0 );

    var container = document.getElementById('container');
    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    // EVENTS

    window.addEventListener( 'resize', onWindowResize, false );

    // CONTROLS

    cameraControls = new THREE.TrackballControls( camera, renderer.domElement );
    cameraControls.target.set(0, 250, 0);


    // MATERIALS
    // Note: setting per pixel off does not affect the specular highlight;
    // it affects only whether the light direction is recalculated each pixel.
    var materialColor = new THREE.Color();
    materialColor.setRGB( 1.0, 0.8, 0.6 );
    flatGouraudMaterial = createShaderMaterial( "gouraud", light, ambientLight );
    flatGouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    flatGouraudMaterial.shading = THREE.FlatShading;
    flatGouraudMaterial.side = THREE.DoubleSide;

    flatPhongMaterial = createShaderMaterial( "phong", light, ambientLight );
    flatPhongMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    flatPhongMaterial.shading = THREE.FlatShading;
    flatPhongMaterial.side = THREE.DoubleSide;

    gouraudMaterial = createShaderMaterial( "gouraud", light, ambientLight );
    gouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    gouraudMaterial.side = THREE.DoubleSide;

    phongMaterial = createShaderMaterial( "phong", light, ambientLight );
    phongMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    phongMaterial.side = THREE.DoubleSide;

    wireMaterial = new THREE.MeshBasicMaterial( { color: 0xFFCC99, wireframe: true } ) ;

    // GUI
    setupGui();

}

// EVENT HANDLERS

function onWindowResize() {

    var canvasWidth = window.innerWidth;
    var canvasHeight = window.innerHeight;

    renderer.setSize( canvasWidth, canvasHeight );

    camera.aspect = canvasWidth/ canvasHeight;
    camera.updateProjectionMatrix();

}

function setupGui() {

    effectController = {

        shininess: 100.0,
        ka: 0.2,
        kd: 0.7,
        ks: 0.7,
        metallic: false,

        hue:        0.09,
        saturation: 0.46,
        lightness:  0.1,

        lhue:        0.04,
        lsaturation: 0.01,  // so that fractions will be shown
        llightness:  1.0,

        // bizarrely, if you initialize these with negative numbers, the sliders
        // will not show any decimal places.
        lx: 0.32,
        ly: 0.39,
        lz: 0.7,
        newTess: 10,
        cup: true,
        saucer: true,
        newFlat: false,
        newPhong: true,
        newWire: false
    };

    var h;

    var gui = new dat.GUI();

    // material (attributes)

    h = gui.addFolder( "Material control" );

    h.add( effectController, "shininess", 1.0, 400.0, 1.0 ).name("m_shininess");
    h.add( effectController, "ka", 0.0, 1.0, 0.025 ).name("m_ka");
    h.add( effectController, "kd", 0.0, 1.0, 0.025 ).name("m_kd");
    h.add( effectController, "ks", 0.0, 1.0, 0.025 ).name("m_ks");
    h.add( effectController, "metallic" );

    // material (color)

    h = gui.addFolder( "Material color" );

    h.add( effectController, "hue", 0.0, 1.0, 0.025 ).name("m_hue");
    h.add( effectController, "saturation", 0.0, 1.0, 0.025 ).name("m_saturation");
    h.add( effectController, "lightness", 0.0, 1.0, 0.025 ).name("m_lightness");

    // light (point)

    h = gui.addFolder( "Light color" );

    h.add( effectController, "lhue", 0.0, 1.0, 0.025 ).name("hue");
    h.add( effectController, "lsaturation", 0.0, 1.0, 0.025 ).name("saturation");
    h.add( effectController, "llightness", 0.0, 1.0, 0.025 ).name("lightness");

    // light (directional)

    h = gui.addFolder( "Light direction" );

    h.add( effectController, "lx", -1.0, 1.0, 0.025 ).name("x");
    h.add( effectController, "ly", -1.0, 1.0, 0.025 ).name("y");
    h.add( effectController, "lz", -1.0, 1.0, 0.025 ).name("z");

    h = gui.addFolder( "Tessellation control" );
    h.add(effectController, "newTess", [2,3,4,5,6,8,10,12,16,24,32] ).name("Tessellation Level");
    h.add(effectController, "cup").name("display cup");
    h.add(effectController, "saucer").name("display saucer");
    h.add( effectController, "newFlat" ).name("Flat Shading");
    h.add( effectController, "newPhong" ).name("Use Phong");
    h.add( effectController, "newWire" ).name("Show wireframe only");
}


//

function animate() {

    requestAnimationFrame( animate );
    render();

}

function render() {

    var delta = clock.getDelta();
    
    cameraControls.update( delta );
    if (effectController.newTess !== tess ||
        effectController.cup !== bCup ||
        effectController.saucer !== bSaucer ||
        effectController.newFlat !== flat || effectController.newPhong !== phong || effectController.newWire !== wire)
    {
        tess = effectController.newTess;
        bCup = effectController.cup;
        bSaucer = effectController.saucer;
        flat = effectController.newFlat;
        phong = effectController.newPhong;
        wire = effectController.newWire;

        fillScene();
    }
    //bikePosX += 1;
    //bike.position.x = bikeFramePosX;

    flatGouraudMaterial.uniforms.shininess.value = effectController.shininess;
    flatPhongMaterial.uniforms.shininess.value = effectController.shininess;
    gouraudMaterial.uniforms.shininess.value = effectController.shininess;
    phongMaterial.uniforms.shininess.value = effectController.shininess;

    flatGouraudMaterial.uniforms.uKd.value = effectController.kd;
    flatPhongMaterial.uniforms.uKd.value = effectController.kd;
    gouraudMaterial.uniforms.uKd.value = effectController.kd;
    phongMaterial.uniforms.uKd.value = effectController.kd;

    flatGouraudMaterial.uniforms.uKs.value = effectController.ks;
    flatPhongMaterial.uniforms.uKs.value = effectController.ks;
    gouraudMaterial.uniforms.uKs.value = effectController.ks;
    phongMaterial.uniforms.uKs.value = effectController.ks;

    var materialColor = new THREE.Color();
    materialColor.setHSL( effectController.hue, effectController.saturation, effectController.lightness );
    flatGouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    flatPhongMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    gouraudMaterial.uniforms.uMaterialColor.value.copy( materialColor );
    phongMaterial.uniforms.uMaterialColor.value.copy( materialColor );

    if ( !effectController.metallic )
    {
        materialColor.setRGB(1,1,1);
    }
    flatGouraudMaterial.uniforms.uSpecularColor.value.copy( materialColor );
    flatPhongMaterial.uniforms.uSpecularColor.value.copy( materialColor );
    gouraudMaterial.uniforms.uSpecularColor.value.copy( materialColor );
    phongMaterial.uniforms.uSpecularColor.value.copy( materialColor );

    // Ambient's actually controlled by the light for this demo - TODO fix
    ambientLight.color.setHSL( effectController.hue, effectController.saturation, effectController.lightness * effectController.ka );

    light.position.set( effectController.lx, effectController.ly, effectController.lz );
    light.color.setHSL( effectController.lhue, effectController.lsaturation, effectController.llightness );
    renderer.render( scene, camera );

}

function createShaderMaterial( id, light, ambientLight ) {

    var shader = THREE.ShaderTypes[ id ];

    var u = THREE.UniformsUtils.clone( shader.uniforms );

    var vs = shader.vertexShader;
    var fs = shader.fragmentShader;

    var material = new THREE.ShaderMaterial( { uniforms: u, vertexShader: vs, fragmentShader: fs } );

    material.uniforms.uDirLightPos.value = light.position;
    material.uniforms.uDirLightColor.value = light.color;

    material.uniforms.uAmbientLightColor.value = ambientLight.color;

    return material;

}

function getUIControlledMesh(frameGeo) {
    var framePart = new THREE.Mesh(
        frameGeo,
        wire ? wireMaterial : (
        flat ?
            ( phong ? flatPhongMaterial : flatGouraudMaterial ) :
            ( phong ? phongMaterial : gouraudMaterial ) ));
    return framePart;
}

function getWhiteFrameMesh(frameGeo) {
	return new THREE.Mesh(
			frameGeo,
			new THREE.MeshPhongMaterial( { color : 0xFFFFFF, shininess: 400, specular: 0xFFFFFF, shading : THREE.SmoothShading } ) );
}

function getBlackFrameMesh(frameGeo) {
	return new THREE.Mesh(
			frameGeo,
			new THREE.MeshPhongMaterial( { color : 0x000000, shininess: 100, specular : 0xFFFFFF, shading : THREE.SmoothShading } ) );
			//new THREE.MeshPhongMaterial( { color : 0xFFFFFF, shininess: 400, specular: 0xFFFFFF, shading : THREE.SmoothShading } ) );
}


function getSaddle() {
	var saddleShape = new THREE.Shape();
	saddleShape.moveTo(150, 0);  // 1
	saddleShape.quadraticCurveTo(150, -18, 130, -20);  // 2
	saddleShape.quadraticCurveTo(32, -28, 30, -30);  // 3
	saddleShape.quadraticCurveTo(0, -32, -30, -58);  // 4
	saddleShape.quadraticCurveTo(-65, -82, -110, -50);  // 5	
	saddleShape.quadraticCurveTo(-178, -0, -110, 50);  // 6	
	saddleShape.quadraticCurveTo(-65, 82, -30, 58);  // 7
	saddleShape.quadraticCurveTo(0, 32, 30, 30);  // 8
	saddleShape.quadraticCurveTo(32, 28, 130, 20);  // 9
	saddleShape.quadraticCurveTo(150, 18, 150, 0);  // 10
		
	var extrudeSettings = { amount: 20, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: 10 };
	var saddleGeometry = new THREE.ExtrudeGeometry( saddleShape, extrudeSettings );
	var saddle = getWhiteFrameMesh(saddleGeometry);
	saddle.rotation.x = 90 * Math.PI / 180;
	
	return saddle;
}

function getBikeFrame() {
	var bikeFrame = new THREE.Object3D();
	
	var topTube = getWhiteFrameMesh(new THREE.CylinderGeometry( topTubeSeatR, topTubeHeadR, topTubeL, 16, 3, false));
    topTube.rotation.z = topTubeA * Math.PI/180;
    topTube.position.y = seatTubeVirtualL;
    topTube.position.x = topTubeL/2 - (Math.sin(seatTubeA * Math.PI/180) * seatTubeVirtualL);
	bikeFrame.add( topTube );
    
	var seatParts = new THREE.Object3D();
    var seatTube = getWhiteFrameMesh(new THREE.CylinderGeometry( seatTubeR, seatTubeR, seatTubeL, 16, 3, false));
    seatTube.position.y = seatTubeL/2;
	seatParts.add(seatTube);
    var seatStem = getBlackFrameMesh(new THREE.CylinderGeometry( seatStemR, seatStemR, seatStemL, 16, 3, false));
	seatStem.position.y = seatStemL/2 + seatTubeL;
    seatParts.add(seatStem);
	var saddle = getSaddle();
	saddle.position.y = seatTubeL + seatStemL;
	saddle.rotation.y = -seatTubeA * Math.PI/180;
	seatParts.add( saddle );
    seatParts.rotation.z = seatTubeA * Math.PI/180;
	bikeFrame.add( seatParts );
	
    var headTube = getWhiteFrameMesh(new THREE.CylinderGeometry( headTubeR, headTubeR, headTubeL, 16, 3, false));
    headTube.rotation.z = seatTubeA * Math.PI/180;
    headTube.position.y = topTube.position.y + Math.sin((topTubeA - 90) * Math.PI/180) * topTubeL - headTubeL/2 + headTubeOverTopTubeL;
    headTube.position.x = topTube.position.x + topTubeL/2 + headTubeR;
	headTube.name = "headTube";
    bikeFrame.add( headTube );
	    
    var downTubeOposite = topTube.position.x + topTubeL/2 + headTubeR;
    var downTubeAdjacent = headTube.position.y - headTubeL / 2 + headTubeR * 2;
    var downTubeL = Math.sqrt(Math.pow(downTubeOposite, 2) + Math.pow(downTubeAdjacent, 2));
    tube = getWhiteFrameMesh(new THREE.CylinderGeometry( downTubeR, downTubeR, downTubeL, 16, 3, false));    
    tube.position.y = downTubeL/2;
    var downTube = new THREE.Object3D();
    downTube.add(tube)
    downTube.rotation.z = -1 * Math.atan(downTubeOposite / downTubeAdjacent);
    bikeFrame.add( downTube );
	
    tube = getBlackFrameMesh(new THREE.CylinderGeometry( chainStayBotR, chainStayTopR, chainStayL, 16, 3, false));
    tube.position.y = chainStayL / 2;
    tube.position.z = downTubeR - chainStayTopR;
    var chainStayOpL = (rearAxelL / 2) - tube.position.z;
    var chainStaySeparationAngle = Math.asin(chainStayOpL / chainStayL);
    tube.rotation.x = chainStaySeparationAngle;
    var rightChainStay = new THREE.Object3D();
    rightChainStay.add( tube );
    rightChainStay.rotation.z = 90 * Math.PI/180 - chainStayArad;
    rightChainStay.position.z = chainStayOpL / 2;
	bikeFrame.add( rightChainStay );
    
    tube = getBlackFrameMesh(new THREE.CylinderGeometry( chainStayBotR, chainStayTopR, chainStayL, 16, 3, false));
    tube.position.y = chainStayL / 2;
    tube.position.z = -(downTubeR - chainStayTopR);
    tube.rotation.x = -chainStaySeparationAngle;
    var leftChainStay = new THREE.Object3D();
    leftChainStay.add( tube );
    leftChainStay.rotation.z = 90 * Math.PI/180 - chainStayArad;
    leftChainStay.position.z = -chainStayOpL / 2;
	bikeFrame.add( leftChainStay );
    
    var seatStayL = Math.sqrt(Math.pow(seatTubeVirtualL, 2) + Math.pow(chainStayL, 2) - (2 * seatTubeVirtualL * chainStayL * Math.cos((90 - seatTubeA)* Math.PI/180 - chainStayArad)));
    tube = getBlackFrameMesh(new THREE.CylinderGeometry( seatStayR, seatStayR, seatStayL, 16, 3, false));
    tube.position.y = -seatStayL / 2;
    tube.position.z = seatTubeR - seatStayR;
    var seatStayOpL = (rearAxelL / 2) - tube.position.z;
    var seatStaySeparationAngle = Math.asin(seatStayOpL / seatStayL);
    tube.rotation.x = -seatStaySeparationAngle;
    var rightSeatStay = new THREE.Object3D();
    rightSeatStay.add(tube);
    rightSeatStay.rotation.z = -(90 * Math.PI/180 + chainStayArad - Math.asin((Math.sin((90 - seatTubeA) * Math.PI/180 - chainStayArad) / seatStayL) * seatTubeVirtualL));
    rightSeatStay.position.z = seatStayOpL / 2;
    var seatStayTopX = -Math.sin(seatTubeA * Math.PI/180) * seatTubeVirtualL;
    var seatStayTopY = Math.cos(seatTubeA * Math.PI/180) * seatTubeVirtualL;
    rightSeatStay.position.y = seatStayTopY;
    rightSeatStay.position.x = seatStayTopX;
    bikeFrame.add( rightSeatStay );
	
    tube = getBlackFrameMesh(new THREE.CylinderGeometry( seatStayR, seatStayR, seatStayL, 16, 3, false));
    tube.position.y = -seatStayL / 2;
    tube.position.z = -(seatTubeR - seatStayR); 
    tube.rotation.x = seatStaySeparationAngle;  
    var leftSeatStay = new THREE.Object3D();
    leftSeatStay.add(tube);   
    leftSeatStay.rotation.z = -(90 * Math.PI/180 + chainStayArad - Math.asin((Math.sin((90 - seatTubeA) * Math.PI/180 - chainStayArad) / seatStayL) * seatTubeVirtualL));
    leftSeatStay.position.z = -seatStayOpL / 2;
    leftSeatStay.position.y = seatStayTopY;
    leftSeatStay.position.x = seatStayTopX;
	bikeFrame.add( leftSeatStay );
	
	return bikeFrame;
}

function getSpoke(spokeR, wheelDiam) {
    return getWhiteFrameMesh(new THREE.CylinderGeometry( spokeR, spokeR, wheelDiam / 2, 16, 3, false));
}
  
function getRim(radius, width, depth) {
    var pathPoints = [];
    for ( var i = 0; i < 10; i ++ ) {
	var a = (360 / 10) * i * (Math.PI / 180);
	pathPoints.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    var rimCurve = new THREE.ClosedSplineCurve3(pathPoints);
    var extrudeSettings = { amount: 200,  bevelEnabled: true, bevelSegments: 2, steps: 150 }; // bevelSegments: 2, steps: 2 , bevelSegments: 5, bevelSize: 8, bevelThickness:5,
    extrudeSettings.extrudePath = rimCurve;
    
    var brakeDepth = 10;
    var insideWidth = 5;
    var rimPoints = [];
    rimPoints.push( new THREE.Vector2 ( 0, 0 ) );
    rimPoints.push( new THREE.Vector2 ( width, 0 ) );
    rimPoints.push( new THREE.Vector2 ( width, brakeDepth ) );
    rimPoints.push( new THREE.Vector2 ( (width - insideWidth) / 2 + insideWidth, depth ) );
    rimPoints.push( new THREE.Vector2 ( (width - insideWidth) / 2, depth  ) );
    rimPoints.push( new THREE.Vector2 ( 0, brakeDepth ) );
    var rimShape = new THREE.Shape( rimPoints );
    var rim3D = rimShape.extrude( extrudeSettings );
    return rim3D
}

function getRimTire() {
	var rimTire = new THREE.Object3D();
	var tire = new THREE.Mesh(
			new THREE.TorusGeometry(tireR, tireW/2, 16, 100, Math.PI * 2),
			new THREE.MeshLambertMaterial( { color : '#000000', shading : THREE.SmoothShading } ) );
    rimTire.add( tire );
    
    var rimTireJoin = 5;
    var insideTireR = tireR - tireW / 2 + rimTireJoin;
    //var rim = getWhiteFrameMesh(getRim(insideTireR, rimW, rimD));
	var rim = new THREE.Mesh(
			getRim(insideTireR, rimW, rimD),
			new THREE.MeshPhongMaterial( { color : 0x000000, shininess: 100, specular : 0xFFFFFF, shading : THREE.SmoothShading } ) );
    rim.position.z = rimW / 2;
    rimTire.add( rim );
	
	return rimTire;
}

function getRearWheel() {
	var rearWheel = new THREE.Object3D();
    
    var rearAxel = getWhiteFrameMesh(new THREE.CylinderGeometry( rearAxelR, rearAxelR, rearAxelL, 16, 3, false));
    rearAxel.rotation.x = 90 * Math.PI / 180;
    rearWheel.add(rearAxel);
	
    var rearHub = new THREE.Object3D();
    var rearHubCyl = getWhiteFrameMesh(new THREE.CylinderGeometry( rearHubR, rearHubR, rearHubD, 16, 3, false));
    rearHubCyl.rotation.x = 90 * Math.PI / 180;
    rearHub.add(rearHubCyl);
    
	var leftHubSphere = getWhiteFrameMesh(new THREE.SphereGeometry(rearHubR - 1, 32, 32));
    leftHubSphere.position.z = -(rearHubD) / 2;
    var rearHubZOffset = rearAxelL / 2 - (rearHubD) / 2 - rearHubR - chainStayBotR - 2;
    rearHub.position.z = -rearHubZOffset;
    rearHub.add(leftHubSphere);
    
    var leftRearHubFlang = getWhiteFrameMesh(new THREE.CylinderGeometry( rearHubFlangR, rearHubFlangR, rearHubFlangL, 16, 3, false));
    leftRearHubFlang.rotation.x = 90 * Math.PI / 180;
    leftRearHubFlang.position.z = -(rearHubD) / 2;
    rearHub.add(leftRearHubFlang);
    
	var rightRearHubFlang = getWhiteFrameMesh(new THREE.CylinderGeometry( rearHubFlangR, rearHubFlangR, rearHubFlangL, 16, 3, false));
    rightRearHubFlang.rotation.x = 90 * Math.PI / 180;
    rightRearHubFlang.position.z = (rearHubD) / 2;
    rearHub.add(rightRearHubFlang);    
	
    rearWheel.add(rearHub);
	
    rearWheel.add( getRimTire() );
    
    var spokeHubOffset = (rearHubFlangR - rearHubR) / 2 + rearHubR;
	var numSpokeHoleOffset = 2;
	var initHubA = (2 * Math.PI / numRearSpokes) * numSpokeHoleOffset;
	var hubx = Math.cos(initHubA) * spokeHubOffset;
	var huby = Math.sin(initHubA) * spokeHubOffset;
	var rimx = insideTireR - rimD;
	//We add 5 degree to rearSpokeCrossA so that the spokes line up properly on the rim (cheap hack)
	var rearSpokeCrossA = (2 * Math.PI / numRearSpokes) * numSpokeHoleOffset + 5 * Math.PI / 180;
	
    for (var i = 0; i < numRearSpokes * 2; i++) {
	var hubz = i >= numRearSpokes ? -(rearHubD / 2 + rearHubZOffset) / 2 : (rearHubD / 2 - rearHubZOffset) / 2;
	var spokeL = Math.sqrt(Math.pow(rimx - hubx, 2) + Math.pow(0 - huby, 2) + Math.pow(0 - hubz, 0));
	
	tube = getWhiteFrameMesh(new THREE.CylinderGeometry( spokeR, spokeR, spokeL, 16, 3, false));
	tube.position.y = spokeL / 2;	
	tube.rotation.x = i >= numRearSpokes ? Math.asin((rearHubD / 2 + rearHubZOffset) / spokeL) : -Math.asin((rearHubD / 2 - rearHubZOffset) / spokeL);
	
	var spoke = new THREE.Object3D();
	spoke.add( tube );
	var spokeA = (2 * Math.PI / numRearSpokes) * i;
	spokeA = i >= numRearSpokes ? spokeA + (2 * Math.PI / (numRearSpokes * 2)) : spokeA;
	spoke.rotation.z = spokeA - 90 * Math.PI / 180;
	spoke.position.z = i >= numRearSpokes ? -(rearHubD / 2 + rearHubZOffset) / 2 : (rearHubD / 2 - rearHubZOffset) / 2;
	spoke.position.y = Math.sin(spokeA) * spokeHubOffset;
	spoke.position.x = Math.cos(spokeA) * spokeHubOffset;
	spoke.rotation.z = i % 2 == 0 ? spoke.rotation.z - rearSpokeCrossA : spoke.rotation.z + rearSpokeCrossA;
	rearWheel.add( spoke );
    }
	
	return rearWheel;
}

function getFrontWheel(leftFork) {
	var frontWheel = new THREE.Object3D();
    
    var frontAxel = getWhiteFrameMesh(new THREE.CylinderGeometry( frontAxelR, frontAxelR, frontAxelL, 16, 3, false));
    frontAxel.rotation.x = 90 * Math.PI / 180;
    frontWheel.add(frontAxel);
    //var frontHub = getWhiteFrameMesh(new THREE.CylinderGeometry( frontHubR, frontHubR, frontHubL, 16, 3, false));
    //frontHub.rotation.x = 90 * Math.PI / 180;
	var points = [];
	var r = 268	//radius of the circle used to create the curve in the hub
	for ( var i = 0; i < frontHubL; i += 4 ) {
		points.push( new THREE.Vector3(frontHubR - (Math.sqrt(Math.pow(r, 2) - Math.pow(i - frontHubL / 2, 2)) - r), 0, i - frontHubL / 2 ));
	}
		
	frontHub = getWhiteFrameMesh( new THREE.LatheGeometry( points, 20 ));	
    frontWheel.add(frontHub);
    var leftFrontHubSpokeRing = getWhiteFrameMesh(new THREE.CylinderGeometry( frontHubFlangR, frontHubFlangR, frontHubFlangL, 16, 3, false));
    leftFrontHubSpokeRing.rotation.x = 90 * Math.PI / 180;
    leftFrontHubSpokeRing.position.z = -frontHubCentreToFlang;
    frontWheel.add(leftFrontHubSpokeRing);
    var rightFrontHubSpokeRing = getWhiteFrameMesh(new THREE.CylinderGeometry( frontHubFlangR, frontHubFlangR, frontHubFlangL, 16, 3, false));
    rightFrontHubSpokeRing.rotation.x = 90 * Math.PI / 180;
    rightFrontHubSpokeRing.position.z = frontHubCentreToFlang;
    frontWheel.add(rightFrontHubSpokeRing);    

	frontWheel.add( getRimTire() );
    	
    var spokeHubOffset = (frontHubFlangR - frontHubR) / 2 + frontHubR;
    var spokeL = Math.sqrt(Math.pow( frontHubCentreToFlang, 2) + Math.pow(insideTireR - rimD - spokeHubOffset, 2));
    for (var i = 0; i < numFrontSpokes * 2; i++) {
	var spokeA = (2 * Math.PI / numFrontSpokes) * i;
	spokeA = i >= numFrontSpokes ? spokeA + (2 * Math.PI / (numFrontSpokes * 2)) : spokeA;
	tube = getWhiteFrameMesh(new THREE.CylinderGeometry( spokeR, spokeR, spokeL, 16, 3, false));
	tube.position.y = spokeL / 2;
	var xRot = Math.asin(frontHubCentreToFlang / spokeL);
	tube.rotation.x = i >= numFrontSpokes ? xRot : -xRot;
	
	var spoke = new THREE.Object3D();
	spoke.add( tube );
	spoke.rotation.z = spokeA - 90 * Math.PI / 180;
	spoke.position.z = i >= numFrontSpokes ? -frontHubCentreToFlang / 2 : frontHubCentreToFlang / 2;
	spoke.position.y = Math.sin(spokeA) * spokeHubOffset;
	spoke.position.x = Math.cos(spokeA) * spokeHubOffset;
	frontWheel.add( spoke );
    }
    
	return frontWheel;
}

/**
 * function for debugging/testing
 */
function makeSphere(vec) {
	sphere = getWhiteFrameMesh(new THREE.SphereGeometry(10, 32, 32));
	sphere.position.x = vec.x;
	sphere.position.y = vec.y;
	sphere.position.z = vec.z;
	scene.add( sphere );
}

function getHandleBar() {
	var handleBar = new THREE.Object3D();
	
	var topL = 140;
	var topBendL = 30;
	var topForwardStart = 25;
	var topForwardSlopeL = 32
	var topForwardSlopeDrop = 15;
	var topForwardBendDrop = 30;
	var bottomDropCurve = 30
	var bottomCurveEnd = -10
	var dropEnd = -20;
	var reach = 77;
	var drop = 123;
	var leftHandleBarCurvePoints = [
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(0, 0, topL),
		new THREE.Vector3(topForwardStart, 0, topL + topBendL),
		new THREE.Vector3(topForwardStart + topForwardSlopeL, -topForwardSlopeDrop, topL + topBendL),
		new THREE.Vector3(reach, -topForwardSlopeDrop - topForwardBendDrop, topL + topBendL),
		new THREE.Vector3(topForwardStart + topForwardSlopeL, -drop + bottomDropCurve, topL + topBendL),
		new THREE.Vector3(25, -drop +10, topL + topBendL),
		new THREE.Vector3(bottomCurveEnd, -drop -2, topL + topBendL),
		new THREE.Vector3(bottomCurveEnd + dropEnd, -drop -5, topL + topBendL),
		new THREE.Vector3(bottomCurveEnd + dropEnd -20, -drop-5, topL + topBendL),
	];
	var leftHandleBarCurve = new THREE.SplineCurve3(leftHandleBarCurvePoints);
	
	/*
	makeSphere(new THREE.Vector3(0, 0, 0));
	makeSphere(new THREE.Vector3(0, 0, topL));
	makeSphere(new THREE.Vector3(topForwardStart, 0, topL + topBendL));
	makeSphere(new THREE.Vector3(topForwardStart + topForwardSlopeL, -topForwardSlopeDrop, topL + topBendL));
	makeSphere(new THREE.Vector3(reach, -topForwardSlopeDrop - topForwardBendDrop, topL + topBendL));
	makeSphere(new THREE.Vector3(topForwardStart + topForwardSlopeL, -drop + bottomDropCurve, topL + topBendL));
	makeSphere(new THREE.Vector3(25, -drop +10, topL + topBendL));
	makeSphere(new THREE.Vector3(bottomCurveEnd, -drop, topL + topBendL));
	makeSphere(new THREE.Vector3(bottomCurveEnd + dropEnd, -drop -5, topL + topBendL));	
	makeSphere(new THREE.Vector3(bottomCurveEnd + dropEnd -20, -drop -5, topL + topBendL));
	*/
	
	
	
	var extrudeSettings = { amount: 200,  bevelEnabled: true, bevelSegments: 2, steps: 150 };
	extrudeSettings.extrudePath = leftHandleBarCurve
	var leftHandleBar = getWhiteFrameMesh(new THREE.TubeGeometry(extrudeSettings.extrudePath, 150, handleBarR, 20, false, true));
	handleBar.add( leftHandleBar );
	
	var leftCap = getWhiteFrameMesh(new THREE.CylinderGeometry( handleBarR, handleBarR, 2, 32, 3, false));
	leftCap.rotation.z = 90 * Math.PI / 180;
	leftCap.position.x = leftHandleBarCurvePoints[leftHandleBarCurvePoints.length - 1].x;
	leftCap.position.y = leftHandleBarCurvePoints[leftHandleBarCurvePoints.length - 1].y;
	leftCap.position.z = leftHandleBarCurvePoints[leftHandleBarCurvePoints.length - 1].z;
	handleBar.add( leftCap );
	
	var rightHandleBarCurvePoints = [
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(0, 0, -topL),
		new THREE.Vector3(topForwardStart, 0, -(topL + topBendL)),
		new THREE.Vector3(topForwardStart + topForwardSlopeL, -topForwardSlopeDrop, -(topL + topBendL)),
		new THREE.Vector3(reach, -topForwardSlopeDrop - topForwardBendDrop, -(topL + topBendL)),
		new THREE.Vector3(topForwardStart + topForwardSlopeL, -drop + bottomDropCurve, -(topL + topBendL)),
		new THREE.Vector3(25, -drop +10, -(topL + topBendL)),
		new THREE.Vector3(bottomCurveEnd, -drop -2, -(topL + topBendL)),
		new THREE.Vector3(bottomCurveEnd + dropEnd, -drop -5, -(topL + topBendL)),
		new THREE.Vector3(bottomCurveEnd + dropEnd -20, -drop-5, -(topL + topBendL)),
	];
	var rightHandleBarCurve = new THREE.SplineCurve3(rightHandleBarCurvePoints);
	
	extrudeSettings.extrudePath = rightHandleBarCurve
	var rightHandleBar = getWhiteFrameMesh(new THREE.TubeGeometry(extrudeSettings.extrudePath, 150, handleBarR, 20, false, true));
	handleBar.add( rightHandleBar );
	
	var rightCap = getWhiteFrameMesh(new THREE.CylinderGeometry( handleBarR, handleBarR, 2, 32, 3, false));
	rightCap.rotation.z = 90 * Math.PI / 180;
	rightCap.position.x = rightHandleBarCurvePoints[rightHandleBarCurvePoints.length - 1].x;
	rightCap.position.y = rightHandleBarCurvePoints[rightHandleBarCurvePoints.length - 1].y;
	rightCap.position.z = rightHandleBarCurvePoints[rightHandleBarCurvePoints.length - 1].z;
	handleBar.add( rightCap );
	
	return handleBar;
}

function getFrontFork(headTubeHeight) {
	var frontFork = new THREE.Object3D();
	
	var headSetTube = getBlackFrameMesh(new THREE.CylinderGeometry( headSetR, headSetR, headSetL, 16, 3, false));
	frontFork.add( headSetTube );
	
	var steeringControls = new THREE.Object3D();
    var stemTube = getBlackFrameMesh(new THREE.CylinderGeometry( stemR, stemR, stemL, 16, 3, false));
	steeringControls.add( stemTube );
	
	var handleBar = getHandleBar();
	handleBar.position.y = -stemL / 2;
	handleBar.rotation.z = -90 * Math.PI / 180;
	steeringControls.add( handleBar );
	
	
    steeringControls.rotation.z = (90 - stemA) * Math.PI / 180;
    var stemHeightOffset = 10;
    var stemForwardOffset = 5;
    steeringControls.position.y = headSetL / 2 - stemHeightOffset - stemR;
    steeringControls.position.x = stemL / 2 + stemForwardOffset;	
    frontFork.add( steeringControls );
	
    //cone shape where top of fork enters head tube. Probable won't use it
    var forkTopL = 15;
    var forkTopBotR = headTubeR + 5;
    var forkTop = getWhiteFrameMesh(new THREE.CylinderGeometry( headTubeR, forkTopBotR, forkTopL, 16, 3, false));
    forkTop.position.y = -headSetL / 2 + forkTopL / 2;
    
    var headTubeToWheelBase = headTubeHeight - headTubeL/2 - (Math.cos(90 * Math.PI/180 - chainStayArad) * chainStayL);
    var forkL = Math.sqrt(Math.pow(headTubeToWheelBase, 2) + Math.pow(forkRake +  headTubeToWheelBase * Math.tan(headTubeA * Math.PI / 180), 2));
    var forkForwardA = Math.acos(headTubeToWheelBase / forkL) - headTubeA * Math.PI / 180;    
    var forkSepA = Math.asin((120/2 - (headTubeR - forkTopR / 2)) / forkL);
    
    var forkTubes = new THREE.Object3D();
    var tube = getWhiteFrameMesh(new THREE.CylinderGeometry( forkTopR / 2, forkBotR / 2, forkL, 16, 3, false));
    tube.position.y = -forkL / 2;
    tube.scale.x = 2;
    tube.position.z = - (headTubeR - forkTopR / 2);    
    var leftFork = new THREE.Object3D();
    leftFork.add(tube);
    leftFork.rotation.x = forkSepA;   
    forkTubes.add(leftFork);
    
    tube = getWhiteFrameMesh(new THREE.CylinderGeometry( forkTopR / 2, forkBotR / 2, forkL, 16, 3, false));	
    tube.position.y = -forkL / 2;
    tube.scale.x = 2;
    tube.position.z = headTubeR - forkTopR / 2;
    var rightFork = new THREE.Object3D();
    rightFork.add(tube);
    rightFork.rotation.x = -forkSepA;
    forkTubes.add(rightFork);
	
    forkTubes.rotation.z = forkForwardA;
    forkTubes.position.y =  - headSetL / 2;
	frontFork.add( forkTubes );
    
    /* Front Wheel */
	var frontWheel = getFrontWheel(leftFork);
	frontWheel.position.y = leftFork.position.y - forkL;    
	forkTubes.add( frontWheel );
        
	return frontFork;
}

function fillScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

    // LIGHTS
    scene.add( ambientLight );
    scene.add( light );
    scene.add( particleLight );

    Coordinates.drawAllAxes({axisLength:1000,axisRadius:5,axisTess:50});
    
	var bikeFrame = getBikeFrame();

	var rearWheel = getRearWheel();
	rearWheel.position.y = wheelDiam / 2 - bottomBracketH;
    rearWheel.position.x = -Math.sqrt(Math.pow(chainStayL, 2) - Math.pow( wheelDiam / 2 - bottomBracketH, 2));	
    
	bikeFrame.add( rearWheel );
    
    /* Fork */
    var frontFork = getFrontFork(bikeFrame.getChildByName("headTube", true).position.y);
	frontFork.rotation.z = bikeFrame.getChildByName("headTube", true).rotation.z;
    frontFork.position.y = bikeFrame.getChildByName("headTube", true).position.y + Math.cos(headTubeA * Math.PI/180) * ((headSetL - headTubeL) / 2);
    frontFork.position.x = bikeFrame.getChildByName("headTube", true).position.x - Math.sin(headTubeA * Math.PI/180) * ((headSetL - headTubeL) / 2);
	
    bikeFrame.add( frontFork );
	
    scene.add( bikeFrame );
}

function loader1() {
    init();
    animate();
}


