import * as THREE from 'three';
import { ThreeRenderParams } from './ThreeJSRenderer';

export interface IThreeJSEffect {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    material: THREE.ShaderMaterial | THREE.Material;
    update: (params: ThreeRenderParams, texture: THREE.Texture) => void;
    dispose: () => void;
}

export const THREE_JS_EFFECTS: Record<string, () => IThreeJSEffect> = {
    TERRAIN: () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5000);
        camera.position.set(0, 30, 60);
        camera.lookAt(0, 0, 0);

        // Simple 512x512 plane:
        const width = 300; // Width of 300: X range is -150 to 150
        const height = 500; // Height of 500: Z range is -250 to 250
        const meshResX = 512;
        const meshResY = Math.floor(meshResX * (height / width));
        const geometry = new THREE.PlaneGeometry(width, height, meshResX, meshResY);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            transparent: true,
            uniforms: {
                u_image: { value: null },
                u_scale: { value: 1.0 },
                u_extrusion: { value: 0.0 },
                u_res: { value: 100.0 },
                u_mesh_z: { value: 0.0 },
            },
            vertexShader: `
                uniform sampler2D u_image;
                uniform float u_scale;
                uniform float u_extrusion;
                uniform float u_res;
                uniform float u_mesh_z;
                out vec2 vUv;
                out vec4 vTexColor;
                out float vVisibility;

                void main() {
                    // ── DYNAMIC VOXEL RESOLUTION ───────────────────────────
                    float gridRes = clamp(u_res, 1.0, 512.0);
                    float blockSize = 300.0 / gridRes;
                    
                    vec3 pos = position;
                    // Snapped Local Coordinates
                    float snappedX = floor(pos.x / blockSize + 0.5) * blockSize;
                    float snappedZ = floor(pos.z / blockSize + 0.5) * blockSize;
                    
                    // If extrusion is 0, turn off snapping (show full-res image)
                    float isFlat = step(u_extrusion, 0.01); // 1 if extrusion <= 0.01 (flat), 0 if extrusion > 0.01
                    pos.x = mix(snappedX, pos.x, isFlat);
                    pos.z = mix(snappedZ, pos.z, isFlat);
                    
                    // ── SAMPLING & HEIGHT ────────────────────────────────
                    vUv = vec2(uv.x, uv.y * u_scale);
                    
                    // HEIGHT SNAP: Align UV sample exactly with physical columns
                    // Map the resulting physical position back into 0-1 UV space.
                    vec2 hUv = vec2((pos.x / 300.0) + 0.5, 0.5 - (pos.z / 500.0));
                    vec2 samplingUv = mix(hUv, uv, isFlat);
                    
                    vTexColor = texture(u_image, vec2(samplingUv.x, samplingUv.y * u_scale));
                    float heightVal = dot(vTexColor.rgb, vec3(0.333));
                    
                    // ── ALPHA & FOG ───────────────────────
                    // Side fade (X)
                    float sideFade = smoothstep(150.0, 147.0, abs(pos.x)); 
                    // Depth fog (Z)
                    float zFog = smoothstep(150.0, 250.0, abs(pos.z + u_mesh_z));
                    // Visibility combines height threshold, side fade, and depth fog
                    vVisibility = step(0.01, heightVal) * sideFade * (1.0 - zFog);

                    pos.y += heightVal * u_extrusion * sideFade;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D u_image;
                uniform float u_extrusion;
                in vec2 vUv;
                in vec4 vTexColor;
                in float vVisibility;
                out vec4 outColor;

                void main() {
                    // Use full-res texture when extrusion is 0
                    float isFlat = step(u_extrusion, 0.01);
                    vec4 flatColor = texture(u_image, vUv);
                    vec4 finalColor = mix(vTexColor, flatColor, isFlat);

                    outColor = vec4(finalColor.rgb, finalColor.a * vVisibility);
                }
            `,
            side: THREE.DoubleSide
        });

        const matA = material;
        const matB = material.clone();

        const meshA = new THREE.Mesh(geometry, matA);
        const meshB = new THREE.Mesh(geometry, matB);

        // Draw both terrain segments after the sky is drawn (fixes terrain being depth masked by the sky)
        meshA.renderOrder = 1;
        meshB.renderOrder = 1;

        meshA.frustumCulled = true;
        meshB.frustumCulled = true;

        // Wrap both meshes in a group so we can rotate the whole terrain as a unit
        const terrainGroup = new THREE.Group();
        terrainGroup.add(meshA);
        terrainGroup.add(meshB);
        scene.add(terrainGroup);

        const meshes = [meshA, meshB];

        // STABILIZER: Phantom mesh to keep engine initialized
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
                const scale = p ? p[0] : 1;
                const extrusion = p ? p[1] : 0;
                const speed = p ? p[2] * 5 : 0;
                const resolution = p ? p[3] : 100;

                // Threshold: Map 0..100 (UI) to 2..512 (Shader)
                let targetRes = Math.max(2, Math.floor(2 + (resolution / 100.0) * 510.0));

                /**
                 * GRID ALIGNMENT: To prevent artifacts at the edges of the meshes, 
                 * we ensure the voxel size (blockSize) is a perfect divisor of the plane length (500).
                 * blockSize = 300 / u_res. We want K (number of voxels) = 500 / blockSize to be an even integer:
                 * K = 500 / (300 / u_res) = 500 * (u_res / 300) = 5/3 * u_res
                 * u_res = K * (3/5)
                 * Multiply K by 2 to force it to be an even integer:
                 * targetRes = K * 2 * (3/5) = K * 1.2
                 */
                targetRes = Math.round(targetRes / 1.2) * 1.2; // Snap targetRes to the nearest multiple of 1.2

                // Rotation angles (0–100 slider maps to 0–2π radians = full 360°)
                const toRad = (v: number) => (v / 100.0) * Math.PI * 2.0;
                terrainGroup.rotation.x = toRad(p[4] ?? 0);
                terrainGroup.rotation.y = toRad(p[5] ?? 0);
                terrainGroup.rotation.z = toRad(p[6] ?? 0);

                // Elevation: Map 0-100 to -500 to +500 world units. 50 = default (0)
                terrainGroup.position.y = ((p[7] ?? 50) - 50) * 10.0;

                // Distance offset
                const zOffset = ((p[8] ?? 50) - 50) * 10.0;
                terrainGroup.position.z = zOffset;

                // Travel distance in world units
                const rawTravel = (params.integratedValues && params.integratedValues.length >= 3)
                    ? params.integratedValues[2]
                    : (params.time || 0.0);
                const travelZ = rawTravel * speed;

                // Two planes 500 units apart, looping
                meshes[0].position.z = ((travelZ) % 1000.0) - 500.0;
                meshes[1].position.z = ((travelZ + 500.0) % 1000.0) - 500.0;

                meshes.forEach(m => {
                    const mat = m.material as THREE.ShaderMaterial;
                    mat.uniforms.u_image.value = texture;
                    mat.uniforms.u_scale.value = scale;
                    mat.uniforms.u_extrusion.value = extrusion;
                    mat.uniforms.u_res.value = targetRes;

                    // Pass local z-offset to shader for bounds-checking
                    mat.uniforms.u_mesh_z.value = m.position.z;
                });

                cube.rotation.y += 0.01;

            },
            dispose: () => {
                geometry.dispose();
                material.dispose();
                matB.dispose();
                scene.clear();
            }
        };
    },
    TERRAIN_SPHERE: () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
        camera.position.set(0, 0, 120);
        camera.lookAt(0, 0, 0);

        const meshRes = 512; // Fixed high-res base geometry
        const geometry = new THREE.SphereGeometry(30, meshRes, meshRes);

        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            transparent: true,
            uniforms: {
                u_image: { value: null },
                u_extrusion: { value: 0.0 },
                u_res: { value: 100.0 },
            },
            vertexShader: `
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

                    // ── DISPLACE ALONG SPHERE NORMAL ──────────────────────────
                    // For a unit sphere the geometric normal == normalized position.
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
            `,
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

        const sphereGroup = new THREE.Group();
        sphereGroup.add(mesh);
        scene.add(sphereGroup);

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
                    const distance = p[2]; // 0-100 → camera distance

                    // Resolution: map 0-100 → 2-512 voxel cells
                    const virtualRes = Math.max(2, Math.floor(2 + (resolution / 100.0) * 510.0));

                    // Distance: 0 = very far (200 units), 100 = very close (50 units)
                    camera.position.z = 200 - (distance / 100.0) * 150.0;

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
                    sphereGroup.rotation.x = toRad(p[3] ?? 0);
                    sphereGroup.rotation.y = toRad(p[4] ?? 0);
                    sphereGroup.rotation.z = toRad(p[5] ?? 0);

                    material.uniforms.u_image.value = texture;
                    material.uniforms.u_extrusion.value = extrusion;
                    material.uniforms.u_res.value = virtualRes;
                }
                phantom.rotation.y += 0.01;
            },
            dispose: () => {
                geometry.dispose();
                material.dispose();
                scene.clear();
            }
        };
    },
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
    }
};
