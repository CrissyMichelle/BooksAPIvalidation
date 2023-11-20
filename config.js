/** Common config for bookstore. */

let DB_URI = `postgresql:///bookstore`;

if (process.env.NODE_ENV === "test") {
  DB_URI = `${DB_URI}_test`;
} else {
  DB_URI = process.env.DATABASE_URL || DB_URI;
}

module.exports = { DB_URI };