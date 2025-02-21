const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { parse } = require("json2csv");

async function checkSite() {
  console.log("Launching Puppeteer...");

  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.goto(
    "https://www.sport-conrad.com/ski-alpin/ski/freeride-freetouring-ski/?count=300&offset=0"
  );
  console.log("Visiting page...");

  await page.waitForSelector(".sc-product-list-tile__action--to-product", {
    visible: true,
  });
  console.log("Found 'to product' button");

  const skiData = [];

  for (let j = 1; j <= 100; j++) {
    for (let i = 1; i <= 3; i++) {
      console.log(`row: ${j} item: ${i}`);
      await page
        .waitForSelector(".sc-product-list__wrapper > ul", {
          visible: true,
        })
        .catch(() => {
          console.log("Selector not found within 10 seconds");
        });
      console.log("Found product list");

      const selector = `.sc-product-list__wrapper > ul > ul.sc-product-list-tile-row:nth-child(${j}) > li:nth-child(${i}) button.sc-product-list-tile__action--to-product`;
      const element = await page.$(selector);

      if (!element) continue;

      await Promise.all([
        page.$eval(selector, (el) => el.click()),
        page.waitForNavigation(),
      ]);

      console.log("Extracting ski data...");
      await page.waitForSelector(".sc-skiMeta");

      const skiObject = {
        name: await page.$eval(".sc-product-buy-box__title", (el) =>
          el.innerText.trim()
        ),
        skiWidth: await page.$eval(
          ".sc-skiMeta_attribute-silhouette > span",
          (el) => parseInt(el.innerText.replace(/\D/g, ""), 10)
        ),
        radius: await page.$eval(
          ".sc-skiMeta_attribute--radius .sc-skiMeta_attribute--value",
          (el) => parseFloat(el.innerText.replace(/[^\d.]/g, ""))
        ),
        sidecut: await page.$eval(
          ".sc-skiMeta_attribute--sidecut .sc-skiMeta_attribute--value",
          (el) => el.innerText.match(/\d+/g)?.map(Number).join(", ")
        ),
        weight: await page.evaluate(() => {
          const rows = document.querySelectorAll(
            ".sc-product-detail-secondary__attributes--row"
          );
          for (let row of rows) {
            if (
              row
                .querySelector(".sc-product-detail-secondary__attributes--key")
                ?.innerText.trim()
                .toLowerCase() === "gewicht:"
            ) {
              return parseInt(
                row
                  .querySelector(
                    ".sc-product-detail-secondary__attributes--value span"
                  )
                  ?.innerText.replace(/\D/g, ""),
                10
              );
            }
          }
          return null;
        }),
        brand: await page.evaluate(() => {
          const rows = document.querySelectorAll(
            ".sc-product-detail-secondary__attributes--row"
          );
          for (let row of rows) {
            if (
              row
                .querySelector(".sc-product-detail-secondary__attributes--key")
                ?.innerText.trim()
                .toLowerCase() === "marke:"
            ) {
              return row
                .querySelector(".sc-product-detail-secondary__attributes--value span")
                ?.innerText.trim();
            }
          }
          return null;
        }),
        sizes: await page.$$eval(
          ".sc-product-buy-box__option-menu__option",
          (els) =>
            els
              .map((el) => parseInt(el.textContent.trim(), 10))
              .filter((num) => !isNaN(num))
              .join(", ")
        ),
        price: await page.$eval(".sc-product-buy-box__price--current", (el) =>
          el.textContent
            .trim()
            .replace(/[^\d,]/g, "")
            .replace(",", ".")
        ),
        url: await page.url(),
      };

      skiData.push(skiObject);
      console.log("Added ski object:", skiObject);

      await Promise.all([page.goBack(), page.waitForNavigation()]);
    }
  }

  await browser.close();

  // Save data to CSV
  console.log(skiData);
  const csvFilePath = path.join(__dirname, "ski_data.csv");
  const csv = parse(skiData, {
    fields: [
      { label: "Name", value: "name" },
      { label: "Mittelbreite", value: "skiWidth" },
      { label: "Radius", value: "radius" },
      { label: "Taillierung", value: "sidecut" },
      { label: "Gewicht", value: "weight" },
      { label: "Größen", value: "sizes" },
      { label: "Preis", value: "price" },
      { label: "Link", value: "url" },
    ],
  });
  fs.writeFileSync(csvFilePath, csv);
  console.log(`Saved CSV file: ${csvFilePath}`);
}

checkSite();
