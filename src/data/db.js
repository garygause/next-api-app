import fs from 'fs';
import slugify from 'slugify';
import xss from 'xss';

const sql = require('better-sqlite3');
const db = sql('src/data/meals.db');

export function getMeal(slug) {
  return db.prepare('select * from meals where slug = ?').get(slug);
}

export function getMeals() {
  return db.prepare('select * from meals').all();
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const extension = meal.image.name.split('.').pop();
  const fileName = `${meal.slug}.${extension}`;
  const stream = fs.createWriteStream(`@/../public/images/${fileName}`);
  const bufferedImage = await meal.image.arrayBuffer();

  stream.write(Buffer.from(bufferedImage), (error) => {
    if (error) {
      throw new Error('Saving image failed.');
    }
  });

  meal.image = `/images/${fileName}`;

  db.prepare(
    `
    INSERT INTO meals
    (title, summary, instructions, creator, creator_email, image, slug)
    VALUES
    (@title, @summary, @instructions, @creator, @creator_email, @image, @slug)
  `
  ).run(meal);
  return meal;
}

export default db;
