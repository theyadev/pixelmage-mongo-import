import axios from "axios";
import Mongoose from "mongoose";

import { extend } from "lodash";
import { readFileSync, writeFileSync } from "fs";

import { Games, Category, Game, Answer } from "./types";

let database: Mongoose.Connection;

async function connect() {
  if (database) return;
  if (!process.env.MONGODB_URI) return;

  await Mongoose.connect(process.env.MONGODB_URI);

  database = Mongoose.connection;
}

function getLastCategory(categories: any[]) {
  function sortIds(a: number, b: number) {
    return b - a;
  }

  if (categories.length == 0) {
    return 1;
  }

  const ids = categories.map((e) => {
    return e.id;
  });

  const sortedIds = ids.sort(sortIds);

  return sortedIds[0] + 1;
}

async function getCategory(name: string): Promise<Category> {
  name = name.toLowerCase();

  await connect();

  const categories = database.collection("categories");

  const allCategories = await categories.find({}).toArray();

  let gamesCategory: any = await categories
    .find({
      category: name,
    })
    .toArray();

  if (gamesCategory.length == 0) {
    const category = {
      category: name,
      id: getLastCategory(allCategories),
    };
    categories.insertOne(category);

    gamesCategory = [category];
  }

  return gamesCategory[0];
}

function getImageUrl(id: number) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${id}/header.jpg`;
}

function readJSON() {
  const buffer = readFileSync("./games.json", {
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

  writeFileSync("./games.json", JSON.stringify(sortedGames), {
    encoding: "utf-8",
  });

  return sortedGames;
}

async function addGamesToMongo() {
  let games: Game[];

  try {
    games = readJSON();
  } catch (error) {
    games = await fetchGames();
  }

  const best_games = games.splice(0, 1000);

  await connect();

  const category = await getCategory("jeux");

  const images = database.collection("images");

  const formattedGames = best_games.map((e) => {
    const answer: Answer = {
      answer: e.name,
      aliases: null,
      url: getImageUrl(e.appid),
      categoryId: category.id,
    };
    return answer;
  });

  images.insertMany(formattedGames);

  console.log("Fin de l'importation.");

  Mongoose.connection.close();
}

addGamesToMongo();
