// Made by fmaret (https://github.com/fmaret) and formatted/optimized by Me (Theya)

import puppeteer, { Page } from "puppeteer";

import { getCategory, insertMany } from "..";

import { Answer } from "../types";

/**
 * @returns Number of pages
 */
async function getNbOfPages(page: Page) {
  return await page.evaluate(() => {
    const pagesDiv = document.querySelectorAll(".page-item");
    const pages = pagesDiv[pagesDiv.length - 2].querySelector("a")?.innerText;

    return pages ? parseInt(pages) : 1;
  });
}

/**
 * Scrap every page from a "anniversaire-celebrite.com" link
 */
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

        if (!answer || !url) continue;

        answerList.push({
          answer,
          url,
          aliases: null,
          categoryId: category.id,
        });
      }

      return answerList;
    }, category);

    await insertMany(result);
    console.log(`Page ${i}/${nbPages} | ${categoryName}`);
  }
}

async function main() {
  const categories = [
    {
      url: "https://anniversaire-celebrite.com/categories/chanteurs",
      name: "chanteurs",
    },
    {
      url: "https://anniversaire-celebrite.com/categories/animateurs",
      name: "animateurs",
    },
    {
      url: "https://anniversaire-celebrite.com/categories/personnages-de-fiction",
      name: "personnages de fiction",
    },
  ];

  for (const category of categories) {
    await startScrapping(category.url, category.name);
  }
}

main();
