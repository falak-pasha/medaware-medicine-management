/**
 * MEDAWARE | Decorative 3D backgrounds (Three.js r159, self-hosted in js/vendor/).
 *
 * One WebGL canvas (#bgCanvas) with two modes, chosen by whichever [data-scene]
 * element on the page is visible (not .hidden):
 *   - data-scene="login": floating two-tone capsules and soft particles;
 *   - data-scene="home":  a slow wave (custom shader) and floating capsules.
 *
 * - Colours come from the active theme's CSS variables (--particle-color-1..5 in
 *   css/theme.css) and update live when js/shared/theme.js changes <html data-theme>.
 * - Sets body.auth-view / body.app-view for css/theme.css. Auth and data stay in
 *   js/pages/app.js and js/pages/profile.js; this file only draws.
 * - Motion is a function of elapsed time, so speed is the same at 60 Hz and 120 Hz.
 * - prefers-reduced-motion: one still frame per view, no animation loop or parallax.
 * - No WebGL (or Three.js failed to load): the CSS gradient background remains.
 * - Capsules are placed in empty space (margins and gaps), never behind text.
 */
(() => {
  const canvas = document.getElementById("bgCanvas");
  const views = [...document.querySelectorAll("[data-scene]")];
  if (!canvas || views.length === 0) return;

  function currentView() {
    return views.find((element) => !element.classList.contains("hidden"))?.dataset.scene ?? null;
  }

  function readPalette() {
    const styles = getComputedStyle(document.documentElement);
    const color = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
    return [
      color("--particle-color-1", "#7c6bc4"),
      color("--particle-color-2", "#4a3d8f"),
      color("--particle-color-3", "#a89cdb"),
      color("--particle-color-4", "#6c5ce7"),
      color("--particle-color-5", "#c4b8f0")
    ];
  }

  function createBackground() {
    const THREE = window.THREE;
    if (!THREE) return null;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "low-power"
      });
    } catch (error) {
      console.warn("MEDAWARE: WebGL is unavailable, using the plain background.", error);
      return null;
    }
    renderer.setClearColor(0x000000, 0); // transparent: the CSS gradient shows through

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isNarrow = () => window.innerWidth <= 780; // the breakpoint where layouts stack
    const CAPSULE_WHITE = new THREE.Color(0xfffafc);

    // ---------- Shared building blocks ----------

    function addLights(scene, keyIntensity, fillIntensity) {
      scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const keyLight = new THREE.DirectionalLight(0xffffff, keyIntensity);
      keyLight.position.set(5, 5, 5);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, fillIntensity);
      fillLight.position.set(-5, -5, 5);
      scene.add(fillLight);
      return (palette) => {
        keyLight.color.set(palette[0]);
        fillLight.color.set(palette[1]);
      };
    }

    // Coloured half + white half, like a real capsule.
    function capsuleMesh() {
      const geometry = new THREE.CapsuleGeometry(0.3, 1, 8, 20);
      geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
      return new THREE.Mesh(
        geometry,
        new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x444444 })
      );
    }

    function colourCapsule(mesh, color) {
      const top = new THREE.Color(color);
      const positions = mesh.geometry.attributes.position;
      const colors = mesh.geometry.attributes.color;
      for (let i = 0; i < positions.count; i++) {
        (positions.getY(i) >= 0 ? top : CAPSULE_WHITE).toArray(colors.array, i * 3);
      }
      colors.needsUpdate = true;
    }

    // Each capsule takes one of the palette's five colours.
    const CAPSULE_DEPTHS = [-2, -2.5, -1.5, -3, -3.5, -2.8];
    const CAPSULE_COLOUR_INDEX = [0, 1, 2, 3, 4, 0];

    function createCapsules(scene, count) {
      return CAPSULE_DEPTHS.slice(0, count).map((z, index) => {
        const mesh = capsuleMesh();
        mesh.userData = {
          z,
          index,
          phase: index * 1.7,
          spin: [0.25 + index * 0.05, 0.35 + index * 0.04, 0.1],
          tilt: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
        };
        scene.add(mesh);
        return mesh;
      });
    }

    function recolourCapsules(capsules, palette) {
      capsules.forEach((mesh) => colourCapsule(mesh, palette[CAPSULE_COLOUR_INDEX[mesh.userData.index]]));
    }

    function visibleSize(camera, z) {
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
      return { width: height * camera.aspect, height };
    }

    // Anchors are fractions of the visible area (x, y in -0.5..0.5).
    function placeCapsules(capsules, camera, layout, time, yOffset = 0) {
      capsules.forEach((mesh) => {
        const { index, z, phase, spin, tilt } = mesh.userData;
        const anchor = layout.anchors[index];
        mesh.visible = Boolean(anchor);
        if (!anchor) return;
        mesh.scale.setScalar(layout.scale);
        const area = visibleSize(camera, z);
        mesh.position.set(
          anchor[0] * area.width,
          anchor[1] * area.height + Math.sin(time * 0.5 + phase) * 0.25 + yOffset,
          z
        );
        mesh.rotation.set(tilt[0] + time * spin[0], tilt[1] + time * spin[1], tilt[2] + time * spin[2]);
      });
    }

    // ---------- Login mode: particles + capsules ----------

    function buildLogin() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      const recolourLights = addLights(scene, 1.6, 0.7);

      const dot = document.createElement("canvas");
      dot.width = dot.height = 64;
      const context = dot.getContext("2d");
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.45, "rgba(255,255,255,0.8)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
      const dotTexture = new THREE.CanvasTexture(dot);
      dotTexture.colorSpace = THREE.SRGBColorSpace;

      const particleCount = window.innerWidth < 600 ? 45 : 90;
      const particlePositions = new Float32Array(particleCount * 3);
      const particleBaseY = new Float32Array(particleCount);
      const particlePhase = new Float32Array(particleCount);
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 20;
        particleBaseY[i] = (Math.random() - 0.5) * 14;
        particlePositions[i * 3 + 1] = particleBaseY[i];
        particlePositions[i * 3 + 2] = -2 + (Math.random() - 0.5) * 10;
        particlePhase[i] = Math.random() * Math.PI * 2;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        size: 0.14,
        map: dotTexture,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        sizeAttenuation: true
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      const capsules = createCapsules(scene, 5);
      // Wide: side margins, the hero/card gap and below the hero.
      // Narrow: the band under the header and the empty right side beside short lines.
      const layouts = {
        wide: { scale: 0.65, anchors: [[-0.47, 0.22], [0.47, 0.12], [0.47, -0.4], [-0.27, -0.43], [0.065, 0.3]] },
        narrow: { scale: 0.42, anchors: [[-0.44, 0.375], [0.47, 0.2], [0.47, -0.02]] }
      };

      return {
        scene,
        camera,
        maxPixelRatio: 2,
        recolour(palette) {
          recolourLights(palette);
          particleMaterial.color.set(palette[0]);
          recolourCapsules(capsules, palette);
        },
        update(time) {
          const positions = particleGeometry.attributes.position;
          for (let i = 0; i < particleCount; i++) {
            positions.array[i * 3 + 1] = particleBaseY[i] + Math.sin(time * 0.6 + particlePhase[i]) * 0.18;
          }
          positions.needsUpdate = true;
          particles.rotation.y = time * 0.02;
          particles.rotation.x = Math.sin(time * 0.05) * 0.05;
          placeCapsules(capsules, camera, isNarrow() ? layouts.narrow : layouts.wide, time);
        }
      };
    }

    // ---------- Home mode: wave shader + capsules ----------

    function buildHome() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
      camera.position.set(0, 0, 5);
      const recolourLights = addLights(scene, 1.4, 0.6);

      // Large enough to cover a 21:9 screen at this depth, plus scroll parallax.
      const waveUniforms = {
        uTime: { value: 0 },
        // Kept soft so text sitting directly on the background keeps WCAG contrast.
        uOpacity: { value: 0.22 },
        uColor1: { value: new THREE.Color(0xffffff) },
        uColor2: { value: new THREE.Color() },
        uColor3: { value: new THREE.Color() }
      };
      const wave = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 24, 160, 96),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: waveUniforms,
          vertexShader: `
            uniform float uTime;
            varying float vNoise;

            void main() {
              vec3 pos = position;
              pos.z += sin(pos.x * 0.5 + uTime) * 0.3;
              pos.z += cos(pos.y * 0.5 + uTime * 0.7) * 0.3;
              vNoise = sin(pos.x * 0.35 + uTime) * cos(pos.y * 0.45 + uTime * 0.5);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            uniform float uOpacity;
            varying float vNoise;

            void main() {
              vec3 color = mix(uColor1, uColor2, vNoise * 0.5 + 0.5);
              color = mix(color, uColor3, abs(sin(vNoise)) * 0.4);
              gl_FragColor = vec4(color, uOpacity);
            }
          `
        })
      );
      wave.position.z = -4;
      scene.add(wave);

      const capsules = createCapsules(scene, 6);
      // Signed-in pages are a centred column, so capsules stay in the side margins.
      const layouts = {
        wide: {
          scale: 0.55,
          anchors: [[-0.46, 0.3], [0.46, 0.18], [-0.46, -0.12], [0.46, -0.32], [-0.45, -0.42], [0.45, 0.42]]
        },
        // Phone gutters are only 4vw, so capsules sit mostly off-screen and just peek in.
        narrow: { scale: 0.38, anchors: [[-0.56, 0.25], [0.56, -0.08], [-0.56, -0.38]] }
      };

      let scrollY = window.scrollY;
      window.addEventListener("scroll", () => {
        scrollY = window.scrollY;
      }, { passive: true });

      return {
        scene,
        camera,
        maxPixelRatio: 1.5, // a work area: keep the GPU cost low
        recolour(palette) {
          recolourLights(palette);
          waveUniforms.uColor2.value.set(palette[2]);
          waveUniforms.uColor3.value.set(palette[0]);
          recolourCapsules(capsules, palette);
        },
        update(time) {
          waveUniforms.uTime.value = time * 0.9;
          // Gentle scroll parallax: the background drifts slightly as the page scrolls.
          const drift = Math.min(scrollY * 0.0012, 3);
          wave.position.y = drift * 0.6;
          placeCapsules(capsules, camera, isNarrow() ? layouts.narrow : layouts.wide, time, drift);
        }
      };
    }

    // ---------- Lifecycle ----------

    const builders = { login: buildLogin, home: buildHome };
    const modes = {};
    let mode = null;
    let running = false;
    let frameId = null;
    const startTime = performance.now();
    const pointer = { x: 0, y: 0 };
    const lookTarget = new THREE.Vector3(0, 0, -2);

    function onPointerMove(event) {
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    }

    function resize() {
      if (!mode) return;
      const { camera, maxPixelRatio } = modes[mode];
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    function draw(time, withParallax) {
      const { scene, camera, update } = modes[mode];
      update(time);
      if (withParallax) {
        camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
        camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.04;
      } else {
        camera.position.set(0, 0, 5);
      }
      camera.lookAt(lookTarget);
      renderer.render(scene, camera);
    }

    function frame(now) {
      if (!running) return;
      draw((now - startTime) / 1000, true);
      frameId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      window.removeEventListener("pointermove", onPointerMove);
    }

    function show(nextMode) {
      stop();
      mode = nextMode;
      if (!mode) return;
      if (!modes[mode]) {
        modes[mode] = builders[mode]();
        modes[mode].recolour(readPalette());
      }
      resize();
      if (reducedMotion.matches) {
        draw(0, false);
        return;
      }
      running = true;
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      frameId = requestAnimationFrame(frame);
    }

    function recolour() {
      const palette = readPalette();
      Object.values(modes).forEach((built) => built.recolour(palette));
      if (mode && !running) draw(0, false); // reduced motion: redraw the still frame
    }

    window.addEventListener("resize", () => {
      resize();
      if (mode && !running) draw(0, false);
    });
    reducedMotion.addEventListener("change", () => show(mode));
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      stop();
      mode = null;
      canvas.hidden = true; // fall back to the CSS gradient
    });

    return {
      show,
      recolour,
      get mode() {
        return mode;
      },
      get running() {
        return running;
      }
    };
  }

  const background = createBackground();
  let lastView;

  function syncView() {
    const view = currentView();
    document.body.classList.toggle("auth-view", view === "login");
    document.body.classList.toggle("app-view", view === "home");
    if (view === lastView) return;
    lastView = view;
    background?.show(view);
  }

  // js/pages/app.js and js/pages/profile.js show and hide these views as the session changes.
  const observer = new MutationObserver(syncView);
  views.forEach((element) => observer.observe(element, { attributes: true, attributeFilter: ["class"] }));
  syncView();

  // js/shared/theme.js switches <html data-theme>; follow it with the scene colours.
  new MutationObserver(() => background?.recolour())
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Exposed for debugging and automated checks only.
  window.MEDAWARE_SCENE = {
    get enabled() {
      return Boolean(background);
    },
    get running() {
      return Boolean(background?.running);
    },
    get mode() {
      return background?.mode ?? null;
    },
    get palette() {
      return readPalette();
    }
  };
})();
