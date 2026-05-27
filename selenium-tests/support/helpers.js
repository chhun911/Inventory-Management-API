import { By, until } from 'selenium-webdriver';
import { config } from './config.js';

export const dt = (name) => By.css(`[data-test="${name}"]`);

export async function goto(driver, path = '/') {
  const url = `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  await driver.get(url);
}

export async function waitFor(driver, locator, timeout = config.defaultTimeoutMs) {
  return driver.wait(until.elementLocated(locator), timeout);
}

export async function waitForVisible(driver, locator, timeout = config.defaultTimeoutMs) {
  const el = await waitFor(driver, locator, timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

export async function waitForText(driver, locator, expected, timeout = config.defaultTimeoutMs) {
  await driver.wait(async () => {
    try {
      const el = await driver.findElement(locator);
      const text = await el.getText();
      return text.includes(expected);
    } catch {
      return false;
    }
  }, timeout, `Timed out waiting for text "${expected}"`);
}

export async function typeInto(driver, locator, value) {
  const el = await waitForVisible(driver, locator);
  await el.clear();
  if (value !== '') await el.sendKeys(value);
}

export async function click(driver, locator) {
  const el = await waitForVisible(driver, locator);
  await el.click();
}

export async function getText(driver, locator) {
  const el = await waitForVisible(driver, locator);
  return el.getText();
}

export async function elementExists(driver, locator, timeoutMs = 1000) {
  try {
    await driver.wait(until.elementLocated(locator), timeoutMs);
    return true;
  } catch {
    return false;
  }
}

export async function waitForUrlMatches(driver, regex, timeout = config.defaultTimeoutMs) {
  await driver.wait(async () => {
    const current = await driver.getCurrentUrl();
    return regex.test(current);
  }, timeout, `Timed out waiting for URL to match ${regex}`);
}

export async function clearAuth(driver) {
  await driver.executeScript(`
    try {
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('auth_user');
    } catch (e) {}
  `);
}

export function uniqueSuffix() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
