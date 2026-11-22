# Paws & Claws — Pet Care Sanctuary

A web-based pet care simulation game where each animal species dynamically loads its own real-world **biological/maintenance needs** and **play/enrichment needs**.

## Available Pet Species

| Species | Difficulty | Habitat | Unique Care Highlights |
| --- | --- | --- | --- |
| **Golden Retriever** | Easy | Sunny Living Room | Kibble, Fresh Water, Potty Break, Coat Brushing, Daily Walk, Fetch & Tug, Belly Rubs |
| **Ginger Tabby** | Easy | Cozy Windowsill Lounge | Wet & Dry Food, Water Fountain, Litter Box, Fur Care, Feather Wand Hunt, Scratching Post |
| **Sky Budgie** | Moderate | Sunlit Bird Perch Room | Pellets & Greens, Water & Mist Bath, Cage Liner, Cuttlebone/Beak, Out-of-Cage Flight, Foraging Toys, Flock Singing |
| **Green Tree Frog** | Specialist | Tropical Mist Terrarium | Live Crickets, Terrarium Humidity Misting, Dechlorinated Soak, Glass & Moss Clean, Canopy Climbing, Bug Hunting, Dusk Chorus |
| **Bearded Dragon** | Specialist | Desert Basking Vivarium | Greens & Dubia Roaches, Basking Heat & UVB Lamp, Warm Soak, Slate Tile Clean, Driftwood Climb, Supervised Roam, Shoulder Hangout |
| **Pygmy Goat** | Moderate | Sunny Barn & Pasture | Timothy Hay & Forage, Water Bucket, Hoof Trimming, Stall Mucking, Goat Parkour & Climbing, Pasture Ball, Herd Scratches |

## Local Development

```bash
npm install
npm run dev
```

## Build & Deploy to Firebase (`pet-game-ad3a1`)

```bash
npm run build
npx firebase-tools deploy --only hosting --project pet-game-ad3a1
```
