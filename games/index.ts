import axios from "axios";

import { extend } from "lodash";
import { readFileSync, writeFileSync } from "fs";

import { Games, Game, Answer } from "../types";

import { connect, getCategory, insertMany } from "../";

const jsonPath = "../games.json";

function getImageUrl(id: number) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;
}

function readJSON() {
  const buffer = readFileSync(jsonPath, {
    encoding: "utf-8",
  });

  const games: Game[] = JSON.parse(buffer);

  return games;
}

async function fetchGames(pages: number = 49) {
  function sortGames(games: Games) {
    let listGames: Game[] = [];

    for (let game in games) {
      listGames.push(games[game]);
    }

    listGames = listGames.sort(function (a: any, b: any) {
      return b.positive - a.positive;
    });

    return listGames;
  }

  const games: Games = {};

  for (let i = 0; i <= pages; i++) {
    const res = await axios.get(
      "https://steamspy.com/api.php?request=all&page=" + i
    );
    extend(games, res.data);
  }

  const sortedGames = sortGames(games);

  writeFileSync(jsonPath, JSON.stringify(sortedGames), {
    encoding: "utf-8",
  });

  return sortedGames;
}

async function addGamesToMongo() {
  let games: Game[];

  try {
    games = readJSON();
    
    console.log("Fetching games from JSON !");
    
  } catch (error) {
    console.log("Fetching games from steamspy !");

    games = await fetchGames();
  }

  const best_games = games.splice(0, 1000);

  await connect();

  const category = await getCategory("jeux");

  const formattedGames = best_games.map((e) => {
    const answer: Answer = {
      answer: e.name,
      aliases: null,
      url: getImageUrl(e.appid),
      categoryId: category.id,
    };
    return answer;
  });

  await insertMany(formattedGames);

  console.log("Fin de l'importation.");
}

addGamesToMongo();
