import puppeteer, { Page } from "puppeteer";

import { getCategory, insertMany } from "..";

import { Answer } from "../types";

async function getNbOfPages(page: Page) {
  return await page.evaluate(() => {
    const pagesDiv = document.querySelectorAll(".page-item");
    const pages = pagesDiv[pagesDiv.length - 2].querySelector("a")?.innerText;

    return pages ? parseInt(pages) : 1;
  });
}

async function startScrapping(link: string, categoryName: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(link);

  const nbPages = await getNbOfPages(page);

  for (let i = 1; i <= nbPages; i++) {
    await page.goto(link + "-" + i.toString());

    const category = await getCategory(categoryName);

    const result = await page.evaluate((category) => {
      let answerList: Answer[] = [];

      const cards = document.querySelectorAll(".column.col-2");

      for (const card of cards) {
        const answer = card.querySelector(".celnom > a")?.innerHTML.trim();
        const url = card.querySelector(".celimage")?.querySelector("img")?.src;
        const aliases = null;
        const categoryId = category.id

        if(!answer || !url) continue

        answerList.push({
            answer,
            url,
            aliases,
            categoryId
        })
      }

      return answerList
    }, category);

    await insertMany(result)
    console.log(`Page ${i}/${nbPages}`);
  }
}

const chanteurs = "https://anniversaire-celebrite.com/categories/chanteurs";
const animateurs = "https://anniversaire-celebrite.com/categories/animateurs";
const personnagesFiction = "https://anniversaire-celebrite.com/categories/personnages-de-fiction"

startScrapping(animateurs, "animateurs");
// startScrapping(chanteurs, "chanteurs");
startScrapping(personnagesFiction, "personnages de fiction")