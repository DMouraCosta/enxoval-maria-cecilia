import fs from "fs";
import path from "path";

const FILE = path.resolve("data/checklist.json");

function ensureFile() {
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }

  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([], null, 2));
  }
}

export function readData() {
  ensureFile();

  const raw = fs.readFileSync(FILE);

  return JSON.parse(raw);
}

export function writeData(data) {
  ensureFile();

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
