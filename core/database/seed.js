/**
 * Seed Kenya food regions and representative dishes.
 * Run: npm run seed
 */
const db = require('./db');

const REGIONS = [
  {
    name: 'Coastal Swahili',
    country: 'Kenya',
    description: 'Mombasa, Lamu, Malindi — Swahili coastal cuisine with Arab, Indian, and Portuguese influences.',
    cuisineTags: ['swahili', 'coastal', 'seafood', 'coconut'],
    centerLat: -4.0435,
    centerLng: 39.6682,
    foods: [
      { foodName: 'Biryani', avgPrice: 350, isStaple: true, tags: ['rice', 'spiced'] },
      { foodName: 'Pilau', avgPrice: 250, isStaple: true, tags: ['rice', 'spiced'] },
      { foodName: 'Mahamri', avgPrice: 50, isStaple: false, tags: ['snack', 'fried', 'coconut'] },
      { foodName: 'Samaki wa Kupaka', avgPrice: 500, isStaple: false, tags: ['fish', 'coconut'] },
      { foodName: 'Wali wa Nazi', avgPrice: 150, isStaple: true, tags: ['rice', 'coconut'] },
      { foodName: 'Kachumbari', avgPrice: 50, isStaple: false, tags: ['salad', 'fresh'] },
      { foodName: 'Mbaazi za Nazi', avgPrice: 100, isStaple: false, tags: ['legume', 'coconut'] },
    ],
  },
  {
    name: 'Central Kenya Highlands',
    country: 'Kenya',
    description: 'Kikuyu, Embu, Meru — hearty highland staples, stews, and root vegetables.',
    cuisineTags: ['highland', 'kikuyu', 'root-vegetables', 'stews'],
    centerLat: -0.4167,
    centerLng: 36.9500,
    foods: [
      { foodName: 'Mukimo', avgPrice: 200, isStaple: true, tags: ['mashed', 'potato', 'greens'] },
      { foodName: 'Irio', avgPrice: 180, isStaple: true, tags: ['mashed', 'beans', 'corn'] },
      { foodName: 'Nyama Choma', avgPrice: 500, isStaple: false, tags: ['meat', 'grilled'] },
      { foodName: 'Githeri', avgPrice: 120, isStaple: true, tags: ['beans', 'maize'] },
      { foodName: 'Matoke', avgPrice: 200, isStaple: false, tags: ['banana', 'stew'] },
      { foodName: 'Mutura', avgPrice: 100, isStaple: false, tags: ['sausage', 'street-food'] },
    ],
  },
  {
    name: 'Lake Victoria Region',
    country: 'Kenya',
    description: 'Kisumu, Homa Bay, Siaya — freshwater fish, Luo cuisine.',
    cuisineTags: ['luo', 'fish', 'lake-victoria'],
    centerLat: -0.1022,
    centerLng: 34.7617,
    foods: [
      { foodName: 'Omena', avgPrice: 80, isStaple: true, tags: ['fish', 'small-fish', 'dried'] },
      { foodName: 'Tilapia (fried)', avgPrice: 400, isStaple: true, tags: ['fish', 'fried'] },
      { foodName: 'Ugali', avgPrice: 30, isStaple: true, tags: ['maize', 'staple'] },
      { foodName: 'Sukuma Wiki', avgPrice: 40, isStaple: true, tags: ['greens', 'kale'] },
      { foodName: 'Aliya (Nile Perch)', avgPrice: 600, isStaple: false, tags: ['fish', 'stew'] },
      { foodName: 'Nyoyo', avgPrice: 100, isStaple: false, tags: ['beans', 'maize'] },
    ],
  },
  {
    name: 'Western Kenya',
    country: 'Kenya',
    description: 'Kakamega, Bungoma, Vihiga — Luhya cuisine, hearty chicken and ugali.',
    cuisineTags: ['luhya', 'chicken', 'traditional'],
    centerLat: 0.2827,
    centerLng: 34.7519,
    foods: [
      { foodName: 'Ingokho (traditional chicken)', avgPrice: 800, isStaple: false, tags: ['chicken', 'boiled'] },
      { foodName: 'Ugali', avgPrice: 30, isStaple: true, tags: ['maize', 'staple'] },
      { foodName: 'Tsimboka (mushrooms)', avgPrice: 150, isStaple: false, tags: ['mushroom', 'local'] },
      { foodName: 'Likhanga (maize & beans)', avgPrice: 100, isStaple: true, tags: ['beans', 'maize'] },
    ],
  },
  {
    name: 'Rift Valley & Kalenjin',
    country: 'Kenya',
    description: 'Nakuru, Eldoret, Kericho — Kalenjin staples, dairy-rich diet.',
    cuisineTags: ['kalenjin', 'dairy', 'rift-valley'],
    centerLat: 0.5143,
    centerLng: 35.2698,
    foods: [
      { foodName: 'Mursik (fermented milk)', avgPrice: 80, isStaple: true, tags: ['dairy', 'fermented'] },
      { foodName: 'Ugali & Mursik', avgPrice: 100, isStaple: true, tags: ['maize', 'dairy'] },
      { foodName: 'Kimyet (blood & milk)', avgPrice: 0, isStaple: false, tags: ['traditional', 'ceremonial'] },
      { foodName: 'Roasted maize', avgPrice: 20, isStaple: false, tags: ['snack', 'street-food'] },
    ],
  },
  {
    name: 'North Eastern (Somali-Kenyan)',
    country: 'Kenya',
    description: 'Garissa, Wajir, Mandera — Somali-influenced cuisine, camel meat and pasta.',
    cuisineTags: ['somali', 'pastoral', 'camel'],
    centerLat: 0.4532,
    centerLng: 39.6461,
    foods: [
      { foodName: 'Anjera (canjeero)', avgPrice: 100, isStaple: true, tags: ['flatbread', 'fermented'] },
      { foodName: 'Suqaar (diced meat)', avgPrice: 300, isStaple: false, tags: ['meat', 'stew'] },
      { foodName: 'Bariis Iskukaris', avgPrice: 350, isStaple: true, tags: ['rice', 'spiced'] },
      { foodName: 'Camel milk tea', avgPrice: 60, isStaple: true, tags: ['beverage', 'dairy'] },
      { foodName: 'Muufo', avgPrice: 80, isStaple: false, tags: ['bread', 'flatbread'] },
    ],
  },
  {
    name: 'Nairobi Metropolitan',
    country: 'Kenya',
    description: 'Nairobi — cosmopolitan mix of all Kenyan cuisines plus international.',
    cuisineTags: ['urban', 'cosmopolitan', 'street-food'],
    centerLat: -1.2921,
    centerLng: 36.8219,
    foods: [
      { foodName: 'Ugali & Sukuma Wiki', avgPrice: 80, isStaple: true, tags: ['maize', 'greens'] },
      { foodName: 'Nyama Choma', avgPrice: 500, isStaple: false, tags: ['meat', 'grilled'] },
      { foodName: 'Chips Masala', avgPrice: 150, isStaple: false, tags: ['street-food', 'fries'] },
      { foodName: 'Smokie Pasua', avgPrice: 50, isStaple: false, tags: ['street-food', 'sausage'] },
      { foodName: 'Chapati & Beans', avgPrice: 100, isStaple: true, tags: ['flatbread', 'beans'] },
      { foodName: 'Mandazi', avgPrice: 30, isStaple: false, tags: ['snack', 'fried', 'doughnut'] },
    ],
  },
];

async function seed() {
  console.log('Seeding food regions and foods…');

  for (const region of REGIONS) {
    const { rows } = await db.query(
      `INSERT INTO food_regions (name, country, description, cuisine_tags, center_lat, center_lng)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [region.name, region.country, region.description, region.cuisineTags, region.centerLat, region.centerLng],
    );

    const regionId = rows[0]?.id;
    if (!regionId) {
      console.log(`  ⏭ Region "${region.name}" already exists, skipping.`);
      continue;
    }

    for (const food of region.foods) {
      await db.query(
        `INSERT INTO region_foods (region_id, food_name, avg_price, currency, is_staple, tags)
         VALUES ($1, $2, $3, 'KES', $4, $5)
         ON CONFLICT DO NOTHING`,
        [regionId, food.foodName, food.avgPrice, food.isStaple, food.tags],
      );
    }
    console.log(`  ✓ ${region.name} — ${region.foods.length} foods`);
  }

  console.log('Seeding complete.');
  await db.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
