const express = require("express");
const router = express.Router();
const {
  dbAll,
  dbGet,
  convertTimestamps,
  markNew,
} = require("../../../util/UTIL.js");

router.get("/", async (req, res) => {
  const sortKeys = {
    name: "presets.preset_name",
    synth: "synths.synth_name",
    pack: "presets.pack_name",
    author: "presets.author",
    added: "presets.timestamp",
  };

  const sortDirections = {
    asc: "ASC",
    desc: "DESC",
  };

  const sortKey = sortKeys[req.query.sort] || sortKeys.added;
  const sortDirection = sortDirections[req.query.direction] || "ASC";

  if (!sortKey || !sortDirection) {
    return res.status(400).send("Invalid sort key");
  }

  const queries = {
    totalResults: `
        SELECT COUNT(*) AS total_results FROM presets`,

    presets: `
        SELECT
            presets.id AS preset_id,
            presets.preset_name AS preset_name,
            presets.pack_name AS preset_pack_name,
            presets.author AS preset_author,
            synths.id AS synth_id,
            synths.synth_name AS synth_name,
            synths.image_url AS synth_image,
            presets.timestamp AS preset_added_timestamp
        FROM presets
        LEFT JOIN preset_synths ON presets.id = preset_synths.preset_id
        LEFT JOIN synths ON preset_synths.synth_id = synths.id
        GROUP BY presets.id
        ORDER BY ${sortKey} ${sortDirection}`,
  };

  const isAuth = req.isAuthenticated();
  const userIsAdmin = isAuth && req.user && req.user.is_admin;

  try {
    const [totalResults, presets] = await Promise.all([
      dbGet(queries.totalResults),
      dbAll(queries.presets),
    ]);

    markNew(presets, "preset");
    convertTimestamps(presets, "preset");

    res.render("main/browse/presets", {
      isAuth,
      userIsAdmin,
      totalResults: totalResults.total_results,
      presets,
      PATH_URL: "browse",
    });
  } catch (err) {
    return res.status(500).render("static/db-error", {
      err,
      isAuth,
      userIsAdmin,
      PATH_URL: "db-error",
    });
  }
});

module.exports = router;
