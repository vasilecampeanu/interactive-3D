// Maybe this should be asyncrom.
// TODO: Check a better way to encapsulate this, maybe use classes.
(function () {
    // Set our main variables
    let scene,
        renderer,
        camera,
        model,                              // Our character
        neck,                               // Reference to the neck bone in the skeleton
        waist,                              // Reference to the waist bone in the skeleton
        possibleAnims,                      // Animations found in our file
        mixer,                              // THREE.js animations mixer
        idle,                               // Idle, the default state our character returns to
        clock = new THREE.Clock(),          // Used for anims, which run to a clock instead of frame rate 
        currentlyAnimating = false,         // Used to check whether characters neck is being used in another anim
        raycaster = new THREE.Raycaster();  // Used to detect the click on our character

    // Init fuction
    // Here we init all variables & components
    function init() {

        // -------------------
        // Some general things
        // -------------------

        // Path to our model
        const MODEL_PATH = 'idle-animation.glb';

        // Canvas style
        const canvas = document.querySelector('#character-animation');
        const backgroundColor = 0x0E141B;

        // ------------------------
        // Let's init ThreeJS scene
        // ------------------------

        scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);

        // The fog will not be visible if the flor and the backround color are the same.
        // If they're not then will help to better blend it together.
        scene.fog = new THREE.Fog(backgroundColor, 60, 100);

        // -----------------
        // Init the renderer
        // -----------------

        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        
        // Enable shadow casting
        renderer.shadowMap.enabled = true;

        // Render correctly on mobile devices
        renderer.setPixelRatio(window.devicePixelRatio);
        
        document.body.appendChild(renderer.domElement);
        
        // ------------------------
        // Setup perspective camera
        // ------------------------

        camera = new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        camera.position.z =  30 
        camera.position.x =  0;
        camera.position.y = -3;

        // -------------------
        // Load model textures
        // -------------------
        // let stacy_txt = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy.jpg');

        // stacy_txt.flipY = false; // we flip the texture so that its the right way up
        
        // const stacy_mtl = new THREE.MeshPhongMaterial({
        //     map: stacy_txt,
        //     color: 0xffffff,
        //     skinning: true
        // });

        // --------------------
        // Load character model
        // --------------------
        
        var loader = new THREE.GLTFLoader();

        loader.load (
            MODEL_PATH,
            function(gltf) {
                let fileAnimations = gltf.animations;

                model = gltf.scene.children[0];
                // model.scale.set(7, 7, 7);
                gltf.scene.scale.set( 7, 7, 7);            
                gltf.scene.position.y = -11;            
                // model.position.y = -11;

                model.traverse(o => {
                    console.log(o.name);

                    // Reference the neck and spine bones
                    if (o.isBone && o.name === 'Neck') 
                    { 
                        neck = o;
                    }
                    
                    if (o.isBone && o.name === 'Spine') 
                    { 
                        waist = o;
                    }
                });
                
                for (let i = 0; i <= 9; i++) {
                    model.children[i].material.metalness = 0;
                }

                scene.add(gltf.scene);

                mixer = new THREE.AnimationMixer(model);
                
                let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
                console.log(idleAnim);

                idleAnim.tracks.splice(3, 3);
                idleAnim.tracks.splice(9, 3);

                idle = mixer.clipAction(idleAnim);
                idle.play();
            },
            undefined, // We don't need this function
            function(error) {
                console.error(error);
            }
        );

        // ----------
        // Add lights
        // ----------

        // Without lights our camera has nothing to display. 
        // We’re going to create two lights, a hemisphere light, and a directional light. 
        // We then add them to the scene using scene.add(light).

        // Hemisphere light
        // The hemisphere light is just casting white light, and its intensity is at 0.61.
        // We also set its position 50 units above our center point
        let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
        hemiLight.position.set(0, 50, 0);
        
        // Add hemisphere light to scene
        scene.add(hemiLight);

        // Directional light
        // This enable sto cast a shadow
        let d = 8.25;
        let dirLight = new THREE.DirectionalLight(0xffffff, 2.94);
        dirLight.position.set(-8, 12, 8);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 1500;
        dirLight.shadow.camera.left = d * -1;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = d * -1;

        // Add directional Light to scene
        scene.add(dirLight);

        // ----------------
        // Initialize floor
        // ----------------

        // Floor
        let floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
        let floorMaterial = new THREE.MeshBasicMaterial({
            color: 0x0E141B
        });

        let floor = new THREE.Mesh(floorGeometry, floorMaterial);

        floor.rotation.x = -0.5 * Math.PI; // This is 90 degrees by the way
        floor.receiveShadow = true;
        floor.position.y = -11;
        
        // Add the floors to scene
        scene.add(floor);

        // Add a sphere
        let geometry = new THREE.SphereGeometry(8, 32, 32);
        let material = new THREE.MeshBasicMaterial({ color: 0x4C6EF5 });
        let sphere = new THREE.Mesh(geometry, material);
        sphere.position.z = -15;
        sphere.position.y = -2.5;
        sphere.position.x = -0.25;
        scene.add(sphere);
    }
    
    init();

    // The update function is a crutial aspect of ThreeJS
    // Runs on every frame
    function update() {
        if (mixer) {
            mixer.update(clock.getDelta());
        }

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        requestAnimationFrame(update);
    }
    
    update();
    
    // The scene needs to be aware of resizes too so that it can keep everything in proportion.
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        let width = window.innerWidth;
        let height = window.innerHeight;
        let canvasPixelWidth = canvas.width / window.devicePixelRatio;
        let canvasPixelHeight = canvas.height / window.devicePixelRatio;
      
        const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;

        if (needResize) {
            renderer.setSize(width, height, false);
        }
        
        return needResize;
    }

    document.addEventListener('mousemove', function (e) {
        var mousecoords = getMousePos(e);
        if (neck && waist) {

            moveJoint(mousecoords, neck, 50);
            moveJoint(mousecoords, waist, 30);
        }
    });

    function getMousePos(e) {
        return { x: e.clientX, y: e.clientY };
    }

    function moveJoint(mouse, joint, degreeLimit) {
        let degrees = getMouseDegrees(mouse.x, mouse.y, degreeLimit);
        joint.rotation.y = THREE.Math.degToRad(degrees.x);
        joint.rotation.x = THREE.Math.degToRad(degrees.y);
    }

    function getMouseDegrees(x, y, degreeLimit) {
        let dx = 0,
        dy = 0,
        xdiff,
        xPercentage,
        ydiff,
        yPercentage;

        let w = { x: window.innerWidth, y: window.innerHeight };

        // Left (Rotates neck left between 0 and -degreeLimit)
        // 1. If cursor is in the left half of screen
        if (x <= w.x / 2) {
            // 2. Get the difference between middle of screen and cursor position
            xdiff = w.x / 2 - x;
            // 3. Find the percentage of that difference (percentage toward edge of screen)
            xPercentage = xdiff / (w.x / 2) * 100;
            // 4. Convert that to a percentage of the maximum rotation we allow for the neck
            dx = degreeLimit * xPercentage / 100 * -1;
        }

        // Right (Rotates neck right between 0 and degreeLimit)
        if (x >= w.x / 2) {
            xdiff = x - w.x / 2;
            xPercentage = xdiff / (w.x / 2) * 100;
            dx = degreeLimit * xPercentage / 100;
        }

        // Up (Rotates neck up between 0 and -degreeLimit)
        if (y <= w.y / 2) {
            ydiff = w.y / 2 - y;
            yPercentage = ydiff / (w.y / 2) * 100;
            // Note that I cut degreeLimit in half when she looks up
            dy = degreeLimit * 0.5 * yPercentage / 100 * -1;
        }
        
        // Down (Rotates neck down between 0 and degreeLimit)
        if (y >= w.y / 2) {
            ydiff = y - w.y / 2;
            yPercentage = ydiff / (w.y / 2) * 100;
            dy = degreeLimit * yPercentage / 100;
        }
        
        return { x: dx, y: dy };
    }
})(); // Don't add anything below this line.