# 结果归档与同版主分析

原始 XLSX 只读保存于 survey-results/historical-v1.0.x、github-v1.1.0、github-v1.1.1、campus-v1.1.1。真实数据和导出总表均已忽略，禁止提交。脚本不创建或改写原始文件。

运行：`python3 research-tools/merge_survey_results.py survey-results --analysis-version questionnaire-v1.1.1 --analysis-sites github_pages`。需要 openpyxl。默认递归导入，目录来源映射仅识别上述目录名，未知为 unknown_legacy，不按 XLSX 文件名猜站点。也可 `--manifest import.json`，格式 `{ "files": [{"path":"相对于清单的路径.xlsx", "source_site":"github_pages"}] }`；不能重复列入同一路径。

输出分别为 archive_*.xlsx（完整四表原行+来源/版本/文件 SHA/导入状态、导入追踪、版本×站点统计、质量检查）和 primary_*.xlsx（仅明确指定同版及来源的主分析）。输出目录默认 merged，可用 --output-dir；不会覆盖输入或之前输出。每个 task 保留题目原文、实例、答案；缺失字段记录，不能伪造 UUID 或版本。

优先同版稳定 UUID，缺失时使用同版 participant_id。完全相同文件 SHA 标 exact_duplicate，仅统计一次；仅导出时间不同、其余数据相同的重导出标 equivalent_reexport。相同身份但数据不同，全组 conflict_review，不能自动保留较新。相同 ID 对应不同 UUID 也人工复核。多站点重复答卷的来源不明确时 source_review，不任意归属站点。不同站点匿名浏览器无法证明同一个人。原件均保留。

默认主分析版本为 v1.1.1，站点 github_pages。旧版需明确 --analysis-version 与 --analysis-sites unknown_legacy 或 github_pages。禁止混算 v1.1.0/v1.1.1 为同一条件。分层统计按版本、站点各自计算 N、各任务准确率/时间中位数和 U/L/R 均值。归档的行含重复和冲突，统计仅 included 且元数据和结果有效者。

未来两站同版合并，需 --analysis-sites github_pages campus_server --site-equivalence-manifest receipt.json。清单要求 deployments 两站均含 verified=true、questionnaire_version、相同 40 位 commit、五个正式资产文件名对应相同 SHA256。该证明必须由真实部署核验形成，不能把合成测试清单作为部署证明；校园未部署时不可跨站正式主分析。

相较旧工具：非递归/文件名追踪→递归/完整路径+SHA+来源；仅重复报警仍入统计→精确/等价去重与冲突整组排除；六表混合输出→完整归档与同版主分析分别输出；默认 v1.1.0→明确 v1.1.1/站点，历史统计不自动覆盖。没有自动跨版本探索性合并功能。

合成集成测试：先跑浏览器 E2E，确保 output/playwright/step17 含新旧 XLSX，再运行 `python3 research-tools/test-step18-merge.py`。所有合成 XLSX、示例总表和测试等价证明均留在忽略的 output 下。
