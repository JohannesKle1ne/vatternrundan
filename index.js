const puppeteer = require("puppeteer");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clickWithDelay(button) {
  return new Promise((resolve) => {
    button.click();
    setTimeout(resolve, 2000);
  });
}

const checkSite = async () => {
  console.log("Launch pupeteer..");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto(
    "https://www.sport-conrad.com/ski-alpin/ski/freeride-freetouring-ski/?count=253&offset=0"
  );
  console.log("Visiting page..");
  await page.waitForSelector(".sc-product-list-tile__action--to-product", {
    visible: true,
  });

  console.log("Found to product button");

  for (let i = 0; i < 72; i++) {
    await page.waitForSelector(
      ".sc-product-list__wrapper > ul > ul.sc-product-list-tile-row:nth-child(2)",
      {
        visible: true,
      }
    );
    console.log("found ul");
    /*     const selector = `ul.sc-product-list__tiles > li:nth-child(${i}) button.sc-product-list-tile__action--to-product`;
     */
    const selector =
      ".sc-product-list__wrapper > ul > ul.sc-product-list-tile-row:nth-child(2) > li:nth-child(2) button.sc-product-list-tile__action--to-product";
    const element = await page.$(selector);
    console.log("found li element", element);

    if (element == null) continue;
    await Promise.all([
      await page.$eval(selector, (element) => {
        element.click();
      }),
      page.waitForNavigation(),
    ]);
    /*   await page.click(".sc-product-list-tile__action--to-product");
     */

    console.log("look for page meta");
    await page.waitForSelector(".sc-skiMeta");
    console.log("found page meta");

    //  await delay(1000);

    const name = await page.evaluate(() => {
      return document
        .querySelector(".sc-product-buy-box__title")
        .innerText.trim();
    });
    console.log(name);

    const skiWidth = await page.evaluate(() => {
      return document
        .querySelector(".sc-skiMeta_attribute-silhouette > span")
        .innerText.trim();
    });
    console.log(skiWidth);

    await Promise.all([page.goBack(), page.waitForNavigation()]);
    break;
  }

  /*  const lines = innerText.split("\n");

  const weekendDays = ["Freitag", "Samstag", "Sonntag"];

  const weekendLines = lines.filter((l) =>
    weekendDays.some((d) => l.includes(d))
  );
  const hasWeekend = weekendLines.length > 0;

  console.log(hasWeekend);
 */

  browser.close();
};

checkSite();

setInterval(() => {
  checkSite();
}, 1000 * 60 * 5);
