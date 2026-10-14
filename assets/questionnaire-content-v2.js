// Candidate-only item wording; legacy questionnaire content remains untouched.
(() => {
  const prompts = {
    U1: "我很容易掌握这张可达性地图的阅读方法。",
    U2: "我能清楚理解地图中颜色、字号等视觉元素所表达的信息。",
    U3: "整体而言，我觉得这张可达性地图容易理解。"
  };
  window.QUESTIONNAIRE_CONTENT_V2 = Object.freeze({
    ...window.QUESTIONNAIRE_CONTENT,
    version: "questionnaire-v1.1.0-step15d",
    partB: Object.freeze(window.QUESTIONNAIRE_CONTENT.partB.map(item =>
      Object.freeze({...item, prompt: prompts[item.id] || item.prompt})))
  });
})();
