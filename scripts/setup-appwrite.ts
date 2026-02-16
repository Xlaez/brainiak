// scripts/setup-appwrite.ts

import {
  Client,
  Databases,
  Role,
  Permission,
  ID,
  IndexType,
  Query,
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
    } else if (attr.type === "float") {
      await databases.createFloatAttribute(
        dbId,
        collId,
        attr.key,
        attr.required,
        attr.min,
        attr.max,
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
        { key: "gameRoomId", type: "string", size: 36, required: false },
        { key: "createdAt", type: "string", size: 50, required: true },
        { key: "updatedAt", type: "string", size: 50, required: true },
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
        { key: "duration", type: "integer", required: true },
        { key: "createdAt", type: "string", size: 50, required: true },
        { key: "updatedAt", type: "string", size: 50, required: true },
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
        { key: "difficulty", type: "string", size: 20, required: true },
        { key: "subject", type: "string", size: 30, required: true },
        { key: "createdAt", type: "string", size: 50, required: false },
        { key: "updatedAt", type: "string", size: 50, required: false },
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
    {
      id: "users_profile",
      name: "User Profiles",
      attributes: [
        { key: "userId", type: "string", size: 36, required: true },
        { key: "username", type: "string", size: 100, required: true },
        { key: "country", type: "string", size: 100, required: true },
        { key: "tier", type: "integer", required: true },
        { key: "totalPoints", type: "integer", required: true },
        { key: "gamesPlayed", type: "integer", required: true },
        { key: "gamesWon", type: "integer", required: true },
        { key: "gamesLost", type: "integer", required: true },
        { key: "winRate", type: "float", required: true },
        { key: "profile_image", type: "string", size: 255, required: false },
        { key: "cover_image", type: "string", size: 255, required: false },
        { key: "bio", type: "string", size: 1000, required: false },
      ],
      indexes: [
        { key: "userId", type: IndexType.Unique, attributes: ["userId"] },
        {
          key: "leaderboard_points",
          type: IndexType.Key,
          attributes: ["totalPoints"],
        },
        { key: "tier", type: IndexType.Key, attributes: ["tier"] },
        { key: "country", type: IndexType.Key, attributes: ["country"] },
        {
          key: "username_search",
          type: IndexType.Fulltext,
          attributes: ["username"],
        },
      ],
    },
    {
      id: "tournaments",
      name: "Tournaments",
      attributes: [
        { key: "tournamentId", type: "string", size: 36, required: true },
        { key: "name", type: "string", size: 100, required: true },
        { key: "creatorId", type: "string", size: 36, required: true },
        { key: "creatorUsername", type: "string", size: 100, required: true },
        { key: "status", type: "string", size: 20, required: true },
        {
          key: "subjects",
          type: "string",
          size: 50,
          required: true,
          array: true,
        },
        { key: "duration", type: "integer", required: true },
        { key: "entryLimit", type: "integer", required: true },
        {
          key: "participants",
          type: "string",
          size: 5000,
          required: false,
          array: true,
        },
        {
          key: "participantIds",
          type: "string",
          size: 36,
          required: false,
          array: true,
        },
        {
          key: "matches",
          type: "string",
          size: 5000,
          required: false,
          array: true,
        },
        {
          key: "standings",
          type: "string",
          size: 5000,
          required: false,
          array: true,
        },
        {
          key: "chatMessages",
          type: "string",
          size: 10000,
          required: false,
          array: true,
        },
        { key: "winnerId", type: "string", size: 36, required: false },
        { key: "startedAt", type: "string", size: 50, required: false },
        { key: "completedAt", type: "string", size: 50, required: false },
        { key: "createdAt", type: "string", size: 50, required: true },
        { key: "updatedAt", type: "string", size: 50, required: true },
      ],
      indexes: [
        { key: "status", type: IndexType.Key, attributes: ["status"] },
        { key: "creatorId", type: IndexType.Key, attributes: ["creatorId"] },
        {
          key: "participantIds",
          type: IndexType.Key,
          attributes: ["participantIds"],
        },
        {
          key: "status_created",
          type: IndexType.Key,
          attributes: ["status", "createdAt"],
        },
        { key: "name_search", type: IndexType.Fulltext, attributes: ["name"] },
      ],
    },
  ];

  for (const coll of collections) {
    const permissions = [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ];

    try {
      console.log(`\n📦 synchronizing collection: ${coll.id}`);
      await databases.createCollection(
        DATABASE_ID,
        coll.id,
        coll.name,
        permissions,
      );
      console.log(`✅ Created collection '${coll.id}'`);
    } catch (e: any) {
      if (e.code === 409) {
        console.log(
          `ℹ️ Collection '${coll.id}' already exists. Updating permissions...`,
        );
        try {
          await databases.updateCollection(
            DATABASE_ID,
            coll.id,
            coll.name,
            permissions,
          );
          console.log(`  ✅ Updated permissions for '${coll.id}'`);
        } catch (updateError: any) {
          console.log(
            `  ⚠️ Failed to update permissions for '${coll.id}': ${updateError.message}`,
          );
        }
      } else throw e;
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

  // Seed some questions
  try {
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
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which is the largest ocean on Earth?",
        optionA: "Atlantic Ocean",
        optionB: "Indian Ocean",
        optionC: "Arctic Ocean",
        optionD: "Pacific Ocean",
        correctAnswer: "D",
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which continent is the Sahara Desert located on?",
        optionA: "Asia",
        optionB: "Africa",
        optionC: "South America",
        optionD: "Australia",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the capital city of Japan?",
        optionA: "Seoul",
        optionB: "Beijing",
        optionC: "Tokyo",
        optionD: "Bangkok",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which is the longest river in the world?",
        optionA: "Amazon River",
        optionB: "Nile",
        optionC: "Yangtze River",
        optionD: "Mississippi River",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Mount Everest is located in which mountain range?",
        optionA: "Andes",
        optionB: "Rockies",
        optionC: "Himalayas",
        optionD: "Alps",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which country is the largest in the world by land area?",
        optionA: "Canada",
        optionB: "China",
        optionC: "United States",
        optionD: "Russia",
        correctAnswer: "D",
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which of these is the smallest country in the world?",
        optionA: "Monaco",
        optionB: "Vatican City",
        optionC: "San Marino",
        optionD: "Liechtenstein",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "The Great Barrier Reef is off the coast of which country?",
        optionA: "New Zealand",
        optionB: "Australia",
        optionC: "Indonesia",
        optionD: "Philippines",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "geography",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which country is known as the Land of the Rising Sun?",
        optionA: "Thailand",
        optionB: "Japan",
        optionC: "Vietnam",
        optionD: "Norway",
        correctAnswer: "B",
        difficulty: "easy",
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
        difficulty: "easy",
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
        difficulty: "medium",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Who is considered the founder of Buddhism?",
        optionA: "Mahavira",
        optionB: "Siddhartha Gautama",
        optionC: "Confucius",
        optionD: "Laozi",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the holy book of Islam?",
        optionA: "Torah",
        optionB: "Bible",
        optionC: "Quran",
        optionD: "Vedas",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which religion follows the Eightfold Path?",
        optionA: "Hinduism",
        optionB: "Sikhism",
        optionC: "Buddhism",
        optionD: "Jainism",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the Jewish place of worship called?",
        optionA: "Church",
        optionB: "Mosque",
        optionC: "Synagogue",
        optionD: "Temple",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Who is the Hindu god of wisdom and the remover of obstacles?",
        optionA: "Shiva",
        optionB: "Vishnu",
        optionC: "Ganesha",
        optionD: "Brahma",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "On which day do Christians celebrate the resurrection of Jesus?",
        optionA: "Christmas",
        optionB: "Good Friday",
        optionC: "Easter Sunday",
        optionD: "Pentecost",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the fundamental text of Taoism?",
        optionA: "Analects",
        optionB: "Tao Te Ching",
        optionC: "Art of War",
        optionD: "I Ching",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which prophet is central to the history of the Baha'i Faith?",
        optionA: "Zoroaster",
        optionB: "Baha'u'llah",
        optionC: "Joseph Smith",
        optionD: "Guru Nanak",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the name of the Sikh holy scripture?",
        optionA: "Vedas",
        optionB: "Guru Granth Sahib",
        optionC: "Dhammapada",
        optionD: "Avesta",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "In which city was Jesus Christ born according to the Bible?",
        optionA: "Jerusalem",
        optionB: "Nazareth",
        optionC: "Bethlehem",
        optionD: "Jericho",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "religion",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the square root of 144?",
        optionA: "10",
        optionB: "11",
        optionC: "12",
        optionD: "14",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the value of Pi to two decimal places?",
        optionA: "3.12",
        optionB: "3.14",
        optionC: "3.16",
        optionD: "3.18",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "If a triangle has angles of 90 and 45 degrees, what is the third angle?",
        optionA: "35",
        optionB: "45",
        optionC: "55",
        optionD: "90",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is 7 cubed (7^3)?",
        optionA: "49",
        optionB: "243",
        optionC: "343",
        optionD: "512",
        correctAnswer: "C",
        difficulty: "medium",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Solve for x: 2x + 5 = 15",
        optionA: "3",
        optionB: "5",
        optionC: "10",
        optionD: "20",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the term for a polygon with eight sides?",
        optionA: "Hexagon",
        optionB: "Heptagon",
        optionC: "Octagon",
        optionD: "Nonagon",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the perimeter of a square with side length 5?",
        optionA: "10",
        optionB: "20",
        optionC: "25",
        optionD: "30",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is 15% of 200?",
        optionA: "20",
        optionB: "30",
        optionC: "40",
        optionD: "50",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which number is considered neither prime nor composite?",
        optionA: "0",
        optionB: "1",
        optionC: "2",
        optionD: "3",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the next prime number after 7?",
        optionA: "8",
        optionB: "9",
        optionC: "11",
        optionD: "13",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "maths",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the chemical symbol for Gold?",
        optionA: "Ag",
        optionB: "Au",
        optionC: "Gd",
        optionD: "Go",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which gas do plants primarily use for photosynthesis?",
        optionA: "Oxygen",
        optionB: "Nitrogen",
        optionC: "Carbon Dioxide",
        optionD: "Hydrogen",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the hardest natural substance on Earth?",
        optionA: "Gold",
        optionB: "Iron",
        optionC: "Diamond",
        optionD: "Quartz",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which part of the human eye is responsible for color vision?",
        optionA: "Rods",
        optionB: "Cones",
        optionC: "Iris",
        optionD: "Cornea",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "At what temperature does water freeze in Fahrenheit?",
        optionA: "0",
        optionB: "32",
        optionC: "100",
        optionD: "212",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the main gas found in the Earth's atmosphere?",
        optionA: "Oxygen",
        optionB: "Nitrogen",
        optionC: "Carbon Dioxide",
        optionD: "Argon",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Who developed the theory of general relativity?",
        optionA: "Isaac Newton",
        optionB: "Albert Einstein",
        optionC: "Stephen Hawking",
        optionD: "Marie Curie",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the largest organ in the human body?",
        optionA: "Liver",
        optionB: "Heart",
        optionC: "Skin",
        optionD: "Lungs",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Which planet has the most moons?",
        optionA: "Jupiter",
        optionB: "Saturn",
        optionC: "Mars",
        optionD: "Neptune",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What is the study of fossils called?",
        optionA: "Biology",
        optionB: "Geology",
        optionC: "Paleontology",
        optionD: "Anthropology",
        correctAnswer: "C",
        difficulty: "medium",
        subject: "science",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Who was the first female Prime Minister of the UK?",
        optionA: "Theresa May",
        optionB: "Margaret Thatcher",
        optionC: "Angela Merkel",
        optionD: "Indira Gandhi",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "What is the minimum age to be elected President of the US?",
        optionA: "25",
        optionB: "30",
        optionC: "35",
        optionD: "40",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which international organization was formed in 1945 to maintain world peace?",
        optionA: "League of Nations",
        optionB: "NATO",
        optionC: "United Nations",
        optionD: "European Union",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "What political ideology emphasizes individual liberty and limited government?",
        optionA: "Communism",
        optionB: "Socialism",
        optionC: "Libertarianism",
        optionD: "Fascism",
        correctAnswer: "C",
        difficulty: "medium",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "Who wrote the Communist Manifesto?",
        optionA: "John Locke",
        optionB: "Karl Marx & Friedrich Engels",
        optionC: "Adam Smith",
        optionD: "Thomas Hobbes",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "What is the term for a form of government where power is held by the nobility?",
        optionA: "Democracy",
        optionB: "Aristocracy",
        optionC: "Theocracy",
        optionD: "Oligarchy",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which country is known for having a 'Basic Law' instead of a formal constitution?",
        optionA: "United Kingdom",
        optionB: "Germany",
        optionC: "France",
        optionD: "Canada",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Who is the head of state in a constitutional monarchy like the UK?",
        optionA: "Prime Minister",
        optionB: "Monarch",
        optionC: "President",
        optionD: "Chief Justice",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "What is the name of the lower house of the United States Congress?",
        optionA: "Senate",
        optionB: "House of Representatives",
        optionC: "Parliament",
        optionD: "Congress",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "In which city is the headquarters of the European Union located?",
        optionA: "Paris",
        optionB: "Brussels",
        optionC: "Berlin",
        optionD: "London",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "politics",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which language is primarily used for Android app development?",
        optionA: "Swift",
        optionB: "Python",
        optionC: "Kotlin",
        optionD: "C#",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What does 'HTML' stand for?",
        optionA: "HighText Machine Language",
        optionB: "HyperText Markup Language",
        optionC: "Hyperlink Transfer Markup Language",
        optionD: "HyperText Multiple Language",
        correctAnswer: "B",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which programming paradigm is based on the concept of 'objects'?",
        optionA: "Functional Programming",
        optionB: "Procedural Programming",
        optionC: "Object-Oriented Programming",
        optionD: "Logic Programming",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "What is the standard keyword used to declare a constant in JavaScript (ES6+)?",
        optionA: "var",
        optionB: "let",
        optionC: "const",
        optionD: "static",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which data structure operates on a 'Last In, First Out' (LIFO) principle?",
        optionA: "Queue",
        optionB: "Stack",
        optionC: "Linked List",
        optionD: "Array",
        correctAnswer: "B",
        difficulty: "medium",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "What is the most popular version control system used today?",
        optionA: "SVN",
        optionB: "Mercurial",
        optionC: "Git",
        optionD: "Perforce",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which CSS property is used to change the background color of an element?",
        optionA: "color",
        optionB: "bg-color",
        optionC: "background-color",
        optionD: "fill-color",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "In Python, which symbol is used for comments?",
        optionA: "//",
        optionB: "/*",
        optionC: "#",
        optionD: "--",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText: "What does 'SQL' stand for?",
        optionA: "Simple Query Language",
        optionB: "System Query Language",
        optionC: "Structured Query Language",
        optionD: "Standard Query Language",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
      {
        questionId: ID.unique(),
        questionText:
          "Which operator is used for strict equality in JavaScript?",
        optionA: "==",
        optionB: "=",
        optionC: "===",
        optionD: "!==",
        correctAnswer: "C",
        difficulty: "easy",
        subject: "programming",
        createdAt: new Date().toISOString(),
      },
    ];

    for (const q of sampleQuestions) {
      const existing = await databases.listDocuments(DATABASE_ID, "questions", [
        Query.equal("questionText", q.questionText),
      ]);

      if (existing.total === 0) {
        await databases.createDocument(
          DATABASE_ID,
          "questions",
          ID.unique(),
          q,
        );
      }
    }
    console.log(`✅ Seeded ${sampleQuestions.length} questions.`);
  } catch (e) {
    console.error("❌ Error seeding questions:", e);
  }

  console.log("\n✨ Appwrite Sync Complete!");
}

setupCollections();
