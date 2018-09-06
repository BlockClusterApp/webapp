const puppeteer = require('puppeteer');

let page;
let browser;
const width = 1366;
const height = 720;

const TIMEOUT = 10 * 60 * 1000;

const env = process.env.NODE_ENV || 'development';

function sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: true,
    slowMo: 1,
    args: [`--window-size=${width},${height}`, '--no-sandbox', '--disable-setuid-sandbox'],
  });
  page = await browser.newPage();
  const puppeteer = require('puppeteer');
});

afterAll(() => {
  browser.close();
});

const BASE_URL = 'https://test.blockcluster.io';

const networkUser = {
  email: 'bcbot@blockcluster.io',
  password: '1234567890',
};

const network = {
  instanceId: "injxtone"
}

describe('Asset Management', () => {

  test(
    'Can Create Asset',
    async () => {
      await page.goto(BASE_URL);
      await page.waitForSelector('.ladda-button.btn.btn-complete.btn-cons.m-t-10');
      await page.click('input[name=email]');
      await page.type('input[name=email]', validUser.email);
      await page.click('input[name=password]');
      await page.type('input[name=password]', validUser.password, { delay: 50 });

      await page.click('.ladda-button.btn.btn-complete.btn-cons.m-t-10');
      await page.waitForSelector('.thumbnail-wrapper.d32.circular.inline');
    },
    TIMEOUT
  );

  test(
    'Can create a network',
    async () => {
      await page.waitForSelector('li[title="Create Network"]');
      await page.goto(`${BASE_URL}/app/createNetwork`);
      await page.waitForSelector('option[value="Light"]');
      await page.click('input[name="projectName"]');
      await page.type('input[name="projectName"]', networkDetails.name, { delay: 50 });
      await page.click('button[type=submit]');
      await page.waitForSelector('.viewNetwork');

      const url = page.url();
      const urlParts = url.split('/');
      networkDetails.instanceId = urlParts[urlParts.length - 1];

      await page.goto(`${BASE_URL}/app/networks/${networkDetails.instanceId}/settings`);
      await page.waitForSelector('span.label');
    },
    TIMEOUT
  );

  test(
    'Can delete a network',
    async () => {
      await page.goto(`${BASE_URL}/app/networks/${networkDetails.instanceId}/settings`);
      await sleep(5000);
      await page.waitForSelector('.ladda-button.btn.btn-danger.btn-cons');
      await sleep(5000);
      await page.click('.ladda-button.btn.btn-danger.btn-cons');
      await page.waitForSelector('.networksList');
    },
    TIMEOUT
  );
});
