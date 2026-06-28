import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Lightweight 3D turntable that maps the 4 try-on result images
 * (front / right / back / left) onto billboards arranged around a cylinder, so
 * the user can drag to "rotate the figure" in real 3D perspective.
 *
 * It's image-based (not a reconstructed mesh) — the honest, reliable way to get
 * a rotatable 3D look from 4 sparse views. Each billboard fades in only while it
 * faces the camera, so you always see a clean, undistorted view with a smooth
 * hand-off between angles as you spin.
 *
 * props.images = { front, right, back, left }  (data URLs; missing ones skipped)
 */
export default function OutfitViewer3D({ images = {} }) {
    const mountRef = useRef(null);
    // rotation state shared with the animation loop
    const rot = useRef({ angle: 0, vel: 0, dragging: false, lastX: 0 });

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // Which views do we actually have, and at what angle they sit on the ring.
        const layout = [
            ['front', 0],
            ['right', -Math.PI / 2],
            ['back', Math.PI],
            ['left', Math.PI / 2],
        ].filter(([k]) => images[k]);
        if (layout.length === 0) return;

        let W = mount.clientWidth || 400;
        let H = mount.clientHeight || 600;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
        camera.position.set(0, 0, 7.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.cursor = 'grab';
        renderer.domElement.style.touchAction = 'none';

        scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        const group = new THREE.Group();
        scene.add(group);

        const R = 1.4;            // ring radius
        const TARGET_H = 4.2;     // billboard height in world units
        const loader = new THREE.TextureLoader();
        const planes = [];

        let needsRender = true;
        const requestRender = () => { needsRender = true; };

        layout.forEach(([key, ang]) => {
            const geo = new THREE.PlaneGeometry(1, 1);
            const mat = new THREE.MeshBasicMaterial({
                transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide,
            });
            const plane = new THREE.Mesh(geo, mat);
            plane.position.set(Math.sin(ang) * R, 0, Math.cos(ang) * R);
            plane.rotation.y = ang;              // face radially outward
            plane.userData.ang = ang;
            group.add(plane);
            planes.push(plane);

            loader.load(
                images[key],
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    mat.map = tex;
                    mat.needsUpdate = true;
                    const aspect = (tex.image?.width || 3) / (tex.image?.height || 4);
                    plane.scale.set(TARGET_H * aspect, TARGET_H, 1);
                    requestRender();
                },
                undefined,
                () => requestRender(),
            );
        });

        const updateFacing = () => {
            planes.forEach((p) => {
                const worldAng = p.userData.ang + group.rotation.y;
                const facing = Math.cos(worldAng);                 // 1 = facing camera
                const op = THREE.MathUtils.clamp((facing - 0.45) / 0.55, 0, 1);
                p.material.opacity = op;
                p.visible = op > 0.01;
                p.renderOrder = facing;                            // front-most on top
            });
        };

        // ----- interaction -----
        const el = renderer.domElement;
        const onDown = (x) => { rot.current.dragging = true; rot.current.lastX = x; rot.current.vel = 0; el.style.cursor = 'grabbing'; };
        const onMove = (x) => {
            const r = rot.current;
            if (!r.dragging) return;
            const dx = x - r.lastX; r.lastX = x;
            const d = dx * 0.011;
            r.angle += d; r.vel = d;
            requestRender();
        };
        const onUp = () => { rot.current.dragging = false; el.style.cursor = 'grab'; };

        const md = (e) => onDown(e.clientX);
        const mm = (e) => onMove(e.clientX);
        const mu = () => onUp();
        const td = (e) => onDown(e.touches[0].clientX);
        const tm = (e) => onMove(e.touches[0].clientX);
        const tu = () => onUp();

        el.addEventListener('mousedown', md);
        window.addEventListener('mousemove', mm);
        window.addEventListener('mouseup', mu);
        el.addEventListener('touchstart', td, { passive: true });
        el.addEventListener('touchmove', tm, { passive: true });
        el.addEventListener('touchend', tu);

        const onResize = () => {
            W = mount.clientWidth || W; H = mount.clientHeight || H;
            camera.aspect = W / H; camera.updateProjectionMatrix();
            renderer.setSize(W, H); requestRender();
        };
        window.addEventListener('resize', onResize);

        // ----- loop (inertia + snap to nearest view) -----
        let raf;
        const SNAP = (2 * Math.PI) / Math.max(layout.length, 1);
        const loop = () => {
            const r = rot.current;
            if (!r.dragging) {
                if (Math.abs(r.vel) > 0.0006) {
                    r.angle += r.vel; r.vel *= 0.93; requestRender();
                } else {
                    r.vel = 0;
                    // ease toward the nearest view angle
                    const nearest = Math.round(r.angle / SNAP) * SNAP;
                    const diff = nearest - r.angle;
                    if (Math.abs(diff) > 0.002) { r.angle += diff * 0.12; requestRender(); }
                }
            }
            if (needsRender) {
                group.rotation.y = r.angle;
                updateFacing();
                renderer.render(scene, camera);
                needsRender = false;
            }
            raf = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(raf);
            el.removeEventListener('mousedown', md);
            window.removeEventListener('mousemove', mm);
            window.removeEventListener('mouseup', mu);
            el.removeEventListener('touchstart', td);
            el.removeEventListener('touchmove', tm);
            el.removeEventListener('touchend', tu);
            window.removeEventListener('resize', onResize);
            planes.forEach((p) => { p.material.map?.dispose?.(); p.material.dispose(); p.geometry.dispose(); });
            renderer.dispose();
            if (el.parentNode) el.parentNode.removeChild(el);
        };
    }, [images]);

    return <div ref={mountRef} className="w-full h-full" />;
}
