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

        /**
         * HYBRID VOXEL ARCHITECTURE:
         * We use a fixed high-resolution mesh (256+ segments) and handle 'Voxels' purely in the 
         * vertex shader. This eliminates CPU bottlenecks and geometry recreation jank when 
         * dragging the resolution slider. To maintain perfectly square blocks across the 
         * entire landscape, we scale the segment count to match the plane's aspect ratio.
         */
        const meshResX = 256;
        const meshResY = Math.floor(meshResX * (500.0 / 300.0));
        let geometry = new THREE.PlaneGeometry(300, 500, meshResX, meshResY);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            transparent: true,
            uniforms: {
                u_image: { value: null },
                u_scale: { value: 1.0 },
                u_extrusion: { value: 0.0 },
                u_uv_offset: { value: 0.0 },
                u_is_max_res: { value: 0.0 },
                u_res: { value: 1.0 },
                u_mesh_z: { value: 0.0 },
            },
            vertexShader: `
                uniform sampler2D u_image;
                uniform float u_scale;
                uniform float u_extrusion;
                uniform float u_uv_offset;
                uniform float u_is_max_res;
                uniform float u_res;
                uniform float u_mesh_z;
                out vec2 vUv;
                flat out vec4 vColorFlat;
                out vec2 vLocalPos;

                void main() {
                    // Block size defines the 'Visual Resolution' snapped in world units
                    float blockSize = 300.0 / clamp(u_res, 1.0, 256.0);
                    
                    // Step 1: Snap physical vertex positions to the virtual voxel grid
                    vec3 snappedPos = position;
                    snappedPos.x = floor(position.x / blockSize + 0.5) * blockSize;
                    snappedPos.z = floor(position.z / blockSize + 0.5) * blockSize;
                    
                    // Step 2: Interpolate between the snapped grid and raw high-res geometry
                    vec3 pos = mix(snappedPos, position, u_is_max_res);
                    
                    // Step 3: Map world coordinates to scrolling texture UVs
                    vUv = vec2(pos.x / 300.0 + 0.5, 1.0 - ((pos.z / 20.0) * (u_scale / 50.0) + u_uv_offset));
                    
                    vec3 luminanceWeights = vec3(0.333);
                    vec4 tex = texture(u_image, vUv);
                    float luminance = dot(tex.rgb, luminanceWeights);
                    float h = luminance * (u_extrusion / 1.0);
                    
                    // Step 4: Right-side face color fix
                    // We sample the neighbor to the left to ensure right-facing mountain 
                    // slopes are colored with the peak color rather than the ground.
                    vec3 leftPos = pos - vec3(blockSize, 0.0, 0.0);
                    vec2 leftUv = vec2(leftPos.x / 300.0 + 0.5, 1.0 - ((leftPos.z / 20.0) * (u_scale / 50.0) + u_uv_offset));
                    vec4 leftTex = texture(u_image, leftUv);
                    float hL = dot(leftTex.rgb, luminanceWeights);
                    vColorFlat = mix(tex, leftTex, clamp((hL - luminance) * 10.0, 0.0, 1.0)); // Prevent flickering colors
                    
                    pos.y += h;
                    vLocalPos = vec2(position.x, position.z + u_mesh_z);

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D u_image;
                uniform float u_is_max_res;
                in vec2 vUv;
                flat in vec4 vColorFlat;
                in vec2 vLocalPos;
                out vec4 outColor;

                void main() {
                    // Voxel: Solid color per triangle face using the vertex peak color
                    // Full-res: Smooth per-pixel sampling
                    vec4 smoothColor = texture(u_image, vUv);
                    vec4 finalColor = mix(vColorFlat, smoothColor, u_is_max_res);

                    // Object-Space Edge Fog
                    // Fades out the physical boundaries of the local terrain geometry
                    // so it perfectly rotates along with the mesh!
                    float zFog = smoothstep(150.0, 300.0, abs(vLocalPos.y));
                    float xFog = smoothstep(120.0, 150.0, abs(vLocalPos.x));
                    float edgeAlpha = 1.0 - max(zFog, xFog);
                    
                    outColor = finalColor * edgeAlpha;
                }
            `,
            side: THREE.FrontSide
        });

        const matA = material;
        const matB = material.clone();

        const meshA = new THREE.Mesh(geometry, matA);
        const meshB = new THREE.Mesh(geometry, matB);

        // Draw both terrain segments after the sky is drawn (fixes terrain being depth masked by the sky)
        meshA.renderOrder = 1;
        meshB.renderOrder = 1;

        meshA.frustumCulled = false;
        meshB.frustumCulled = false;

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

                if (p && p.length >= 4) {
                    const scale = p[0];
                    const extrusion = p[1];
                    const speed = (p[2] / 100.0 * 50.0);
                    // Map 0-100 slider to 4-256 resolution range 
                    // Lower sliders use Voxels; 100 triggers full-res cinematic mode
                    const resolution = Math.max(1, p[3]);
                    const isMaxRes = resolution >= 100.0 ? 1.0 : 0.0;

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

                    // The 'Grid' we snap to in the shader
                    // RESOLUTION CEILING: 256 max identifies smaller squares
                    const virtualRes = Math.max(2, Math.floor(4 + resolution * 2.54));

                    // Physical length for tiling calculation
                    const segmentLen = 500.0;
                    const wrapDistInShader = 20.0; // Shader tiles every 20 units
                    const scaleFactor = (scale / 50.0 || 1.0);
                    const unitsPerSegment = (segmentLen / wrapDistInShader) * scaleFactor;

                    // Travel distance
                    const rawTravel = (params.integratedValues && params.integratedValues.length >= 3)
                        ? params.integratedValues[2]
                        : (params.time || 0.0);

                    const worldTravelZ = rawTravel * speed * 20.0;

                    /**
                     * LEAP-FROG SCROLLING:
                     * Two 1000-unit mesh segments cycle through the scene to create an infinite
                     * landscape. We sync the UV offsets to the physical position so the 
                     * texture patterns never 'jump' as the segments wrap around.
                     */
                    meshes.forEach((m, idx) => {
                        const mat = m.material as THREE.ShaderMaterial;
                        mat.uniforms.u_image.value = texture;
                        mat.uniforms.u_is_max_res.value = isMaxRes;
                        mat.uniforms.u_scale.value = scale;
                        mat.uniforms.u_extrusion.value = extrusion;
                        mat.uniforms.u_res.value = virtualRes;

                        // Leap-frog: each mesh moves by worldTravelZ
                        let z = worldTravelZ - (idx * segmentLen);
                        let cycle = Math.floor(z / (segmentLen * 2.0));
                        let wrappedZ = ((z % (segmentLen * 2.0)) + (segmentLen * 2.0)) % (segmentLen * 2.0);

                        // Reposition mesh
                        m.position.z = wrappedZ - segmentLen;

                        // Pass local z-offset to shader for bounds-checking
                        mat.uniforms.u_mesh_z.value = m.position.z;

                        // Calculate unique UV offset per segment to maintain texture continuity.
                        // This ensures the mountains are identical every time they scroll in.
                        mat.uniforms.u_uv_offset.value = -(cycle * 2.0 + idx) * unitsPerSegment;
                    });
                }

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

        /**
         * TERRAIN SPHERE ARCHITECTURE:
         * A UV sphere with enough segments to support fine voxel snapping.
         * The vertex shader snaps longitude/latitude to a virtual voxel grid,
         * then displaces each vertex along its geometric normal by luminance.
         * Resolution controls the granularity of the voxel snap.
         */
        const meshRes = 256; // Fixed high-res base geometry
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
                flat out vec4 vColorFlat;
                out float vFaceAlpha;

                void main() {
                    // ── Step 1: Snap UVs to the voxel grid ─────────────────────
                    // u_res drives how many cells cover the sphere surface.
                    // At max res (256+) we pass UV straight through for smooth mode.
                    float gridRes = clamp(u_res, 2.0, 256.0);
                    vec2 snappedUv = floor(uv * gridRes + 0.5) / gridRes;
                    vec2 finalUv   = mix(snappedUv, uv, step(256.0, u_res));

                    // ── Step 2: Sample luminance at the snapped UV ──────────────
                    vec4 tex = texture(u_image, finalUv);
                    vec3 luminanceWeights = vec3(0.333);
                    float luma = dot(tex.rgb, luminanceWeights);

                    // ── Step 3: Displace along the sphere normal ────────────────
                    // The geometric normal of a unit sphere IS the normalized position.
                    vec3 norm  = normalize(normal);
                    float disp = luma * u_extrusion;
                    vec3 pos   = position + norm * disp;

                    // ── Step 4: Omnidirectional ridge color fix ─────────────────
                    // Sample all four cardinal neighbors with fract() wrapping so the
                    // UV seam is handled correctly and slopes in every direction are fixed.
                    // We pick the brightest (highest) neighbor and blend toward it so that
                    // a face belonging to a peak is always colored like the peak, not the valley.
                    float du = 1.0 / gridRes;
                    vec4 nL = texture(u_image, fract(finalUv - vec2(du,  0.0)));
                    vec4 nR = texture(u_image, fract(finalUv + vec2(du,  0.0)));
                    vec4 nD = texture(u_image, fract(finalUv - vec2(0.0, du)));
                    vec4 nU = texture(u_image, fract(finalUv + vec2(0.0, du)));

                    float lL = dot(nL.rgb, luminanceWeights);
                    float lR = dot(nR.rgb, luminanceWeights);
                    float lD = dot(nD.rgb, luminanceWeights);
                    float lU = dot(nU.rgb, luminanceWeights);

                    // Find the brightest neighbor and blend toward it proportionally
                    float maxNeighborLuma = max(max(lL, lR), max(lD, lU));
                    vec4 brightestNeighbor = (maxNeighborLuma == lL) ? nL
                                           : (maxNeighborLuma == lR) ? nR
                                           : (maxNeighborLuma == lD) ? nD : nU;
                    vColorFlat = mix(tex, brightestNeighbor, clamp((maxNeighborLuma - luma) * 10.0, 0.0, 1.0));

                    // ── Step 5: Backface fade ───────────────────────────────────
                    // Vertices whose normals point away from the camera fade to 0 alpha.
                    // This creates a clean horizon without needing two-sided rendering.
                    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0)); // camera looks along -Z in view space
                    vec3 worldNorm = normalize((modelMatrix * vec4(norm, 0.0)).xyz);
                    vec3 camDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
                    float facing = dot(worldNorm, camDir);
                    vFaceAlpha = smoothstep(-0.15, 0.25, facing);

                    vUv = finalUv;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D u_image;
                uniform float u_res;
                in vec2 vUv;
                flat in vec4 vColorFlat;
                in float vFaceAlpha;
                out vec4 outColor;

                void main() {
                    // Smooth mode at max resolution, voxel/flat otherwise
                    float smoothMode = step(256.0, u_res);
                    vec4 smoothColor = texture(u_image, vUv);
                    vec4 finalColor  = mix(vColorFlat, smoothColor, smoothMode);

                    outColor = vec4(finalColor.rgb, finalColor.a * vFaceAlpha);
                }
            `,
            side: THREE.FrontSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;

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
                    const resolution = p[1]; // 0-100 → 2-256 voxel cells
                    const distance = p[2]; // 0-100 → camera distance

                    // Resolution: map 0-100 → 2-256 voxel cells, 100 becomes smooth (>256 threshold)
                    const virtualRes = Math.max(2, Math.floor(2 + resolution * 2.54));

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
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000);
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
                in vec2 vUv;
                flat in vec4 vColor;
                out vec4 outColor;

                void main() {
                    vec4 col = texture(u_image, vUv);

                    // Edge feather: fade out as UV approaches the plane border
                    vec2 d = abs(vUv - 0.5);          // 0 at centre, 0.5 at edge
                    float inner = 0.5 - max(u_feather * 0.5, 0.001);
                    float ax = 1.0 - smoothstep(inner, 0.5, d.x);
                    float ay = 1.0 - smoothstep(inner, 0.5, d.y);

                    outColor = vec4(col.rgb, col.a * ax * ay * u_alpha);
                }
            `,
        });

        // N-plane leap-frog tunnel
        const NUM_PLANES = 10;
        const materials: THREE.ShaderMaterial[] = [];
        const meshes: THREE.Mesh[] = [];

        const tunnelGroup = new THREE.Group();
        for (let i = 0; i < NUM_PLANES; i++) {
            const mat = i === 0 ? material : material.clone();
            materials.push(mat);
            const mesh = new THREE.Mesh(geometry, mat);
            mesh.frustumCulled = false;
            mesh.renderOrder = 1;
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
                if (p && p.length >= 5) {
                    // p[0] Speed    0-100
                    // p[1] Depth    0-100
                    // p[2] Density  0-100 → segment length 100-600 world units
                    // p[3] Edge Feather  0-100 → 0.0-0.5 UV fade width
                    // p[4] Fade Buffer 0-100 → 0.0-1.0 segment fade zone

                    const speed = (p[0] / 100.0) * 10.0;
                    const fov = 30.0 + (p[1] / 100.0) * 90.0;
                    const segLen = 600.0 - (p[2] / 100.0) * 500.0;
                    const feather = p[3] / 100.0;
                    const fade = Math.max(p[4] / 100.0, 0.01);

                    const width = params.width;
                    const height = params.height;
                    const aspect = width / height;

                    if (camera.fov !== fov) {
                        camera.fov = fov;
                        camera.updateProjectionMatrix();
                    }

                    // Travel distance
                    const rawTravel = (params.integratedValues && params.integratedValues.length >= 3)
                        ? params.integratedValues[0]
                        : (params.time || 0.0);

                    const travelZ = rawTravel * speed * segLen;

                    // Camera drifts forward along -Z
                    camera.position.set(0, 0, 0);
                    camera.lookAt(0, 0, -1);

                    const totalLength = segLen * NUM_PLANES;

                    // LEAP-FROG: NUM_PLANES planes cycle every totalLength
                    meshes.forEach((m, idx) => {
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

                        mat.uniforms.u_image.value = texture;
                        mat.uniforms.u_feather.value = feather;
                        mat.uniforms.u_alpha.value = fadeIn * fadeOut;
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
