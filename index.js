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
        raycaster = new THREE.Raycaster(),  // Used to detect the click on our character
        loaderAnim = document.getElementById('js-model-loader');

    // Init fuction
    // Here we init all variables & components
    function init() {

        // -------------------
        // Some general things
        // -------------------

        // Path to our model
        const MODEL_PATH = 'https://d1a370nemizbjq.cloudfront.net/c9588aef-8f4a-465a-8b21-c40c8b7e689f.glb';

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
                model = gltf.scene.children[0];
                model.scale.set(7, 7, 7);
                
                model.position.y = -11;
                
                for (let i = 0; i <= 9; i++) {
                    model.children[i].material.metalness = 0;
                }

                scene.add(gltf.scene);
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
            color: 0x0E141B,
            shininess: 1,
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

})(); // Don't add anything below this line.