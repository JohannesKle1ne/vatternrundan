const puppeteer = require("puppeteer");
const { Sequelize, Model, DataTypes } = require("sequelize");
const nodemailer = require("nodemailer");

const subject = "Vätternrundan new start times!";
const link = `<a href="https://mypages.vatternrundan.se">Vatternrundan.se</a>`;

const sendMail = () => {
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true, //ssl
    auth: {
      user: "jojokl1ne@zohomail.eu",
      pass: "Nn9Tgys.Cknh@UW",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  transporter.sendMail({
    from: "jojokl1ne@zohomail.eu",
    to: "johannes_kleine@gmx.de",
    subject: subject,
    html: link,
  });
};

const sequelize = new Sequelize("initial_hug", "postgres", "postgres", {
  host: "database-hug.csehfyfmn8dh.eu-north-1.rds.amazonaws.com",
  port: 5432,
  dialect: "postgres",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    idle: 10000,
  },
});

const Vattern = sequelize.define(
  "Vattern",
  {
    times: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { freezeTableName: true }
);

const checkStartTimes = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  const vattern = await Vattern.findOne({
    where: {
      id: 1,
    },
  });
  let times;
  if (vattern) {
    times = vattern.times;
  } else {
    console.log("no time found in DB");
  }

  const browser = await puppeteer.launch({
    /* headless: false */
  });
  const page = await browser.newPage();
  await page.goto("https://mypages.vatternrundan.se");
  console.log("go to succeeded");
  await page.waitForSelector(
    "#LoginWrapper_ucLogin_eicUserIdEMail_ctl00_txtUserIdEMail"
  );
  console.log("wait done");
  await page.type(
    "#LoginWrapper_ucLogin_eicUserIdEMail_ctl00_txtUserIdEMail",
    "393022"
  );
  await page.type(
    "#LoginWrapper_ucLogin_eicPassword_ctl00_txtPassword",
    "n3x64p"
  );
  console.log("typed");
  await page.click("#LoginWrapper_ucLogin_btn");

  await page.waitForSelector(
    "#Content_rptParticipationCurrent_lnkRaceCurrent_0"
  );
  await page.click("#Content_rptParticipationCurrent_lnkRaceCurrent_0");

  await page.waitForSelector(
    "#Content_ucRegistrationEntered_ucEditButtons_lnkStartTimeChange"
  );
  await page.click(
    "#Content_ucRegistrationEntered_ucEditButtons_lnkStartTimeChange"
  );

  await page.waitForSelector(
    "#ctl00_Content_ucRegistrationEntered_ucStartTimeChange_eicInterval_ctl00_ddlInterval_Input"
  );
  await page.click(
    "#ctl00_Content_ucRegistrationEntered_ucStartTimeChange_eicInterval_ctl00_ddlInterval_Input"
  );

  const searchValue = await page.$eval(
    "#ctl00_Content_ucRegistrationEntered_ucStartTimeChange_eicInterval_ctl00_ddlInterval_DropDown ul",
    (el) => el.innerHTML
  );

  console.log("end");

  if (searchValue != times) {
    console.log("New start times found!!");
    vattern.times = searchValue;
    await vattern.save();
  }
  browser.close();
  sendMail();
};

/* setInterval(() => {
  
}, 1000 * 60); */

console.log("check!");
checkStartTimes();
