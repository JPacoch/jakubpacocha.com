import * as THREE from 'three';

window.__APP_MACHINES__ = window.__APP_MACHINES__ || {};

let currentCleanup = null;

function createParticlesMachine() {
    let state = {
        value: 'uninitialized',
        context: {
            theme: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
            pointerState: 'idle',
            repulsedParticles: 0
        }
    };

    const transitions = {
        uninitialized: {
            MOUNT: 'running',
            NO_CANVAS: 'disposed'
        },
        running: {
            VISIBILITY_HIDDEN: 'paused',
            DISPOSE: 'disposed',
            THEME_CHANGE: (ctx, event) => ({
                target: 'running',
                context: { ...ctx, theme: event.theme }
            }),
            POINTER_INTERACT: (ctx, event) => {
                const nextPointerState = event.repulsed > 0 ? 'repulsing' : 'idle';
                if (ctx.pointerState === nextPointerState && ctx.repulsedParticles === event.repulsed) {
                    return null;
                }
                return {
                    target: 'running',
                    context: {
                        ...ctx,
                        pointerState: nextPointerState,
                        repulsedParticles: event.repulsed
                    }
                };
            }
        },
        paused: {
            VISIBILITY_VISIBLE: 'running',
            DISPOSE: 'disposed',
            THEME_CHANGE: (ctx, event) => ({
                target: 'paused',
                context: { ...ctx, theme: event.theme }
            })
        },
        disposed: {
            MOUNT: 'running'
        }
    };

    function send(event) {
        const eventObj = typeof event === 'string' ? { type: event } : (event || { type: 'NOOP' });
        const stateHandlers = transitions[state.value];
        const handler = stateHandlers && stateHandlers[eventObj.type];
        if (!handler) return state;

        if (typeof handler === 'string') {
            state = { value: handler, context: state.context };
        } else if (typeof handler === 'function') {
            const next = handler(state.context, eventObj);
            if (!next) return state;
            state = {
                value: next.target || state.value,
                context: next.context !== undefined ? next.context : state.context
            };
        }
        return state;
    }

    const machine = {
        id: 'heroParticles',
        states: Object.keys(transitions),
        send,
        getSnapshot: () => ({
            id: 'heroParticles',
            state: state.value,
            context: state.context,
            states: Object.keys(transitions),
            availableEvents: Object.keys(transitions[state.value] || {})
        })
    };

    Object.defineProperties(machine, {
        state: { get: () => state.value, enumerable: true },
        context: { get: () => state.context, enumerable: true }
    });

    window.__APP_MACHINES__.heroParticles = machine;
    return machine;
}

const particlesMachine = createParticlesMachine();

window.initHeroParticles = () => {
    if (currentCleanup) currentCleanup();
    currentCleanup = null;

    const canvas = document.getElementById('hero-particles');
    if (!canvas) {
        particlesMachine.send('NO_CANVAS');
        return;
    }

    particlesMachine.send('MOUNT');
    canvas.setAttribute('data-machine', 'heroParticles');
    canvas.setAttribute('data-state', particlesMachine.state);

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

    const applyThemeToMaterial = (theme) => {
        const isLight = theme === 'light';
        material.color.setHex(isLight ? 0x0034e0 : 0xc8f070);
        material.size = isLight ? 0.4 : 0.6;
        material.opacity = isLight ? 0.3 : 0.15;
    };

    const syncThemeFromDom = () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const nextTheme = isLight ? 'light' : 'dark';
        particlesMachine.send({ type: 'THEME_CHANGE', theme: nextTheme });
        applyThemeToMaterial(nextTheme);
    };
    syncThemeFromDom();

    const themeObserver = new MutationObserver(syncThemeFromDom);
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
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

    const cursorWorld = new THREE.Vector3();

    const SPRING_K = 0.08;
    const SPRING_D = 0.85;
    const REPULSE_FORC = 10.0;
    const RADIUS = 6;

    let animationId = null;
    const tick = () => {
        if (particlesMachine.state !== 'running') {
            animationId = null;
            return;
        }

        cursorWorld.set(mouse.x, mouse.y, 0.5);
        cursorWorld.unproject(camera);
        cursorWorld.sub(camera.position).normalize();
        const distanceToZ0 = -camera.position.z / cursorWorld.z;
        cursorWorld.multiplyScalar(distanceToZ0).add(camera.position);

        const pos = geometry.attributes.position.array;
        let repulsedCount = 0;

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

            if (dist < RADIUS && dist > 0.0001) {
                repulsedCount++;
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

        particlesMachine.send({ type: 'POINTER_INTERACT', repulsed: repulsedCount });

        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(tick);
    };

    const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            particlesMachine.send('VISIBILITY_HIDDEN');
            canvas.setAttribute('data-state', particlesMachine.state);
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else {
            particlesMachine.send('VISIBILITY_VISIBLE');
            canvas.setAttribute('data-state', particlesMachine.state);
            if (animationId === null) {
                animationId = requestAnimationFrame(tick);
            }
        }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    tick();

    currentCleanup = () => {
        particlesMachine.send('DISPOSE');
        canvas.setAttribute('data-state', particlesMachine.state);
        themeObserver.disconnect();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pointermove', onMouseMove);
        window.removeEventListener('resize', onResize);
        if (animationId !== null) cancelAnimationFrame(animationId);
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
