import { expect } from 'chai';
import { createDriver } from '../support/driver.js';
import {
  dt, goto, click, typeInto, getText, waitForUrlMatches,
  waitForVisible, clearAuth, uniqueSuffix,
} from '../support/helpers.js';
import { registerViaApi } from '../support/api.js';
import { snapshot, snapshotOnFailure } from '../support/screenshot.js';

async function loginInBrowser(driver, email, password) {
  await goto(driver, '/login');
  await typeInto(driver, dt('login-email'), email);
  await typeInto(driver, dt('login-password'), password);
  await click(driver, dt('login-submit'));
  await waitForUrlMatches(driver, /\/suppliers$/);
}

describe('Error pages and error messages', function () {
  let driver;
  let userEmail;
  const userPassword = 'password123';

  before(async function () {
    driver = await createDriver();
    userEmail = `err-${uniqueSuffix()}@example.com`;
    await registerViaApi(userEmail, userPassword, 'Error Tester');
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  beforeEach(async function () {
    await goto(driver, '/login');
    await clearAuth(driver);
    await driver.navigate().refresh();
  });

  afterEach(async function () {
    await snapshotOnFailure(driver, this);
  });

  it('renders the 404 page for an unknown route while unauthenticated', async function () {
    await goto(driver, '/this-route-does-not-exist');
    await waitForVisible(driver, dt('not-found'));
    expect(await getText(driver, dt('not-found-code'))).to.equal('404');
    expect(await getText(driver, dt('not-found-title'))).to.match(/not found/i);
    expect(await getText(driver, dt('not-found-message'))).to.match(/doesn'?t exist/i);
    const homeBtn = await driver.findElement(dt('not-found-home'));
    expect(await homeBtn.getText()).to.match(/sign in/i);
    await snapshot(driver, '404-unauthenticated');
  });

  it('renders the 404 page for an unknown route while authenticated', async function () {
    await loginInBrowser(driver, userEmail, userPassword);
    await goto(driver, '/totally-missing');
    await waitForVisible(driver, dt('not-found'));
    expect(await getText(driver, dt('not-found-code'))).to.equal('404');
    const homeBtn = await driver.findElement(dt('not-found-home'));
    expect(await homeBtn.getText()).to.match(/suppliers/i);
    await homeBtn.click();
    await waitForUrlMatches(driver, /\/suppliers$/);
  });

  it('shows a not-found message for a missing supplier on the details page', async function () {
    await loginInBrowser(driver, userEmail, userPassword);
    await goto(driver, '/suppliers/999999');
    await waitForVisible(driver, dt('details-notfound'));
    const msg = await getText(driver, dt('details-notfound'));
    expect(msg).to.match(/not found/i);
  });

  it('shows a not-found message for a missing supplier on the edit page', async function () {
    await loginInBrowser(driver, userEmail, userPassword);
    await goto(driver, '/suppliers/999999/edit');
    await waitForVisible(driver, dt('edit-notfound'));
    const msg = await getText(driver, dt('edit-notfound'));
    expect(msg).to.match(/not found/i);
  });

  it('shows session-expired notice on /login?session=expired', async function () {
    await goto(driver, '/login?session=expired');
    await waitForVisible(driver, dt('session-expired'));
    const msg = await getText(driver, dt('session-expired'));
    expect(msg).to.match(/session has expired/i);
  });
});
