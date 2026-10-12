(function attachSurveyXlsxExporter(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SurveyXlsxExporter = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSurveyXlsxExporter() {
  const TASK_IDS = ["T1", "T2", "T3", "T4", "T5"];
  const DIMENSIONS = [
    { code: "U", name: "易理解性", ids: ["U1", "U2", "U3"] },
    { code: "L", name: "布局", ids: ["L1", "L2", "L3"] },
    { code: "R", name: "数据读取", ids: ["R1", "R2", "R3"] }
  ];
  const RINGS = { "0-5": "0–5 min", "5-10": "5–10 min", "10-15": "10–15 min", "15-20": "15–20 min", uncertain: "不确定" };
  const XLSX_LAYOUT = {
    participant: { name: "参与者信息", columns: [
      ["participant_id", "参与者编号", 14], ["questionnaire_version", "问卷版本", 16], ["dataset_id", "数据集", 22, "left"], ["stimulus_version", "刺激版本", 22, "left"],
      ["education", "教育阶段", 16], ["discipline", "专业领域", 28, "left"], ["gis", "GIS / 地图学经验", 22, "left"], ["visualization", "数据可视化经验", 22, "left"],
      ["started_at", "开始时间", 21], ["completed_at", "完成时间", 21], ["duration", "总用时", 18],
      ["participant_uuid", "participant_uuid", 24, "left", true], ["started_at_iso", "started_at_iso", 24, "left", true], ["completed_at_iso", "completed_at_iso", 24, "left", true],
      ["total_duration_ms", "duration_ms", 18, "center", true], ["total_duration_s", "duration_s", 18, "center", true]
    ], dataHeight: 40 },
    tasks: { name: "任务记录", columns: [
      ["participant_id", "参与者编号", 14], ["task", "任务", 9], ["question", "题目", 50, "left"], ["target", "目标条件", 22, "left"],
      ["answer", "参与者答案", 36, "left"], ["correct_answer", "正确答案", 36, "left"], ["correct_mark", "是否正确", 10],
      ["duration", "作答用时", 18], ["hidden_count", "切屏次数", 11], ["hidden_duration", "切屏时长", 18],
      ["task_id", "task_id", 16, "center", true], ["task_instance_id", "task_instance_id", 24, "left", true], ["task_seed", "task_seed", 24, "left", true],
      ["condition", "condition", 24, "left", true], ["candidate_pool", "candidate_pool", 20, "left", true], ["stimulus_file", "stimulus_file", 28, "left", true],
      ["manifest_file", "manifest_file", 24, "left", true], ["target_ring", "target_ring", 16, "center", true], ["target_category", "target_category", 24, "left", true],
      ["target_place_id", "target_place_id", 24, "left", true], ["selected_place_ids", "selected_place_ids", 32, "left", true],
      ["correct_place_ids", "correct_place_ids", 32, "left", true], ["correct_bool", "correct_bool", 16, "center", true],
      ["active_duration_ms", "active_duration_ms", 20, "center", true], ["active_duration_s", "active_duration_s", 20, "center", true],
      ["hidden_duration_ms", "hidden_duration_ms", 20, "center", true], ["started_at_iso", "started_at_iso", 24, "left", true], ["submitted_at_iso", "submitted_at_iso", 24, "left", true]
    ], dataHeight: 36 },
    previs: { name: "主观评价", columns: [
      ["participant_id", "参与者编号", 14], ["dimension", "维度", 14], ["item", "题号", 9], ["question", "题目", 56, "left"], ["score", "评分", 10],
      ["dimension_code", "dimension_code", 18, "center", true], ["item_code", "item_code", 16, "center", true]
    ], dataHeight: 42 },
    sessionMeta: { name: "会话信息", columns: [["field", "字段", 25, "left"], ["value", "值", 72, "left"]], dataHeight: 28 }
  };
  const LOOKUPS = {
    education_level: { undergraduate_or_below: "本科在读或以下", undergraduate: "本科毕业", master: "硕士在读", master_graduated: "硕士毕业", doctorate_or_above: "博士在读或以上", other: "其他 / 不愿回答" },
    discipline_group: { geo_gis_mapping: "地理 / 地图 / GIS / 测绘", planning_architecture_landscape: "城乡规划 / 建筑 / 景观 / 交通", computer_data: "计算机 / 数据科学 / 信息技术", design: "设计 / 视觉传达 / 数字媒体", social_humanities: "社会科学 / 管理 / 人文", natural_engineering: "自然科学 / 其他工程领域", other: "其他 / 跨学科" },
    experience: { none: "无", concepts: "仅了解概念", course_or_project: "有课程或少量使用经验", frequent_project: "经常使用 / 有项目经验", professional: "专业或研究级经验" }
  };
  function formatDurationMs(ms) {
    if (ms === "" || ms === null || ms === undefined) return "";
    const total = Number(ms);
    if (!Number.isFinite(total) || total < 0) return "";
    const seconds = total / 1000;
    if (seconds < 60) return `${seconds.toFixed(3)} s`;
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    if (h > 0) return `${h} h ${String(m).padStart(2, "0")} min ${s.toFixed(3).padStart(6, "0")} s`;
    return `${m} min ${s.toFixed(3).padStart(6, "0")} s`;
  }
  function seconds(ms) { return ms === "" || ms === null || ms === undefined || !Number.isFinite(Number(ms)) ? "" : Math.round(Number(ms)) / 1000; }
  function localTime(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "";
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  function answerNames(task) {
    if (!task) return "";
    if (task.task_id === "T3" || task.task_id === "T4") return RINGS[task.answer] || task.answer || "";
    const names = task.selected_place_names?.length ? task.selected_place_names : Array.isArray(task.answer) ? task.answer.map(item => item.name) : [];
    return names.filter(Boolean).join("\n");
  }
  function correctNames(task) {
    if (!task) return "";
    if (task.task_id === "T3" || task.task_id === "T4") return RINGS[task.target_ring] || "";
    if (task.task_id === "T1") return "目标圈层内任意 3 个不同地点";
    return (task.correct_place_names || []).join("\n");
  }
  function visibleTarget(task) {
    if (!task) return "";
    if (task.task_id === "T1" || task.task_id === "T2") return RINGS[task.target_ring] || task.target_ring || "";
    if (task.task_id === "T5") return task.target_category || "";
    return task.target_poi_name || "";
  }
  function buildRows(session, content, environment = {}) {
    const start = session.startedAt || "", end = session.completedAt || "";
    const durationMs = start && end ? Date.parse(end) - Date.parse(start) : "";
    const participant = [{ participant_id: session.participantId || "", questionnaire_version: session.questionnaireVersion || "", dataset_id: session.datasetId || "", stimulus_version: session.stimulusVersion || "",
      education: LOOKUPS.education_level[session.background?.education_level] || session.background?.education_level || "", discipline: LOOKUPS.discipline_group[session.background?.discipline_group] || session.background?.discipline_group || "",
      gis: LOOKUPS.experience[session.background?.gis_experience] || session.background?.gis_experience || "", visualization: LOOKUPS.experience[session.background?.visualization_experience] || session.background?.visualization_experience || "",
      started_at: localTime(start), completed_at: localTime(end), duration: formatDurationMs(durationMs), participant_uuid: session.participantUuid || "", started_at_iso: start, completed_at_iso: end, total_duration_ms: durationMs, total_duration_s: seconds(durationMs) }];
    const tasks = TASK_IDS.map(taskId => {
      const task = session.tasks?.[taskId] || null;
      const instance = session.taskInstances?.[taskId] || {};
      const merged = task ? { ...instance, ...task, task_id: taskId } : { ...instance, task_id: taskId };
      const answered = Boolean(task);
      return { participant_id: session.participantId || "", task: taskId, question: merged.question_text || merged.prompt || "", target: visibleTarget(merged), answer: answered ? answerNames(merged) : "", correct_answer: correctNames(merged),
        correct_mark: answered && typeof merged.correct === "boolean" ? (merged.correct ? "✓" : "✕") : "", duration: answered ? formatDurationMs(merged.task_time_ms) : "", hidden_count: answered ? merged.hidden_count ?? "" : "", hidden_duration: answered ? formatDurationMs(merged.hidden_duration_ms) : "",
        task_id: taskId, task_instance_id: merged.task_instance_id || "", task_seed: merged.task_seed || session.taskSeed || "", condition: merged.condition || "", candidate_pool: merged.candidate_pool || "",
        stimulus_file: merged.stimulus_file || "", manifest_file: merged.manifest_file || "", target_ring: merged.target_ring || "", target_category: merged.target_category || "", target_place_id: merged.target_poi_id || "",
        selected_place_ids: (merged.selected_place_ids || []).join("|"), correct_place_ids: (merged.correct_place_ids || []).join("|"), correct_bool: answered && typeof merged.correct === "boolean" ? merged.correct : "",
        active_duration_ms: answered ? merged.task_time_ms ?? "" : "", active_duration_s: answered ? seconds(merged.task_time_ms) : "", hidden_duration_ms: answered ? merged.hidden_duration_ms ?? "" : "",
        started_at_iso: merged.started_at_iso || "", submitted_at_iso: merged.submitted_at_iso || "" };
    });
    const promptById = new Map((content?.partB || []).map(item => [item.id, item.prompt]));
    const previs = DIMENSIONS.flatMap(dimension => dimension.ids.map(item => ({ participant_id: session.participantId || "", dimension: dimension.name, item, question: promptById.get(item) || "", score: session.previs?.[item] ?? "", dimension_code: dimension.code, item_code: item })));
    const sessionMeta = [
      ["Schema 版本", session.schemaVersion ?? ""], ["浏览器", environment.userAgent || ""], ["屏幕宽度", environment.screenWidth ?? ""], ["屏幕高度", environment.screenHeight ?? ""],
      ["设备像素比", environment.devicePixelRatio ?? ""], ["Task Seed", session.taskSeed || ""], ["Session 创建时间", localTime(session.createdAt || session.startedAt)],
      ["完成时间", localTime(session.completedAt)], ["导出时间", localTime(environment.exportedAt || new Date().toISOString())], ["Participant UUID", session.participantUuid || ""],
      ["问卷版本", session.questionnaireVersion || ""], ["数据集", session.datasetId || ""], ["刺激版本", session.stimulusVersion || ""], ["题库版本", session.taskPoolVersion || ""], ["发布通道", session.releaseChannel || ""]
    ].map(([field, value]) => ({ field, value }));
    return { participant, tasks, previs, sessionMeta };
  }
  function estimateRowHeight(values, widths, { base = 24, max = 92 } = {}) {
    const lines = Math.max(1, ...values.map((value, index) => {
      const width = Math.max(8, widths[index] || 34);
      return String(value ?? "").split("\n").reduce((sum, segment) => sum + Math.max(1, Math.ceil([...segment].length / Math.max(8, width - 3))), 0);
    }));
    return Math.min(max, base + (Math.min(lines, 6) - 1) * 15);
  }
  function sheetForRows(XLSX, layout, rows) {
    const headers = layout.columns.map(column => column[1]);
    const data = rows.map(row => layout.columns.map(column => row[column[0]] ?? ""));
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    sheet["!cols"] = layout.columns.map(column => ({ wch: column[2], hidden: Boolean(column[4]) }));
    sheet["!rows"] = [{ hpt: layout.name === "参与者指标" ? 42 : 30 }, ...data.map(values => ({ hpt: layout.name === "任务记录" ? Math.max(36, estimateRowHeight(values.slice(0, 10), layout.columns.slice(0, 10).map(col => col[2]), { base: 30 })) : layout.name === "会话信息" && values[0] === "浏览器" ? Math.min(72, estimateRowHeight(values, [25, 72], { base: 30, max: 72 })) : layout.dataHeight }))];
    sheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(layout.columns.length - 1)}${Math.max(1, data.length + 1)}` };
    const headerStyle = { font: { name: "Microsoft YaHei", sz: 11, bold: true, color: { rgb: "17365D" } }, fill: { fgColor: { rgb: "E8F0F8" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } };
    for (let column = 0; column < layout.columns.length; column++) sheet[XLSX.utils.encode_cell({ r: 0, c: column })].s = headerStyle;
    for (let row = 1; row <= data.length; row++) for (let column = 0; column < layout.columns.length; column++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;
      const left = layout.columns[column][3] === "left";
      cell.s = { font: { name: "Microsoft YaHei", sz: 11, color: { rgb: "1F3552" } }, alignment: { horizontal: left ? "left" : "center", vertical: "center", wrapText: left || String(cell.v ?? "").includes("\n") } };
      if (layout.name === "任务记录" && layout.columns[column][0] === "correct_mark") {
        if (cell.v === "✓") cell.s = { font: { name: "Microsoft YaHei", sz: 11, bold: true, color: { rgb: "1E7A46" } }, fill: { fgColor: { rgb: "EDF8F1" } }, alignment: { horizontal: "center", vertical: "center" } };
        if (cell.v === "✕") cell.s = { font: { name: "Microsoft YaHei", sz: 11, bold: true, color: { rgb: "B42318" } }, fill: { fgColor: { rgb: "FFF1F0" } }, alignment: { horizontal: "center", vertical: "center" } };
      }
    }
    if (layout.name === "会话信息") for (let row = 1; row <= data.length; row++) { const cell = sheet[`A${row + 1}`]; if (cell) cell.s = { font: { name: "Microsoft YaHei", sz: 11, bold: true, color: { rgb: "17365D" } }, fill: { fgColor: { rgb: "F3F7FC" } }, alignment: { vertical: "center", wrapText: true } }; }
    return sheet;
  }
  async function freezeFirstRows(bytes, JSZip) {
    const zip = await JSZip.loadAsync(bytes);
    for (const path of Object.keys(zip.files).filter(path => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))) {
      const xml = await zip.file(path).async("string");
      const frozen = xml.replace(/<sheetViews>.*?<\/sheetViews>/s, '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>');
      if (frozen === xml) throw new Error(`无法冻结首行: ${path}`);
      zip.file(path, frozen);
    }
    return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  }
  async function createWorkbookBytes(session, content, environment, XLSX, JSZip) {
    if (!XLSX || !JSZip) throw new Error("离线 Excel 组件未加载");
    const rows = buildRows(session, content, environment);
    const workbook = XLSX.utils.book_new();
    for (const key of ["participant", "tasks", "previs", "sessionMeta"]) XLSX.utils.book_append_sheet(workbook, sheetForRows(XLSX, XLSX_LAYOUT[key], rows[key]), XLSX_LAYOUT[key].name);
    const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array", cellStyles: true, compression: true });
    return freezeFirstRows(bytes, JSZip);
  }
  function fileName(session, date = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    return `reachability-survey_${session.participantId || "unknown"}_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.xlsx`;
  }
  async function download(session, content, environment, XLSX, JSZip) {
    const bytes = await createWorkbookBytes(session, content, environment, XLSX, JSZip);
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const href = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = href; anchor.download = fileName(session); anchor.style.display = "none"; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60000);
    return anchor.download;
  }
  return Object.freeze({ XLSX_LAYOUT, formatDurationMs, seconds, localTime, buildRows, estimateRowHeight, createWorkbookBytes, fileName, download });
});
