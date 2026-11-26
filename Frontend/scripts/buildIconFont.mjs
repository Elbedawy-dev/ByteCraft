import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(FRONTEND_DIR, 'src');
const SAFELIST_PATH = path.join(__dirname, 'icon-safelist.json');
const SOURCE_FONT_PATH = path.join(
  FRONTEND_DIR,
  'node_modules',
  'material-symbols',
  'material-symbols-rounded.woff2'
);
const OUTPUT_DIR = path.join(SRC_DIR, 'assets', 'fonts');
const OUTPUT_FONT_PATH = path.join(OUTPUT_DIR, 'material-symbols-rounded-subset.woff2');

const require = createRequire(path.join(FRONTEND_DIR, 'package.json'));
const subsetFont = require('subset-font');
const fontverter = require('fontverter');

const ICON_NAME_RE = /^[a-z0-9][a-z0-9_]*$/;
const MAX_RECOMMENDED_BYTES = 100 * 1024;

// ---------------------------------------------------------------------------
// SFNT Font Table Inspection (fvar, cmap, GSUB ligatures)
// ---------------------------------------------------------------------------

function readSfntTables(ttfBuf) {
  const numTables = ttfBuf.readUInt16BE(4);
  const tables = {};
  for (let i = 0; i < numTables; i += 1) {
    const off = 12 + i * 16;
    const tag = ttfBuf.toString('ascii', off, off + 4);
    const offset = ttfBuf.readUInt32BE(off + 8);
    const length = ttfBuf.readUInt32BE(off + 12);
    tables[tag] = { offset, length };
  }
  return tables;
}

function parseFvarAxes(ttfBuf, tables) {
  const axes = {};
  if (!tables.fvar) return axes;
  const off = tables.fvar.offset;
  const axesOffset = ttfBuf.readUInt16BE(off + 4);
  const axisCount = ttfBuf.readUInt16BE(off + 8);
  const axisSize = ttfBuf.readUInt16BE(off + 10);
  for (let i = 0; i < axisCount; i += 1) {
    const a = off + axesOffset + i * axisSize;
    const tag = ttfBuf.toString('ascii', a, a + 4);
    axes[tag] = {
      min: ttfBuf.readInt32BE(a + 4) / 65536,
      default: ttfBuf.readInt32BE(a + 8) / 65536,
      max: ttfBuf.readInt32BE(a + 12) / 65536,
    };
  }
  return axes;
}

function parseCmap(ttfBuf, cmapTable) {
  const base = cmapTable.offset;
  const numSubtables = ttfBuf.readUInt16BE(base + 2);
  let subOffset = null;
  let fmt = 0;

  for (let i = 0; i < numSubtables; i += 1) {
    const rec = base + 4 + i * 8;
    const platformId = ttfBuf.readUInt16BE(rec);
    const encodingId = ttfBuf.readUInt16BE(rec + 2);
    const offset = base + ttfBuf.readUInt32BE(rec + 4);
    const format = ttfBuf.readUInt16BE(offset);
    if ((platformId === 3 && encodingId === 10 && format === 12) || (platformId === 0 && format === 12)) {
      subOffset = offset;
      fmt = 12;
      break;
    }
    if ((platformId === 3 && encodingId === 1 && format === 4) || (platformId === 0 && format === 4)) {
      if (!subOffset) {
        subOffset = offset;
        fmt = 4;
      }
    }
  }

  const gidToCps = new Map();
  const add = (cp, gid) => {
    if (gid === 0) return;
    if (!gidToCps.has(gid)) gidToCps.set(gid, []);
    gidToCps.get(gid).push(cp);
  };

  if (fmt === 12) {
    const nGroups = ttfBuf.readUInt32BE(subOffset + 12);
    for (let i = 0; i < nGroups; i += 1) {
      const g = subOffset + 16 + i * 12;
      const startCP = ttfBuf.readUInt32BE(g);
      const endCP = ttfBuf.readUInt32BE(g + 4);
      const startGid = ttfBuf.readUInt32BE(g + 8);
      for (let cp = startCP; cp <= endCP; cp += 1) {
        add(cp, startGid + (cp - startCP));
      }
    }
  } else if (fmt === 4) {
    const segCount = ttfBuf.readUInt16BE(subOffset + 6) / 2;
    const endCodes = subOffset + 14;
    const startCodes = endCodes + segCount * 2 + 2;
    const idDeltas = startCodes + segCount * 2;
    const idRangeOffsets = idDeltas + segCount * 2;
    for (let i = 0; i < segCount; i += 1) {
      const endCode = ttfBuf.readUInt16BE(endCodes + i * 2);
      const startCode = ttfBuf.readUInt16BE(startCodes + i * 2);
      const idDelta = ttfBuf.readInt16BE(idDeltas + i * 2);
      const idRangeOffset = ttfBuf.readUInt16BE(idRangeOffsets + i * 2);
      if (startCode === 0xffff) break;
      for (let cp = startCode; cp <= endCode; cp += 1) {
        let gid;
        if (idRangeOffset === 0) {
          gid = (cp + idDelta) & 0xffff;
        } else {
          const ptr = idRangeOffsets + i * 2 + idRangeOffset + (cp - startCode) * 2;
          gid = ttfBuf.readUInt16BE(ptr);
          if (gid !== 0) gid = (gid + idDelta) & 0xffff;
        }
        add(cp, gid);
      }
    }
  }

  return gidToCps;
}

function parseCoverage(ttfBuf, off) {
  const fmt = ttfBuf.readUInt16BE(off);
  const gids = [];
  if (fmt === 1) {
    const count = ttfBuf.readUInt16BE(off + 2);
    for (let i = 0; i < count; i += 1) {
      gids.push(ttfBuf.readUInt16BE(off + 4 + i * 2));
    }
  } else if (fmt === 2) {
    const count = ttfBuf.readUInt16BE(off + 2);
    for (let i = 0; i < count; i += 1) {
      const r = off + 4 + i * 6;
      const start = ttfBuf.readUInt16BE(r);
      const end = ttfBuf.readUInt16BE(r + 2);
      const startIdx = ttfBuf.readUInt16BE(r + 4);
      for (let g = start; g <= end; g += 1) {
        gids[startIdx + (g - start)] = g;
      }
    }
  }
  return gids;
}

function parseGsubLigatures(ttfBuf, gsubTable, gidToCps) {
  const base = gsubTable.offset;
  const lookupListOffset = base + ttfBuf.readUInt16BE(base + 8);
  const lookupCount = ttfBuf.readUInt16BE(lookupListOffset);

  const gidToAscii = new Map();
  for (const [gid, cps] of gidToCps.entries()) {
    for (const cp of cps) {
      if (cp >= 0x20 && cp <= 0x7e) {
        gidToAscii.set(gid, String.fromCharCode(cp));
      }
    }
  }

  const nameToInfo = new Map();

  for (let i = 0; i < lookupCount; i += 1) {
    const lookupOff = lookupListOffset + ttfBuf.readUInt16BE(lookupListOffset + 2 + i * 2);
    const lookupType = ttfBuf.readUInt16BE(lookupOff);
    const subCount = ttfBuf.readUInt16BE(lookupOff + 4);

    for (let s = 0; s < subCount; s += 1) {
      let subOff = lookupOff + ttfBuf.readUInt16BE(lookupOff + 6 + s * 2);
      let effType = lookupType;
      if (lookupType === 7) {
        effType = ttfBuf.readUInt16BE(subOff + 2);
        subOff += ttfBuf.readUInt32BE(subOff + 4);
      }
      if (effType !== 4) continue;

      const covOff = subOff + ttfBuf.readUInt16BE(subOff + 2);
      const firstGids = parseCoverage(ttfBuf, covOff);
      const ligSetCount = ttfBuf.readUInt16BE(subOff + 4);

      for (let ls = 0; ls < ligSetCount; ls += 1) {
        const firstChar = gidToAscii.get(firstGids[ls]);
        if (!firstChar) continue;
        const ligSetOff = subOff + ttfBuf.readUInt16BE(subOff + 6 + ls * 2);
        const ligCount = ttfBuf.readUInt16BE(ligSetOff);

        for (let l = 0; l < ligCount; l += 1) {
          const ligOff = ligSetOff + ttfBuf.readUInt16BE(ligSetOff + 2 + l * 2);
          const ligGlyph = ttfBuf.readUInt16BE(ligOff);
          const compCount = ttfBuf.readUInt16BE(ligOff + 2);
          let word = firstChar;
          let ok = true;
          for (let c = 0; c < compCount - 1; c += 1) {
            const ch = gidToAscii.get(ttfBuf.readUInt16BE(ligOff + 4 + c * 2));
            if (!ch) {
              ok = false;
              break;
            }
            word += ch;
          }
          if (ok) {
            const cps = gidToCps.get(ligGlyph) || [];
            const puaCp = cps.find((cp) => cp >= 0xe000) ?? cps[0] ?? null;
            nameToInfo.set(word, { gid: ligGlyph, codepoint: puaCp });
          }
        }
      }
    }
  }

  return nameToInfo;
}

async function inspectWoff2Font(woff2Buf) {
  const ttfBuf = await fontverter.convert(woff2Buf, 'truetype');
  const tables = readSfntTables(ttfBuf);
  const gidToCps = parseCmap(ttfBuf, tables.cmap);
  const ligatures = tables.GSUB ? parseGsubLigatures(ttfBuf, tables.GSUB, gidToCps) : new Map();
  const axes = parseFvarAxes(ttfBuf, tables);
  return { ligatures, axes };
}

// ---------------------------------------------------------------------------
// Source Code & Config Scanner
// ---------------------------------------------------------------------------

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'fonts' || entry.name === 'node_modules') continue;
      walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function stripJsComments(source) {
  let out = '';
  let i = 0;
  const len = source.length;
  let quote = null;

  while (i < len) {
    const ch = source[i];
    const next = source[i + 1];

    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < len) {
        out += next;
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '/') {
      while (i < len && source[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

function readBalancedBlock(str, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < str.length; i += 1) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === openChar) depth += 1;
    else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return { content: str.slice(openIndex + 1, i), endIndex: i };
    }
  }
  return null;
}

function findJsxOpenTagEnd(str, startIndex) {
  let braceDepth = 0;
  let quote = null;
  for (let i = startIndex; i < str.length; i += 1) {
    const ch = str[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') {
      braceDepth += 1;
      continue;
    }
    if (ch === '}') {
      if (braceDepth > 0) braceDepth -= 1;
      continue;
    }
    if (braceDepth === 0 && ch === '>') {
      return i;
    }
  }
  return -1;
}

function extractValidQuotedIcons(snippet, validLigatures, record) {
  for (const m of snippet.matchAll(/(['"])([a-z0-9_]+)\1/g)) {
    const candidate = m[2];
    if (ICON_NAME_RE.test(candidate) && validLigatures.has(candidate)) {
      record(candidate);
    }
  }
}

function scanSourceDirectory(validLigatures) {
  const foundIcons = new Map(); // iconName -> Set<relativeFile>
  const unknownLiterals = [];

  const recordIcon = (name, relFile) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return;
    if (!foundIcons.has(trimmed)) foundIcons.set(trimmed, new Set());
    foundIcons.get(trimmed).add(relFile);
  };

  // Variation axes usage tracking
  let fillUsed = false;
  const wghtValues = new Set();
  const gradValues = new Set();
  const opszValues = new Set();

  const files = walkFiles(SRC_DIR);

  for (const filePath of files) {
    const rel = path.relative(FRONTEND_DIR, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const raw = fs.readFileSync(filePath, 'utf8');

    // Track font-variation-settings & filled/gradient utility usage across CSS/JS/JSX
    if (ext === '.css' || ext === '.js' || ext === '.jsx') {
      if (/['"]FILL['"]\s*1\b/.test(raw) || /\b(?:material-symbols-filled|icon-gradient)\b/.test(raw)) {
        fillUsed = true;
      }
      for (const m of raw.matchAll(/['"]wght['"]\s*(\d+)/g)) {
        wghtValues.add(Number(m[1]));
      }
      for (const m of raw.matchAll(/['"]GRAD['"]\s*(-?\d+)/g)) {
        gradValues.add(Number(m[1]));
      }
      for (const m of raw.matchAll(/['"]opsz['"]\s*(\d+)/g)) {
        opszValues.add(Number(m[1]));
      }
    }

    // 1. JSON files (i18n locales & config JSON)
    if (ext === '.json') {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        continue;
      }
      const visitJson = (node, keyPath) => {
        if (typeof node === 'string') {
          const lastKey = keyPath[keyPath.length - 1] || '';
          if (/icon/i.test(lastKey)) {
            const val = node.trim();
            if (ICON_NAME_RE.test(val)) {
              if (validLigatures.has(val)) recordIcon(val, rel);
              else unknownLiterals.push({ icon: val, file: rel, source: `json:${keyPath.join('.')}` });
            }
          }
        } else if (Array.isArray(node)) {
          node.forEach((item, idx) => visitJson(item, [...keyPath, String(idx)]));
        } else if (node && typeof node === 'object') {
          for (const [k, v] of Object.entries(node)) {
            visitJson(v, [...keyPath, k]);
          }
        }
      };
      visitJson(parsed, []);
      continue;
    }

    if (ext !== '.js' && ext !== '.jsx') continue;

    const code = stripJsComments(raw);

    // 2. JSX elements with material-symbols-rounded / material-symbols-outlined classes
    const openTagRe = /<([A-Za-z][A-Za-z0-9_.]*)\b/g;
    let tagMatch;
    while ((tagMatch = openTagRe.exec(code)) !== null) {
      const tagName = tagMatch[1];
      const tagStart = tagMatch.index;
      const tagEnd = findJsxOpenTagEnd(code, tagStart + tagMatch[0].length);
      if (tagEnd === -1) continue;

      const openTagText = code.slice(tagStart, tagEnd + 1);
      if (!/material-symbols-(?:rounded|outlined)\b/.test(openTagText)) continue;
      if (openTagText.endsWith('/>')) continue;

      const closeTag = `</${tagName}>`;
      const closeIndex = code.indexOf(closeTag, tagEnd + 1);
      if (closeIndex === -1) continue;

      const body = code.slice(tagEnd + 1, closeIndex).trim();
      if (!body) continue;

      if (ICON_NAME_RE.test(body)) {
        if (validLigatures.has(body)) {
          recordIcon(body, rel);
        } else {
          unknownLiterals.push({ icon: body, file: rel, source: 'jsx-class-body' });
        }
      } else {
        // Dynamic expression (ternaries, logical fallbacks, etc.) inside the icon span
        extractValidQuotedIcons(body, validLigatures, (icon) => recordIcon(icon, rel));
      }
    }

    // 3. JSX icon props: icon="...", headerIcon="...", iconName="...", icon={...}
    const jsxPropStringRe = /\b(?:icon|iconName|headerIcon|leadingIcon|trailingIcon|startIcon|endIcon)\s*=\s*(['"])([a-z0-9_]+)\1/g;
    for (const m of code.matchAll(jsxPropStringRe)) {
      const val = m[2];
      if (validLigatures.has(val)) recordIcon(val, rel);
      else unknownLiterals.push({ icon: val, file: rel, source: 'jsx-prop' });
    }

    const jsxPropExprRe = /\b(?:icon|iconName|headerIcon|leadingIcon|trailingIcon|startIcon|endIcon)\s*=\s*\{/g;
    for (const m of code.matchAll(jsxPropExprRe)) {
      const braceIdx = m.index + m[0].length - 1;
      const block = readBalancedBlock(code, braceIdx, '{', '}');
      if (block) {
        extractValidQuotedIcons(block.content, validLigatures, (icon) => recordIcon(icon, rel));
      }
    }

    // 4. Object property keys: icon: '...', iconName: '...', headerIcon: '...'
    const objPropRe = /\b(?:icon|iconName|headerIcon|leadingIcon|trailingIcon|startIcon|endIcon)\s*:\s*(['"])([a-z0-9_]+)\1/g;
    for (const m of code.matchAll(objPropRe)) {
      const val = m[2];
      if (validLigatures.has(val)) recordIcon(val, rel);
    }

    // 5. Default params & variable assignments containing 'icon' (e.g. icon = 'inbox', iconName = ..., methodIcon = ...)
    const iconAssignRe = /\b[a-zA-Z0-9_]*[Ii]con[a-zA-Z0-9_]*\s*=\s*([^;\n,})]+)/g;
    for (const m of code.matchAll(iconAssignRe)) {
      extractValidQuotedIcons(m[1], validLigatures, (icon) => recordIcon(icon, rel));
    }

    // 6. Config maps & helper functions whose identifier includes ICON (e.g. PAYMENT_METHOD_ICON, TECH_ICON_MAP, DELIVERY_ICON_MAP, iconMap, getTechIcon, resolveIcon)
    const iconObjectRe = /\b(?:const|let|var)\s+[A-Za-z0-9_]*[Ii][Cc][Oo][Nn][A-Za-z0-9_]*\s*=\s*\{/g;
    for (const m of code.matchAll(iconObjectRe)) {
      const braceIdx = m.index + m[0].length - 1;
      const block = readBalancedBlock(code, braceIdx, '{', '}');
      if (block) {
        extractValidQuotedIcons(block.content, validLigatures, (icon) => recordIcon(icon, rel));
      }
    }

    const iconFnRe = /\bfunction\s+[A-Za-z0-9_]*[Ii][Cc][Oo][Nn][A-Za-z0-9_]*\s*\([^)]*\)\s*\{/g;
    for (const m of code.matchAll(iconFnRe)) {
      const braceIdx = m.index + m[0].length - 1;
      const block = readBalancedBlock(code, braceIdx, '{', '}');
      if (block) {
        extractValidQuotedIcons(block.content, validLigatures, (icon) => recordIcon(icon, rel));
      }
    }

    // 7. Config arrays in src/config/* (nav, ownerNav, etc.)
    if (rel.startsWith('src/config/')) {
      const configIconRe = /\bicon\s*:\s*(['"])([a-z0-9_]+)\1/g;
      for (const m of code.matchAll(configIconRe)) {
        const val = m[2];
        if (validLigatures.has(val)) recordIcon(val, rel);
        else unknownLiterals.push({ icon: val, file: rel, source: 'config' });
      }
    }
  }

  // 8. Safelist (scripts/icon-safelist.json)
  if (fs.existsSync(SAFELIST_PATH)) {
    const safelistRaw = JSON.parse(fs.readFileSync(SAFELIST_PATH, 'utf8'));
    const safelistIcons = Array.isArray(safelistRaw)
      ? safelistRaw
      : Array.isArray(safelistRaw?.icons)
        ? safelistRaw.icons
        : [];
    for (const name of safelistIcons) {
      const trimmed = String(name || '').trim();
      if (!trimmed) continue;
      if (validLigatures.has(trimmed)) {
        recordIcon(trimmed, 'scripts/icon-safelist.json');
      } else {
        unknownLiterals.push({ icon: trimmed, file: 'scripts/icon-safelist.json', source: 'safelist' });
      }
    }
  }

  // Build variationAxes config from detected usage
  const wghtList = wghtValues.size > 0 ? [...wghtValues] : [400];
  const gradList = gradValues.size > 0 ? [...gradValues] : [0];
  const opszList = opszValues.size > 0 ? [...opszValues] : [24];

  const variationAxes = {
    FILL: fillUsed ? { min: 0, max: 1, default: 0 } : 0,
    wght:
      Math.min(...wghtList) === Math.max(...wghtList)
        ? wghtList[0]
        : { min: Math.min(...wghtList), max: Math.max(...wghtList), default: 400 },
    GRAD:
      Math.min(...gradList) === Math.max(...gradList)
        ? gradList[0]
        : { min: Math.min(...gradList), max: Math.max(...gradList), default: 0 },
    opsz:
      Math.min(...opszList) === Math.max(...opszList)
        ? opszList[0]
        : { min: Math.min(...opszList), max: Math.max(...opszList), default: 24 },
  };

  return {
    foundIcons,
    unknownLiterals,
    fillUsed,
    variationAxes,
  };
}

// ---------------------------------------------------------------------------
// Build & Check Entrypoints
// ---------------------------------------------------------------------------

async function main() {
  const isCheckMode = process.argv.includes('--check');
  const isVerbose = process.argv.includes('--verbose');

  if (!fs.existsSync(SOURCE_FONT_PATH)) {
    console.error(`[icons] Source font not found at ${SOURCE_FONT_PATH}`);
    process.exit(1);
  }

  const sourceWoff2 = fs.readFileSync(SOURCE_FONT_PATH);
  const { ligatures: sourceLigatures } = await inspectWoff2Font(sourceWoff2);

  const { foundIcons, unknownLiterals, fillUsed, variationAxes } = scanSourceDirectory(sourceLigatures);
  const iconNames = [...foundIcons.keys()].sort();

  if (unknownLiterals.length > 0) {
    console.error('[icons] Unknown Material Symbols names found in source:');
    for (const item of unknownLiterals) {
      console.error(`  - "${item.icon}" in ${item.file} (${item.source})`);
    }
    process.exit(1);
  }

  if (iconNames.length === 0) {
    console.error('[icons] No Material Symbols icons were discovered in src/. Aborting.');
    process.exit(1);
  }

  if (isCheckMode) {
    if (!fs.existsSync(OUTPUT_FONT_PATH)) {
      console.error(`[icons:check] Subset font missing: ${path.relative(FRONTEND_DIR, OUTPUT_FONT_PATH)}`);
      console.error('Run `node scripts/buildIconFont.mjs` to generate it.');
      process.exit(1);
    }

    const subsetWoff2 = fs.readFileSync(OUTPUT_FONT_PATH);
    const { ligatures: subsetLigatures, axes: subsetAxes } = await inspectWoff2Font(subsetWoff2);

    const missing = iconNames.filter((name) => !subsetLigatures.has(name));
    if (missing.length > 0) {
      console.error(`[icons:check] FAIL — ${missing.length} icon(s) used in src/ are missing from the subset font:`);
      for (const name of missing) {
        const files = [...(foundIcons.get(name) || [])].join(', ');
        console.error(`  - ${name} (${files})`);
      }
      console.error('Run `node scripts/buildIconFont.mjs` to rebuild the subset font.');
      process.exit(1);
    }

    if (fillUsed && (!subsetAxes.FILL || subsetAxes.FILL.max < 1)) {
      console.error('[icons:check] FAIL — FILL axis is used in src/ but missing from the subset font.');
      process.exit(1);
    }

    const kb = (subsetWoff2.length / 1024).toFixed(2);
    console.log(
      `[icons:check] OK — all ${iconNames.length} icons verified in subset (${kb} KB, FILL axis: ${fillUsed ? '0..1' : 'pinned 0'}).`
    );
    return;
  }

  // Collect required ASCII characters for ligature inputs + PUA codepoints for target icon glyphs
  const asciiChars = new Set();
  const targetPuaChars = new Set();
  for (const name of iconNames) {
    for (const ch of name) asciiChars.add(ch);
    const info = sourceLigatures.get(name);
    if (!info || info.codepoint === null) {
      console.error(`[icons] Unable to resolve glyph codepoint for "${name}"`);
      process.exit(1);
    }
    targetPuaChars.add(String.fromCodePoint(info.codepoint));
  }

  const subsetInputText = [...asciiChars].sort().join('') + [...targetPuaChars].join('');

  const subsetWoff2 = await subsetFont(sourceWoff2, subsetInputText, {
    targetFormat: 'woff2',
    noLayoutClosure: true,
    variationAxes,
  });

  // Self-verify generated binary before writing
  const { ligatures: generatedLigatures } = await inspectWoff2Font(subsetWoff2);
  const missingAfterBuild = iconNames.filter((name) => !generatedLigatures.has(name));
  if (missingAfterBuild.length > 0) {
    console.error(`[icons] Internal error — generated subset is missing ligatures: ${missingAfterBuild.join(', ')}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FONT_PATH, subsetWoff2);

  const origKB = (sourceWoff2.length / 1024).toFixed(2);
  const subsetKB = (subsetWoff2.length / 1024).toFixed(2);
  const savedPct = (((sourceWoff2.length - subsetWoff2.length) / sourceWoff2.length) * 100).toFixed(2);

  console.log(
    `[icons] Generated ${path.relative(FRONTEND_DIR, OUTPUT_FONT_PATH)}: ${iconNames.length} icons | ${origKB} KB -> ${subsetKB} KB (-${savedPct}%)`
  );
  console.log(`[icons] Variation axes: ${JSON.stringify(variationAxes)}`);

  if (subsetWoff2.length > MAX_RECOMMENDED_BYTES) {
    console.warn(`[icons] Warning: subset font (${subsetKB} KB) exceeds 100 KB target.`);
  }

  if (isVerbose) {
    console.log(`[icons] Included icons (${iconNames.length}): ${iconNames.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('[icons] Failed to build icon font subset:', err);
  process.exit(1);
});
