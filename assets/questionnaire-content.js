// Frozen questionnaire content. Keep stable IDs; UI labels may be localized separately.
window.QUESTIONNAIRE_CONTENT = Object.freeze({
  version: "2026-09-25-v2",
  rings: Object.freeze(["0-5", "5-10", "10-15", "15-20"]),
  partA: Object.freeze([
    Object.freeze({ id: "T1", type: "three_places_from_set", prompt: "请从图中说出任意三个步行 5–10 min 可以到达的地点。", fields: ["place_1", "place_2", "place_3"], unique: true }),
    Object.freeze({ id: "T2", type: "two_exact_places", prompt: "在图中显示的、步行 5 min 内可以到达的地点中，请找出评论数最多的两个地点。", fields: ["place_1", "place_2"], orderMatters: false }),
    Object.freeze({ id: "T3", type: "existence_and_ring", prompt: "图中是否存在地点 X？", existenceField: "exists", ringField: "ring", targetKey: "T3" }),
    Object.freeze({ id: "T4", type: "existence_and_ring", prompt: "图中是否存在地点 Y？", existenceField: "exists", ringField: "ring", targetKey: "T4" }),
    Object.freeze({ id: "T5", type: "single_exact_place", prompt: "在图中显示的、步行 15 min 内可以到达的酒店中，请找出评论数最多的地点。", fields: ["answer"] }),
  ]),
  existenceOptions: Object.freeze([
    Object.freeze({ value: "yes", label: "是" }),
    Object.freeze({ value: "no", label: "否" }),
  ]),
  ringOptions: Object.freeze([
    Object.freeze({ value: "0-5", label: "0–5 min" }),
    Object.freeze({ value: "5-10", label: "5–10 min" }),
    Object.freeze({ value: "10-15", label: "10–15 min" }),
    Object.freeze({ value: "15-20", label: "15–20 min" }),
    Object.freeze({ value: "uncertain", label: "不确定" }),
  ]),
  partB: Object.freeze([
    Object.freeze({ id: "U1", group: "Understand", prompt: "我很容易明白应该如何阅读这个可视化。" }),
    Object.freeze({ id: "U2", group: "Understand", prompt: "我很容易理解数据在这个可视化中是如何表达的。" }),
    Object.freeze({ id: "U3", group: "Understand", prompt: "我能够很容易地理解这个可视化。" }),
    Object.freeze({ id: "L1", group: "Layout", prompt: "我不觉得这个可视化杂乱。" }),
    Object.freeze({ id: "L2", group: "Layout", prompt: "我不觉得这个可视化过于拥挤。" }),
    Object.freeze({ id: "L3", group: "Layout", prompt: "我不觉得这个可视化中存在明显分散注意力的部分。" }),
    Object.freeze({ id: "R1", group: "Reading Data", prompt: "我能够很容易地找到图中特定的元素。" }),
    Object.freeze({ id: "R2", group: "Reading Data", prompt: "我能够很容易地识别图中与任务相关的信息。" }),
    Object.freeze({ id: "R3", group: "Reading Data", prompt: "我能够很容易地从图中获取所需要的信息。" }),
  ]),
  likert7: Object.freeze([
    Object.freeze({ value: 1, label: "非常不同意" }), Object.freeze({ value: 2, label: "不同意" }),
    Object.freeze({ value: 3, label: "比较不同意" }), Object.freeze({ value: 4, label: "中立" }),
    Object.freeze({ value: 5, label: "比较同意" }), Object.freeze({ value: 6, label: "同意" }),
    Object.freeze({ value: 7, label: "非常同意" }),
  ]),
});
