const puppeteer = require('puppeteer');

let page;
let browser;
const width = 1366;
const height = 720;

const TIMEOUT = 10 * 60 * 1000;

const env  = process.env.NODE_ENV || "development";

function sleep(time) {
  return new Promise(function(resolve) {
      setTimeout(resolve, time)
  });
}

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: false,
    slowMo: 1,
    args: [`--window-size=${width},${height}`]
  });
  page = await browser.newPage();
  await page.setViewport({ width, height });
});
afterAll(() => {
  browser.close();
});

const BASE_URL="http://localhost:3000"

const validUser = {
  email: 'jibin.mathews@blockcluster.io',
  password: '1234567890'
}

const invalidUser = {
  email: 'jibin.mathews@blockcluster.io',
  password: 'asdfghjkl'
}

const networkDetails = {
  name: 'Puppeteer test network',
  instanceId: undefined
}

describe("Basic Flow", () => {
  // test('Shows error for forgot password', async () => {
  //   await page.goto(BASE_URL);
  //   await page.waitForSelector("#form-login");
  //   await page.click("input[name=email]");
  //   await page.type("input[name=email]", invalidUser.email);
  //   await page.click("input[name=password]");
  //   await page.type("input[name=password]", invalidUser.password);
  //   await page.click("button[type=submit]");
  //   // await page.waitForSelector(".alert.alert-danger");
  //   await sleep(2000);
  //   console.log("Eval");
  //   const alertMessage = await page.evaluate(document.querySelector(".alert.alert-danger").textContent);
  //   console.log("ALert mesae", alertMessage);
  //   expect(alertMessage).toEqual("Incorrect Password");
  // })

  test("Can login", async () => {
    await page.goto(BASE_URL);
    await page.waitForSelector("#form-login");
    await page.click("input[name=email]");
    await page.type("input[name=email]", validUser.email);
    await page.click("input[name=password]");
    await page.type("input[name=password]", validUser.password);
    await page.click("button[type=submit]");
    await page.waitForSelector(".thumbnail-wrapper.d32.circular.inline")
  }, TIMEOUT);

  test("Can create a network", async () => {
    await page.waitForSelector('li[title="Create Network"]');
    await page.goto(`${BASE_URL}/app/createNetwork`);
    await page.waitForSelector('option[value="Light"]');
    await page.click('input[name="projectName"]');
    await page.type('input[name="projectName"]', networkDetails.name, { delay: 50 });
    await page.click("button[type=submit]");
    await page.waitForSelector('.viewNetwork');

    const url = page.url();
    const urlParts = url.split("/");
    networkDetails.instanceId = urlParts[urlParts.length - 1];

    await page.goto(`${BASE_URL}/app/networks/${networkDetails.instanceId}/settings`);
    await page.waitForSelector('span.label');
  }, TIMEOUT);

  test("Can delete a network", async () => {
    await page.goto(`${BASE_URL}/app/networks/${networkDetails.instanceId}/settings`);
    await page.waitForSelector('.ladda-button.btn.btn-danger.btn-cons');
    await sleep(2000);
    await page.click('.ladda-button.btn.btn-danger.btn-cons');
    await page.waitForSelector('.networksList');
  }, TIMEOUT);
});
