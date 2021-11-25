export type Games = {
  [key: number]: Game;
};

export type Answer = {
  url: string;
  answer: string;
  aliases: string[] | null;
  categoryId: number;
};

export interface Game {
  appid: number;
  name: string;
  developer: string;
  publisher: string;
  score_rank: string;
  positive: number;
  negative: number;
  userscore: number;
  owners: string;
  average_forever: number;
  average_2weeks: number;
  median_forever: number;
  median_2weeks: number;
  price: string;
  initialprice: string;
  discount: string;
  ccu: number;
}

export type Category = {
  category: string;
  id: number;
};
