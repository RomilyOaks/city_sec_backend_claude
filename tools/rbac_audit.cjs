const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

const readText = (p) => fs.readFileSync(p, "utf8");

const listFilesRecursive = (dir, filterFn) => {
  const out = [];
  const stack = [dir];

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (!filterFn || filterFn(full)) {
        out.push(full);
      }
    }
  }

  return out;
};

const extractUsedPermissionsFromRoutes = () => {
  const routesDir = path.join(projectRoot, "src", "routes");
  const files = listFilesRecursive(routesDir, (p) => p.endsWith(".js"));

  const used = new Set();

  const callRe = /requireAnyPermission\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
  const strRe = /"([^"]+)"|'([^']+)'/g;

  for (const f of files) {
    const txt = readText(f);
    let m;
    while ((m = callRe.exec(txt))) {
      const arrText = m[1];
      let s;
      while ((s = strRe.exec(arrText))) {
        const val = (s[1] || s[2] || "").trim();
        if (val) used.add(val);
      }
    }
  }

  return used;
};

const extractSeededPermissionsFromSeedRBAC = () => {
  const seedFile = path.join(projectRoot, "src", "seeders", "seedRBAC.js");
  const txt = readText(seedFile);

  const seeded = new Set();

  // Heurística: capturar objetos permisoData con modulo/recurso/accion.
  const permRe = /modulo\s*:\s*"([^"]+)"\s*,\s*recurso\s*:\s*"([^"]+)"\s*,\s*accion\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = permRe.exec(txt))) {
    const modulo = m[1];
    const recurso = m[2];
    const accion = m[3];
    seeded.add(`${modulo}.${recurso}.${accion}`);
  }

  return seeded;
};

const main = () => {
  const used = extractUsedPermissionsFromRoutes();
  const seeded = extractSeededPermissionsFromSeedRBAC();

  const usedList = [...used].sort();
  const seededList = [...seeded].sort();

  const missing = usedList.filter((p) => !seeded.has(p));
  const unused = seededList.filter((p) => !used.has(p));

  console.log("=== RBAC AUDIT ===");
  console.log("USED (in routes):", usedList.length);
  console.log("SEEDED (seedRBAC):", seededList.length);
  console.log("");

  console.log("--- Missing (used but not seeded) ---");
  if (missing.length === 0) console.log("(none)");
  else console.log(missing.join("\n"));

  console.log("");
  console.log("--- Unused (seeded but not used in routes) ---");
  if (unused.length === 0) console.log("(none)");
  else console.log(unused.join("\n"));

  console.log("");
  console.log("Tip: missing permissions should be added to seedRBAC; unused are safe but could indicate dead/legacy permissions.");
};

main();
