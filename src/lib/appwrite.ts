import {
  Client,
  Account,
  Databases,
  Storage,
  Functions,
  Realtime,
} from "appwrite";

export const APPWRITE_ENDPOINT =
  import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  import.meta.env.VITE_APPWRITE_PROJECT_ID || "";
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "";
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_ID || "";

const client = new Client();

client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);
export { client };

export const COLLECTIONS = {
  USERS_PROFILE: "users_profile",
  QUESTIONS: "questions",
  GAME_ROOMS: "game_rooms",
  GAME_ANSWERS: "game_answers",
  TOURNAMENTS: "tournaments",
  LEADERBOARDS: "leaderboards",
  MATCHMAKING_QUEUE: "matchmaking_queue",
  BATTLE_ROOMS: "battle_rooms",
} as const;
