const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const { scrollPageToBottom } = require("puppeteer-autoscroll-down");

async function start() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.fitsw.com/exercise-list/", {
    waitUntil: "networkidle2",
  });

  await scrollPageToBottom(page, {
    size: 1000,
    delay: 500,
  });

  const grabExcercise = await page.evaluate(() => {
    const tableTr = document.querySelectorAll("#exercise-table-body > tr");

    let exerciseList = [];
    let csvFile;
    tableTr.forEach((x) => {
      const td = x.querySelectorAll("td");
      const groupNestedSpan = td[0].querySelector("span");
      const group = td[0];

      // removes span dot f
      group.removeChild(groupNestedSpan);
      const name = td[1];
      const level = td[2];
      const equipment = td[3];
      const imageTd = td[5].querySelector("span");
      const image = imageTd;

      // csv file:
      csvFile = `${name.innerText}, ${level.innerText}, ${
        equipment.innerText
      }, ${image.getAttribute("data-preview-src")}\n`;

      // js object
      exerciseList.push({
        muscleGroup: group.innerText,
        exercises: [
          {
            name: name.innerText,
            level: level.innerText.replaceAll("\n", "").trim(),
            equipment: equipment.innerText.replaceAll("\n", "").trim(),
            image: image.getAttribute("data-preview-src"),
          },
        ],
      });
    });

    return exerciseList;
  });

  console.log(grabExcercise);
  // const jsonList = JSON.stringify(grabExcercise);

  // await fs.writeFile("workouts.csv", jsonList);

  await browser.close();
}

start();
