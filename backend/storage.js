import fs from "fs";

const FILE = "data/checklist.json";

export function readData() {
  return JSON.parse(fs.readFileSync(FILE));
}

export function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
