import * as THREE from 'three';
import CoffeeSteam from './CoffeeSteam.js';
import RubiksCube from './RubiksCube.js';
import Whiteboard from './Whiteboard.js';
import VisionBoard from './VisionBoard.js';
import ArcadeScreen from './ArcadeScreen.js';
import ServerRig from './ServerRig.js';
import CyberParticles from './CyberParticles.js';
import RainEffect from './RainEffect.js';
import WeatherTimeSystem from './WeatherTimeSystem.js';
import SmartClock from './SmartClock.js';
import { TextureGenerator } from './TextureGenerator.js';

export default class Room {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;
    this.audioManager = experience.audioManager;

    this.group = new THREE.Group();
    this.interactiveObjects = [];

    // Pre-generate realistic 3D textures & normal maps
    this.woodFloorTexture = TextureGenerator.createWoodFloorTexture();
    this.woodFloorNormal = TextureGenerator.createWoodFloorNormalMap();
    this.woodFloorRoughness = TextureGenerator.createWoodFloorRoughnessMap();

    this.furnitureWoodTexture = TextureGenerator.createFurnitureWoodTexture(false);
    this.walnutWoodTexture = TextureGenerator.createFurnitureWoodTexture(true);
    this.woodNormal = TextureGenerator.createWoodNormalMap();

    this.rugTexture = TextureGenerator.createWovenRugTexture();
    this.fabricNormal = TextureGenerator.createFabricNormalMap();
    this.wallNormal = TextureGenerator.createWallPlasterNormalMap();

    this.windowTexture = TextureGenerator.createWindowViewTexture();
    this.wallArtTexture = TextureGenerator.createWallArtTexture();

    this.initLights();
    this.buildRoomStructure();
    this.buildAcousticWoodSlats();
    this.buildDeskSetup();
    this.buildChair();
    this.buildRubikSideTable();
    this.buildServerRig();
    this.buildBookshelfAndTrophies();
    this.buildArcadeCabinet();
    this.buildDecorations();

    // 3D Smart Wall Clock & E-Ink Desktop Calendar
    this.smartClock = new SmartClock(this.experience);
    this.interactiveObjects.push(this.smartClock.clockGroup, this.smartClock.deskCalendarGroup);

    // Dynamic 3D Rain Effect outside the window
    this.rainEffect = new RainEffect(this.scene);

    // Dynamic Real-time Weather, Sun & Day/Night System
    this.weatherTimeSystem = new WeatherTimeSystem(this);

    // Floating Golden Sun Dust Motes in the window sunbeam
    this.dustMotes = new CyberParticles(this.scene, 120);

    this.scene.add(this.group);
  }

  initLights() {
    // 1. Natural Environmental Sky & Ground Hemispherical Light
    this.hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x475569, 1.35);
    this.scene.add(this.hemiLight);

    // 2. Primary Golden Sunlight streaming through the window
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.7);
    this.sunLight.position.set(6.5, 9.5, 2.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 28;
    this.sunLight.shadow.camera.left = -6.5;
    this.sunLight.shadow.camera.right = 6.5;
    this.sunLight.shadow.camera.top = 6.5;
    this.sunLight.shadow.camera.bottom = -6.5;
    this.sunLight.shadow.bias = -0.00015;
    this.sunLight.shadow.normalBias = 0.02; // Prevents shadow acne on 3D surfaces
    this.sunLight.shadow.radius = 2.0;
    this.scene.add(this.sunLight);

    // 3. Sky Blue Window Fill (Atmospheric outdoor light)
    this.skyFill = new THREE.DirectionalLight(0xbae6fd, 0.9);
    this.skyFill.position.set(4.0, 5.0, -3.0);
    this.scene.add(this.skyFill);

    // 4. Soft Warm Interior Bounce
    this.warmBounce = new THREE.DirectionalLight(0xfde68a, 0.55);
    this.warmBounce.position.set(-4, 3, 4);
    this.scene.add(this.warmBounce);

    // 5. Desk Lightbar / Monitor Downward Task Light (Warm LED)
    this.deskTaskLight = new THREE.PointLight(0xffedd5, 1.8, 3.5, 2);
    this.deskTaskLight.position.set(0, 1.85, -0.6);
    this.scene.add(this.deskTaskLight);

    // 6. Cozy Table Lamp on Side Table
    this.tableLampLight = new THREE.PointLight(0xfef08a, 1.6, 3.8, 2);
    this.tableLampLight.position.set(1.65, 1.35, 0.75);
    this.scene.add(this.tableLampLight);

    // 7. Subtle Monitor Screen Ambilight
    this.monitorGlow = new THREE.PointLight(0xe0f2fe, 0.9, 2.8, 2);
    this.monitorGlow.position.set(0, 1.45, -0.65);
    this.scene.add(this.monitorGlow);
  }

  buildRoomStructure() {
    // --- REALISTIC OAK HARDWOOD FLOOR WITH 3D NORMAL & ROUGHNESS MAPS ---
    const floorGeo = new THREE.BoxGeometry(7.4, 0.2, 7.4);
    const floorMat = new THREE.MeshStandardMaterial({
      map: this.woodFloorTexture,
      normalMap: this.woodFloorNormal,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughnessMap: this.woodFloorRoughness,
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    // --- REALISTIC MATTE PAINTED WALLS WITH PLASTER NORMAL MAP ---
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xeeece6,
      normalMap: this.wallNormal,
      normalScale: new THREE.Vector2(0.2, 0.2),
      roughness: 0.88,
      metalness: 0.02
    });

    const backWallGeo = new THREE.BoxGeometry(7.4, 4.6, 0.2);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 2.2, -3.5);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    const leftWallGeo = new THREE.BoxGeometry(0.2, 4.6, 7.4);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-3.5, 2.2, 0);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    // --- REALISTIC WHITE BASEBOARDS (SKIRTING BOARDS) ---
    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.4,
      metalness: 0.05
    });

    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(7.36, 0.14, 0.03), baseboardMat);
    bbBack.position.set(0, 0.07, -3.385);
    this.group.add(bbBack);

    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 7.36), baseboardMat);
    bbLeft.position.set(-3.385, 0.07, 0);
    this.group.add(bbLeft);

    // --- CEILING CROWN MOLDING ---
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
    const crownBack = new THREE.Mesh(new THREE.BoxGeometry(7.36, 0.08, 0.05), crownMat);
    crownBack.position.set(0, 4.46, -3.38);
    this.group.add(crownBack);

    const crownLeft = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 7.36), crownMat);
    crownLeft.position.set(-3.38, 4.46, 0);
    this.group.add(crownLeft);

    // --- REALISTIC WINDOW ---
    this.buildWindow();

    // --- COZY NORDIC WOVEN AREA RUG WITH FABRIC NORMAL MAP ---
    const rugGeo = new THREE.BoxGeometry(3.6, 0.015, 2.8);
    const rugMat = new THREE.MeshStandardMaterial({
      map: this.rugTexture,
      normalMap: this.fabricNormal,
      normalScale: new THREE.Vector2(0.4, 0.4),
      roughness: 0.95,
      metalness: 0.0
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.position.set(0, 0.01, 0.1);
    rug.receiveShadow = true;
    this.group.add(rug);
  }

  buildAcousticWoodSlats() {
    // Real-Life Trendy Scandinavian Vertical Oak Slat Wall Accent Panel (Lower desk accent)
    const slatGroup = new THREE.Group();
    slatGroup.position.set(-0.6, 1.25, -3.38);

    // Dark Charcoal Acoustic Felt Backing (Lower section behind desk)
    const feltBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.6, 0.015),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 })
    );
    slatGroup.add(feltBack);

    // Individual 3D Natural Oak Wood Slats
    const oakSlatMat = new THREE.MeshStandardMaterial({
      map: this.furnitureWoodTexture,
      roughness: 0.45,
      metalness: 0.05
    });

    const slatCount = 18;
    const slatWidth = 0.045;
    const slatSpacing = 0.088;
    const startX = -((slatCount - 1) * slatSpacing) / 2;

    for (let i = 0; i < slatCount; i++) {
      const slatGeo = new THREE.BoxGeometry(slatWidth, 1.58, 0.018);
      const slat = new THREE.Mesh(slatGeo, oakSlatMat);
      slat.position.set(startX + i * slatSpacing, 0, 0.012);
      slat.castShadow = true;
      slat.receiveShadow = true;
      slatGroup.add(slat);
    }

    this.group.add(slatGroup);
  }

  buildWindow() {
    const windowGroup = new THREE.Group();
    windowGroup.position.set(2.15, 2.4, -3.37);

    // Scenic Outdoor Sky & City View (Bright Daylight Backdrop)
    this.windowViewMat = new THREE.MeshBasicMaterial({
      map: this.windowTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const viewMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), this.windowViewMat);
    viewMesh.position.set(0, 0, 0.008);
    windowGroup.add(viewMesh);

    // Outer Window Frame (4 Perimeter Bars: Top, Bottom, Left, Right)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3, metalness: 0.4 });
    
    // Top & Bottom bars
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), frameMat);
    topBar.position.set(0, 1.16, 0.04);
    windowGroup.add(topBar);

    const btmBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), frameMat);
    btmBar.position.set(0, -1.16, 0.04);
    windowGroup.add(btmBar);

    // Left & Right bars
    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), frameMat);
    leftBar.position.set(-1.16, 0, 0.04);
    windowGroup.add(leftBar);

    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), frameMat);
    rightBar.position.set(1.16, 0, 0.04);
    windowGroup.add(rightBar);

    // Wooden Windowsill Shelf at bottom
    const sillMat = new THREE.MeshStandardMaterial({
      map: this.furnitureWoodTexture,
      roughness: 0.4
    });
    const sill = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.06, 0.22), sillMat);
    sill.position.set(0, -1.2, 0.08);
    sill.castShadow = true;
    windowGroup.add(sill);

    // Small Potted Succulent on Windowsill
    const sillPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.035, 0.065, 16),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.3 })
    );
    sillPot.position.set(0.7, -1.13, 0.08);
    windowGroup.add(sillPot);

    const sillPlant = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.042, 1),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 })
    );
    sillPlant.position.set(0.7, -1.07, 0.08);
    windowGroup.add(sillPlant);

    // Realistic Window Mullions (Central Grids)
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.3, 0.05), frameMat);
    vBar.position.set(0, 0, 0.03);
    windowGroup.add(vBar);

    const hBar = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.035, 0.05), frameMat);
    hBar.position.set(0, 0, 0.03);
    windowGroup.add(hBar);

    // Curtain Rod & Warm Brass Finials
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.7, 16), rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 1.28, 0.14);
    windowGroup.add(rod);

    // Brass Finials on Rod Ends
    const finialMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
    [-1.36, 1.36].forEach(fx => {
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 16), finialMat);
      finial.position.set(fx, 1.28, 0.14);
      windowGroup.add(finial);
    });

    // 1. Translucent Airy Sheer Curtains ("Transy" Linen Curtains)
    const sheerCurtainMat = new THREE.MeshStandardMaterial({
      color: 0xfcfbfa,
      roughness: 0.75,
      metalness: 0.02,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide
    });

    // Pleated wavy curtain drapes (Left & Right)
    const createCurtainPanel = (isLeft) => {
      const panelGroup = new THREE.Group();
      const baseSign = isLeft ? -1 : 1;
      
      // Main hanging sheer panel
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.45, 0.04), sheerCurtainMat);
      panel.position.set(baseSign * 1.08, -0.02, 0.11);
      panelGroup.add(panel);

      // Delicate vertical pleat ripples
      for (let p = 0; p < 4; p++) {
        const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 2.45, 12), sheerCurtainMat);
        pleat.position.set(baseSign * (0.92 + p * 0.1), -0.02, 0.125 + Math.sin(p * 1.6) * 0.01);
        panelGroup.add(pleat);
      }

      // Elegant Brass Tie-Back Ring
      const tieRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 8, 24), finialMat);
      tieRing.rotation.y = Math.PI / 2;
      tieRing.position.set(baseSign * 1.16, -0.2, 0.12);
      panelGroup.add(tieRing);

      return panelGroup;
    };

    windowGroup.add(createCurtainPanel(true));
    windowGroup.add(createCurtainPanel(false));

    // Top Header Valance Sheer Drape
    const valance = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.18, 0.03), sheerCurtainMat);
    valance.position.set(0, 1.22, 0.12);
    windowGroup.add(valance);

    // 2. Magical Fairy Lights String (Glows ONLY in Night / Evening)
    this.fairyLightsGroup = new THREE.Group();
    
    this.fairyLightBulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffb703,
      emissiveIntensity: 0.0, // Default 0.0 for daytime, activated in night mode
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95
    });

    // Wire cable along rod
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 2.6, 12), wireMat);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(0, 1.26, 0.15);
    this.fairyLightsGroup.add(wire);

    // Hanging micro-bulbs with gentle catenary drape
    const bulbCount = 16;
    const bulbGeo = new THREE.SphereGeometry(0.018, 12, 12);

    for (let i = 0; i < bulbCount; i++) {
      const bx = -1.2 + i * (2.4 / (bulbCount - 1));
      const sag = Math.sin((i / (bulbCount - 1)) * Math.PI) * 0.08;
      const bulb = new THREE.Mesh(bulbGeo, this.fairyLightBulbMat);
      bulb.position.set(bx, 1.25 - sag, 0.16);
      this.fairyLightsGroup.add(bulb);
    }

    // Warm ambient point light for fairy lights
    this.fairyPointLight = new THREE.PointLight(0xffb703, 0.0, 3.2, 2);
    this.fairyPointLight.position.set(0, 1.25, 0.22);
    this.fairyLightsGroup.add(this.fairyPointLight);

    windowGroup.add(this.fairyLightsGroup);

    this.group.add(windowGroup);
  }

  buildDeskSetup() {
    this.deskGroup = new THREE.Group();
    this.deskGroup.position.set(0, 0, -0.8);

    // Solid European Natural Oak Tabletop (Warm realistic wood)
    const topGeo = new THREE.BoxGeometry(3.3, 0.075, 1.4);
    const topMat = new THREE.MeshStandardMaterial({
      map: this.furnitureWoodTexture,
      roughness: 0.35,
      metalness: 0.05
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.96;
    top.castShadow = true;
    top.receiveShadow = true;
    this.deskGroup.add(top);

    // Black Cable Grommet on rear-center of desk
    const grommet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
    );
    grommet.position.set(0, 0.965, -0.55);
    this.deskGroup.add(grommet);

    // Dual-Motor Standing Desk Matte Black Steel Frame & T-Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.8 });

    // Under-desk Crossbar
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.05, 0.08), legMat);
    crossbar.position.set(0, 0.9, -0.1);
    crossbar.castShadow = true;
    this.deskGroup.add(crossbar);

    [-1.38, 1.38].forEach(lx => {
      // Telescopic lifting columns
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.09), legMat);
      column.position.set(lx, 0.46, -0.1);
      column.castShadow = true;
      this.deskGroup.add(column);

      // Floor T-feet with leveler pads
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 1.05), legMat);
      foot.position.set(lx, 0.02, -0.1);
      foot.castShadow = true;
      this.deskGroup.add(foot);

      // Top bracket under tabletop
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.85), legMat);
      bracket.position.set(lx, 0.91, -0.1);
      this.deskGroup.add(bracket);
    });

    // Premium Charcoal Felt / Saddle Leather Desk Mat
    const matGeo = new THREE.BoxGeometry(2.3, 0.008, 0.8);
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.75,
      metalness: 0.05
    });
    const deskMatMesh = new THREE.Mesh(matGeo, matMaterial);
    deskMatMesh.position.set(0, 1.002, 0.08);
    deskMatMesh.receiveShadow = true;
    this.deskGroup.add(deskMatMesh);

    // Dual 4K IPS Ultra-Thin Bezel Displays on Gas-Spring Mount
    this.buildDualMonitors();

    // Custom 75% Mechanical Keyboard with Wooden Wrist Rest
    this.buildMechanicalKeyboard();

    // Ergonomic Wireless Precision Mouse (Logitech MX Master style)
    this.buildErgonomicMouse();

    // Bookshelf Studio Monitor Speakers on isolation foam
    this.buildStudioSpeakers();

    // Steaming Coffee Ceramic Mug on Cork Coaster
    const coasterMat = new THREE.MeshStandardMaterial({ color: 0xa87948, roughness: 0.9 });
    const coaster = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.008, 24), coasterMat);
    coaster.position.set(1.05, 1.005, -0.1);
    this.deskGroup.add(coaster);

    const cupGeo = new THREE.CylinderGeometry(0.048, 0.04, 0.09, 24);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(1.05, 1.05, -0.1);
    cup.castShadow = true;
    this.deskGroup.add(cup);

    // Coffee Liquid surface inside cup
    const coffeeLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.01, 20),
      new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.1 })
    );
    coffeeLiquid.position.set(1.05, 1.085, -0.1);
    this.deskGroup.add(coffeeLiquid);

    // Animated Coffee Steam Shader
    this.coffeeSteam = new CoffeeSteam(new THREE.Vector3(1.05, 1.1, -0.9));
    this.scene.add(this.coffeeSteam.mesh);

    // Potted Desk Monstera / Succulent Plant
    const potGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.11, 20);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(-1.28, 1.05, 0.35);
    pot.castShadow = true;
    this.deskGroup.add(pot);

    const plantLeavesGeo = new THREE.DodecahedronGeometry(0.09, 1);
    const plantLeavesMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.45
    });
    const plantLeaves = new THREE.Mesh(plantLeavesGeo, plantLeavesMat);
    plantLeaves.position.set(-1.28, 1.15, 0.35);
    this.deskGroup.add(plantLeaves);

    // Brass Pen Cup with Pens & Notebook
    const penCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.09, 20),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
    );
    penCup.position.set(1.22, 1.045, 0.25);
    this.deskGroup.add(penCup);

    // Pens inside cup
    const penColors = [0x2563eb, 0xdc2626, 0x18181b];
    penColors.forEach((col, pIdx) => {
      const pen = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.12, 10),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 })
      );
      pen.rotation.z = (pIdx - 1) * 0.15;
      pen.position.set(1.22 + (pIdx - 1) * 0.015, 1.09, 0.25);
      this.deskGroup.add(pen);
    });

    // Moleskine Notebook
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.02, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    book.position.set(1.2, 1.01, 0.0);
    book.rotation.y = -0.2;
    this.deskGroup.add(book);

    this.group.add(this.deskGroup);
  }

  buildStudioSpeakers() {
    // Pair of Realistic Bookshelf Studio Monitor Speakers (e.g. Yamaha / Audioengine)
    const speakerMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    const woodSideMat = new THREE.MeshStandardMaterial({
      map: this.furnitureWoodTexture,
      roughness: 0.35
    });

    [-1.32, 1.32].forEach((sx, idx) => {
      const spGroup = new THREE.Group();
      spGroup.position.set(sx, 1.14, -0.28);
      spGroup.rotation.y = idx === 0 ? 0.3 : -0.3; // Angled towards user ears

      // Angled Foam Isolation Wedge
      const wedge = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.03, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 })
      );
      wedge.position.y = -0.13;
      spGroup.add(wedge);

      // Main Cabinet Body
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.22), speakerMat);
      cab.castShadow = true;
      spGroup.add(cab);

      // Wood Veneer Side Cheeks
      const leftCheek = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.22), woodSideMat);
      leftCheek.position.x = -0.095;
      spGroup.add(leftCheek);

      const rightCheek = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.22), woodSideMat);
      rightCheek.position.x = 0.095;
      spGroup.add(rightCheek);

      // White Woofer Cone
      const woofer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.045, 0.01, 20),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
      );
      woofer.rotation.x = Math.PI / 2;
      woofer.position.set(0, -0.04, 0.112);
      spGroup.add(woofer);

      // Black Tweeter
      const tweeter = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.8 })
      );
      tweeter.position.set(0, 0.07, 0.112);
      spGroup.add(tweeter);

      this.deskGroup.add(spGroup);
    });
  }

  buildMechanicalKeyboard() {
    const kbGroup = new THREE.Group();
    kbGroup.position.set(0, 1.015, 0.18);

    // Matte Black / Charcoal Aluminum Case
    const kbCase = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.025, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.6 })
    );
    kbCase.position.y = 0.012;
    kbCase.castShadow = true;
    kbGroup.add(kbCase);

    // Two-Tone Retro Keycaps (Cream & Slate Gray)
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
    const slateMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }); // Sky blue enter/esc

    // Keycap block
    const keysMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.015, 0.21),
      creamMat
    );
    keysMesh.position.set(0, 0.028, 0);
    kbGroup.add(keysMesh);

    // Individual Accent Enter/Esc keys
    const escKey = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.035), accentMat);
    escKey.position.set(-0.31, 0.03, -0.08);
    kbGroup.add(escKey);

    const enterKey = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.018, 0.035), accentMat);
    enterKey.position.set(0.28, 0.03, 0.01);
    kbGroup.add(enterKey);

    // Solid Walnut Wooden Wrist Rest in front of keyboard
    const restMat = new THREE.MeshStandardMaterial({
      map: this.walnutWoodTexture,
      roughness: 0.4
    });
    const wristRest = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.018, 0.09), restMat);
    wristRest.position.set(0, 0.009, 0.17);
    wristRest.castShadow = true;
    kbGroup.add(wristRest);

    // Coiled Aviator Cable running from keyboard back
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const cableStraight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.18, 12),
      cableMat
    );
    cableStraight.rotation.x = Math.PI / 2;
    cableStraight.position.set(0, 0.01, -0.2);
    kbGroup.add(cableStraight);

    this.deskGroup.add(kbGroup);
  }

  buildErgonomicMouse() {
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(0.62, 1.012, 0.18);

    // Sculpted Ergonomic Mouse (Matte Black Graphite with Thumb Rest)
    const mouseBodyGeo = new THREE.BoxGeometry(0.1, 0.038, 0.15);
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.35, metalness: 0.3 });
    const mouseBody = new THREE.Mesh(mouseBodyGeo, mouseMat);
    mouseBody.position.y = 0.018;
    mouseBody.castShadow = true;
    mouseGroup.add(mouseBody);

    // Metal MagSpeed Scroll Wheel
    const wheelGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.015, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.1 });
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.038, -0.03);
    mouseGroup.add(wheel);

    this.deskGroup.add(mouseGroup);
  }

  buildDualMonitors() {
    // Articulated Dual Heavy-Duty Gas-Spring Monitor Arm Mount
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.85 });

    // Desk Clamp Base
    const clampBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), mountMat);
    clampBase.position.set(0, 0.99, -0.58);
    this.deskGroup.add(clampBase);

    // Central Heavy Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 20), mountMat);
    pole.position.set(0, 1.25, -0.58);
    pole.castShadow = true;
    this.deskGroup.add(pole);

    // Articulated Left & Right Extension Arms
    [-0.35, 0.35].forEach((ax, i) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.04), mountMat);
      arm.position.set(ax, 1.35, -0.5);
      arm.rotation.y = i === 0 ? 0.3 : -0.3;
      this.deskGroup.add(arm);
    });

    const monitorBezelGeo = new THREE.BoxGeometry(1.22, 0.74, 0.035);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.7 });

    // --- LEFT MONITOR (Shipped AI Products & Code Hub) ---
    const leftMonitorGroup = new THREE.Group();
    leftMonitorGroup.position.set(-0.68, 1.45, -0.32);
    leftMonitorGroup.rotation.y = 0.16;

    const leftBezel = new THREE.Mesh(monitorBezelGeo, bezelMat);
    leftBezel.castShadow = true;
    leftMonitorGroup.add(leftBezel);

    // Left Screen Texture
    this.leftScreenCanvas = document.createElement('canvas');
    this.leftScreenCanvas.width = 640;
    this.leftScreenCanvas.height = 380;
    this.drawLeftScreenTexture();

    this.leftScreenTexture = new THREE.CanvasTexture(this.leftScreenCanvas);
    const leftScreenMat = new THREE.MeshStandardMaterial({
      map: this.leftScreenTexture,
      emissive: 0xffffff,
      emissiveMap: this.leftScreenTexture,
      emissiveIntensity: 0.95,
      roughness: 0.15
    });

    const leftScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.7), leftScreenMat);
    leftScreen.position.z = 0.019;
    leftScreen.userData = { isLeftMonitor: true, targetView: 'monitors' };
    leftMonitorGroup.add(leftScreen);
    this.interactiveObjects.push(leftScreen);

    this.deskGroup.add(leftMonitorGroup);

    // --- RIGHT MONITOR (Profile, Certifications & Metrics) ---
    const rightMonitorGroup = new THREE.Group();
    rightMonitorGroup.position.set(0.68, 1.45, -0.32);
    rightMonitorGroup.rotation.y = -0.16;

    const rightBezel = new THREE.Mesh(monitorBezelGeo, bezelMat);
    rightBezel.castShadow = true;
    rightMonitorGroup.add(rightBezel);

    // Right Screen Texture
    this.rightScreenCanvas = document.createElement('canvas');
    this.rightScreenCanvas.width = 640;
    this.rightScreenCanvas.height = 380;
    this.drawRightScreenTexture();

    this.rightScreenTexture = new THREE.CanvasTexture(this.rightScreenCanvas);
    const rightScreenMat = new THREE.MeshStandardMaterial({
      map: this.rightScreenTexture,
      emissive: 0xffffff,
      emissiveMap: this.rightScreenTexture,
      emissiveIntensity: 0.95,
      roughness: 0.15
    });

    const rightScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.7), rightScreenMat);
    rightScreen.position.z = 0.019;
    rightScreen.userData = { isRightMonitor: true, targetView: 'monitors' };
    rightMonitorGroup.add(rightScreen);
    this.interactiveObjects.push(rightScreen);

    this.deskGroup.add(rightMonitorGroup);

    // Modern BenQ ScreenBar LED Monitor Lightbar mounted on top of Left Monitor
    const barMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 });
    const screenBar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.52, 16), barMat);
    screenBar.rotation.z = Math.PI / 2;
    screenBar.position.set(0, 0.39, 0.02);
    leftMonitorGroup.add(screenBar);

    // Lightbar counterweight mount clamp
    const barClamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.07), barMat);
    barClamp.position.set(0, 0.38, -0.01);
    leftMonitorGroup.add(barClamp);
  }

  drawLeftScreenTexture() {
    const ctx = this.leftScreenCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a'; // Modern dark IDE theme
    ctx.fillRect(0, 0, 640, 380);

    // VS Code Window Titlebar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 640, 34);

    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(18, 17, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(34, 17, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(50, 17, 5, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('molly@dev-station: ~/shipped-ai-products [MAIN]', 75, 21);

    // Section Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('🚀 SHIPPED AI PRODUCTS & REAL-TIME AGENTS', 25, 62);

    // Card 1: MUSE AI
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 74, 596, 66);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('1. MUSE AI • Conversational Voice AI Co-Producer', 38, 96);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText('   → Agora Voice AI | 5 Dynamic Personas | Real-Time Melody Engine', 38, 116);
    ctx.fillStyle = '#34d399';
    ctx.fillText('● LIVE ON VERCEL & AGORA', 465, 96);

    // Card 2: Focus Forge
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 148, 596, 66);
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('2. Focus Forge • AI Concentration & Productivity Suite', 38, 170);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText('   → React + TypeScript + AI Attention Modeling & Reward Engine', 38, 190);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('● PROTOTYPE ACTIVE', 465, 170);

    // Card 3: Satyadarshi & Phantom Mesh
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 222, 596, 66);
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('3. Satyadarshi (AI Proctoring) & Phantom Mesh (Voice Spam Shield)', 38, 244);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText('   → Computer Vision Gaze Anomaly Detection | Anthropic Voice Agents', 38, 264);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('👉 Click screen to inspect live projects & GitHub repositories', 25, 348);
  }

  drawRightScreenTexture() {
    const ctx = this.rightScreenCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 380);

    // Window Header Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 640, 34);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Molly Arora • AI/ML Engineer & Full-Stack Developer', 20, 21);

    // Profile Card UI
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(22, 48, 596, 84);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MOLLY ARORA', 42, 78);

    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('B.Tech CSE (AI) • React / TypeScript / LLM Agent Pipelines', 42, 100);
    ctx.fillStyle = '#34d399';
    ctx.fillText('🟢 Ranked 8th PAN India @ DevSummit 2026', 42, 120);

    // Verified Badges Grid
    const badges = [
      { t: '🏆 8th PAN India DevSummit', c: '#fbbf24', sub: 'National Hackathon' },
      { t: '⭐ Google Certified', c: '#38bdf8', sub: 'Prompt Engineering' },
      { t: '🎓 IIT Mandi (8.0 CGPA)', c: '#34d399', sub: 'Minor in DS & ML' },
      { t: '🌲 Stanford University', c: '#f472b6', sub: 'Code in Place (Python)' }
    ];

    badges.forEach((b, i) => {
      const bx = 22 + (i % 2) * 304;
      const by = 142 + Math.floor(i / 2) * 85;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, by, 292, 74);

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = b.c;
      ctx.fillText(b.t, bx + 16, by + 30);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(b.sub, bx + 16, by + 52);
    });

    ctx.font = 'italic 12px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Click screen to view full interactive resume, credentials & contact modal →', 110, 355);
  }

  buildChair() {
    this.chairGroup = new THREE.Group();
    this.chairGroup.position.set(0, 0, 0.45);

    // Real-Life Ergonomic Mesh Office Chair (Herman Miller / Steelcase style)
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.6 });
    const seatFabricMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.75, metalness: 0.1 });

    // 5-Star Caster Base with rolling dual-wheel casters
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.34), frameMat);
      spoke.position.set(Math.sin(angle) * 0.17, 0.06, Math.cos(angle) * 0.17);
      spoke.rotation.y = angle;
      this.chairGroup.add(spoke);

      // Caster wheel at end of spoke
      const caster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12),
        frameMat
      );
      caster.rotation.z = Math.PI / 2;
      caster.position.set(Math.sin(angle) * 0.32, 0.022, Math.cos(angle) * 0.32);
      this.chairGroup.add(caster);
    }

    // Pneumatic Gas Lift Cylinder
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.44, 16), frameMat);
    stem.position.y = 0.26;
    this.chairGroup.add(stem);

    // Contoured Cushion Seat
    const seatGeo = new THREE.BoxGeometry(0.58, 0.08, 0.54);
    const seat = new THREE.Mesh(seatGeo, seatFabricMat);
    seat.position.y = 0.52;
    seat.castShadow = true;
    seat.receiveShadow = true;
    this.chairGroup.add(seat);

    // Curved Ergonomic Mesh Backrest with Lumbar Spine Band
    const backGeo = new THREE.BoxGeometry(0.5, 0.64, 0.04);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(0, 0.86, 0.25);
    back.rotation.x = -0.08;
    back.castShadow = true;
    this.chairGroup.add(back);

    // Lumbar Support Spine Band on the back
    const lumbar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.03), frameMat);
    lumbar.position.set(0, 0.76, 0.28);
    this.chairGroup.add(lumbar);

    // Headrest
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.13, 0.05), seatFabricMat);
    head.position.set(0, 1.22, 0.28);
    this.chairGroup.add(head);

    // 3D Adjustable Armrests
    [-0.31, 0.31].forEach(ax => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), frameMat);
      post.position.set(ax, 0.63, 0.05);
      this.chairGroup.add(post);

      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.025, 0.26),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 })
      );
      pad.position.set(ax, 0.74, 0.05);
      this.chairGroup.add(pad);
    });

    this.chairGroup.userData = { isChair: true };
    this.interactiveObjects.push(this.chairGroup);
    this.group.add(this.chairGroup);
  }

  buildRubikSideTable() {
    // Scandinavian Round Natural Wooden Side Table (1.65, 0, 0.75)
    const tableGroup = new THREE.Group();
    tableGroup.position.set(1.65, 0, 0.75);

    // Solid Oak Round Top
    const tableTopGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 32);
    const tableTopMat = new THREE.MeshStandardMaterial({
      map: this.furnitureWoodTexture,
      roughness: 0.35,
      metalness: 0.05
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.y = 0.62;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // 3 Splayed Tapered Wooden Legs
    const legMat = new THREE.MeshStandardMaterial({
      map: this.walnutWoodTexture,
      roughness: 0.4
    });

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.62, 16), legMat);
      leg.position.set(Math.sin(angle) * 0.22, 0.31, Math.cos(angle) * 0.22);
      leg.rotation.z = Math.cos(angle) * 0.12;
      leg.rotation.x = -Math.sin(angle) * 0.12;
      leg.castShadow = true;
      tableGroup.add(leg);
    }

    // Ceramic Table Lamp with warm pleated fabric lampshade
    const lampGroup = new THREE.Group();
    lampGroup.position.set(0.18, 0.64, -0.12);

    // Lamp Ceramic Base
    const lampBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 })
    );
    lampBase.position.y = 0.08;
    lampBase.castShadow = true;
    lampGroup.add(lampBase);

    // Brass Stem
    const lampStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 })
    );
    lampStem.position.y = 0.22;
    lampGroup.add(lampStem);

    // Warm Pleated Fabric Lampshade
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.8,
      emissive: 0xfde68a,
      emissiveIntensity: 0.55
    });
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 0.18, 24, 1, true),
      shadeMat
    );
    shade.position.y = 0.32;
    lampGroup.add(shade);

    tableGroup.add(lampGroup);

    // Walnut Wooden Plinth for Rubik's Cube
    const rubikStand = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.03, 0.34),
      new THREE.MeshStandardMaterial({ map: this.walnutWoodTexture, roughness: 0.4 })
    );
    rubikStand.position.set(-0.08, 0.655, 0.08);
    rubikStand.castShadow = true;
    tableGroup.add(rubikStand);

    this.group.add(tableGroup);

    // Interactive 3D Rubik's Cube on the wooden side table
    this.rubiksCube = new RubiksCube(this.experience, new THREE.Vector3(1.57, 0.814, 0.83));
  }

  buildServerRig() {
    // Realistic High-End Custom PC Tower (NZXT / Fractal North with wood slats)
    this.serverRig = new ServerRig(this.group, new THREE.Vector3(-1.75, 0, 0.4));
  }

  buildBookshelfAndTrophies() {
    this.shelfGroup = new THREE.Group();
    this.shelfGroup.position.set(-1.8, 1.8, -3.35);

    const shelfMat = new THREE.MeshStandardMaterial({
      map: this.furnitureWoodTexture,
      roughness: 0.38,
      metalness: 0.05
    });
    const metalBracketMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.2 });

    // 2 Natural Oak Floating Wall Shelves with hidden steel wall brackets
    [0, 0.62].forEach(offsetY => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.34), shelfMat);
      shelf.position.y = offsetY;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.shelfGroup.add(shelf);

      // Steel wall support brackets
      [-0.6, 0.6].forEach(bx => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.28), metalBracketMat);
        bracket.position.set(bx, offsetY - 0.06, 0);
        this.shelfGroup.add(bracket);
      });
    });

    // Real Polished Brass & Walnut DevSummit 2026 Trophy (8th PAN India)
    const trophyGroup = new THREE.Group();
    trophyGroup.position.set(-0.45, 0.64, 0.02);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15
    });
    const woodPedestalMat = new THREE.MeshStandardMaterial({ map: this.walnutWoodTexture, roughness: 0.4 });

    // Engraved Walnut Plinth Base
    const trophyBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), woodPedestalMat);
    trophyBase.castShadow = true;
    trophyGroup.add(trophyBase);

    // Brass Plaque on base
    const trophyPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.09, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.9, roughness: 0.1 })
    );
    trophyPlaque.position.set(0, 0, 0.061);
    trophyGroup.add(trophyPlaque);

    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16), goldMat);
    trophyStem.position.y = 0.09;
    trophyStem.castShadow = true;
    trophyGroup.add(trophyStem);

    const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.16, 20), goldMat);
    trophyCup.position.y = 0.22;
    trophyCup.castShadow = true;
    trophyGroup.add(trophyCup);

    // Polished Star on top
    const starGeo = new THREE.OctahedronGeometry(0.048);
    const star = new THREE.Mesh(starGeo, goldMat);
    star.position.y = 0.34;
    trophyGroup.add(star);

    trophyGroup.userData = { isTrophy: true, targetView: 'trophy' };
    this.interactiveObjects.push(trophyGroup);
    this.shelfGroup.add(trophyGroup);

    // Realistic Computer Science & AI Hardcover Books
    const bookSpines = [
      { col: '#1e3a8a', title: 'Deep Learning', w: 0.055 },
      { col: '#065f46', title: 'Algorithms C++', w: 0.065 },
      { col: '#7c2d12', title: 'System Design', w: 0.05 },
      { col: '#581c87', title: 'Prompt Eng', w: 0.048 },
      { col: '#1f2937', title: 'Python ML', w: 0.06 }
    ];

    bookSpines.forEach((b, i) => {
      const bookMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(b.col),
        roughness: 0.6
      });
      const book = new THREE.Mesh(new THREE.BoxGeometry(b.w, 0.26, 0.22), bookMat);
      book.position.set(0.08 + i * 0.068, 0.15, 0);
      book.castShadow = true;
      this.shelfGroup.add(book);
    });

    // Potted Trailing Pothos Plant on Shelf
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.045, 0.09, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
    );
    pot.position.set(0.55, 0.065, 0);
    this.shelfGroup.add(pot);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 1), foliageMat);
    bush.position.set(0.55, 0.14, 0);
    this.shelfGroup.add(bush);

    // Trailing vine cascading down
    const vine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.04), foliageMat);
    vine.position.set(0.55, -0.02, 0.12);
    this.shelfGroup.add(vine);

    // Framed Certificate (IIT Mandi & Stanford) in natural wood frame
    const frameMat = new THREE.MeshStandardMaterial({ map: this.furnitureWoodTexture, roughness: 0.4 });
    const certFrame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.025), frameMat);
    certFrame.position.set(0.35, 0.76, 0);
    this.shelfGroup.add(certFrame);

    const certPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.18),
      new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.85 })
    );
    certPaper.position.set(0.35, 0.76, 0.014);
    this.shelfGroup.add(certPaper);

    this.group.add(this.shelfGroup);
  }

  buildArcadeCabinet() {
    // Retro Modern Walnut & Matte Black Arcade Machine in Corner
    this.arcadeGroup = new THREE.Group();
    this.arcadeGroup.position.set(2.6, 0, -2.2);
    this.arcadeGroup.rotation.y = -Math.PI / 4;

    const cabBodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    const woodSideMat = new THREE.MeshStandardMaterial({ map: this.walnutWoodTexture, roughness: 0.4 });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 0.8), cabBodyMat);
    lowerBody.position.y = 0.6;
    lowerBody.castShadow = true;
    this.arcadeGroup.add(lowerBody);

    // Wood Veneer Side Panels
    [-0.43, 0.43].forEach(px => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.015, 1.8, 0.82), woodSideMat);
      side.position.set(px, 0.9, 0);
      this.arcadeGroup.add(side);
    });

    // Control Panel
    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 0.4), cabBodyMat);
    cp.position.set(0, 0.95, 0.28);
    cp.rotation.x = 0.2;
    this.arcadeGroup.add(cp);

    // Joystick & Buttons
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.1, 12),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95 })
    );
    stick.position.set(-0.2, 1.04, 0.3);
    this.arcadeGroup.add(stick);

    const stickBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.15 })
    );
    stickBall.position.set(-0.2, 1.1, 0.3);
    this.arcadeGroup.add(stickBall);

    const btnCols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
    btnCols.forEach((c, idx) => {
      const bx = 0.05 + (idx % 3) * 0.08;
      const bz = 0.26 + Math.floor(idx / 3) * 0.06;
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.2 })
      );
      btn.position.set(bx, 1.02, bz);
      this.arcadeGroup.add(btn);
    });

    // Arcade Marquee on Top
    const marquee = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.22, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    marquee.position.set(0, 1.95, 0.1);
    this.arcadeGroup.add(marquee);

    // Interactive Arcade Screen
    this.arcadeScreen = new ArcadeScreen(this.experience, new THREE.Vector3(2.6, 1.45, -2.2));
    this.arcadeScreen.mesh.userData = { targetView: 'arcade', isArcadeScreen: true };

    // Make entire cabinet responsive to click/touch in 3D
    this.arcadeGroup.traverse(child => {
      if (child.isMesh) {
        child.userData = { targetView: 'arcade', isArcadeCabinet: true };
        this.interactiveObjects.push(child);
      }
    });
    this.interactiveObjects.push(this.arcadeScreen.mesh);

    this.group.add(this.arcadeGroup);
  }

  buildDecorations() {
    // 1. Realistic Office Whiteboard on Left Wall
    this.whiteboard = new Whiteboard(this.experience, new THREE.Vector3(-3.38, 1.8, 0.4));
    this.interactiveObjects.push(this.whiteboard.mesh);

    // 2. Interactive Vision Board with Polaroids & Warm LED Accent
    this.visionBoard = new VisionBoard(this.experience, new THREE.Vector3(-0.05, 2.85, -3.34), {
      width: 1.65,
      height: 1.75
    });
    this.group.add(this.visionBoard.group);
    this.interactiveObjects.push(this.visionBoard.mesh);

    // 3. Large Floor Plant (Monstera / Ficus) in ceramic fluted pot on wooden stand
    const floorPlantGroup = new THREE.Group();
    floorPlantGroup.position.set(-2.8, 0, -2.5);

    // Wooden Tripod Stand
    const tripodMat = new THREE.MeshStandardMaterial({ map: this.walnutWoodTexture, roughness: 0.4 });
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 12), tripodMat);
      leg.position.set(Math.sin(angle) * 0.22, 0.2, Math.cos(angle) * 0.22);
      leg.castShadow = true;
      floorPlantGroup.add(leg);
    }

    // Fluted White Ceramic Pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.46, 24),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
    );
    pot.position.y = 0.42;
    pot.castShadow = true;
    floorPlantGroup.add(pot);

    // Lush Monstera Leaves
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.45 });
    for (let l = 0; l < 9; l++) {
      const leafAngle = (l * Math.PI * 2) / 9;
      const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), foliageMat);
      leaf.position.set(
        Math.sin(leafAngle) * 0.26,
        0.72 + (l % 3) * 0.14,
        Math.cos(leafAngle) * 0.26
      );
      leaf.scale.set(1.1, 0.4, 1.2);
      leaf.rotation.y = leafAngle;
      leaf.castShadow = true;
      floorPlantGroup.add(leaf);
    }

    this.group.add(floorPlantGroup);
  }

  update(delta, isRubikInspecting = false) {
    if (this.coffeeSteam) {
      this.coffeeSteam.update(delta);
    }
    if (this.rubiksCube) {
      this.rubiksCube.update(delta, isRubikInspecting);
    }
    if (this.serverRig) {
      this.serverRig.update(delta);
    }
    if (this.dustMotes) {
      this.dustMotes.update(delta);
    }
    if (this.whiteboard) {
      this.whiteboard.update(delta);
    }
    if (this.smartClock) {
      this.smartClock.update(delta);
    }
    if (this.rainEffect) {
      this.rainEffect.update(delta);
    }
  }
}
