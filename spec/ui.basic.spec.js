const helpers = require('./helpers');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { expect } = require('chai');

const width = 1366;
const height = 720;

const TIMEOUT = 10 * 60 * 1000;

const env = process.env.NODE_ENV || 'development';

function sleep(time) {
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
}

const BASE_URL = 'https://test.blockcluster.io';

const validUser = {
  email: 'jibin.mathews@blockcluster.io',
  password: '1234567890',
};

const invalidUser = {
  email: 'jibin.mathews@blockcluster.io',
  password: 'asdfghjkl',
};

const networkDetails = {
  name: 'Puppeteer test network',
  instanceId: undefined,
};

describe('Basic Flow', () => {
  let page;
  let browser;
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      slowMo: 1,
      args: [`--window-size=${width},${height}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width, height });
  });

  afterAll(() => {
    browser.close();
  });

  test(
    'Can login',
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

describe('Asset Management', () => {
  let page;
  let browser;

  const networkUser = {
    email: 'bcbot@blockcluster.io',
    password: '1234567890',
  };

  const network = {
    instanceId: 'dgaekbhr',
  };

  const asset = {
    solo: {
      name: helpers.generateRandomString(),
    },
    bulk: {
      name: helpers.generateRandomString(),
    },
  };

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      slowMo: 20,
      args: [`--window-size=${width},${height}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width, height });
  });

  afterAll(() => {
    browser.close();
  });

  test(
    'Can login',
    async () => {
      await page.goto(BASE_URL);
      await page.waitForSelector('.ladda-button.btn.btn-complete.btn-cons.m-t-10');
      await page.click('input[name=email]');
      await page.type('input[name=email]', networkUser.email);
      await page.click('input[name=password]');
      await page.type('input[name=password]', networkUser.password, { delay: 50 });

      await page.click('.ladda-button.btn.btn-complete.btn-cons.m-t-10');
      await page.waitForSelector('.thumbnail-wrapper.d32.circular.inline');
    },
    TIMEOUT
  );

  test(
    'Can Create Solo Asset',
    async () => {
      await page.goto(`${BASE_URL}/app/networks/${network.instanceId}/assets/create`);
      await page.waitForSelector('form div.form-group select.form-control:nth-child(3) option');
      await page.click('input[type=text]');
      await page.type('input[type=text]', asset.solo.name);
      await sleep(3000);
      await page.click('.ladda-button.btn.btn-success.m-t-10');
      await sleep(5000);
      await page.goto(`${BASE_URL}/app/networks/${network.instanceId}/assets/stats`);
      await page.waitForSelector('div.table-responsive table#basicTable.table tbody tr td.v-align-middle');
      await sleep(4000);
      const body = await page.evaluate(el => el.innerHTML, await page.$('body'));
      const $ = cheerio.load(body);
      const trs = $('tbody').find('tr');
      let isAssetCreated = false;
      for (let i = 0; i < trs.length; i++) {
        if ($($(trs[i]).find('td:nth-child(1)')).html() === asset.solo.name) {
          isAssetCreated = true;
          asset.solo.administrator = $($(trs[i]).find('td:nth-child(4)')).html();
          asset.solo.quantity = Number($($(trs[i]).find('td:nth-child(3)')).html());
          asset.solo.type = $($(trs[i]).find('td:nth-child(2)')).html();
          break;
        }
      }
      expect(isAssetCreated).to.true;
      expect(asset.solo.type).to.equal('solo');
      expect(asset.solo.quantity).to.equal(0);
      await sleep(2000);
    },
    TIMEOUT
  );

  test(
    'Can Create Bulk Asset',
    async () => {
      await page.goto(`${BASE_URL}/app/networks/${network.instanceId}/assets/create`);
      await page.waitForSelector('form div.form-group select.form-control:nth-child(3) option');
      await page.click('input[type=text]');
      await page.type('input[type=text]', asset.bulk.name);
      await sleep(1000);
      await page.select('form > .form-group:nth-child(2) > select', 'bulk');
      await sleep(3000);
      await page.click('.ladda-button.btn.btn-success.m-t-10');
      await sleep(5000);
      await page.goto(`${BASE_URL}/app/networks/${network.instanceId}/assets/stats`);
      await page.waitForSelector('div.table-responsive table#basicTable.table tbody tr td.v-align-middle');
      await sleep(4000);
      const body = await page.evaluate(el => el.innerHTML, await page.$('body'));
      const $ = cheerio.load(body);
      const trs = $('tbody').find('tr');
      let isAssetCreated = false;
      for (let i = 0; i < trs.length; i++) {
        if ($($(trs[i]).find('td:nth-child(1)')).html() === asset.bulk.name) {
          isAssetCreated = true;
          asset.bulk.administrator = $($(trs[i]).find('td:nth-child(4)')).html();
          asset.bulk.quantity = Number($($(trs[i]).find('td:nth-child(3)')).html());
          asset.bulk.type = $($(trs[i]).find('td:nth-child(2)')).html();
          break;
        }
      }
      expect(isAssetCreated).to.true;
      expect(asset.bulk.type).to.equal('bulk');
      expect(asset.bulk.quantity).to.equal(0);
      await sleep(2000);
    },
    TIMEOUT
  );
});
