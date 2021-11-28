import axios from "axios";

import { Response, Media } from "./types";

import query from "./query";
import { getCategory, insertMany } from "..";
import { Answer, Category } from "../types";

/**
 * There are 50 anime per pages, 40*50 = 2000. So there'll be 2000 animes
 */
const pages = 40;

/**
 * Fetch a page from the Anilist API
 * @returns Media List
 */
async function fetchPageFromAPI(page: number = 0) {
  const res = await axios({
    url: "https://graphql.anilist.co",
    method: "POST",
    data: {
      query: query,
      variables: {
        page,
      },
    },
  });
  const response: Response = res.data;

  return response.data.Page.media;
}

/**
 * Fetch x number of pages
 * @returns Media List
 */
async function fetchAnimes(pages: number) {
  let animes: Media[] = [];

  for (let i = 0; i <= pages; i++) {
    const res = await fetchPageFromAPI(i);
    animes = animes.concat(res);
  }

  return animes;
}

/**
 * Convert Media to Answer
 * @returns Answer
 */
function animeToAnswer(anime: Media, category: Category) {
  const aliases: string[] = [];

  aliases.push(anime.title.english);

  for (const synonym of anime.synonyms) {
    if (synonym.length > 2) {
      aliases.push(synonym);
    }
  }

  const answer: Answer = {
    answer: anime.title.romaji,
    aliases: aliases,
    url: anime.coverImage.extraLarge,
    categoryId: category.id,
  };
  return answer;
}

/**
 * Insert the first x pages of animes in the database.
 * @returns Nothing
 */
async function addAnimesToMongo() {
  const animes = await fetchAnimes(pages);

  const category = await getCategory("anime");

  const answerList = animes.map((anime) => {
    return animeToAnswer(anime, category);
  });
  
  await insertMany(answerList);
}

addAnimesToMongo()
