#!/usr/bin/env python3
"""Merge local per-participant survey exports into a version-separated archive and primary-analysis workbooks."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from statistics import mean, median, stdev

try:
    from openpyxl import Workbook, load_workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
except ImportError as exc:
    raise SystemExit("需要 openpyxl：python3 -m pip install openpyxl") from exc

SHEETS = ("参与者信息", "任务记录", "主观评价", "会话信息")
TASKS = ("T1", "T2", "T3", "T4", "T5")
PREVIS = ("U1", "U2", "U3", "L1", "L2", "L3", "R1", "R2", "R3")
BLUE = PatternFill("solid", fgColor="E8F0F8")
NAVY = "17365D"


def records(sheet):
    values = list(sheet.values)
    if not values:
        return []
    keys = [str(value or "") for value in values[0]]
    return [dict(zip(keys, row)) for row in values[1:] if any(value is not None for value in row)]


def number(value):
    try:
        return float(value) if value is not None and value != "" else None
    except (TypeError, ValueError):
        return None


def binary(value):
    return 1 if value in (True, "✓", 1, "true", "TRUE") else 0 if value in (False, "✕", 0, "false", "FALSE") else None


def avg(values):
    nums = [x for x in values if x is not None]
    return round(mean(nums), 3) if nums else None


def med(values):
    nums = [x for x in values if x is not None]
    return round(median(nums), 3) if nums else None


def sd(values):
    nums = [x for x in values if x is not None]
    return round(stdev(nums), 3) if len(nums) > 1 else None


def task_time(row):
    return number(row.get("active_duration_s"))


def style_sheet(ws, widths, *, hidden=(), long_columns=(), header_height=30, data_height=30):
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    ws.row_dimensions[1].height = header_height
    for col, width in enumerate(widths, 1):
        letter = get_column_letter(col)
        ws.column_dimensions[letter].width = width
        if col in hidden:
            ws.column_dimensions[letter].hidden = True
    for cell in ws[1]:
        cell.fill = BLUE
        cell.font = Font(name="Microsoft YaHei", size=11, bold=True, color=NAVY)
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for row in ws.iter_rows(min_row=2):
        lines = 1
        for cell in row:
            if cell.column in long_columns and cell.value is not None:
                width = widths[cell.column - 1]
                lines = max(lines, sum(max(1, (len(part) + max(8, width - 4) - 1) // max(8, width - 4)) for part in str(cell.value).split("\n")))
            cell.font = Font(name="Microsoft YaHei", size=11, color="1F3552")
            cell.alignment = Alignment(horizontal="left" if cell.column in long_columns else "center", vertical="center", wrap_text=cell.column in long_columns)
            if cell.value == "✓":
                cell.font = Font(name="Microsoft YaHei", size=11, bold=True, color="1E7A46")
                cell.fill = PatternFill("solid", fgColor="EDF8F1")
            elif cell.value == "✕":
                cell.font = Font(name="Microsoft YaHei", size=11, bold=True, color="B42318")
                cell.fill = PatternFill("solid", fgColor="FFF1F0")
        ws.row_dimensions[row[0].row].height = min(92, max(data_height, 22 + lines * 15))


def add_table(wb, title, headers, rows, widths, *, hidden=(), long_columns=(), header_height=30, data_height=30):
    ws = wb.create_sheet(title)
    ws.append(headers)
    for row in rows:
        ws.append(row)
    style_sheet(ws, widths, hidden=hidden, long_columns=long_columns, header_height=header_height, data_height=data_height)
    return ws


SITES = ('github_pages', 'campus_server', 'unknown_legacy')
VERSIONS = ('questionnaire-v1.0.0', 'questionnaire-v1.0.1', 'questionnaire-v1.1.0', 'questionnaire-v1.1.1')
DIRECTORY_SITES = {'historical-v1.0.x': 'unknown_legacy', 'github-v1.1.0': 'github_pages', 'github-v1.1.1': 'github_pages', 'campus-v1.1.1': 'campus_server'}


def digest(data):
    import hashlib
    return hashlib.sha256(data).hexdigest()


def stable_uuid(value):
    import uuid
    try:
        parsed = uuid.UUID(str(value))
        return str(parsed) if parsed.int else None
    except (ValueError, AttributeError, TypeError):
        return None


def json_text(value):
    import json
    return json.dumps(value, ensure_ascii=False, sort_keys=True, default=str, separators=(',', ':'))


def verify_sites(path, version):
    import json, re
    if not path:
        raise ValueError('跨 github_pages / campus_server 主分析需要 --site-equivalence-manifest；尚未部署校园站不能假定等价')
    receipt = json.loads(path.read_text())
    pair = [receipt['deployments'][site] for site in ('github_pages', 'campus_server')]
    expected = set(('formal-time-color-v2.svg', 'formal-category-color-v2.svg', 'rittenhouse-formal-dataset-v2.json', 'formal-task-pool-v5.json', 'formal-task-generator-v5.js'))
    for record in pair:
        if record.get('questionnaire_version') != version or not record.get('verified') or not re.fullmatch('[0-9a-f]{40}', record.get('commit', '')):
            raise ValueError('站点等价证明缺少经核验的版本/commit')
        if set(record.get('assets', {})) != expected or any(not re.fullmatch('[0-9a-f]{64}', v) for v in record['assets'].values()):
            raise ValueError('站点等价证明缺少五项 SHA')
    if pair[0]['commit'] != pair[1]['commit'] or pair[0]['assets'] != pair[1]['assets']:
        raise ValueError('两站 commit / SHA 不一致，禁止跨站主分析')
    return receipt


def main():
    import json
    parser = argparse.ArgumentParser(description='只读导入四表 XLSX，完整归档与同版主分析分离；不修改原件。')
    parser.add_argument('directory', type=Path)
    parser.add_argument('--manifest', type=Path, help='JSON {files:[{path,source_site}]}，相对路径相对于 manifest')
    parser.add_argument('--analysis-version', default='questionnaire-v1.1.1', choices=VERSIONS)
    parser.add_argument('--analysis-sites', nargs='+', choices=SITES, default=['github_pages'])
    parser.add_argument('--site-equivalence-manifest', type=Path)
    parser.add_argument('--output-dir', type=Path)
    args = parser.parse_args()
    directory = args.directory.expanduser().resolve()
    output = (args.output_dir or directory / 'merged').expanduser().resolve()
    if {'github_pages', 'campus_server'}.issubset(args.analysis_sites):
        verify_sites(args.site_equivalence_manifest, args.analysis_version)
    if args.manifest:
        manifest = json.loads(args.manifest.read_text())
        inputs = []
        seen_paths = set()
        for row in manifest['files']:
            path = Path(row['path']).expanduser()
            path = (args.manifest.parent / path).resolve() if not path.is_absolute() else path.resolve()
            site = row.get('source_site', 'unknown_legacy')
            if site not in SITES or path in seen_paths:
                raise ValueError('manifest 站点不合法或同一路径重复；请修正导入清单')
            seen_paths.add(path)
            inputs.append((path, site))
    else:
        inputs = []
        for path in sorted(directory.rglob('*.xlsx')):
            if output in path.parents or path.name.startswith(('~$', 'survey-master_', 'archive_', 'primary_')):
                continue
            matches = {DIRECTORY_SITES[p] for p in path.relative_to(directory).parts[:-1] if p in DIRECTORY_SITES}
            if len(matches) > 1:
                raise ValueError('嵌套来源目录冲突：' + str(path))
            inputs.append((path.resolve(), next(iter(matches), 'unknown_legacy')))
    if not inputs:
        raise ValueError('没有输入 XLSX')
    quality, exports = [], []
    def flag(item, issue, detail=''):
        quality.append({'source_path': str(item['path']), 'participant_id': item.get('participant_id', ''), 'questionnaire_version': item.get('version', 'unknown'), 'source_site': item['site'], 'issue': issue, 'detail': str(detail)})
    for path, site in inputs:
        item = {'path': path, 'site': site, 'valid': True, 'status': 'included', 'rows': {}}
        try:
            item['checksum'] = digest(path.read_bytes())
            book = load_workbook(path, read_only=True, data_only=True)
            try:
                for sheet in SHEETS:
                    item['rows'][sheet] = records(book[sheet]) if sheet in book.sheetnames else []
                if any(sheet not in book.sheetnames for sheet in SHEETS):
                    item['valid'] = False
                    flag(item, 'missing_sheet')
            finally:
                book.close()
            people = item['rows'][SHEETS[0]]
            person = people[0] if people else {}
            if len(people) != 1:
                item['valid'] = False
                flag(item, 'participant_row_count', len(people))
            meta = {row.get('字段'): row.get('值') for row in item['rows'][SHEETS[3]]}
            item['person'], item['meta'] = person, meta
            item['version'] = str(person.get('问卷版本') or person.get('questionnaire_version') or meta.get('问卷版本') or 'unknown')
            item['participant_id'] = str(person.get('参与者编号') or person.get('participant_id') or '')
            raw_uuid = person.get('participant_uuid') or meta.get('Participant UUID')
            item['uuid'] = stable_uuid(raw_uuid)
            if not item['uuid']:
                flag(item, 'missing_or_invalid_uuid', '未补写 UUID；使用同版 participant_id 辅助查重')
            if not item['participant_id']:
                flag(item, 'missing_participant_id')
                item['valid'] = False
            for field in ('问卷版本', '刺激版本', '题库版本', '数据集'):
                if person.get(field) and meta.get(field) and person[field] != meta[field]:
                    flag(item, 'metadata_conflict', field)
                    item['valid'] = False
            stimulus = person.get('刺激版本') or meta.get('刺激版本')
            pool = person.get('题库版本') or meta.get('题库版本')
            expected = ('rittenhouse-formal-v1', 'rittenhouse-formal-task-pool-v4') if item['version'] in VERSIONS[:2] else ('rittenhouse-formal-v2', 'rittenhouse-formal-task-pool-v5')
            if item['version'] not in VERSIONS or (stimulus, pool) != expected:
                flag(item, 'version_metadata_mismatch', f"{item['version']} / {stimulus} / {pool}")
                item['valid'] = False
            ids = [row.get('任务') or row.get('task_id') for row in item['rows'][SHEETS[1]]]
            questions = [row.get('题号') or row.get('item_code') for row in item['rows'][SHEETS[2]]]
            if Counter(ids) != Counter(TASKS) or Counter(questions) != Counter(PREVIS):
                flag(item, 'incomplete_or_duplicate_items', f'tasks={ids};PREVis={questions}')
                item['valid'] = False
            if not meta.get('Task Seed'):
                flag(item, 'missing_task_seed')
            for row in item['rows'][SHEETS[1]]:
                for field in ('task_instance_id', '题目', '正确答案', 'active_duration_s'):
                    if row.get(field) in (None, ''):
                        flag(item, 'missing_field', f"{row.get('任务')}:{field}")
                if binary(row.get('是否正确')) is None or task_time(row) is None or task_time(row) < 0:
                    flag(item, 'invalid_task_result', row.get('任务'))
                    item['valid'] = False
            if any(number(row.get('评分')) is None or not 1 <= number(row['评分']) <= 7 for row in item['rows'][SHEETS[2]]):
                flag(item, 'invalid_previs')
                item['valid'] = False
            semantic = {sheet: rows for sheet, rows in item['rows'].items() if sheet != SHEETS[3]}
            semantic[SHEETS[3]] = [row for row in item['rows'][SHEETS[3]] if row.get('字段') != '导出时间']
            item['semantic'] = digest(json_text(semantic).encode())
            item['identity'] = (item['version'], item['uuid'] or item['participant_id'] or str(path))
            exports.append(item)
        except Exception as exc:
            flag(item, 'read_failure', str(exc)[:180])
    groups = defaultdict(list)
    for item in exports:
        groups[item['identity']].append(item)
    # Same UUID + version with different answers is never resolved by timestamp.
    for group in groups.values():
        if len({item['semantic'] for item in group}) > 1:
            for item in group:
                item['status'] = 'conflict_review'
                flag(item, 'conflicting_identity', '同版稳定身份的数据冲突，全部退出统计，等待人工复核')
        elif len({item['site'] for item in group}) > 1:
            for item in group:
                item['status'] = 'source_review'
                flag(item, 'conflicting_source_provenance', '同一答卷多站点归属不明确，不擅自指定站点')
        else:
            for item in group[1:]:
                item['status'] = 'exact_duplicate' if item['checksum'] == group[0]['checksum'] else 'equivalent_reexport'
                flag(item, item['status'], str(group[0]['path']))
    id_groups = defaultdict(list)
    for item in exports:
        if item['participant_id']:
            id_groups[(item['version'], item['participant_id'])].append(item)
    for group in id_groups.values():
        if len({item['identity'] for item in group}) > 1:
            for item in group:
                item['status'] = 'conflict_review'
                flag(item, 'participant_id_collision', '同版 ID 对应不同 UUID，不能证明为同一人，人工复核')
    for item in exports:
        if item['status'] == 'included' and not item['valid']:
            item['status'] = 'invalid_review'
    accepted = [item for item in exports if item['status'] == 'included' and item['valid']]
    primary = [item for item in accepted if item['version'] == args.analysis_version and item['site'] in args.analysis_sites]
    def provenance(item):
        return {'source_path': str(item['path']), 'source_sha256': item['checksum'], 'source_site': item['site'], 'questionnaire_version': item['version'], 'participant_id': item['participant_id'], 'participant_uuid': item['uuid'] or '', 'participant_uuid_raw': item['person'].get('participant_uuid') or item['meta'].get('Participant UUID') or '', 'import_status': item['status']}
    def data_rows(items, sheet):
        return [{**row, **provenance(item), 'source_record_json': json_text(row)} for item in items for row in item['rows'][sheet]]
    def table(wb, name, rows, headers=None):
        headers = headers or list(dict.fromkeys(key for row in rows for key in row)) or ['说明']
        values = [[row.get(key) for key in headers] for row in rows]
        return add_table(wb, name, headers, values, [44 if 'path' in key or key in ('题目', '问题', 'detail') else 26 for key in headers], long_columns=tuple(range(1, len(headers) + 1)), data_height=36)
    stats = []
    for version, site in sorted({(item['version'], item['site']) for item in exports}):
        selected = [item for item in accepted if (item['version'], item['site']) == (version, site)]
        imported = [item for item in exports if (item['version'], item['site']) == (version, site)]
        stats.append({'questionnaire_version': version, 'source_site': site, 'metric': 'sample_count', 'value': len(selected), 'imported_files': len(imported)})
        for task in TASKS:
            rows = [row for item in selected for row in item['rows'][SHEETS[1]] if (row.get('任务') or row.get('task_id')) == task]
            stats.append({'questionnaire_version': version, 'source_site': site, 'metric': task + '_accuracy', 'value': avg([binary(row.get('是否正确')) for row in rows]), 'N': len(rows)})
            stats.append({'questionnaire_version': version, 'source_site': site, 'metric': task + '_time_median_s', 'value': med([task_time(row) for row in rows]), 'N': len(rows)})
        for dim in 'ULR':
            scores = [avg([number(row.get('评分')) for row in item['rows'][SHEETS[2]] if str(row.get('题号', '')).startswith(dim)]) for item in selected]
            stats.append({'questionnaire_version': version, 'source_site': site, 'metric': dim + '_mean', 'value': avg(scores), 'N': len(selected)})
    output.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    archive_path = output / ('archive_' + stamp + '.xlsx')
    primary_path = output / ('primary_' + args.analysis_version + '_' + stamp + '.xlsx')
    wb = Workbook(); wb.remove(wb.active)
    for sheet in SHEETS:
        table(wb, sheet, data_rows(exports, sheet))
    table(wb, '导入追踪', [{**provenance(item), 'identity': '|'.join(item['identity']), 'valid': item['valid']} for item in exports])
    table(wb, '版本站点统计', stats)
    table(wb, '数据质量', quality, ['source_path', 'participant_id', 'questionnaire_version', 'source_site', 'issue', 'detail'])
    wb.save(archive_path)
    mainbook = Workbook(); mainbook.remove(mainbook.active)
    table(mainbook, '分析条件', [{'questionnaire_version': args.analysis_version, 'source_sites': '|'.join(args.analysis_sites), 'N': len(primary), 'limitation': '仅同版；v1.1.0/v1.1.1 说明不等价。两站匿名浏览器不能证明同一人。'}])
    for sheet in SHEETS:
        table(mainbook, sheet, data_rows(primary, sheet))
    table(mainbook, '分层统计', [row for row in stats if row['questionnaire_version'] == args.analysis_version and row['source_site'] in args.analysis_sites])
    primary_stats = []
    for task in TASKS:
        rows = [row for item in primary for row in item['rows'][SHEETS[1]] if (row.get('任务') or row.get('task_id')) == task]
        primary_stats.append({'questionnaire_version': args.analysis_version, 'task': task, 'N': len(rows), 'accuracy': avg([binary(row.get('是否正确')) for row in rows]), 'time_median_s': med([task_time(row) for row in rows])})
    for dim in 'ULR':
        scores = [avg([number(row.get('评分')) for row in item['rows'][SHEETS[2]] if str(row.get('题号', '')).startswith(dim)]) for item in primary]
        primary_stats.append({'questionnaire_version': args.analysis_version, 'dimension': dim, 'N': len(primary), 'mean': avg(scores)})
    table(mainbook, '同版总体统计', primary_stats)
    mainbook.save(primary_path)
    summary = {'analysis_version': args.analysis_version, 'analysis_sites': args.analysis_sites, 'input_files': len(inputs), 'read_exports': len(exports), 'archive_task_rows': sum(len(item['rows'][SHEETS[1]]) for item in exports), 'archive_previs_rows': sum(len(item['rows'][SHEETS[2]]) for item in exports), 'accepted_participants': len(accepted), 'primary_participants': len(primary), 'statuses': dict(Counter(item['status'] for item in exports)), 'version_site_statistics': stats, 'quality': quality, 'archive': str(archive_path), 'primary': str(primary_path), 'originals_modified': False}
    (output / ('summary_' + stamp + '.json')).write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(json.dumps({key: value for key, value in summary.items() if key not in ('quality', 'version_site_statistics')}, ensure_ascii=False))


if __name__ == '__main__':
    main()
