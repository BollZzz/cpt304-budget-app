const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = [
  "index.html",
  "privacy.html",
  "style.css",
  "budget.js",
  "chart.js",
];

const missingFiles = requiredFiles.filter(
  (file) => !fs.existsSync(path.join(root, file))
);

if (missingFiles.length > 0) {
  console.error(`Missing required static files: ${missingFiles.join(", ")}`);
  process.exit(1);
}

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const file of ["style.css", "chart.js", "budget.js"]) {
  if (!indexHtml.includes(file)) {
    console.error(`index.html does not reference ${file}`);
    process.exit(1);
  }
}

console.log("Static site verification passed.");
