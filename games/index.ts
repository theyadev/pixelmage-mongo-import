import axios from "axios";

import { extend } from "lodash";

import { Games, Game, Answer, Category } from "../types";

import { getCategory, insertMany } from "../";

/**
 * Get the url of the image based on a steam id.
 * @returns URL
 */
function getImageUrl(id: number) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;
}

/**
 * Convert the object of object to an array of object.
 * @returns Game List
 */
function gamesObjectToArray(games: Games) {
  let gamesList: Game[] = [];

  for (let game in games) {
    gamesList.push(games[game]);
  }

  return gamesList;
}

/**
 * Fetch x pages from steamspy.
 * @returns Object of Object Game
 */
async function fetchFromAPI(pages: number = 49) {
  const games: Games = {};

  for (let i = 0; i <= pages; i++) {
    const res = await axios.get(
      "https://steamspy.com/api.php?request=all&page=" + i
    );
    extend(games, res.data);
  }

  return games;
}

/**
 * Fetch games from API and convert them to a sorted Array
 * @returns A list of games sorted by positive
 */
async function getGames() {
  const games = await fetchFromAPI();

  const gamesList = gamesObjectToArray(games);

  const sortedGames = gamesList.sort(function (a: any, b: any) {
    return b.positive - a.positive;
  });

  return sortedGames;
}

/**
 * Convert a game and a category to an Answer.
 * @return An Answer
 */
function gameToAnswer(game: Game, category: Category) {
  const answer: Answer = {
    answer: game.name,
    aliases: null,
    url: getImageUrl(game.appid),
    categoryId: category.id,
  };
  return answer;
}

/**
 * Insert the first 1000 games in the database.
 * @returns Nothing
 */
async function addGamesToMongo() {
  const games = await getGames();

  const category = await getCategory("jeux");

  // Get the first 1000
  const bestGames = games.splice(0, 1000);

  const answerList = bestGames.map(game => {
    return gameToAnswer(game, category)
  });

  await insertMany(answerList);

  console.log("Fin de l'importation.");
}

addGamesToMongo();
