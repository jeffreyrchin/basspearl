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
    }
};
