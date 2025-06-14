const express = require("express");
const router = express.Router();
const { dbAll, convertTimestamps } = require("../../UTIL.js");

router.get("/", async (req, res) => {
  const sortKeys = {
    title: "song_title",
    genre: "song_genre",
    year: "song_release_year",
    artist: "artist_name",
    album: "album_title",
    added: "song_added_timestamp",
    none: "NULL",
  };

  const sortKey = sortKeys[req.query.sort] || sortKeys.none;

  if (!sortKey) {
    return res.status(400).send("Invalid sort key");
  }

  const query = `
    WITH popular_songs AS (
      SELECT
          songs.id AS song_id,
          songs.title AS song_title,
          songs.genre AS song_genre,
          songs.release_year AS song_release_year,
          songs.image_url AS song_image,
          MAX(artists.name) AS artist_name,
          MAX(artists.id) AS artist_id,
          MAX(albums.title) AS album_title,
          MAX(albums.id) AS album_id,
          songs.timestamp AS song_added_timestamp,
          COALESCE(MAX(song_clicks.clicks), 0) AS song_clicks
      FROM songs
      LEFT JOIN song_artists ON songs.id = song_artists.song_id
      LEFT JOIN artists ON song_artists.artist_id = artists.id
      LEFT JOIN album_songs ON songs.id = album_songs.song_id
      LEFT JOIN albums ON album_songs.album_id = albums.id
      LEFT JOIN song_clicks ON songs.id = song_clicks.song_id
      WHERE song_artists.role = 'Main'
      GROUP BY songs.id, songs.title, songs.genre, songs.release_year,
                songs.image_url, songs.timestamp
      ORDER BY song_clicks.clicks DESC
      LIMIT 10
    )
    SELECT * FROM popular_songs
    ORDER BY ${sortKey}`;

  try {
    const songs = await dbAll(query);

    convertTimestamps(songs, "song");

    res.render("main/browse/popular", {
      songs,
      totalResults: 10,
      PATH_URL: "browse",
    });
  } catch (err) {
    return res.render("static/db-error", { err, PATH_URL: "db-error" });
  }
});

module.exports = router;
