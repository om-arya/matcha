import express from "express";
import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";

/**
    Run with node --loader tsx server.js.

    Uses better-sqlite3 for synchronous reads. Install: npm install express better-sqlite3.

    Place your graphs.sqlite file in a data/ folder at the project root (or change dbPath).

    The assignment list is cached in memory. After 60 participants, call resetAssignments() to reshuffle.
*/

const app = express();
const PORT = process.env.PORT || 3001;

const PARTICIPANTS = 60;
const GRAPHS_PER_PARTICIPANT = 4;

const dbPath = path.join(process.cwd(), "data", "graphs.sqlite");
const db = new Database(dbPath, { readonly: true });

// Shuffle copy
function shuffleCopy(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build repeated shuffled assignment list
function buildAssignmentList() {
  const rows = db.prepare("SELECT id FROM graphs ORDER BY id").all();
  const ids = rows.map((r) => r.id);
  const N = ids.length;

  const totalSlots = PARTICIPANTS * GRAPHS_PER_PARTICIPANT;
  const repeats = Math.ceil(totalSlots / N);

  const assignment = [];
  for (let r = 0; r < repeats; r++) {
    assignment.push(...shuffleCopy(ids));
  }
  return assignment.slice(0, totalSlots);
}

// Deterministic mapping of participantId -> index 0..59
function participantIndexFromId(participantId) {
  const hash = crypto.createHash("sha256").update(participantId).digest();
  const intVal = hash.readUInt32BE(0);
  return intVal % PARTICIPANTS;
}

let assignmentList = buildAssignmentList(); // array length = PARTICIPANTS * 4

function resetAssignments() {
  assignmentList = buildAssignmentList();
}

app.get("/api/assign-graphs", (req, res) => {
  const participantId = String(req.query.participantId || "").trim();
  if (!participantId) {
    return res.status(400).json({ error: "participantId required" });
  }

  const participantIndex = participantIndexFromId(participantId);

  const start = participantIndex * GRAPHS_PER_PARTICIPANT;
  const chosenIds = assignmentList.slice(start, start + GRAPHS_PER_PARTICIPANT);

  if (chosenIds.length < GRAPHS_PER_PARTICIPANT) {
    // reset when we've exhausted the list
    resetAssignments();
    const newStart = participantIndex * GRAPHS_PER_PARTICIPANT;
    chosenIds.push(
      ...assignmentList.slice(newStart, newStart + GRAPHS_PER_PARTICIPANT)
    );
  }

  const placeholders = chosenIds.map(() => "?").join(",");
  const rows = db
    .prepare(`SELECT * FROM graphs WHERE id IN (${placeholders})`)
    .all(...chosenIds);

  const rowById = Object.fromEntries(rows.map((r) => [r.id, r]));
  const ordered = chosenIds.map((id) => rowById[id]);

  res.json({ participantId, participantIndex, charts: ordered });
});

// -------------------- START SERVER --------------------
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});