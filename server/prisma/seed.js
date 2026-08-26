import prisma from "../lib/prisma.js";

const SEED_GAMES = [
  {
    id: "gtest",
    title: "S.T.A.L.K.E.R. 2: Heart of Chornobyl",
    studio: "GSC Game World",
    publisher: "GSC Game World",
    genre: "Shooter",
    year: 2024,
    hours: 80,
    platform: "Steam",
    priority: "high",
    status: "next",
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1643320/library_600x900_2x.jpg",
    screenshots: JSON.stringify([
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1643320/ss_8e3d8f3957bb159bb840e4f208153c3d5267b2dc.1920x1080.jpg",
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1643320/ss_a1f9e20a4b6557b447aafe963d76eef52467d3d7.1920x1080.jpg"
    ]),
    videos: JSON.stringify([]),
    description: "Enter the Chornobyl Anomalous Zone — a vast open world where anomalies, mutants, and rivals stand in your way. Explore, scavenge, and try to survive in this brutal and dangerous land.",
    releaseDate: "20 Nov, 2024",
    tags: JSON.stringify(["Open World", "FPS", "Post-apocalyptic", "Survival", "Shooter", "Atmospheric"]),
    price: 649000,
    hoursPlayed: 12,
    addedAt: Date.now() - 1000 * 45,
    storeId: "1643320",
    storeType: "steam",
  },
  {
    id: "g1",
    title: "Hollow Knight",
    studio: "Team Cherry",
    publisher: "Team Cherry",
    genre: "Metroidvania",
    year: 2017,
    hours: 34,
    platform: "Steam",
    priority: "high",
    status: "next",
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg",
    screenshots: JSON.stringify([]),
    videos: JSON.stringify([]),
    description: "Descend into the world of Hollow Knight! The award winning action adventure of insects and heroes. Explore twisting caverns, ancient cities and deadly wastes.",
    releaseDate: "24 Feb, 2017",
    tags: JSON.stringify(["Metroidvania", "Difficult", "Atmospheric", "2D", "Exploration"]),
    price: 190000,
    hoursPlayed: 0,
    addedAt: Date.now() - 1000 * 60 * 8,
    storeId: "367520",
    storeType: "steam",
  },
  {
    id: "g2",
    title: "Halo Infinite",
    studio: "343 Industries",
    publisher: "Xbox Game Studios",
    genre: "Shooter",
    year: 2021,
    hours: 52,
    platform: "Xbox",
    priority: "high",
    status: "backlog",
    cover: "https://store-images.s-microsoft.com/image/apps.21536.13727851868390641.c9cc5f66-aff8-406c-af6b-440838730be0.68796bde-cbf5-4eaa-a299-011417041da6",
    screenshots: JSON.stringify([]),
    videos: JSON.stringify([]),
    description: "Experience Halo’s celebrated multiplayer reimagined and free-to-play across the Xbox family of consoles.",
    releaseDate: "8 Dec, 2021",
    tags: JSON.stringify(["Action", "Cinematic", "Sci-fi", "Shooter", "Multiplayer"]),
    price: 0,
    hoursPlayed: 0,
    addedAt: Date.now() - 1000 * 60 * 47,
    storeId: "9np1p1wfs0lb",
    storeType: "xbox",
  },
  {
    id: "g6",
    title: "ELDEN RING",
    studio: "FromSoftware Inc.",
    publisher: "Bandai Namco Entertainment",
    genre: "Soulslike",
    year: 2022,
    hours: 68,
    platform: "Steam",
    priority: "high",
    status: "playing",
    cover: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg",
    screenshots: JSON.stringify([]),
    videos: JSON.stringify([]),
    description: "THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
    releaseDate: "25 Feb, 2022",
    tags: JSON.stringify(["Soulslike", "Difficult", "Dark Fantasy", "Action RPG", "Open World"]),
    price: 990000,
    hoursPlayed: 45,
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    storeId: "1245620",
    storeType: "steam",
  }
];

export async function seedDatabaseIfEmpty() {
  try {
    const count = await prisma.game.count();
    if (count === 0) {
      console.log("Database is empty. Seeding initial games...");
      for (const game of SEED_GAMES) {
        await prisma.game.create({ data: game });
      }
      console.log("Seeding complete!");
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  }
}
