import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

import './Silk.css';

/**
 * react-bits "Silk", ported from @react-three/fiber to ogl.
 *
 * WHY THE PORT: the registry ships this on @react-three/fiber@^9 + three@^0.180,
 * and R3F v9 declares `react: ^19.0.0` as a peer. This project is on React 18.3.1,
 * so the published version simply cannot be installed here. Rather than pin R3F v8
 * or add ~600 kB of three.js for a single fullscreen fragment shader, this uses ogl
 * — already a dependency, already driving Iridescence in exactly this pattern.
 *
 * The GLSL is byte-for-byte the registry's. Only the host changed: ogl's Triangle
 * covers the viewport, so the vertex stage is a passthrough instead of R3F's
 * projected plane, and `vPosition` is dropped because the fragment stage never
 * read it. Same props, same output.
 */

const hexToNormalizedRGB = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

export default function Silk({
  speed = 5,
  scale = 1,
  color = '#7B7481',
  noiseIntensity = 1.5,
  rotation = 0,
  ...rest
}) {
  const ctnDom = useRef(null);
  // Live prop mirror, so changing a prop retunes the running shader instead of
  // tearing down the GL context and restarting the animation from zero.
  const props = useRef({ speed, scale, color, noiseIntensity, rotation });
  props.current = { speed, scale, color, noiseIntensity, rotation };

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({ dpr: Math.min(2, window.devicePixelRatio || 1) });
    const gl = renderer.gl;

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...hexToNormalizedRGB(color)) },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uRotation: { value: rotation },
        uNoiseIntensity: { value: noiseIntensity },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => renderer.setSize(ctn.offsetWidth || 1, ctn.offsetHeight || 1);
    const ro = new ResizeObserver(resize);
    ro.observe(ctn);
    resize();

    Object.assign(gl.canvas.style, { width: '100%', height: '100%', display: 'block' });
    ctn.appendChild(gl.canvas);

    let raf = 0;
    let last = performance.now();
    const render = (t) => {
      raf = requestAnimationFrame(render);
      const delta = (t - last) / 1000;
      last = t;

      const p = props.current;
      // Matches R3F's `uTime += 0.1 * delta`.
      program.uniforms.uTime.value += 0.1 * delta;
      program.uniforms.uSpeed.value = p.speed;
      program.uniforms.uScale.value = p.scale;
      program.uniforms.uRotation.value = p.rotation;
      program.uniforms.uNoiseIntensity.value = p.noiseIntensity;
      program.uniforms.uColor.value.set(...hexToNormalizedRGB(p.color));

      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // Mount once; prop changes flow through the ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ctnDom} className="silk-container" {...rest} />;
}
