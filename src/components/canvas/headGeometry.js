import { BufferAttribute, Color, MathUtils } from "three";
import { SphereGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Sculpted head for the avatar. One dense sphere is reshaped into a face
// (brow, eye sockets, cheekbones, nose, lips, jaw and chin), and the hair,
// beard and eyebrows are grown out of that same surface, so every part
// blends into the skin instead of sitting on top of it as a separate shell.
//
// The beard and eyebrows are drawn per pixel by the skin shader (see
// groomSkinShader), so their outlines are crisp, clean cuts at any size.
//
// Head space: origin at the centre of the head, +y up, +z out of the face.

const smooth = (e0, e1, x) => {
  const t = MathUtils.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

// 2D gaussian bump centred on (cx, cy).
const bump = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2) - ((y - cy) / sy) ** 2);

// Half-extents of the cranium.
const A = 0.69;
const B = 0.84;
const C = 0.74;

// Eye centres (mirrored in x).
export const EYE = { x: 0.235, y: 0.04 };

// Point on the head surface for a unit direction (dx, dy, dz).
const sculpt = (dx, dy, dz) => {
  let x = dx * A;
  let y = dy * B;
  let z = dz * C;
  const front = smooth(0.05, 0.6, dz);

  // A slightly longer lower face, with a flat underside so the jaw reads
  // as a crisp line.
  if (y < -0.2) y = -0.2 + (y + 0.2) * 1.12;
  if (y < -0.66) y = -0.66 + (y + 0.66) * 0.4;
  // A lean, square lower face that comes forward to a strong chin.
  x *= (1 - 0.17 * smooth(-0.1, -0.75, y)) * (1 + 0.05 * smooth(0.1, 0.6, y)); // fuller crown
  z += front * 0.15 * smooth(0.1, -0.55, y);

  const ax = Math.abs(x);
  let d = 0;
  d += 0.045 * bump(ax, y, 0.24, 0.2, 0.17, 0.06); // brow ridge
  d += 0.02 * bump(x, y, 0, 0.17, 0.1, 0.06);
  d -= 0.065 * bump(ax, y, EYE.x, EYE.y, 0.12, 0.085); // eye sockets
  d += 0.035 * bump(ax, y, 0.37, -0.07, 0.14, 0.1); // cheekbones
  d -= 0.012 * bump(ax, y, 0.42, -0.26, 0.12, 0.1); // lean cheeks below the cheekbones

  // Nose: a straight bridge widening to a rounded tip and nostril wings.
  const t = smooth(0.14, -0.12, y);
  const w = 0.034 + 0.026 * t;
  d += (0.028 + 0.08 * t) * Math.exp(-((x / w) ** 2)) * smooth(0.24, 0.12, y) * (1 - smooth(-0.11, -0.19, y));
  d += 0.035 * bump(x, y, 0, -0.13, 0.055, 0.048);
  d += 0.035 * bump(ax, y, 0.068, -0.162, 0.04, 0.032);

  // Lips, the line between them, and the dip below the lower lip.
  d += 0.026 * bump(x, y, 0, -0.29, 0.095, 0.026);
  d += 0.036 * bump(x, y, 0, -0.355, 0.08, 0.028);
  d -= 0.02 * bump(x, y, 0, -0.318, 0.11, 0.012);
  d -= 0.015 * bump(ax, y, 0.115, -0.32, 0.02, 0.02);
  d -= 0.012 * bump(x, y, 0, -0.44, 0.09, 0.03);
  d += 0.05 * bump(x, y, 0, -0.63, 0.2, 0.09); // broad, square chin

  d *= front;
  d -= 0.015 * bump(ax, y, 0.6, 0.3, 0.1, 0.12); // temples
  d += 0.065 * bump(ax, y, 0.55, -0.56, 0.1, 0.09) * smooth(-0.4, 0.3, dz); // sharp jaw angles
  d += 0.025 * bump(ax, y, 0.38, -0.64, 0.14, 0.05) * smooth(0, 0.5, dz); // jaw ridge to the chin

  return [x + dx * d, y + dy * d, z + dz * d];
};

// How much hair, beard, brow, lip and so on lies at a surface point.
const regions = (x, y, z) => {
  const a = Math.atan2(x, z); // 0 = front, +-PI = back
  const ad = Math.abs(a);
  const c = Math.cos(a);
  const ax = Math.abs(x);
  const front = smooth(0.3, 0.6, z);

  /* Hair: hairline high on the forehead, above the ears, low at the nape. */
  const h = (c > 0 ? 0.17 + 0.28 * c * c : 0.17 - 0.64 * c * c) + 0.05 * Math.exp(-(((ad - 0.55) / 0.14) ** 2)); // slight temple corners
  const hairEdge = smooth(h - 0.01, h + 0.07, y);
  const top = smooth(0.3, 0.8, y);
  // Textured, tousled crop: a short faded taper above the ears, fuller
  // upper sides, and messy chunky pieces on top pushed up at the front.
  const quiff = Math.exp(-(((z - 0.42) / 0.34) ** 2)) * smooth(0.45, 0.8, y);
  const sides = smooth(0.12, 0.42, y) * (1 - smooth(0.62, 0.86, y));
  const taper = 0.03 + 0.03 * smooth(0.05, 0.3, y);
  let hair = hairEdge * (taper + 0.06 * sides + 0.07 * top + 0.11 * quiff);
  const pieces = Math.abs(Math.sin(x * 13 + z * 5)) * Math.abs(Math.sin(z * 11 - x * 7 + y * 6));
  hair += hairEdge * top * 0.08 * (Math.sqrt(pieces) - 0.5); // chunky pieces with crisp breaks
  const hairPaint = smooth(h - 0.005, h + 0.025, y);

  /* Painted detail. */
  const lipUpper = (1 - smooth(0.7, 1, Math.hypot(x / 0.1, (y + 0.287) / 0.024))) * front;
  const lipLower = (1 - smooth(0.7, 1, Math.hypot(x / 0.088, (y + 0.354) / 0.03))) * front;
  const blush = (0.6 * bump(ax, y, 0.34, -0.14, 0.12, 0.08) + 0.5 * bump(x, y, 0, -0.13, 0.05, 0.045)) * front;
  const shade =
    (0.28 * bump(ax, y, EYE.x, EYE.y + 0.02, 0.11, 0.075) + 0.3 * bump(x, y, 0, -0.2, 0.06, 0.02)) * front +
    0.3 * smooth(-0.66, -0.74, y); // shadow under the jaw

  return { hair, hairEdge, hairPaint, lipUpper, lipLower, blush, shade };
};

// A layer (the hair) offset from the skin by `thickness` per
// vertex. Its edge fades out through per-vertex alpha, so it blends into
// the skin instead of ending in a stepped line.
const makeLayer = (skin, thickness, alpha) => {
  const pos = skin.attributes.position.array;
  const nor = skin.attributes.normal.array;
  const out = new Float32Array(pos.length);
  const rgba = new Float32Array((pos.length / 3) * 4).fill(1);
  for (let i = 0; i < pos.length / 3; i++) {
    const t = thickness[i];
    for (let k = 0; k < 3; k++) out[i * 3 + k] = pos[i * 3 + k] + nor[i * 3 + k] * t;
    rgba[i * 4 + 3] = alpha[i];
  }
  const src = skin.index.array;
  const index = [];
  for (let i = 0; i < src.length; i += 3) {
    const [p, q, r] = [src[i], src[i + 1], src[i + 2]];
    if (Math.max(alpha[p], alpha[q], alpha[r]) > 0.01) index.push(p, q, r);
  }
  const layer = skin.clone();
  layer.setAttribute("position", new BufferAttribute(out, 3));
  layer.setAttribute("color", new BufferAttribute(rgba, 4));
  layer.setIndex(index);
  layer.computeVertexNormals();
  return layer;
};

// `segments` sets mesh density; small, distant heads can use far fewer.
export const buildHead = ({ skin: skinHex, lipUpper, lipLower, hair: hairHex, blush: blushHex, segments = [240, 170] }) => {
  // Seam at the back of the head, hidden under the hair.
  const sphere = new SphereGeometry(1, segments[0], segments[1], -Math.PI / 2);
  sphere.deleteAttribute("normal");
  sphere.deleteAttribute("uv");
  const skin = mergeVertices(sphere);
  sphere.dispose();

  const pos = skin.attributes.position;
  const n = pos.count;
  const uv = new Float32Array(n * 2);
  const colors = new Float32Array(n * 3);
  const hair = new Float32Array(n);
  const hairAlpha = new Float32Array(n);

  const base = new Color(skinHex);
  const cLipU = new Color(lipUpper);
  const cLipL = new Color(lipLower);
  const cHair = new Color(hairHex);
  const cBlush = new Color(blushHex);
  const c = new Color();

  for (let i = 0; i < n; i++) {
    const dx = pos.getX(i);
    const dy = pos.getY(i);
    const dz = pos.getZ(i);
    const [x, y, z] = sculpt(dx, dy, dz);
    pos.setXYZ(i, x, y, z);
    uv[i * 2] = Math.atan2(dx, dz) / (Math.PI * 2) + 0.5;
    uv[i * 2 + 1] = 1 - Math.acos(MathUtils.clamp(dy, -1, 1)) / Math.PI;

    const r = regions(x, y, z);
    hair[i] = r.hair;
    hairAlpha[i] = smooth(0.04, 0.22, r.hairEdge);

    c.copy(base);
    c.lerp(cBlush, r.blush * 0.35);
    c.lerp(cLipU, r.lipUpper);
    c.lerp(cLipL, r.lipLower);
    c.multiplyScalar(1 - r.shade);
    // Short hair shows through as a darker tone at the hairline.
    c.lerp(cHair, r.hairPaint);
    colors.set([c.r, c.g, c.b], i * 3);
  }

  skin.setAttribute("uv", new BufferAttribute(uv, 2));
  skin.setAttribute("color", new BufferAttribute(colors, 3));
  skin.computeVertexNormals();

  // Reference points for placing the eyes, glasses and ears.
  let eyeSurface = 0;
  let bridge = 0;
  let sideX = 0;
  let best = Infinity;
  let bestBridge = Infinity;
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z <= 0) {
      if (Math.abs(y - EYE.y) < 0.03) sideX = Math.max(sideX, Math.abs(x));
      continue;
    }
    if (Math.abs(y - EYE.y) < 0.03) sideX = Math.max(sideX, Math.abs(x));
    const de = (x - EYE.x) ** 2 + (y - EYE.y) ** 2;
    if (de < best) {
      best = de;
      eyeSurface = z;
    }
    const db = x ** 2 + (y - EYE.y - 0.02) ** 2;
    if (db < bestBridge) {
      bestBridge = db;
      bridge = z;
    }
  }
  const eyeZ = eyeSurface - 0.05;

  return {
    skin,
    hair: makeLayer(skin, hair, hairAlpha),
    eyeZ,
    glassesZ: Math.max(eyeZ + 0.17, bridge + 0.02),
    sideX,
  };
};

/* Beard and eyebrows, drawn per pixel on the skin. Masks are evaluated in
   head space with edges anti-aliased to about one pixel. */
const GROOM_GLSL = /* glsl */ `
uniform vec3 uBeardColor;
uniform vec3 uBrowColor;
varying vec3 vHeadPos;

float sm(float e0, float e1, float x) {
  float t = clamp((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// 1 below edge, 0 above, with a ~1px transition.
float below(float v, float edge) {
  float w = max(fwidth(v), 1e-4);
  return 1.0 - smoothstep(edge - w, edge + w, v);
}

// Thin, professional boxed beard: a neat moustache joining the chin around
// the mouth, and a narrow line along the jaw up to the sideburns.
float beardMask(vec3 p) {
  float ad = abs(atan(p.x, p.z));
  float top = -0.215 - 0.2 * sm(0.16, 0.55, ad) + 0.17 * sm(0.6, 1.1, ad) + 0.42 * sm(1.1, 1.36, ad);
  float sideLimit = mix(1.46, 1.95, sm(-0.35, -0.6, p.y));
  float wa = min(fwidth(ad), 0.02);
  float side = 1.0 - smoothstep(sideLimit - wa, sideLimit + wa, ad);
  float mouth = length(vec2(p.x / 0.11, (p.y + 0.34) / 0.054));
  float lips = p.z > 0.45 ? 1.0 - below(mouth, 1.0) : 1.0;
  float neck = 1.0 - below(p.y, -0.76);
  return below(p.y, top) * side * lips * neck;
}

// Slightly arched eyebrows, thicker at the inner end.
float browMask(vec3 p) {
  if (p.z < 0.4) return 0.0;
  float u = (abs(p.x) - 0.09) / 0.3;
  float cu = clamp(u, 0.0, 1.0);
  float y = 0.205 + 0.05 * sin(3.14159 * cu * 0.8) - 0.02 * u;
  float halfWidth = mix(0.03, 0.014, cu);
  float ends = (1.0 - below(u, 0.0)) * below(u, 1.0);
  return below(abs(p.y - y), halfWidth) * ends;
}

// Fine, even grain so the beard reads as trimmed hair.
float grain(vec3 p) {
  return 0.5 + 0.5 * sin(p.x * 830.0 + p.y * 1290.0) * sin(p.y * 970.0 - p.z * 760.0);
}
`;

export const groomSkinShader = (material, { beard, brow }) => {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBeardColor = { value: new Color(beard) };
    shader.uniforms.uBrowColor = { value: new Color(brow) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHeadPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeadPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + GROOM_GLSL)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float beardAmt = beardMask(vHeadPos);
        float browAmt = browMask(vHeadPos);
        diffuseColor.rgb = mix(diffuseColor.rgb, uBeardColor * (0.85 + 0.3 * grain(vHeadPos)), beardAmt);
        diffuseColor.rgb = mix(diffuseColor.rgb, uBrowColor, browAmt);
        float groomAmt = max(beardAmt, browAmt);`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.85, groomAmt);"
      )
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
          material.clearcoat *= 1.0 - groomAmt;
        #endif
        #ifdef USE_SHEEN
          material.sheenColor *= 1.0 - groomAmt;
        #endif`
      );
  };
  material.customProgramCacheKey = () => "groomed-skin";
  material.needsUpdate = true;
};
