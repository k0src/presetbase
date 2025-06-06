const express = require("express");
const router = express.Router();
const db = require("../../db/db");
const { dbAll, convertTimestamp } = require("../UTIL.js");

router.get("/", async (req, res) => {
  const query = `
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
            songs.timestamp AS song_added_timestamp
        FROM songs
        LEFT JOIN song_artists ON songs.id = song_artists.song_id
        LEFT JOIN artists ON song_artists.artist_id = artists.id
        LEFT JOIN album_songs ON songs.id = album_songs.song_id
        LEFT JOIN albums ON album_songs.album_id = albums.id
        LEFT JOIN song_clicks ON songs.id = song_clicks.song_id
        WHERE song_artists.role = 'Main'
        GROUP BY songs.id, songs.title, songs.genre, songs.release_year, 
                 songs.image_url, songs.timestamp
        ORDER BY songs.timestamp DESC
        LIMIT 10`;

  try {
    const songs = await dbAll(query);

    if (songs) {
      songs.forEach((song) => {
        song.song_added_timestamp = convertTimestamp(song.song_added_timestamp);
      });

      for (let i = 0; i < songs.length; i++) {
        songs[i].rank = i + 1;
      }
    }

    res.render("browse/recent", { songs });
  } catch (err) {
    return res.status(500).send("Database error: " + err.message);
  }
});

module.exports = router;
