const puppeteer = require("puppeteer");
const fs = require("fs");
const reader = require("xlsx");
const file = reader.readFile("./euTopTeams.xlsx");
const euTopTeamsJson = require("./euTopTeams.json");
const ws = reader.utils.json_to_sheet(euTopTeamsJson);
reader.utils.book_append_sheet(file, ws, "Sheet3");
reader.writeFile(file, "./euTopTeams.xlsx");
async function start() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  //   gets total pages of ranking
  await page.goto(`https://footballdatabase.com/ranking/europe/1`, {
    waitUntil: "networkidle2",
  });
  const totalPages = await page.evaluate(() => {
    const pagination = document.querySelector(
      "#wrap > div.container.mainfdb > div:nth-child(1) > div.col-md-8 > div > div.text-center > ul"
    );
    const pages = pagination.querySelectorAll("li");
    return pages.length;
  });

  // empty array which stores data
  let euTopRankingTeams = [];
  //   changes index of current page when data is scraped
  for (let pageIndex = 1; pageIndex < totalPages + 1; pageIndex++) {
    console.log("pagination" + pageIndex);
    await page.goto(
      `https://footballdatabase.com/ranking/europe/${pageIndex}`,
      {
        waitUntil: "networkidle2",
      }
    );
    const grabLinks = await page.evaluate(() => {
      const aHrefs = document.querySelectorAll(
        "#wrap > div.container.mainfdb > div:nth-child(1) > div.col-md-8 > div > div.table-responsive > table > tbody > tr > td.club.text-left > a:nth-child(1)"
      );
      const links = [];
      for (let index = 0; index < aHrefs.length; index++) {
        const website = "https://footballdatabase.com";
        const link = website + aHrefs[index].getAttribute("href");
        links.push(link);
      }
      return links;
    });

    // scrapes data by going on each page
    for (let i = 0; i < grabLinks.length; i++) {
      console.log("link" + i);
      await page.goto(grabLinks[i], {
        waitUntil: "domcontentloaded",
      });

      const grabTeamsDetails = await page.evaluate(() => {
        let teams;
        const website = "https://footballdatabase.com";
        // name
        const teamName = document.querySelector("h1").innerHTML;
        // logo
        const teamLogo = document
          .querySelector(
            "#wrap > div.container.mainfdb > div:nth-child(1) > div > div"
          )
          .getAttribute("style");
        const removeBgImage = teamLogo.replace(/background-image: url/g, "");
        const removeBrackets = removeBgImage.replace(/([(;)])/g, "");
        const teamLogoImage = website + removeBrackets;
        const country = document.querySelector(
          "#wrap > div.container.mainfdb > div:nth-child(1) > div > a.sm_logo-name.sm_logo-name-flag"
        ).innerHTML;
        const worldRanking = document.querySelector(
          "#wrap > div.container.mainfdb > div:nth-child(1) > div > a:nth-child(4)"
        ).innerHTML;
        const europeRanking = document.querySelector(
          "#wrap > div.container.mainfdb > div:nth-child(1) > div > a:nth-child(5)"
        ).innerHTML;
        const countryRanking = document.querySelector(
          "#wrap > div.container.mainfdb > div:nth-child(1) > div > a:nth-child(6)"
        ).innerHTML;
        teams = {
          club: teamName,
          teamLogo: teamLogoImage,
          country,
          worldRanking,
          europeRanking,
          countryRanking,
        };

        return teams;
      });

      //   pushes to global array euteams
      euTopRankingTeams.push(grabTeamsDetails);

      // csv

      //   writeStream.write(
      //       `Club, TeamLogo, Country, WorldRanking, EuropeRanking, CountryRanking \n`
      //     );
      //     writeStream.write(
      //       `${grabTeamsDetails.club}, ${grabTeamsDetails.teamLogo}, ${grabTeamsDetails.country}, ${grabTeamsDetails.worldRanking}, ${grabTeamsDetails.europeRanking}, ${grabTeamsDetails.countryRanking} \n`
      //     );
    }
  }
  //   sets data to json file
  //   fs.writeFileSync("euTopTeams.json", JSON.stringify(euTopRankingTeams));
  await browser.close();
}

// start();
