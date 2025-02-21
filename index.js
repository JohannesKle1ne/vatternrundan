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
    "https://www.sport-conrad.com/ski-alpin/ski/freeride-freetouring-ski/?count=300&offset=0"
  );
  console.log("Visiting page..");
  await page.waitForSelector(".sc-product-list-tile__action--to-product", {
    visible: true,
  });

  console.log("Found to product button");

  for (let j = 1; j <= 100; j++) {
    for (let i = 1; i <= 3; i++) {
      await page.waitForSelector(`.sc-product-list__wrapper > ul`, {
        visible: true,
      });
      console.log("found ul");
      /*     const selector = `ul.sc-product-list__tiles > li:nth-child(${i}) button.sc-product-list-tile__action--to-product`;
       */
      const selector = `.sc-product-list__wrapper > ul > ul.sc-product-list-tile-row:nth-child(${j}) > li:nth-child(${i}) button.sc-product-list-tile__action--to-product`;
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

      const skiObject = {};
      const name = await page.evaluate(() => {
        return document
          .querySelector(".sc-product-buy-box__title")
          .innerText.trim();
      });
      skiObject.name = name;

      const skiWidth = await page.evaluate(() => {
        const element = document.querySelector(
          ".sc-skiMeta_attribute-silhouette > span"
        );
        return element
          ? parseInt(element.innerText.replace(/\D/g, ""), 10)
          : null;
      });
      skiObject.skiWidth = skiWidth;

      const radius = await page.evaluate(() => {
        const element = document.querySelector(
          ".sc-skiMeta_attribute--radius .sc-skiMeta_attribute--value"
        );
        return element
          ? parseInt(element.innerText.replace(/\D/g, ""), 10)
          : null;
      });
      skiObject.radius = radius;

      const sidecut = await page.evaluate(() => {
        const element = document.querySelector(
          ".sc-skiMeta_attribute--sidecut .sc-skiMeta_attribute--value"
        );
        return element ? element.innerText.match(/\d+/g).map(Number) : null;
      });
      skiObject.sidecut = sidecut.join(", ");

      const weight = await page.evaluate(() => {
        const rows = document.querySelectorAll(
          ".sc-product-detail-secondary__attributes--row"
        );
        for (let row of rows) {
          const keyElement = row.querySelector(
            ".sc-product-detail-secondary__attributes--key"
          );
          if (
            keyElement &&
            keyElement.innerText.trim().toLowerCase() === "gewicht:"
          ) {
            const valueElement = row.querySelector(
              ".sc-product-detail-secondary__attributes--value span"
            );
            return valueElement
              ? parseInt(valueElement.innerText.replace(/\D/g, ""), 10)
              : null;
          }
        }
        return null;
      });
      skiObject.weight = weight;

      const numbers = await page.evaluate(() => {
        return Array.from(
          document.querySelectorAll(".sc-product-buy-box__option-menu__option")
        )
          .map((el) => parseInt(el.textContent.trim(), 10))
          .filter((num) => !isNaN(num));
      });
      skiObject.sizes = numbers.join(", ");

      const price = await page.evaluate(() => {
        const priceElement = document.querySelector(
          ".sc-product-buy-box__price--current"
        );
        return priceElement
          ? priceElement.textContent
              .trim()
              .replace(/[^\d,]/g, "")
              .replace(",", ".")
          : null;
      });
      skiObject.price = price;

      const currentUrl = await page.url();
      skiObject.url = currentUrl;

      console.log(skiObject);
      await Promise.all([page.goBack(), page.waitForNavigation()]);
    }
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
