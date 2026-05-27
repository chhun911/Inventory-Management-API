import { expect } from 'chai';
import { By, until } from 'selenium-webdriver';
import { createDriver } from '../support/driver.js';
import {
  dt, goto, click, typeInto, getText, waitForUrlMatches,
  waitForVisible, clearAuth, uniqueSuffix, elementExists,
} from '../support/helpers.js';
import { registerViaApi, createSupplierViaApi } from '../support/api.js';
import { snapshot, snapshotOnFailure } from '../support/screenshot.js';
import { config } from '../support/config.js';

async function loginInBrowser(driver, email, password) {
  await goto(driver, '/login');
  await typeInto(driver, dt('login-email'), email);
  await typeInto(driver, dt('login-password'), password);
  await click(driver, dt('login-submit'));
  await waitForUrlMatches(driver, /\/suppliers$/);
}

describe('Suppliers CRUD UI', function () {
  let driver;
  let userEmail;
  const userPassword = 'password123';
  let token;

  before(async function () {
    driver = await createDriver();
    userEmail = `crud-${uniqueSuffix()}@example.com`;
    const reg = await registerViaApi(userEmail, userPassword, 'CRUD Tester');
    token = reg.accessToken;
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  beforeEach(async function () {
    await goto(driver, '/login');
    await clearAuth(driver);
    await loginInBrowser(driver, userEmail, userPassword);
  });

  afterEach(async function () {
    await snapshotOnFailure(driver, this);
  });

  it('shows empty state or table on the suppliers page', async function () {
    await goto(driver, '/suppliers');
    await waitForVisible(driver, dt('suppliers-heading'));
    const hasEmpty = await elementExists(driver, dt('suppliers-empty'), 1500);
    const hasTable = await elementExists(driver, dt('suppliers-table'), 1500);
    expect(hasEmpty || hasTable).to.equal(true);
  });

  it('creates a new supplier via the UI', async function () {
    await goto(driver, '/suppliers');
    await click(driver, dt('suppliers-new-link'));
    await waitForUrlMatches(driver, /\/suppliers\/new$/);
    await waitForVisible(driver, dt('create-heading'));

    const name = `Acme ${uniqueSuffix()}`;
    await typeInto(driver, dt('supplier-name'), name);
    await typeInto(driver, dt('supplier-contactEmail'), `acme-${uniqueSuffix()}@example.com`);
    await typeInto(driver, dt('supplier-phone'), '555-0100');
    await typeInto(driver, dt('supplier-address'), '1 Test Way');
    await snapshot(driver, 'supplier-create-form-filled');
    await click(driver, dt('supplier-submit'));

    await waitForUrlMatches(driver, /\/suppliers\/\d+$/);
    const heading = await getText(driver, dt('details-name'));
    expect(heading).to.equal(name);
    await snapshot(driver, 'supplier-create-success-details');
  });

  it('validates required fields on the create form', async function () {
    await goto(driver, '/suppliers/new');
    await click(driver, dt('supplier-submit'));
    expect(await getText(driver, dt('supplier-name-error'))).to.match(/required/i);
    expect(await getText(driver, dt('supplier-contactEmail-error'))).to.match(/required/i);
  });

  it('shows a server error when creating a duplicate supplier name', async function () {
    const dupName = `Dup ${uniqueSuffix()}`;
    await createSupplierViaApi(token, {
      name: dupName,
      contactEmail: `dup1-${uniqueSuffix()}@example.com`,
    });
    await goto(driver, '/suppliers/new');
    await typeInto(driver, dt('supplier-name'), dupName);
    await typeInto(driver, dt('supplier-contactEmail'), `dup2-${uniqueSuffix()}@example.com`);
    await click(driver, dt('supplier-submit'));
    const err = await getText(driver, dt('create-error'));
    expect(err).to.match(/already exists/i);
  });

  it('lists suppliers and navigates to details', async function () {
    const supplier = await createSupplierViaApi(token, {
      name: `View ${uniqueSuffix()}`,
      contactEmail: `view-${uniqueSuffix()}@example.com`,
    });
    await goto(driver, '/suppliers');
    await waitForVisible(driver, By.css(`[data-test="supplier-row-${supplier.id}"]`));
    await click(driver, By.css(`[data-test="supplier-name-${supplier.id}"]`));
    await waitForUrlMatches(driver, new RegExp(`/suppliers/${supplier.id}$`));
    const name = await getText(driver, dt('details-name'));
    expect(name).to.equal(supplier.name);
  });

  it('edits an existing supplier', async function () {
    const supplier = await createSupplierViaApi(token, {
      name: `Edit ${uniqueSuffix()}`,
      contactEmail: `edit-${uniqueSuffix()}@example.com`,
      phone: '555-0001',
    });
    await goto(driver, `/suppliers/${supplier.id}/edit`);
    await waitForVisible(driver, dt('edit-heading'));
    const newName = `Edited ${uniqueSuffix()}`;
    await typeInto(driver, dt('supplier-name'), newName);
    await typeInto(driver, dt('supplier-phone'), '555-9999');
    await click(driver, dt('supplier-submit'));
    await waitForUrlMatches(driver, new RegExp(`/suppliers/${supplier.id}$`));
    const heading = await getText(driver, dt('details-name'));
    expect(heading).to.equal(newName);
    const phoneText = await getText(driver, dt('details-phone'));
    expect(phoneText).to.match(/555-9999/);
  });

  it('shows server error when editing to a conflicting name', async function () {
    const a = await createSupplierViaApi(token, {
      name: `A-${uniqueSuffix()}`,
      contactEmail: `a-${uniqueSuffix()}@example.com`,
    });
    const b = await createSupplierViaApi(token, {
      name: `B-${uniqueSuffix()}`,
      contactEmail: `b-${uniqueSuffix()}@example.com`,
    });
    await goto(driver, `/suppliers/${b.id}/edit`);
    await waitForVisible(driver, dt('edit-heading'));
    await typeInto(driver, dt('supplier-name'), a.name);
    await click(driver, dt('supplier-submit'));
    const err = await getText(driver, dt('edit-error'));
    expect(err).to.match(/already exists/i);
  });

  it('deletes a supplier from the list with confirmation', async function () {
    const supplier = await createSupplierViaApi(token, {
      name: `Del ${uniqueSuffix()}`,
      contactEmail: `del-${uniqueSuffix()}@example.com`,
    });
    await goto(driver, '/suppliers');
    await waitForVisible(driver, By.css(`[data-test="supplier-row-${supplier.id}"]`));
    await click(driver, By.css(`[data-test="supplier-delete-${supplier.id}"]`));
    await waitForVisible(driver, dt('delete-modal'));
    const modalName = await getText(driver, dt('delete-modal-name'));
    expect(modalName).to.equal(supplier.name);
    await click(driver, dt('delete-confirm'));

    await driver.wait(
      until.stalenessOf(await driver.findElement(By.css(`[data-test="supplier-row-${supplier.id}"]`))),
      config.defaultTimeoutMs,
    );
    const stillThere = await elementExists(
      driver,
      By.css(`[data-test="supplier-row-${supplier.id}"]`),
      1000,
    );
    expect(stillThere).to.equal(false);

    const success = await getText(driver, dt('suppliers-success'));
    expect(success).to.match(/deleted/i);
  });

  it('cancels delete from the confirmation modal', async function () {
    const supplier = await createSupplierViaApi(token, {
      name: `Keep ${uniqueSuffix()}`,
      contactEmail: `keep-${uniqueSuffix()}@example.com`,
    });
    await goto(driver, '/suppliers');
    await waitForVisible(driver, By.css(`[data-test="supplier-row-${supplier.id}"]`));
    await click(driver, By.css(`[data-test="supplier-delete-${supplier.id}"]`));
    await waitForVisible(driver, dt('delete-modal'));
    await click(driver, dt('delete-cancel'));
    const modalGone = await elementExists(driver, dt('delete-modal'), 1000);
    expect(modalGone).to.equal(false);
    const stillThere = await elementExists(
      driver,
      By.css(`[data-test="supplier-row-${supplier.id}"]`),
      1000,
    );
    expect(stillThere).to.equal(true);
  });

  it('deletes a supplier from the details page', async function () {
    const supplier = await createSupplierViaApi(token, {
      name: `DetDel ${uniqueSuffix()}`,
      contactEmail: `detdel-${uniqueSuffix()}@example.com`,
    });
    await goto(driver, `/suppliers/${supplier.id}`);
    await waitForVisible(driver, dt('details-name'));
    await click(driver, dt('details-delete'));
    await waitForVisible(driver, dt('delete-modal'));
    await click(driver, dt('delete-confirm'));
    await waitForUrlMatches(driver, /\/suppliers$/);
    const stillThere = await elementExists(
      driver,
      By.css(`[data-test="supplier-row-${supplier.id}"]`),
      1000,
    );
    expect(stillThere).to.equal(false);
  });
});
