import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const screenshotsDir = path.resolve(__dirname, '..', 'screenshots');

function ensureDir() {
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'snapshot';
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export async function snapshot(driver, name) {
  ensureDir();
  const fileName = `${timestamp()}__${slugify(name)}.png`;
  const filePath = path.join(screenshotsDir, fileName);
  const data = await driver.takeScreenshot();
  fs.writeFileSync(filePath, data, 'base64');
  return filePath;
}

export async function snapshotOnFailure(driver, mochaContext) {
  const test = mochaContext.currentTest;
  if (!test || test.state !== 'failed') return null;
  try {
    const filePath = await snapshot(driver, `FAIL__${test.fullTitle()}`);
    console.log(`    📸 Failure snapshot: ${path.relative(process.cwd(), filePath)}`);
    return filePath;
  } catch (err) {
    console.log(`    ⚠️  Could not capture snapshot: ${err.message}`);
    return null;
  }
}
