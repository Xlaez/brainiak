// scripts/setup-appwrite.ts

import {
  Client,
  Databases,
  Role,
  Permission,
  ID,
  IndexType,
} from "node-appwrite";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || "";
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || "";
const API_KEY = process.env.APPWRITE_API_KEY || "";
const ENDPOINT =
  process.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

async function createIndexIfNotExists(
  dbId: string,
  collId: string,
  key: string,
  type: IndexType,
  attributes: string[],
) {
  try {
    console.log(`Checking index '${key}' on '${collId}'...`);
    await databases.createIndex(dbId, collId, key, type, attributes);
    console.log(`  ✅ Created index '${key}'`);
  } catch (e: any) {
    if (e.code === 409) console.log(`  ℹ️ Index '${key}' already exists.`);
    else console.error(`  ❌ Error creating index '${key}':`, e.message);
  }
}

async function createAttributeIfNotExists(
  dbId: string,
  collId: string,
  attr: any,
) {
  try {
    console.log(`Checking attribute '${attr.key}' on '${collId}'...`);
    if (attr.type === "string") {
      await databases.createStringAttribute(
        dbId,
        collId,
        attr.key,
        attr.size || 255,
        attr.required,
        attr.default,
        attr.array,
      );
    } else if (attr.type === "integer") {
      await databases.createIntegerAttribute(
        dbId,
        collId,
        attr.key,
        attr.required,
        attr.min,
        attr.max,
        attr.default,
        attr.array,
      );
    } else if (attr.type === "boolean") {
      await databases.createBooleanAttribute(
        dbId,
        collId,
        attr.key,
        attr.required,
        attr.default,
        attr.array,
      );
    }
    console.log(`  ✅ Created '${attr.key}'`);
  } catch (e: any) {
    if (e.code === 409) console.log(`  ℹ️ '${attr.key}' already exists.`);
    else console.error(`  ❌ Error creating '${attr.key}':`, e.message);
  }
}

async function setupCollections() {
  console.log("🚀 Starting Appwrite Sync...");

  const collections = [
    {
      id: "matchmaking_queue",
      name: "Matchmaking Queue",
      attributes: [
        { key: "queueId", type: "string", size: 36, required: true },
        { key: "userId", type: "string", size: 36, required: true },
        { key: "username", type: "string", size: 100, required: true },
        { key: "tier", type: "integer", required: true },
        { key: "gameType", type: "string", size: 20, required: true },
        { key: "selectedTier", type: "integer", required: false },
        { key: "subject", type: "string", size: 30, required: true },
        { key: "duration", type: "integer", required: true },
        { key: "joinedAt", type: "string", size: 50, required: true },
        { key: "status", type: "string", size: 20, required: true },
        { key: "matchedWith", type: "string", size: 36, required: false },
      ],
      indexes: [
        { key: "status", type: IndexType.Key, attributes: ["status"] },
        { key: "userId", type: IndexType.Key, attributes: ["userId"] },
        {
          key: "search_criteria",
          type: IndexType.Key,
          attributes: ["status", "gameType", "subject", "duration"],
        },
      ],
    },
    {
      id: "battle_rooms",
      name: "Battle Rooms",
      attributes: [
        { key: "roomId", type: "string", size: 36, required: true },
        { key: "inviteCode", type: "string", size: 10, required: true },
        { key: "hostId", type: "string", size: 36, required: true },
        { key: "hostUsername", type: "string", size: 100, required: true },
        { key: "hostTier", type: "integer", required: true },
        { key: "opponentId", type: "string", size: 36, required: false },
        { key: "opponentUsername", type: "string", size: 100, required: false },
        { key: "opponentTier", type: "integer", required: false },
        { key: "subject", type: "string", size: 30, required: true },
        { key: "duration", type: "integer", required: true },
        { key: "status", type: "string", size: 20, required: true },
        { key: "hostReady", type: "boolean", required: true },
        { key: "opponentReady", type: "boolean", required: true },
        { key: "createdAt", type: "string", size: 50, required: true },
      ],
      indexes: [
        {
          key: "inviteCode",
          type: IndexType.Unique,
          attributes: ["inviteCode"],
        },
        { key: "status", type: IndexType.Key, attributes: ["status"] },
        { key: "hostId", type: IndexType.Key, attributes: ["hostId"] },
        { key: "opponentId", type: IndexType.Key, attributes: ["opponentId"] },
      ],
    },
    {
      id: "game_rooms",
      name: "Game Rooms",
      attributes: [
        { key: "player1Id", type: "string", size: 36, required: true },
        { key: "player1Score", type: "integer", required: true },
        { key: "player1Tier", type: "integer", required: true },
        { key: "player2Id", type: "string", size: 36, required: false },
        { key: "player2Score", type: "integer", required: true },
        { key: "player2Tier", type: "integer", required: false },
        {
          key: "questions",
          type: "string",
          size: 5000,
          required: true,
          array: true,
        },
        { key: "currentQuestionIndex", type: "integer", required: true },
        { key: "status", type: "string", size: 20, required: true },
        { key: "startTime", type: "string", size: 50, required: false },
        { key: "endTime", type: "string", size: 50, required: false },
        { key: "winnerId", type: "string", size: 36, required: false },
        { key: "gameType", type: "string", size: 20, required: true },
        { key: "subject", type: "string", size: 30, required: true },
      ],
      indexes: [
        { key: "player1Id", type: IndexType.Key, attributes: ["player1Id"] },
        { key: "player2Id", type: IndexType.Key, attributes: ["player2Id"] },
        { key: "status", type: IndexType.Key, attributes: ["status"] },
      ],
    },
    {
      id: "questions",
      name: "Questions",
      attributes: [
        { key: "questionId", type: "string", size: 36, required: true },
        { key: "questionText", type: "string", size: 1000, required: true },
        { key: "optionA", type: "string", size: 500, required: true },
        { key: "optionB", type: "string", size: 500, required: true },
        { key: "optionC", type: "string", size: 500, required: true },
        { key: "optionD", type: "string", size: 500, required: true },
        { key: "correctAnswer", type: "string", size: 1, required: true },
        { key: "difficulty", type: "integer", required: true },
        { key: "subject", type: "string", size: 30, required: true },
        { key: "createdAt", type: "string", size: 50, required: false },
      ],
      indexes: [
        { key: "subject", type: IndexType.Key, attributes: ["subject"] },
      ],
    },
    {
      id: "game_answers",
      name: "Game Answers",
      attributes: [
        { key: "gameId", type: "string", size: 36, required: true },
        { key: "playerId", type: "string", size: 36, required: true },
        { key: "questionIndex", type: "integer", required: true },
        { key: "selectedAnswer", type: "string", size: 1, required: true },
        { key: "isCorrect", type: "boolean", required: true },
        { key: "timeTaken", type: "integer", required: true },
        { key: "pointsEarned", type: "integer", required: true },
        { key: "timestamp", type: "string", size: 50, required: true },
      ],
      indexes: [
        {
          key: "game_search",
          type: IndexType.Key,
          attributes: ["gameId", "playerId"],
        },
      ],
    },
  ];

  for (const coll of collections) {
    try {
      console.log(`\n📦 synchronizing collection: ${coll.id}`);
      await databases.createCollection(DATABASE_ID, coll.id, coll.name, [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]);
      console.log(`✅ Created collection '${coll.id}'`);
    } catch (e: any) {
      if (e.code === 409)
        console.log(`ℹ️ Collection '${coll.id}' already exists.`);
      else throw e;
    }

    for (const attr of coll.attributes) {
      await createAttributeIfNotExists(DATABASE_ID, coll.id, attr);
    }

    if ((coll as any).indexes) {
      for (const index of (coll as any).indexes) {
        await createIndexIfNotExists(
          DATABASE_ID,
          coll.id,
          index.key,
          index.type,
          index.attributes,
        );
      }
    }
  }

  // Seed some questions if the collection is empty
  try {
    const existingQuestions = await databases.listDocuments(
      DATABASE_ID,
      "questions",
      [],
    );
    if (existingQuestions.total === 0) {
      console.log("\n🌱 Seeding sample questions...");
      const sampleQuestions = [
        {
          questionId: ID.unique(),
          questionText: "What is the capital of France?",
          optionA: "Berlin",
          optionB: "Madrid",
          optionC: "Paris",
          optionD: "Rome",
          correctAnswer: "C",
          difficulty: 1,
          subject: "geography",
          createdAt: new Date().toISOString(),
        },
        {
          questionId: ID.unique(),
          questionText: "Which planet is known as the Red Planet?",
          optionA: "Venus",
          optionB: "Mars",
          optionC: "Jupiter",
          optionD: "Saturn",
          correctAnswer: "B",
          difficulty: 1,
          subject: "science",
          createdAt: new Date().toISOString(),
        },
        {
          questionId: ID.unique(),
          questionText: "What is 15 * 6?",
          optionA: "80",
          optionB: "90",
          optionC: "100",
          optionD: "110",
          correctAnswer: "B",
          difficulty: 2,
          subject: "maths",
          createdAt: new Date().toISOString(),
        },
      ];

      for (const q of sampleQuestions) {
        await databases.createDocument(
          DATABASE_ID,
          "questions",
          ID.unique(),
          q,
        );
      }
      console.log("✅ Seeded 3 questions.");
    }
  } catch (e) {
    console.error("❌ Error seeding questions:", e);
  }

  console.log("\n✨ Appwrite Sync Complete!");
}

setupCollections();
