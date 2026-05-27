import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';
import { config } from './config.js';

export async function createDriver() {
  let builder = new Builder().forBrowser(config.browser);

  if (config.browser === 'chrome') {
    const options = new chrome.Options();
    if (config.headless) options.addArguments('--headless=new');
    options.addArguments(
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,900',
    );
    builder = builder.setChromeOptions(options);
  } else if (config.browser === 'firefox') {
    const options = new firefox.Options();
    if (config.headless) options.addArguments('-headless');
    options.addArguments('--width=1280', '--height=900');
    builder = builder.setFirefoxOptions(options);
  }

  const driver = await builder.build();
  await driver.manage().setTimeouts({ implicit: config.implicitWaitMs });
  return driver;
}
