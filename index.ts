import Mongoose from "mongoose";
import { Category, Answer } from "./types";

import { config } from "dotenv";
import { isEqual } from "lodash";

config();

export let database: Mongoose.Connection;

export async function connect() {
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

export async function getCategory(name: string): Promise<Category> {
  name = name.toLowerCase();

  await connect();

  const categories = database.collection("categories");

  const allCategories = await categories.find({}).toArray();

  let gamesCategory: any = await categories.findOne({
    category: name,
  });

  if (gamesCategory == null) {
    const category = {
      category: name,
      id: getLastCategory(allCategories),
    };
    categories.insertOne(category);

    gamesCategory = category;
  }

  return gamesCategory;
}

export async function insertMany(items: Answer[]) {
  await connect();

  const images = database.collection("images");

  for (const answer of items) {
    const item = await images.findOne({
      answer: answer.answer,
    });

    if (item == null) {
      await images.insertOne(answer);
      continue;
    }

    delete item._id;

    if (isEqual(item, answer)) {
      console.log(answer.answer + " Deja dans la base de donnée !");
      continue;
    } else {  
      await images.findOneAndReplace(
        {
          answer: answer.answer,
        },
        answer
      );
      console.log(answer.answer + " Remplacé par de nouvelles valeurs !");
    }
  }
}

// addGamesToMongo();
