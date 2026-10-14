# questionnaire-v1.1.1 发布记录

基线 v1.1.0，4783a990e027f2401a581c559eaae31d5ca59cd4。问卷 v1.1.1；正式图 rittenhouse-formal-v2；题库 rittenhouse-formal-task-pool-v5；快照 rittenhouse-formal-snapshot-v2；releaseStatus=frozen。

参与者操作说明改变：增加中心地名、四圈层颜色、字号示例和标签位置非精确地理坐标等解释。不得与 v1.1.0 默认当作完全相同实验条件；全文依据 Step17 逐字采用。其他题目、评分、随机化、PREVis、四表前端导出器和正式资产不变。原会话存储键、题目、答案、版本与原说明均保留，新会话才用 v1.1.1 键及 frozen 通道。

阅读最低门槛仍为可见累计 10 秒；后台暂停、刷新恢复、完成后免重计；不会满时自动进入 T1。单段正文样式不变；新增候选版作用域样式解除 Safari 旧尺寸警告对说明页按钮的遮挡。

Step18 另外完善离线归档合并、来源追踪、去重及同版分析隔离，不修改已发布前端导出器。见 SURVEY_RESULTS_IMPORT.md。

官方地址：https://jianbaihi.github.io/reachability-visualization-study/ 。课题组服务器本轮仅只读审计和方案，未部署。此前公网冷启动中位 4.12 秒未达到 3 秒、直连/代理差异和 GitHub25/50/100高并发 FAIL 仍是未解决事项，小批次低并发发放。本次功能发布不代表这些性能均通过。
