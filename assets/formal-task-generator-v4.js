(function attachFormalTaskGenerator(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FormalTaskGeneratorV4 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFormalTaskGenerator() {
  const RING_LABELS = Object.freeze({ "0-5": "0–5 min", "5-10": "5–10 min", "10-15": "10–15 min", "15-20": "15–20 min" });

  function hash32(value) {
    let hash = 2166136261;
    for (const char of String(value)) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d);
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x846ca68b);
    hash ^= hash >>> 16;
    return hash >>> 0;
  }

  function choose(seed, key, values) {
    if (!values?.length) throw new Error(`Cannot choose from an empty list (${key})`);
    return values[hash32(`${seed}:${key}`) % values.length];
  }

  function createBase(taskId, seed, pool, condition, candidatePool = "") {
    const task = pool[taskId];
    const stimulus = pool.stimuli[taskId];
    return {
      task_id: taskId,
      task_instance_id: `${taskId}-${hash32(`${seed}:${taskId}`).toString(16).padStart(8, "0")}`,
      task_seed: String(seed),
      stimulus_file: stimulus.file,
      manifest_file: stimulus.manifest,
      condition,
      candidate_pool: candidatePool,
      correct_answer_rule: task.scoring_rule,
      task_pool_version: pool.taskPoolVersion
    };
  }

  function generateTaskInstances(seed, pool) {
    if (!seed || !pool || pool.taskPoolVersion !== "rittenhouse-formal-task-pool-v4") {
      throw new Error("A seed and Rittenhouse task-pool V4 are required");
    }
    const rings = Object.keys(pool.T1.answers_by_ring);
    const t1Ring = choose(seed, "T1:ring", rings);
    const t1Bucket = pool.T1.answers_by_ring[t1Ring];
    const t1 = {
      ...createBase("T1", seed, pool, "time_ring_selection"),
      target_ring: t1Ring,
      ring_label: t1Bucket.label,
      valid_place_ids: t1Bucket.valid_places.map(place => place.place_id),
      valid_place_names: t1Bucket.valid_places.map(place => place.name),
      correct_place_ids: t1Bucket.valid_places.map(place => place.place_id),
      correct_place_names: t1Bucket.valid_places.map(place => place.name),
      correct_answer: "ANY_3_DISTINCT_IN_TARGET_RING",
      prompt: pool.T1.prompt_template.replace("{ring_label}", t1Bucket.label)
    };

    const t2Ring = choose(seed, "T2:ring", rings);
    const t2Bucket = pool.T2.answers_by_ring[t2Ring];
    const t2 = {
      ...createBase("T2", seed, pool, "top_two_review_counts"),
      target_ring: t2Ring,
      ring_label: t2Bucket.label,
      correct_place_ids: t2Bucket.correct_places.map(place => place.place_id),
      correct_place_names: t2Bucket.correct_places.map(place => place.name),
      correct_answer: t2Bucket.correct_places.map(place => place.name).join(" | "),
      prompt: pool.T2.prompt_template.replace("{ring_label}", t2Bucket.label)
    };

    const t3Rings = rings.filter(ring => pool.T3.candidate_pool_by_ring[ring]?.length);
    const t3Ring = choose(seed, "T3:ring", t3Rings);
    const t3Candidate = choose(seed, "T3:target", pool.T3.candidate_pool_by_ring[t3Ring]);
    const t3 = {
      ...createBase("T3", seed, pool, "normal_font_P35-P65", "P35–P65"),
      target_poi_id: t3Candidate.place_id,
      target_poi_name: t3Candidate.name,
      target_ring: t3Candidate.ring,
      ring_label: t3Candidate.ring_label,
      correct_place_ids: [t3Candidate.place_id],
      correct_place_names: [t3Candidate.name],
      correct_answer: t3Candidate.ring,
      options: pool.T3.options,
      prompt: pool.T3.prompt_template.replace("{target_name}", t3Candidate.name)
    };

    const pairedCandidates = pool.T4.candidate_pool_by_ring[t3Ring] || [];
    const t4Ring = pairedCandidates.length ? t3Ring : choose(seed, "T4:ring", rings.filter(ring => pool.T4.candidate_pool_by_ring[ring]?.length));
    const t4Candidates = pool.T4.candidate_pool_by_ring[t4Ring];
    const closestNameLength = Math.min(...t4Candidates.map(place => Math.abs(place.name.length - t3Candidate.name.length)));
    const closestCandidates = t4Candidates.filter(place => Math.abs(place.name.length - t3Candidate.name.length) === closestNameLength);
    const t4Candidate = choose(seed, "T4:target", closestCandidates);
    const t4 = {
      ...createBase("T4", seed, pool, "large_font_P85_plus", "P85+"),
      target_poi_id: t4Candidate.place_id,
      target_poi_name: t4Candidate.name,
      target_ring: t4Candidate.ring,
      ring_label: t4Candidate.ring_label,
      paired_ring_with_T3: t3Ring === t4Candidate.ring,
      correct_place_ids: [t4Candidate.place_id],
      correct_place_names: [t4Candidate.name],
      correct_answer: t4Candidate.ring,
      options: pool.T4.options,
      prompt: pool.T4.prompt_template.replace("{target_name}", t4Candidate.name)
    };

    const categories = Object.keys(pool.T5.answers_by_category);
    const t5Category = choose(seed, "T5:category", categories);
    const t5Answer = pool.T5.answers_by_category[t5Category].correct_place;
    const t5 = {
      ...createBase("T5", seed, pool, "category_top_review_count"),
      target_category: t5Category,
      target_poi_id: t5Answer.place_id,
      target_poi_name: t5Answer.name,
      target_ring: t5Answer.ring,
      correct_place_ids: [t5Answer.place_id],
      correct_place_names: [t5Answer.name],
      correct_answer: t5Answer.name,
      prompt: pool.T5.prompt_template.replace("{target_category}", t5Category)
    };

    return { T1: t1, T2: t2, T3: t3, T4: t4, T5: t5 };
  }

  return Object.freeze({ generateTaskInstances, hash32, RING_LABELS });
});
