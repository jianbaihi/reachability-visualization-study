> 历史记录：以下为 Step 17 审阅时的本地候选状态。Step 18 当前版本状态见 [正式发布记录](QUESTIONNAIRE_V1_1_1_RELEASE.md)。

# questionnaire-v1.1.1 — Step 17 本地候选

基线：已冻结 v1.1.0，提交 4783a990e027f2401a581c559eaae31d5ca59cd4。分支 codex/questionnaire-v1.1.1-step17。未提交、未推送、未打标签、未部署。

本轮为参与者操作说明变化：逐字使用 Step 17 指定自然段，增加中心地名、Yelp 出处、四圈层颜色、字号示例和标签位置非精确地理坐标等解释。因此使用独立 questionnaire-v1.1.1 版本，不能将不同说明版本默认视为相同实验条件。

新会话保存至 reachability_questionnaire_session_v1_1_1，releaseChannel=candidate。恢复 v1.1.0 / v1.0.x 时优先保留其原键、原版本、seed、实例、答案及当前冻结公开版本展示的原说明；不迁移数据。HTML 保留冻结版本原段落，只有明确 v1.1.1 会话才换入新段落。旧 QUESTIONNAIRE_CONTENT 与 V2 文件保持逐字节不变。

阅读门槛仍为可见累计 10,000ms、后台暂停、刷新恢复、返回免重计、点击才进入 T1，T1 原倒计时不变。仅把阅读门槛适用版本扩展到 v1.1.1。

样式保持 16px、1.85 行高、.015em 字距及原容器。唯一新增布局规则仅针对带 v1.1.1 标记的说明页，关闭 Safari 遗留固定尺寸警告条，避免覆盖长正文的按钮；旧会话样式不改变。1280×720 允许自然纵向滚动。

不改变 v2 SVG、113 地点、圈层、题库、随机化、评分、PREVis 或 XLSX 四表结构。XLSX 通过现有问卷版本字段区分 v1.1.0 和 v1.1.1。历史合并工具及历史数据未修改；当前合并器默认分析仍是 v1.1.0，不应手工把新候选改写成 v1.1.0 混入分析。后续若正式采集 v1.1.1，分析计划需单独确定该条件的处理。

验收报告：release-audit/STEP17_RESEARCHER_REVIEW_REPORT.md。预览图集：output/playwright/step17/screenshots.html。研究者审阅后另行授权提交和部署；当前线上继续 v1.1.0。
