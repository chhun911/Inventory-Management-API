import { expect } from 'chai';
import { createDriver } from '../support/driver.js';
import {
  dt, goto, click, typeInto, getText, waitForUrlMatches, waitForVisible, clearAuth, uniqueSuffix,
} from '../support/helpers.js';
import { registerViaApi } from '../support/api.js';
import { snapshot, snapshotOnFailure } from '../support/screenshot.js';

describe('Authentication UI', function () {
  let driver;

  before(async function () {
    driver = await createDriver();
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

  it('shows the login form on /login', async function () {
    await goto(driver, '/login');
    await waitForVisible(driver, dt('login-submit'));
    const heading = await driver.findElement(dt('login-submit')).getText();
    expect(heading).to.match(/Sign in/i);
  });

  it('client-side validates required login fields', async function () {
    await goto(driver, '/login');
    await click(driver, dt('login-submit'));
    const emailErr = await getText(driver, dt('login-email-error'));
    const pwErr = await getText(driver, dt('login-password-error'));
    expect(emailErr).to.match(/required/i);
    expect(pwErr).to.match(/required/i);
  });

  it('client-side validates email format on login', async function () {
    await goto(driver, '/login');
    await typeInto(driver, dt('login-email'), 'not-an-email');
    await typeInto(driver, dt('login-password'), 'password123');
    await click(driver, dt('login-submit'));
    const emailErr = await getText(driver, dt('login-email-error'));
    expect(emailErr).to.match(/valid email/i);
  });

  it('shows server error for invalid credentials', async function () {
    await goto(driver, '/login');
    await typeInto(driver, dt('login-email'), `nope-${uniqueSuffix()}@example.com`);
    await typeInto(driver, dt('login-password'), 'wrongpassword');
    await click(driver, dt('login-submit'));
    const err = await getText(driver, dt('login-error'));
    expect(err).to.match(/invalid credentials/i);
  });

  it('registers a new user and lands on suppliers', async function () {
    await goto(driver, '/register');
    await snapshot(driver, 'register-form');
    const email = `seluser-${uniqueSuffix()}@example.com`;
    await typeInto(driver, dt('register-name'), 'Selenium User');
    await typeInto(driver, dt('register-email'), email);
    await typeInto(driver, dt('register-password'), 'password123');
    await click(driver, dt('register-submit'));
    await waitForUrlMatches(driver, /\/suppliers$/);
    await waitForVisible(driver, dt('suppliers-heading'));
    await snapshot(driver, 'register-success-suppliers');
  });

  it('client-side validates the register form', async function () {
    await goto(driver, '/register');
    await typeInto(driver, dt('register-name'), 'A');
    await typeInto(driver, dt('register-email'), 'bad-email');
    await typeInto(driver, dt('register-password'), '123');
    await click(driver, dt('register-submit'));
    expect(await getText(driver, dt('register-name-error'))).to.match(/at least 2/i);
    expect(await getText(driver, dt('register-email-error'))).to.match(/valid email/i);
    expect(await getText(driver, dt('register-password-error'))).to.match(/at least 6/i);
  });

  it('rejects duplicate email on registration', async function () {
    const email = `dup-${uniqueSuffix()}@example.com`;
    await registerViaApi(email, 'password123', 'Dup User');
    await goto(driver, '/register');
    await typeInto(driver, dt('register-name'), 'Dup User Again');
    await typeInto(driver, dt('register-email'), email);
    await typeInto(driver, dt('register-password'), 'password123');
    await click(driver, dt('register-submit'));
    const err = await getText(driver, dt('register-error'));
    expect(err).to.match(/already registered|already exists/i);
  });

  it('logs in an existing user via the UI and lands on suppliers', async function () {
    const email = `login-${uniqueSuffix()}@example.com`;
    await registerViaApi(email, 'password123', 'Login User');
    await goto(driver, '/login');
    await typeInto(driver, dt('login-email'), email);
    await typeInto(driver, dt('login-password'), 'password123');
    await click(driver, dt('login-submit'));
    await waitForUrlMatches(driver, /\/suppliers$/);
    await waitForVisible(driver, dt('nav-logout'));
  });

  it('redirects unauthenticated users hitting a protected route to /login', async function () {
    await goto(driver, '/suppliers');
    await waitForUrlMatches(driver, /\/login(\?.*)?$/);
    await waitForVisible(driver, dt('login-submit'));
  });

  it('logs out and returns to login', async function () {
    const email = `logout-${uniqueSuffix()}@example.com`;
    await registerViaApi(email, 'password123', 'Logout User');
    await goto(driver, '/login');
    await typeInto(driver, dt('login-email'), email);
    await typeInto(driver, dt('login-password'), 'password123');
    await click(driver, dt('login-submit'));
    await waitForUrlMatches(driver, /\/suppliers$/);
    await click(driver, dt('nav-logout'));
    await waitForUrlMatches(driver, /\/login$/);
    await waitForVisible(driver, dt('login-submit'));
  });
});
