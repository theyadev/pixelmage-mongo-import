import Mongoose from "mongoose";
import { Category, Answer } from "./types";
import { performance } from "perf_hooks";

import { config } from "dotenv";
import { isEqual } from "lodash";

config();

let database: Mongoose.Connection;

/**
 * Connect to the database.
 * Should only be used in this file
 * @returns Nothing
 */
async function connect() {
  if (database) return;
  if (!process.env.MONGODB_URI) return;

  await Mongoose.connect(process.env.MONGODB_URI);

  database = Mongoose.connection;
}

/**
 * Get an index wich is not already used.
 * @returns Index
 */
function getFreeIndex(categories: Category[]) {
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

/**
 * Get a specific category.
 * @param name Lower cased string
 * @returns Category
 */
export async function getCategory(name: string): Promise<Category> {
  // Quick verification to convert the name to lower case
  name = name.toLowerCase();

  await connect();

  const categories = database.collection("categories");

  /**It's a list of Category */
  const allCategories: any = await categories.find({}).toArray();

  /**It's a Category */
  const gamesCategory: any = await categories.findOne({
    category: name,
  });

  // If the category exist, returns it
  if (gamesCategory != null) return gamesCategory;

  // Else create the category and returns it
  const category: Category = {
    category: name,
    id: getFreeIndex(allCategories),
  };

  await categories.insertOne(category);

  return category;
}

/**
 * Insert an answer in the database without duplicates.<br>
 * The function update the answer if it already exist in the databse.
 * @returns Nothing
 */
export async function insertOne(answer: Answer) {
  const images = database.collection("images");

  const item = await images.findOne({
    answer: answer.answer,
  });

  // If item doesn't exist add it
  if (item == null) {
    await images.insertOne(answer);
    return;
  }

  // Delete the _id on the item for comparaison with answer
  delete item._id;

  delete item.url;

  let answerSansUrl: any = answer;

  delete answerSansUrl.url;

  // Is they're the same, return
  if (isEqual(item, answerSansUrl)) {
    console.log(answer.answer + " Deja dans la base de donnée !");
    return;
  } else {
    // Else insert
    images.insertOne(answer);
  }
}

/**
 * Insert an array of answer in the database without duplicates.<br>
 * The function update the answer if it already exist in the databse.
 * @returns Nothing
 */
export async function insertMany(answers: Answer[]) {
  await connect();

  for (const answer of answers) {
    await insertOne(answer);
  }
}

/**
 * Truncate images
 * @returns Nothing
 */
async function removeCategoryAndImages(categoryName: string) {
  const category = await getCategory(categoryName);

  const images = database.collection("images");

  const imagesList = await images
    .find({
      categoryId: category.id,
    })
    .toArray();

  for (const image of imagesList) {
    await images.findOneAndDelete(image);
  }
}

// removeCategoryAndImages("chanteurs")

async function test() {
  await connect();

  const imagesCollection = database.collection("images");
  const categoryCollection = database.collection("categories");

  const images = (await imagesCollection.find({}).toArray()) as Answer[];

  const randomImages = images.sort(randomSort);

  function randomSort() {
    return Math.random() - 0.5;
  }

  const categoriesRes = (await categoryCollection
    .find({})
    .toArray()) as Category[];
  const randomCategories = categoriesRes.sort(randomSort);

  const categories = randomCategories

  const rounds = 8;

  const nbs = []
  const algo1 = []
  const algo2 = []

  for (let y = 0; y < 9000; y++) {
    const start = performance.now()

    let numbers = categories.map((e) => {
      return Math.floor(rounds / categories.length);
    });

    for (let i=0;i<rounds%categories.length;i++){
      numbers[i]+=1 
    }

    const end = performance.now()

    nbs.push(end - start)

    const start1 = performance.now()
    let allImages1: Answer[] = []

    const randomImagesList = categories.map(e=>{
      return randomImages.filter(image => image.categoryId == e.id)
    }) 
    
    for (let i=0;i<numbers.length;i++){
      allImages1 = allImages1.concat(randomImagesList[i].splice(0,numbers[i]))
    }

    const end1 = performance.now()
    algo1.push(end1 - start1)

    const start2 = performance.now()

    let allImages2: Answer[] = []
    for (let i=0;i<numbers.length;i++){
      allImages2 = allImages2.concat(randomImages.filter(image=> image.categoryId == categories[i].id).splice(0,numbers[i]))
    }

    const end2 = performance.now()
    algo2.push(end2 - start2)
  }

  const average = (array: any[]) => array.reduce((a, b) => a + b) / array.length;

  console.log("Moyenne algo nombres: " + average(nbs));
  console.log("Moyenne algo 1: " + average(algo1));
  console.log("Moyenne algo 2: " + average(algo2));
}

test();
