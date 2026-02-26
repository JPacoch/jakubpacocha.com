import * as THREE from 'three';

let currentCleanup = null;

window.initHeroParticles = () => {
    if (currentCleanup) currentCleanup();
    currentCleanup = null;

    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const cols = 80;
    const rows = 50;

    const vHeight = 2 * 100 * Math.tan(45 / 2 * (Math.PI / 180));
    const vWidth = vHeight * (window.innerWidth / window.innerHeight);

    const geometry = new THREE.BufferGeometry();
    const count = cols * rows;
    const positions = new Float32Array(count * 3);
    const basePositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    let idx = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = (j / (cols - 1) - 0.5) * vWidth * 1.3; 
            const y = (i / (rows - 1) - 0.5) * vHeight * 1.3;
            const z = 0;

            positions[idx] = x;
            positions[idx + 1] = y;
            positions[idx + 2] = z;

            basePositions[idx] = x;
            basePositions[idx + 1] = y;
            basePositions[idx + 2] = z;

            idx += 3;
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x0034e0,
        size: 0.35,
        transparent: true,
        opacity: 0.4
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const mouse = new THREE.Vector2(-9999, -9999);
    const onMouseMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onMouseMove);

    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const cursorWorld = new THREE.Vector3();

    const SPRING_K = 0.08;
    const SPRING_D = 0.85;
    const REPULSE_FORC = 10.0;
    const RADIUS = 6;

    let animationId;
    const tick = () => {
        const delta = clock.getDelta();

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        material.color.setHex(isLight ? 0x0034e0 : 0xc8f070);
        material.size = isLight ? 0.4 : 0.6;
        material.opacity = isLight ? 0.3 : 0.15;

        cursorWorld.set(mouse.x, mouse.y, 0.5);
        cursorWorld.unproject(camera);
        cursorWorld.sub(camera.position).normalize();
        const distanceToZ0 = -camera.position.z / cursorWorld.z;
        cursorWorld.multiplyScalar(distanceToZ0).add(camera.position);

        const pos = geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const bx = basePositions[i3];
            const by = basePositions[i3 + 1];

            let px = pos[i3];
            let py = pos[i3 + 1];

            let vx = velocities[i3];
            let vy = velocities[i3 + 1];

            const dx = bx - cursorWorld.x;
            const dy = by - cursorWorld.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let targetX = bx;
            let targetY = by;

            if (dist < RADIUS) {
                const force = Math.pow(1 - dist / RADIUS, 1.5) * REPULSE_FORC;
                targetX = bx + (dx / dist) * force * RADIUS;
                targetY = by + (dy / dist) * force * RADIUS;
            }

            const ax = (targetX - px) * SPRING_K;
            const ay = (targetY - py) * SPRING_K;

            vx = (vx + ax) * SPRING_D;
            vy = (vy + ay) * SPRING_D;

            pos[i3] += vx;
            pos[i3 + 1] += vy;

            velocities[i3] = vx;
            velocities[i3 + 1] = vy;
        }

        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(tick);
    };

    tick();

    currentCleanup = () => {
        window.removeEventListener('pointermove', onMouseMove);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(animationId);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
    };
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initHeroParticles);
} else {
    window.initHeroParticles();
}
