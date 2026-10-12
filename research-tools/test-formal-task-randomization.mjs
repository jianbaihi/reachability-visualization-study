import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const generator = require("../assets/formal-task-generator-v4.js");
const pool = JSON.parse(fs.readFileSync(new URL("../assets/stimuli/formal/formal-task-pool-v4.json", import.meta.url), "utf8"));
const frozenTimeSvg = fs.readFileSync(new URL("../assets/stimuli/formal/formal-time-color.svg", import.meta.url), "utf8");
const frozenCategorySvg = fs.readFileSync(new URL("../assets/stimuli/formal/formal-category-color.svg", import.meta.url), "utf8");
const rings = ["0-5", "5-10", "10-15", "15-20"];
const categories = Object.keys(pool.T5.answers_by_category);
const answerKeyT2 = {
  "0-5": ["30cpm1uq6xcQCmN6JTrB8w", "vuE1iseFrgNPumUEfHIZZQ"],
  "5-10": ["gjFUrbSMo1rA1jgG5IhA2A", "X5fWO9e82EICHXzzs6eQMg"],
  "10-15": ["lWedWkinrM5j13pyimbpbA", "oGMwCmV1EQZgCdylAbK9ow"],
  "15-20": ["ysvzP0VvMTrGmUClKJ3img", "OZnU--KfAdDwJarO8roRig"]
};
const answerKeyT5 = {
  "Attractions & Landmarks": "UwkrmLk--LT65HndB1Odhw",
  Restaurants: "30cpm1uq6xcQCmN6JTrB8w",
  "Hotels & Travel": "EaBgGhjd8rB9KVvCXKaiAw",
  Shopping: "X5fWO9e82EICHXzzs6eQMg"
};
const t1Counts = Object.fromEntries(rings.map(ring => [ring, 0]));
const t5Counts = Object.fromEntries(categories.map(category => [category, 0]));
const v4Pois = Object.values(pool.T1.answers_by_ring).flatMap(bucket => bucket.valid_places);
const v4PoiIds = new Set(v4Pois.map(place => place.place_id));
assert.equal(v4Pois.length, 113);
assert.equal(v4PoiIds.size, 113);
for (const [stimulus, svg] of [["time", frozenTimeSvg], ["category", frozenCategorySvg]]) {
  const svgPoiIds = new Set([...svg.matchAll(/data-place-id="([^"]+)"/g)].map(match => match[1]));
  assert.equal(svgPoiIds.size, 113, `${stimulus} frozen SVG should contain 113 unique POIs`);
  assert.deepEqual([...svgPoiIds].sort(), [...v4PoiIds].sort(), `${stimulus} frozen SVG does not match the V4 POI snapshot`);
}

function stableTaskView(tasks) {
  return Object.fromEntries(Object.entries(tasks).map(([taskId, task]) => [taskId, {
    target_ring: task.target_ring,
    target_poi_id: task.target_poi_id,
    target_poi_name: task.target_poi_name,
    target_category: task.target_category,
    correct_answer: task.correct_answer,
    correct_place_ids: task.correct_place_ids,
    valid_place_ids: task.valid_place_ids,
    prompt: task.prompt,
    task_seed: task.task_seed
  }]));
}

function validate(seed, tasks) {
  const { T1, T2, T3, T4, T5 } = tasks;
  assert.ok(rings.includes(T1.target_ring), `T1 ring invalid for ${seed}`);
  assert.deepEqual(T1.correct_place_ids, pool.T1.answers_by_ring[T1.target_ring].valid_places.map(place => place.place_id));
  assert.equal(T1.correct_answer_rule, "ANY_3_DISTINCT_IN_TARGET_RING");

  assert.ok(rings.includes(T2.target_ring), `T2 ring invalid for ${seed}`);
  assert.deepEqual([...T2.correct_place_ids].sort(), pool.T2.answers_by_ring[T2.target_ring].correct_places.map(place => place.place_id).sort());
  assert.deepEqual([...T2.correct_place_ids].sort(), [...answerKeyT2[T2.target_ring]].sort());
  assert.equal(T2.correct_answer_rule, "UNORDERED_EXACT_SET");

  assert.ok(pool.T3.candidate_pool_by_ring[T3.target_ring].some(place => place.place_id === T3.target_poi_id), `T3 candidate invalid for ${seed}`);
  assert.deepEqual(T3.correct_place_ids, [T3.target_poi_id]);
  assert.equal(T3.correct_answer, T3.target_ring);
  assert.equal(T3.correct_answer_rule, "ANSWER_EQUALS_TARGET_RING");
  assert.deepEqual(T3.options, pool.T3.options);

  assert.ok(pool.T4.candidate_pool_by_ring[T4.target_ring].some(place => place.place_id === T4.target_poi_id), `T4 candidate invalid for ${seed}`);
  assert.deepEqual(T4.correct_place_ids, [T4.target_poi_id]);
  assert.equal(T4.correct_answer, T4.target_ring);
  assert.equal(T4.correct_answer_rule, "ANSWER_EQUALS_TARGET_RING");
  assert.deepEqual(T4.options, pool.T4.options);
  assert.equal(T4.target_ring, T3.target_ring, `T3/T4 should share a feasible ring for ${seed}`);
  const closestLength = Math.min(...pool.T4.candidate_pool_by_ring[T3.target_ring].map(place => Math.abs(place.name.length - T3.target_poi_name.length)));
  assert.equal(Math.abs(T4.target_poi_name.length - T3.target_poi_name.length), closestLength);
  assert.equal(T3.prompt.replace(T3.target_poi_name, "{target_name}"), T4.prompt.replace(T4.target_poi_name, "{target_name}"));
  assert.doesNotMatch(`${T3.prompt} ${T4.prompt}`, /普通字号|大字号|normal size|large size|P35|P65|P85/i);

  assert.ok(categories.includes(T5.target_category), `T5 category invalid for ${seed}`);
  const categoryAnswer = pool.T5.answers_by_category[T5.target_category].correct_place;
  assert.equal(categoryAnswer.place_id, answerKeyT5[T5.target_category]);
  assert.equal(T5.target_poi_id, categoryAnswer.place_id);
  assert.deepEqual(T5.correct_place_ids, [categoryAnswer.place_id]);
  assert.equal(T5.correct_answer_rule, "EXACT_PLACE_ID");
}

for (let i = 1; i <= 1000; i++) {
  const seed = `A${String(i).padStart(4, "0")}`;
  const tasks = generator.generateTaskInstances(seed, pool);
  validate(seed, tasks);
  t1Counts[tasks.T1.target_ring]++;
  t5Counts[tasks.T5.target_category]++;
}

const seedSamples = ["A001", "A002", "A003", "A004", "A005"].map(seed => [seed, generator.generateTaskInstances(seed, pool)]);
for (const [, tasks] of seedSamples) validate("sample", tasks);
const sameSeed = generator.generateTaskInstances("A003", pool);
for (let refresh = 0; refresh < 3; refresh++) {
  assert.deepEqual(stableTaskView(generator.generateTaskInstances("A003", pool)), stableTaskView(sameSeed), "same seed changed across refresh simulation");
}
const signatures = new Set(seedSamples.map(([, tasks]) => JSON.stringify(stableTaskView(tasks))));
assert.ok(signatures.size > 1, "different seeds did not produce varied task combinations");

for (const [dimension, counts] of [["T1 ring", t1Counts], ["T5 category", t5Counts]]) {
  for (const [value, count] of Object.entries(counts)) assert.ok(count >= 190 && count <= 310, `${dimension} ${value} distribution outside 190–310: ${count}`);
}

console.log("RANDOMIZATION TEST");
console.log("seeds: 1000");
console.log("T1 ring counts:");
for (const ring of rings) console.log(`${ring}: ${t1Counts[ring]}`);
console.log("T5 category counts:");
for (const category of categories) console.log(`${category}: ${t5Counts[category]}`);
for (const [seed, tasks] of seedSamples) {
  const values = [tasks.T1.target_ring, tasks.T2.target_ring, `${tasks.T3.target_poi_name} / ${tasks.T3.target_ring}`, `${tasks.T4.target_poi_name} / ${tasks.T4.target_ring}`, tasks.T5.target_category];
  console.log(`${seed}: ${values.join(" | ")}`);
}
console.log("same-seed deterministic (A003 + 3 refreshes): PASS");
console.log("different-seed variation: PASS");
console.log("candidate eligibility, T3/T4 pairing, and frozen SVG POI integrity: PASS");
console.log("answer integrity: PASS");
console.log("T1/T5 distribution sanity: PASS");
console.log("PASS");
