/**
 * Gera app/lib/cres.geojson.json — as 11 CREs como polígonos reais do
 * município do Rio.
 *
 * Entrada: repo/Microáreas_SME_revisãoIPP (shapefile oficial SME/IPP, 233
 * microáreas com campo `cre`). Saída: um Feature por CRE, geometria dissolvida
 * (união das microáreas da CRE) e reprojetada de SIRGAS 2000 / UTM 23S para
 * WGS84, que é o que d3-geo espera.
 *
 * One-shot: rode com `node etl/cres-geojson.js`. Sem dependências.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.join(
  __dirname,
  "..",
  "repo",
  "Microáreas_SME_revisãoIPP",
  "Microareas_SME_revisao",
);
const OUT = path.join(__dirname, "..", "app", "lib", "cres.geojson.json");

/* ---------- DBF ---------- */
function readDbf(buf) {
  const nrec = buf.readUInt32LE(4);
  const hlen = buf.readUInt16LE(8);
  const rlen = buf.readUInt16LE(10);
  const fields = [];
  for (let p = 32; buf[p] !== 0x0d; p += 32) {
    fields.push({
      name: buf.toString("latin1", p, p + 11).replace(/\0.*$/, ""),
      len: buf[p + 16],
    });
  }
  const rows = [];
  for (let i = 0; i < nrec; i++) {
    let off = hlen + i * rlen + 1;
    const row = {};
    for (const f of fields) {
      row[f.name] = buf.toString("latin1", off, off + f.len).trim();
      off += f.len;
    }
    rows.push(row);
  }
  return rows;
}

/* ---------- SHP (só Polygon, tipo 5 — o que este arquivo contém) ---------- */
function readShp(buf) {
  const shapes = [];
  let p = 100; // header fixo
  while (p < buf.length) {
    const len = buf.readInt32BE(p + 4) * 2;
    const type = buf.readInt32LE(p + 8);
    if (type !== 5) {
      p += 8 + len;
      continue;
    }
    const nParts = buf.readInt32LE(p + 44);
    const nPoints = buf.readInt32LE(p + 48);
    const partStart = p + 52;
    const parts = [];
    for (let i = 0; i < nParts; i++)
      parts.push(buf.readInt32LE(partStart + i * 4));
    const ptStart = partStart + nParts * 4;
    const rings = [];
    for (let i = 0; i < nParts; i++) {
      const a = parts[i];
      const b = i + 1 < nParts ? parts[i + 1] : nPoints;
      const ring = [];
      for (let j = a; j < b; j++) {
        const o = ptStart + j * 16;
        ring.push([buf.readDoubleLE(o), buf.readDoubleLE(o + 8)]);
      }
      rings.push(ring);
    }
    shapes.push(rings);
    p += 8 + len;
  }
  return shapes;
}

/* ---------- UTM 23S (SIRGAS 2000 ≈ GRS80) -> WGS84 lon/lat ---------- */
function utmToLonLat([x, y]) {
  const a = 6378137.0,
    f = 1 / 298.257222101; // GRS80
  const k0 = 0.9996,
    E0 = 500000,
    N0 = 10000000, // hemisfério sul
    lon0 = (-45 * Math.PI) / 180;

  const e2 = f * (2 - f);
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const M = (y - N0) / k0;
  const mu =
    M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256));

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sin1 = Math.sin(phi1),
    cos1 = Math.cos(phi1),
    tan1 = Math.tan(phi1);
  const ep2 = e2 / (1 - e2);
  const C1 = ep2 * cos1 ** 2;
  const T1 = tan1 ** 2;
  const N1 = a / Math.sqrt(1 - e2 * sin1 ** 2);
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sin1 ** 2, 1.5);
  const D = (x - E0) / (N1 * k0);

  const lat =
    phi1 -
    ((N1 * tan1) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) *
          D ** 6) /
          720);
  const lon =
    lon0 +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5) /
        120) /
      cos1;

  return [(lon * 180) / Math.PI, (lat * 180) / Math.PI];
}

/* ---------- shell vs hole: anel horário = shell (spec do shapefile) ---------- */
const area = (r) => {
  let s = 0;
  for (let i = 0, n = r.length; i < n; i++) {
    const [x1, y1] = r[i];
    const [x2, y2] = r[(i + 1) % n];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
};

const dbf = readDbf(fs.readFileSync(SRC + ".dbf"));
const shp = readShp(fs.readFileSync(SRC + ".shp"));
if (dbf.length !== shp.length)
  throw new Error(`DBF ${dbf.length} != SHP ${shp.length}`);

// Dissolve: agrupa os polígonos por CRE num MultiPolygon.
const byCre = new Map();
shp.forEach((rings, i) => {
  const cre = String(dbf[i].cre).padStart(2, "0");
  if (!byCre.has(cre)) byCre.set(cre, []);
  const polys = byCre.get(cre);
  for (const ring of rings) {
    const ll = ring.map(utmToLonLat);
    if (area(ring) < 0) polys.push([ll]); // shell -> novo polígono
    else if (polys.length) polys[polys.length - 1].push(ll); // hole
  }
});

const features = [...byCre.entries()]
  .sort((a, b) => Number(a[0]) - Number(b[0]))
  .map(([cre, coordinates]) => ({
    type: "Feature",
    properties: { cre },
    geometry: { type: "MultiPolygon", coordinates },
  }));

fs.writeFileSync(
  OUT,
  JSON.stringify({ type: "FeatureCollection", features }),
);

const n = features.reduce((a, f) => a + f.geometry.coordinates.length, 0);
console.log(`${features.length} CREs, ${n} polígonos -> ${OUT}`);
console.log(
  "CREs:",
  features.map((f) => f.properties.cre).join(" "),
);

/* ---------- Simplificação (Douglas-Peucker) ----------
 * 98k pontos = 3.9 MB, grande demais para o bundle. No tamanho em que o mapa
 * é desenhado (~900px de largura para ~0.7° de longitude), qualquer detalhe
 * abaixo de ~0.0004° é sub-pixel. Simplificamos com folga sob esse limite.
 */
const TOL = 0.00025;

const perpDist = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax,
    dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  let max = 0,
    idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [
    ...dp(pts.slice(0, idx + 1), tol).slice(0, -1),
    ...dp(pts.slice(idx), tol),
  ];
}

function simplifyRing(ring) {
  // Anel é fechado: simplifica a linha aberta e refecha.
  const open = ring.slice(0, -1);
  const s = dp(open, TOL);
  return s.length < 3 ? null : [...s, s[0]];
}

let kept = 0;
for (const f of features) {
  const polys = [];
  for (const poly of f.geometry.coordinates) {
    const rings = poly.map(simplifyRing).filter(Boolean);
    if (rings.length) {
      polys.push(rings);
      rings.forEach((r) => (kept += r.length));
    }
  }
  f.geometry.coordinates = polys;
}

// Arredonda para 5 casas (~1 m) — precisão muito além do necessário na tela.
const round = (o) =>
  Array.isArray(o)
    ? typeof o[0] === "number"
      ? [Math.round(o[0] * 1e5) / 1e5, Math.round(o[1] * 1e5) / 1e5]
      : o.map(round)
    : o;
for (const f of features) f.geometry.coordinates = round(f.geometry.coordinates);

fs.writeFileSync(OUT, JSON.stringify({ type: "FeatureCollection", features }));
console.log(
  `simplificado: ${kept} pontos, ${Math.round(fs.statSync(OUT).size / 1024)} KB`,
);
