import * as THREE from "three";

export class Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private width: number;
  private height: number;
  private stars: THREE.Points | null = null;
  private starPositions: Float32Array | null = null;
  private starSpeeds: Float32Array | null = null;

  constructor(canvas?: HTMLCanvasElement) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      2000
    );
    this.camera.position.z = 100;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas || undefined,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Only append to body if no canvas was provided
    if (!canvas) {
      document.body.appendChild(this.renderer.domElement);
    }

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  async init(): Promise<void> {
    this.setupLights();
    this.setupEnvironment();
    this.setupStarfield();
  }

  private setupStarfield(): void {
    const starCount = 1500;
    const starGeometry = new THREE.BufferGeometry();
    this.starPositions = new Float32Array(starCount * 3);
    this.starSpeeds = new Float32Array(starCount);

    // Random star positions and speeds
    for (let i = 0; i < starCount; i++) {
      // Position
      this.starPositions[i * 3] = (Math.random() - 0.5) * 2000; // x
      this.starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // y
      this.starPositions[i * 3 + 2] = (Math.random() - 0.5) * 2000; // z

      // Speed (varying from 50 to 200)
      this.starSpeeds[i] = 50 + Math.random() * 150;
    }

    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    // Create star material with shader
    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 3.0;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vPosition;
        void main() {
          float fadeIn = smoothstep(-1000.0, 0.0, vPosition.z);
          // Maintain a minimum opacity of 0.4 and fade up to 0.8
          float opacity = 0.4 + (0.4 * fadeIn);
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    // Create star points
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  private setupEnvironment(): void {
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
  }

  private onWindowResize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  update(deltaTime: number): void {
    if (this.stars && this.starPositions && this.starSpeeds) {
      const positions = this.stars.geometry.attributes.position
        .array as Float32Array;
      const material = this.stars.material as THREE.ShaderMaterial;

      // Update star positions with varying speeds
      for (let i = 0; i < positions.length; i += 3) {
        const starIndex = i / 3;
        const oldZ = positions[i + 2];
        positions[i + 2] += deltaTime * this.starSpeeds[starIndex];

        // Reset stars that have moved too far
        if (positions[i + 2] > 1000) {
          positions[i + 2] -= 2000;
          // Randomize new position and speed
          positions[i] = (Math.random() - 0.5) * 2000;
          positions[i + 1] = (Math.random() - 0.5) * 2000;
          this.starSpeeds[starIndex] = 50 + Math.random() * 150;
        }
      }

      this.stars.geometry.attributes.position.needsUpdate = true;
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener("resize", this.onWindowResize);
    this.renderer.dispose();
    document.body.removeChild(this.renderer.domElement);
  }
}
