import * as THREE from 'three';
import { ThreeRenderParams } from './ThreeJSRenderer';

export interface IThreeJSEffect {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    material: THREE.ShaderMaterial | THREE.Material;
    update: (params: ThreeRenderParams, texture: THREE.Texture) => void;
    dispose: () => void;
}

const TERRAIN_SPHERE_VERT = `
    uniform sampler2D u_image;
    uniform float u_extrusion;
    uniform float u_res;

    out vec2 vUv;
    out vec4 vTexColor;
    out float vFaceAlpha;

    void main() {
        // ── DYNAMIC VOXEL RESOLUTION ──────────────────────────────
        float gridRes = clamp(u_res, 2.0, 512.0);

        // HEIGHT SNAP: Snap UVs to the voxel grid center,
        // so the sample point aligns with the displaced column — same
        // technique as the terrain hUv remap.
        // If extrusion is 0, bypass snapping (show full-res image).
        float isFlat = step(u_extrusion, 0.01);
        vec2 snappedUv = floor(uv * gridRes + 0.5) / gridRes;
        vec2 samplingUv = mix(snappedUv, uv, isFlat);

        // ── SAMPLING & HEIGHT ─────────────────────────────────────
        vTexColor = texture(u_image, samplingUv);
        float heightVal = dot(vTexColor.rgb, vec3(0.333));

        // ── DISPLACE ALONG NORMAL ──────────────────────────────
        vec3 norm = normalize(normal);
        vec3 pos  = position + norm * (heightVal * u_extrusion);

        // ── BACKFACE FADE ─────────────────────────────────────────
        // Vertices whose normals point away from the camera fade out,
        // creating a clean horizon without two-sided rendering.
        vec3 worldNorm = normalize((modelMatrix * vec4(norm, 0.0)).xyz);
        vec3 camDir    = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        float facing   = dot(worldNorm, camDir);
        vFaceAlpha = smoothstep(-0.15, 0.25, facing);

        vUv = samplingUv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const TERRAIN_RING_VERT = `
    uniform sampler2D u_image;
    uniform float u_extrusion;
    uniform float u_res;
    uniform float u_thickness;

    out vec2 vUv;
    out vec4 vTexColor;
    out float vFaceAlpha;

    void main() {
        // ── DYNAMIC VOXEL RESOLUTION ──────────────────────────────
        float gridRes = clamp(u_res, 2.0, 512.0);

        float isFlat = step(u_extrusion, 0.01);
        vec2 snappedUv = floor(uv * gridRes + 0.5) / gridRes;
        vec2 samplingUv = mix(snappedUv, uv, isFlat);

        // ── SAMPLING & HEIGHT ─────────────────────────────────────
        vTexColor = texture(u_image, samplingUv);
        float heightVal = dot(vTexColor.rgb, vec3(0.333));

        // ── DISPLACE ALONG NORMAL ──────────────────────────────
        vec3 norm = normalize(normal);
        
        // Add u_thickness displacement to expand the tube, then add extrusion
        vec3 pos  = position + norm * (u_thickness + (heightVal * u_extrusion));

        // ── BACKFACE FADE ─────────────────────────────────────────
        vec3 worldNorm = normalize((modelMatrix * vec4(norm, 0.0)).xyz);
        vec3 camDir    = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
        float facing   = dot(worldNorm, camDir);
        vFaceAlpha = smoothstep(-0.15, 0.25, facing);

        vUv = samplingUv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const createDisplacedShapeEffect = (
    geometry: THREE.BufferGeometry,
    vertexShader: string,
    setupUniforms: Record<string, any> = {},
    customUpdater: (params: ThreeRenderParams, material: THREE.ShaderMaterial, group: THREE.Group) => void = () => { }
): IThreeJSEffect => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
    camera.position.set(0, 0, 120);
    camera.lookAt(0, 0, 0);

    const material = new THREE.ShaderMaterial({
        glslVersion: THREE.GLSL3,
        transparent: true,
        uniforms: {
            u_image: { value: null },
            u_extrusion: { value: 0.0 },
            u_res: { value: 100.0 },
            ...setupUniforms
        },
        vertexShader: vertexShader,
        fragmentShader: `
            precision highp float;
            uniform sampler2D u_image;
            uniform float u_extrusion;
            in vec2 vUv;
            in vec4 vTexColor;
            in float vFaceAlpha;
            out vec4 outColor;

            void main() {
                // Use full-res texture when extrusion is 0
                float isFlat = step(u_extrusion, 0.01);
                vec4 flatColor  = texture(u_image, vUv);
                vec4 finalColor = mix(vTexColor, flatColor, isFlat);

                outColor = vec4(finalColor.rgb, finalColor.a * vFaceAlpha);
            }
        `,
        side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = true;

    const group = new THREE.Group();
    group.add(mesh);
    scene.add(group);

    // Stabilizer phantom (keeps engine alive)
    const phantom = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false })
    );
    scene.add(phantom);

    return {
        scene,
        camera,
        material,
        update: (params, texture) => {
            const p = params.params;
            if (p && p.length >= 9) {
                const extrusion = p[0]; // 0-100 → world units
                const resolution = p[1]; // 0-100 → 2-512 voxel cells
                const size = p[2]; // 0-100 → radius

                // Resolution: map 0-100 → 2-512 voxel cells
                const virtualRes = Math.max(2, Math.floor(2 + (resolution / 100.0) * 510.0));

                // Size: 0 = invisible (0 units), 100 = very large (300 units)
                group.scale.setScalar((size / 100.0) * 3.0);

                // Speed: continuous spin driven by the engine's integrated time accumulator
                const integratedSpinX = params.integratedValues[6];
                const integratedSpinY = params.integratedValues[7];
                const integratedSpinZ = params.integratedValues[8];

                const toRad = (v: number) => (v / 100.0) * Math.PI * 2.0;
                const speedMultiplier = 10.0;
                mesh.rotation.x = integratedSpinX * (p[6] / 100.0) * speedMultiplier;
                mesh.rotation.y = integratedSpinY * (p[7] / 100.0) * speedMultiplier;
                mesh.rotation.z = integratedSpinZ * (p[8] / 100.0) * speedMultiplier;

                // Static starting position
                group.rotation.x = toRad(p[3] ?? 0);
                group.rotation.y = toRad(p[4] ?? 0);
                group.rotation.z = toRad(p[5] ?? 0);

                material.uniforms.u_image.value = texture;
                material.uniforms.u_extrusion.value = extrusion;
                material.uniforms.u_res.value = virtualRes;

                // Run custom updater
                customUpdater(params, material, group);
            }
            phantom.rotation.y += 0.01;
        },
        dispose: () => {
            geometry.dispose();
            material.dispose();
            scene.clear();
        }
    };
};

export const THREE_JS_EFFECTS: Record<string, () => IThreeJSEffect> = {
    TERRAIN: () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5000);
        camera.position.set(0, 30, 60);
        camera.lookAt(0, 0, 0);

        // Single large plane
        const PLANE_W = 3000;
        const PLANE_H = 3000;
        const MESH_RES = 1024;
        const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_H, MESH_RES, MESH_RES);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            transparent: true,
            uniforms: {
                u_image: { value: null },
                u_extrusion: { value: 0.0 },
                u_res: { value: 100.0 },
                u_tileW: { value: 100.0 }, // world units per tile (X)
                u_tileH: { value: 100.0 }, // world units per tile (Z)
                u_tileBlend: { value: 0.5 },   // 0 = hard seams, 1 = full seamless blend
                u_mesh_x: { value: 0.0 },
                u_mesh_z: { value: 0.0 },
            },
            vertexShader: `
                uniform sampler2D u_image;
                uniform float u_extrusion;
                uniform float u_res;
                uniform float u_tileW;
                uniform float u_tileH;
                uniform float u_tileBlend;
                uniform float u_mesh_x;
                uniform float u_mesh_z;

                out vec2 vSampleUv;
                out vec4 vTexColor;
                out float vVisibility;

                void main() {
                    float gridRes = clamp(u_res, 1.0, 1024.0);

                    // Block size scales with tile size so voxels stay consistent per tile
                    float blockSizeX = u_tileW / gridRes;
                    float blockSizeZ = u_tileH / gridRes;

                    vec3 pos = position;

                    // Snap vertices to voxel grid centers
                    float snappedX = floor(pos.x / blockSizeX + 0.5) * blockSizeX;
                    float snappedZ = floor(pos.z / blockSizeZ + 0.5) * blockSizeZ;

                    // Bypass snapping when flat (extrusion = 0)
                    float isFlat = step(u_extrusion, 0.01);
                    pos.x = mix(snappedX, pos.x, isFlat);
                    pos.z = mix(snappedZ, pos.z, isFlat);

                    // Tiling UV: position / tile size → naturally repeats via GL_REPEAT
                    vSampleUv = vec2((pos.x / u_tileW) + 0.5, 0.5 - (pos.z / u_tileH));

                    // ── TILE EDGE BLENDING ─────
                    vec2 tileFrac = fract(vSampleUv);
                    vec2 ghostUv  = vSampleUv + 0.5;

                    // Weight: 0 in center of tile, 1 at seam
                    float wx = (u_tileBlend < 1.0) ? smoothstep(u_tileBlend, 1.0, abs(tileFrac.x - 0.5) * 2.0) : 0.0;
                    float wy = (u_tileBlend < 1.0) ? smoothstep(u_tileBlend, 1.0, abs(tileFrac.y - 0.5) * 2.0) : 0.0;

                    // Sample 4 tiles. textureLod is used as derivatives aren't in VS.
                    vec4 c1 = textureLod(u_image, vSampleUv,                    0.0);
                    vec4 c2 = textureLod(u_image, vec2(ghostUv.x, vSampleUv.y), 0.0);
                    vec4 c3 = textureLod(u_image, vec2(vSampleUv.x, ghostUv.y), 0.0);
                    vec4 c4 = textureLod(u_image, ghostUv,                      0.0);

                    vTexColor = mix(mix(c1, c2, wx), mix(c3, c4, wx), wy);
                    float heightVal = dot(vTexColor.rgb, vec3(0.333));

                    // Fog: world-space so it stays fixed as the mesh physically scrolls.
                    // pos.x/z is local; adding u_mesh_x/z converts to world space.
                    float worldX = pos.x + u_mesh_x;
                    float worldZ = pos.z + u_mesh_z;
                    float sideFade = smoothstep(500.0, 400.0, abs(worldX));
                    float zFog     = smoothstep(400.0, 500.0, abs(worldZ));
                    vVisibility = step(0.01, heightVal) * sideFade * (1.0 - zFog);

                    pos.y += heightVal * u_extrusion;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                in vec2 vSampleUv;
                in vec4 vTexColor;
                in float vVisibility;
                out vec4 outColor;

                void main() {
                    // Use the color pre-blended and passed from the vertex shader.
                    // This ensures geometry heights and visual colors are perfectly synced.
                    outColor = vec4(vTexColor.rgb, vTexColor.a * vVisibility);
                }
            `,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 1;
        mesh.frustumCulled = false;

        const terrainGroup = new THREE.Group();
        terrainGroup.add(mesh);
        scene.add(terrainGroup);

        // Stabilizer phantom — keeps the engine alive every frame
        const phantom = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false })
        );
        scene.add(phantom);

        return {
            scene,
            camera,
            material,
            update: (params, texture) => {
                const p = params.params;

                const extrusion = p ? p[0] * 10 : 0;  // Extrusion   0-100
                const resolution = p ? p[1] : 100;    // Resolution  0-100 → 2-1024 voxel columns
                const tileW = p ? p[2] : 100;         // Tile Width  0-100 → 10-1000 world units per tile (X)
                const tileH = p ? p[3] : 100;         // Tile Height 0-100 → 10-1000 world units per tile (Z)
                const rotateX = p ? p[4] : 0;         // Rotate X    0-100 → 0-2π
                const rotateY = p ? p[5] : 0;         // Rotate Y    0-100 → 0-2π
                const rotateZ = p ? p[6] : 0;         // Rotate Z    0-100 → 0-2π
                const elevation = p ? p[7] : 50;      // Elevation   0-100 → -500 to +500 world units
                const distance = p ? p[8] : 50;       // Distance    0-100 → -1000 to +1000 world units
                const tileBlend = p ? p[9] : 50;      // Tile Blend  0-100 → hard seams → full seamless blend
                const speedX = p ? p[10] * 10 : 0;    // Speed X     0-100 → UV/s leftward → rightward
                const speedY = p ? p[11] * 10 : 0;    // Speed Y     0-100 → UV/s forward → backward

                // Map 0-100 → 2-1024 voxel columns
                const targetRes = Math.max(2, Math.floor(2 + (resolution / 100.0) * 1022.0));

                // Map 0-100 → 10-1000 world units per tile
                const tileWWorld = 10.0 + (tileW / 100.0) * 990.0;
                const tileHWorld = 10.0 + (tileH / 100.0) * 990.0;

                const toRad = (v: number) => (v / 100.0) * Math.PI * 2.0;
                terrainGroup.rotation.x = toRad(rotateX);
                terrainGroup.rotation.y = toRad(rotateY);
                terrainGroup.rotation.z = toRad(rotateZ);

                // Elevation: 0 = -500, 100 = +500, 50 = ground level (y=0)
                terrainGroup.position.y = (elevation - 50.0) * 10.0;

                // Distance: 0 = 1000, 100 = -1000, 50 = 0
                terrainGroup.position.z = (50.0 - distance) * 20.0;

                material.uniforms.u_image.value = texture;
                material.uniforms.u_extrusion.value = extrusion;
                material.uniforms.u_res.value = targetRes;
                material.uniforms.u_tileW.value = tileWWorld;
                material.uniforms.u_tileH.value = tileHWorld;
                // Map 0-100 → 1.0 (no blend) → 0.0 (full seamless blend), clamped just below 1.0
                material.uniforms.u_tileBlend.value = 1.0 - Math.min(tileBlend / 100.0, 0.999);

                // Scroll logic: The plane physically translates continuously.
                // To create an infinite illusion with a single bounded plane, it wraps
                // backwards exactly when it reaches the width of ONE TEXTURE TILE.
                // Since the texture natively repeats exactly at the tile size, the snap
                // is completely mathematically invisible, eliminating all UV shifting complexity.
                const iv = params.integratedValues;
                const time = params.time || 0.0;
                const rawTx = (iv && iv.length > 10) ? iv[10] : time;
                const rawTy = (iv && iv.length > 11) ? iv[11] : time;

                // Max speed 100 units/s per axis
                const distX = rawTx * (speedX / 100.0) * 100.0;
                const distZ = rawTy * (speedY / 100.0) * 100.0;

                const mod = (n: number, m: number) => ((n % m) + m) % m;

                // Move in physical space, wrapping exactly at the full tile repeat boundary
                mesh.position.x = -mod(distX, tileWWorld);
                mesh.position.z = mod(distZ, tileHWorld);

                material.uniforms.u_mesh_x.value = mesh.position.x;
                material.uniforms.u_mesh_z.value = mesh.position.z;

                phantom.rotation.y += 0.01;
            },
            dispose: () => {
                geometry.dispose();
                material.dispose();
                scene.clear();
            }
        };
    },
    TERRAIN_SPHERE: () => createDisplacedShapeEffect(
        new THREE.SphereGeometry(30, 512, 512),
        TERRAIN_SPHERE_VERT
    ),
    TERRAIN_RING: () => createDisplacedShapeEffect(
        new THREE.TorusGeometry(30, 0.1, 512, 512), // Start with a thin base tube
        TERRAIN_RING_VERT,
        { u_thickness: { value: 0.0 } },
        (params, material) => {
            const p = params.params;
            if (p.length >= 10) {
                // Tube Width
                // p[9] = 0 -> 0, p[9] = 100 -> +29.9 (0.1 + 29.9 = 30.0)
                const thickness = (p[9] / 100.0) * 29.9;
                material.uniforms.u_thickness.value = thickness;
            }
        }
    ),
    INFINITE_ZOOM: () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100000);
        camera.position.set(0, 0, 0);
        camera.lookAt(0, 0, -1);

        // Plane geometry — large enough to overfill the FOV at any spacing.
        // Uses standard PlaneGeometry in XY space (facing +Z) so it sits
        // perpendicular to the camera flight path.
        const PLANE_W = 300;
        const PLANE_H = 300;
        const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_H, 1, 1);
        // PlaneGeometry is in XY, facing +Z by default — camera looks toward -Z,
        // so the planes are face-on when placed ahead at negative Z. Good.

        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            uniforms: {
                u_image: { value: null },
                u_feather: { value: 0.3 },
                u_alpha: { value: 1.0 },
                u_blur_lod: { value: 0.0 },
            },
            vertexShader: `
                uniform sampler2D u_image;
                out vec2 vUv;
                flat out vec4 vColor;

                void main() {
                    vUv = uv;
                    vColor = texture(u_image, uv);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D u_image;
                uniform float u_feather;
                uniform float u_alpha;
                uniform float u_blur_lod;
                in vec2 vUv;
                flat in vec4 vColor;
                out vec4 outColor;

                void main() {
                    vec4 col = textureLod(u_image, vUv, u_blur_lod);

                    // Edge feather: fade out as UV approaches the plane border
                    vec2 d = abs(vUv - 0.5);          // 0 at centre, 0.5 at edge
                    float inner = 0.5 - max(u_feather * 0.5, 0.001);
                    float ax = 1.0 - smoothstep(inner, 0.5, d.x);
                    float ay = 1.0 - smoothstep(inner, 0.5, d.y);

                    outColor = vec4(col.rgb, col.a * ax * ay * u_alpha);
                }
            `,
        });

        // Pre-allocate a fixed pool of MAX_PLANES planes.
        // The Plane Count parameter controls how many are visible each frame
        // via mesh.visible — no geometry is created or destroyed at runtime.
        const MAX_PLANES = 100;
        const materials: THREE.ShaderMaterial[] = [];
        const meshes: THREE.Mesh[] = [];

        const tunnelGroup = new THREE.Group();
        for (let i = 0; i < MAX_PLANES; i++) {
            const mat = i === 0 ? material : material.clone();
            materials.push(mat);
            const mesh = new THREE.Mesh(geometry, mat);
            mesh.frustumCulled = false;
            mesh.renderOrder = 1;
            mesh.visible = false; // hidden until enabled by Plane Count
            tunnelGroup.add(mesh);
            meshes.push(mesh);
        }
        scene.add(tunnelGroup);

        // Stabilizer phantom
        const cube = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false })
        );
        scene.add(cube);

        return {
            scene,
            camera,
            material,
            update: (params, texture) => {
                const p = params.params;
                if (p && p.length >= 6) {
                    // p[0] Speed       0-100
                    // p[1] Depth       0-100 → 10-150 FOV
                    // p[2] Spacing     0-100 → segment length 5-600 world units
                    // p[3] Plane Count 0-100 → 1-100 active planes
                    // p[4] Edge Feather 0-100 → 0.0-0.5 UV fade width
                    // p[5] Fade Buffer 0-100 → 0.0-1.0 segment fade zone

                    const speed = (p[0] / 100.0) * 10.0;
                    const fov = 10.0 + (p[1] / 100.0) * 140.0;
                    const segLen = (p[2] / 100.0) * 595.0 + 5.0;
                    const activePlanes = Math.max(1, Math.round(p[3]));
                    const feather = p[4] / 100.0;
                    const fade = Math.max((p[5] / 100.0) * 2.0, 0.01);

                    const width = params.width;
                    const height = params.height;
                    const aspect = width / height;

                    if (camera.fov !== fov) {
                        camera.fov = fov;
                        camera.updateProjectionMatrix();
                    }

                    // Travel distance
                    const rawTravel = (params.integratedValues && params.integratedValues.length >= 1)
                        ? params.integratedValues[0]
                        : (params.time || 0.0);

                    const travelZ = rawTravel * speed * segLen;

                    // Camera drifts forward along -Z
                    camera.position.set(0, 0, 0);
                    camera.lookAt(0, 0, -1);

                    const totalLength = segLen * activePlanes;

                    // Show only the active planes; hide the rest.
                    // Active planes are leap-frogged through the tunnel every totalLength.
                    meshes.forEach((m, idx) => {
                        if (idx >= activePlanes) {
                            m.visible = false;
                            return;
                        }
                        m.visible = true;
                        const mat = m.material as THREE.ShaderMaterial;

                        let z = travelZ - (idx * segLen);
                        let wrappedZ = ((z % totalLength) + totalLength) % totalLength;

                        m.scale.set(aspect, 1.0, 1.0);

                        m.position.z = -(totalLength - wrappedZ);
                        m.renderOrder = Math.round(m.position.z);

                        // Fade in from the far end, fade out as they approach camera
                        const distFromCam = Math.abs(m.position.z);
                        const fadeBuffer = segLen * fade;

                        const fadeIn = Math.min(1.0, (totalLength - distFromCam) / fadeBuffer);
                        const fadeOut = Math.min(1.0, distFromCam / fadeBuffer);

                        // Mipmap Blur (Depth of Field). Increase blur as plane enters the near-fade zone.
                        // 0.75: wait until image is 75% faded out before applying blur (reduces crunchy artifacts)
                        // 2.0: max mipmap blur level
                        const nearLod = Math.max(0, 1.0 - (distFromCam / (fadeBuffer * 0.75))) * 2.0;

                        mat.uniforms.u_image.value = texture;
                        mat.uniforms.u_feather.value = feather;
                        mat.uniforms.u_alpha.value = fadeIn * fadeOut;
                        mat.uniforms.u_blur_lod.value = nearLod;
                    });
                }

                cube.rotation.y += 0.01;
            },
            dispose: () => {
                geometry.dispose();
                materials.forEach(mat => mat.dispose());
                scene.clear();
            }
        };
    },
    PARTICLES: () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
        camera.position.set(0, 0, 300);

        const PARTICLE_COUNT = 10000;
        const geometry = new THREE.BufferGeometry();
        const basePositions = new Float32Array(PARTICLE_COUNT * 3);
        const randoms = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ix = i * 3;
            basePositions[ix + 0] = (Math.random() - 0.5) * 2.0;
            basePositions[ix + 1] = (Math.random() - 0.5) * 2.0;
            basePositions[ix + 2] = (Math.random() - 0.5) * 2.0;

            randoms[ix + 0] = Math.random();
            randoms[ix + 1] = Math.random();
            randoms[ix + 2] = Math.random();
        }

        const positions = new Float32Array(PARTICLE_COUNT * 3);
        // Fill positions once; they will be used as "base" coordinates in the shader
        for (let i = 0; i < PARTICLE_COUNT * 3; i++) positions[i] = basePositions[i];

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('a_random', new THREE.BufferAttribute(randoms, 3));

        // Background quad to carry the image behind the particles
        const bgMaterial = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: { u_image: { value: null } },
            vertexShader: `
                out vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position.xy, 0.999, 1.0); 
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D u_image;
                in vec2 vUv;
                out vec4 outColor;
                void main() {
                    outColor = texture(u_image, vUv);
                }
            `,
            depthWrite: false,
            depthTest: false
        });
        const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
        bgMesh.frustumCulled = false;
        bgMesh.renderOrder = -1;
        scene.add(bgMesh);

        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NormalBlending,
            uniforms: {
                u_time: { value: 0.0 },
                u_speed: { value: 0.0 },
                u_drift: { value: 0.0 },
                u_spread: { value: 0.0 },
                u_aspect: { value: 1.0 },
                u_tanHalfFov: { value: Math.tan((75.0 * Math.PI) / 360.0) },
                u_zDepth: { value: 300.0 },
                u_size: { value: 1.0 },
                u_opacity: { value: 1.0 },
            },
            vertexShader: `
                uniform float u_time;
                uniform float u_speed;
                uniform float u_drift;
                uniform float u_spread;
                uniform float u_aspect;
                uniform float u_tanHalfFov;
                uniform float u_zDepth;
                uniform float u_size;

                in vec3 a_random;

                void main() {
                    // 1. Individual speed jitter: each particle moves at a slightly different rate
                    // to break up the "synchronized" look and make it feel organic.
                    float speedJitter = mix(0.5, 1.5, a_random.y);
                    float t = u_time * u_speed * speedJitter;
                    
                    // 2. Narrow Z-variance for layering (same as simplified JS)
                    float z = (position.z * 200.0) + sin(t * 0.3 + a_random.z * 200.0) * (u_drift * 0.2);
                    
                    // 3. Uniform screen-space movement logic
                    float fieldH = 2.0 * u_tanHalfFov * u_zDepth;
                    float fieldW = fieldH * u_aspect;
                    float fill   = (u_spread / 400.0) * 0.5;

                    float finalX = (position.x * fieldW * fill) + sin(t * 0.5 + a_random.x * 20.0) * u_drift;
                    float finalY = (position.y * fieldH * fill) + cos(t * 0.4 + a_random.x * 40.0) * u_drift;

                    vec4 mvPosition = modelViewMatrix * vec4(finalX, finalY, z, 1.0);
                    gl_PointSize = u_size * clamp(800.0 / -mvPosition.z, 0.5, 20.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform float u_opacity;
                out vec4 outColor;

                void main() {
                    float d = dot(gl_PointCoord - 0.5, gl_PointCoord - 0.5);
                    if (d > 0.25) discard;
                    
                    // Starfield-Style Falloff: 1 / (1 + d * size)
                    float intensity = 1.0 / (1.0 + d * 500.0);
                    
                    // Starfield stars are white dots that mix into the background
                    outColor = vec4(1.0, 1.0, 1.0, intensity * u_opacity);
                }
            `
        });

        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        scene.add(points);

        // Stabilizer phantom
        const phantom = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, depthWrite: false, depthTest: false })
        );
        scene.add(phantom);

        return {
            scene,
            camera,
            material,
            update: (params, texture) => {
                const p = params.params;
                const iv = params.integratedValues;
                if (p && iv && p.length >= 6) {
                    // p[0] Count    (0-100)
                    // p[1] Size     (0-100)
                    // p[2] Speed    (0-100) -> drives iv[2]
                    // p[3] Spread   (0-100)
                    // p[4] Drift    (0-100)
                    // p[5] Blend    (0-100)

                    const countVal = p[0] / 100.0;
                    const size = (p[1] / 100.0) * 100.0 + 2.0;
                    const speed = (p[2] / 100.0) * 10.0;
                    const spread = (p[3] / 100.0) * 1500.0 + 100.0;
                    const drift = (p[4] / 100.0) * 200.0;
                    const blend = p[5] / 100.0;

                    // Fixed camera defaults for Screen-Space Spawning
                    const fov = 75.0;
                    const zDepth = 300.0;

                    if (camera.fov !== fov) {
                        camera.fov = fov;
                        camera.updateProjectionMatrix();
                    }
                    camera.position.set(0, 0, zDepth);
                    camera.lookAt(0, 0, 0);

                    // 2. Control count via Draw Range
                    const activeCount = Math.floor(countVal * PARTICLE_COUNT);
                    geometry.setDrawRange(0, activeCount);

                    // 3. Update Uniforms (Animation now runs entirely on the GPU)
                    const mat = material as THREE.ShaderMaterial;
                    mat.uniforms.u_time.value = iv[2] || 0.0;
                    mat.uniforms.u_speed.value = speed;
                    mat.uniforms.u_drift.value = drift;
                    mat.uniforms.u_spread.value = spread;
                    mat.uniforms.u_aspect.value = params.width / params.height;
                    mat.uniforms.u_size.value = size;
                    mat.uniforms.u_opacity.value = blend;

                    // Background Quad
                    bgMaterial.uniforms.u_image.value = texture;

                    phantom.rotation.y += 0.01;
                }
            },
            dispose: () => {
                geometry.dispose();
                bgMaterial.dispose();
                material.dispose();
                scene.clear();
            }
        };
    }
};
