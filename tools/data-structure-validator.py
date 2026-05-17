#!/usr/bin/env python3
"""
网站数据结构验证器 v1.0
啃魂导航 - 九九九九四层级分类法强制验证工具

功能：
1. 验证数据文件严格遵循四层结构：大类 → 中类 → 小类 → 网站
2. 检测结构违规：禁止任何层级直接跳过下一级
3. 检测命名异常：发现叠词、重复名称等
4. 强制执行 STRUCTURE_ENFORCEMENT.md 的所有铁律

使用方式：
    python3 tools/data-structure-validator.py data/sites-v2.json
    python3 tools/data-structure-validator.py data/sites-v2.json --fix  # 自动修复可修复的问题
"""

import json
import sys
import os
from pathlib import Path

# 目标数据结构版本
TARGET_VERSION = "4-level"
LAYER_NAMES = ["大类", "中类", "小类", "网站"]

# 异常检测模式
REDUNDANT_NAME_PATTERNS = [
    "工具工具", "平台平台", "教程教程", "资源资源",
    "代码代码", "图片图片", "图标图标", "视频视频",
    "音乐音乐", "游戏游戏", "文档文档", "网站网站",
    "内容内容", "系统系统", "服务服务", "应用应用"
]

# 允许的分类名称（用于检测假分类）
ALLOWED_CATEGORY_NAMES = [
    "AI智能", "视频娱乐", "阅读写作", "资源素材",
    "开发资源", "创意工具", "办公效率", "学术科研", "视频创作"
]


class StructureValidator:
    def __init__(self, file_path, dry_run=True):
        self.file_path = file_path
        self.dry_run = dry_run
        self.errors = []
        self.warnings = []
        self.stats = {
            "big_categories": 0,
            "mid_categories": 0,
            "minor_categories": 0,
            "sites": 0,
            "structure_violations": 0,
            "name_anomalies": 0
        }
        self.fixed_count = 0

    def validate(self):
        """执行完整验证"""
        print(f"🔍 开始验证: {self.file_path}")
        print("=" * 60)

        # 1. 加载数据
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            self.errors.append(f"JSON 解析失败: {e}")
            return False
        except FileNotFoundError:
            self.errors.append(f"文件不存在: {self.file_path}")
            return False

        # 2. 提取 categories
        if isinstance(data, dict) and "categories" in data:
            categories = data.get("categories", [])
        elif isinstance(data, list):
            categories = data
        else:
            categories = data

        if not isinstance(categories, list):
            self.errors.append(f"categories 不是列表类型: {type(categories)}")
            return False

        # 3. 逐层验证
        for i, big_cat in enumerate(categories):
            if not isinstance(big_cat, dict):
                self.errors.append(f"大类 #{i+1} 不是对象类型")
                continue

            big_name = big_cat.get('name', f'未命名大类#{i+1}')
            self.stats["big_categories"] += 1

            # 检查是否在大类层直接有 sites（违规！）
            if 'sites' in big_cat:
                self.errors.append(
                    f"❌ 违规：[{big_name}] 大类层直接包含 sites，"
                    f"必须通过 中类→小类 层级"
                )
                self.stats["structure_violations"] += 1

            subcats = big_cat.get('subcategories', [])
            if not isinstance(subcats, list):
                self.errors.append(f"大类 [{big_name}] 的 subcategories 不是列表")
                continue

            if len(subcats) == 0:
                self.warnings.append(f"⚠️ 大类 [{big_name}] 没有中类")

            for j, subcat in enumerate(subcats):
                if not isinstance(subcat, dict):
                    self.errors.append(f"中类 #{j+1} in [{big_name}] 不是对象类型")
                    continue

                sub_name = subcat.get('name', f'未命名中类#{j+1}')
                self.stats["mid_categories"] += 1

                # 检查是否在中类层直接有 sites（违规！）
                if 'sites' in subcat and 'minor_categories' not in subcat:
                    self.errors.append(
                        f"❌ 违规：[{big_name}]→[{sub_name}] 中类层直接包含 sites，"
                        f"缺少小类(minor_categories)层级"
                    )
                    self.stats["structure_violations"] += 1

                # 检测叠词
                for pattern in REDUNDANT_NAME_PATTERNS:
                    if sub_name == pattern or sub_name.endswith(pattern):
                        self.warnings.append(
                            f"⚠️ 异常名称：[{big_name}]→[{sub_name}] 疑似叠词"
                        )
                        self.stats["name_anomalies"] += 1

                # 检测中文标点（可能导致 JS 解析错误）
                chinese_punct = '。，、；：？！""''【】『』（）'
                for ch in chinese_punct:
                    if ch in sub_name:
                        self.warnings.append(
                            f"⚠️ 中类名称 [{sub_name}] 包含中文标点 '{ch}'，可能导致 JS 解析错误"
                        )
                        self.stats["name_anomalies"] += 1

                minors = subcat.get('minor_categories', [])
                if not isinstance(minors, list):
                    self.errors.append(
                        f"中类 [{sub_name}] 的 minor_categories 不是列表"
                    )
                    continue

                if len(minors) == 0:
                    self.warnings.append(
                        f"⚠️ 中类 [{big_name}]→[{sub_name}] 没有小类"
                    )

                for k, minor in enumerate(minors):
                    if not isinstance(minor, dict):
                        self.errors.append(
                            f"小类 #{k+1} in [{sub_name}] 不是对象类型"
                        )
                        continue

                    minor_name = minor.get('name', f'未命名小类#{k+1}')
                    self.stats["minor_categories"] += 1

                    sites = minor.get('sites', [])
                    if not isinstance(sites, list):
                        self.errors.append(
                            f"小类 [{minor_name}] 的 sites 不是列表"
                        )
                        continue

                    self.stats["sites"] += len(sites)

                    # 检测叠词（小类名）
                    for pattern in REDUNDANT_NAME_PATTERNS:
                        if minor_name == pattern or minor_name.endswith(pattern):
                            self.warnings.append(
                                f"⚠️ 异常名称：[{big_name}]→[{sub_name}]→[{minor_name}] 疑似叠词"
                            )
                            self.stats["name_anomalies"] += 1

        return len(self.errors) == 0

    def fix(self):
        """自动修复可修复的问题"""
        print(f"\n🔧 开始修复: {self.file_path}")
        print("=" * 60)

        # 1. 加载数据
        with open(self.file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        if isinstance(data, dict) and "categories" in data:
            categories = data.get("categories", [])
        else:
            categories = data

        fixed_count = 0

        for big_cat in categories:
            if not isinstance(big_cat, dict):
                continue

            big_name = big_cat.get('name', 'Unknown')

            # 修复1：将大类层的 sites 下沉到小类
            if 'sites' in big_cat:
                sites = big_cat.pop('sites', [])
                if sites:
                    subcats = big_cat.setdefault('subcategories', [])
                    # 获取或创建默认中类
                    default_sub = None
                    for sub in subcats:
                        if sub.get('name') == '其他':
                            default_sub = sub
                            break
                    if not default_sub:
                        default_sub = {
                            'id': 'other',
                            'name': '其他',
                            'minor_categories': []
                        }
                        subcats.append(default_sub)

                    # 获取或创建默认小类
                    minors = default_sub.setdefault('minor_categories', [])
                    default_minor = None
                    for m in minors:
                        if m.get('name') == '默认':
                            default_minor = m
                            break
                    if not default_minor:
                        default_minor = {
                            'id': 'default',
                            'name': '默认',
                            'sites': []
                        }
                        minors.append(default_minor)

                    default_minor['sites'].extend(sites)
                    fixed_count += 1
                    print(f"  ✅ [{big_name}] 大类层 sites 已下沉到小类 ({len(sites)} 个网站)")

            subcats = big_cat.get('subcategories', [])
            for subcat in subcats:
                if not isinstance(subcat, dict):
                    continue

                sub_name = subcat.get('name', 'Unknown')

                # 修复2：将中类层的 sites 下沉到小类（如果缺少 minor_categories）
                if 'sites' in subcat and 'minor_categories' not in subcat:
                    sites = subcat.pop('sites', [])
                    if sites:
                        minors = subcat.setdefault('minor_categories', [{
                            'id': 'default',
                            'name': f'{sub_name}-精选',
                            'sites': sites
                        }])
                        if isinstance(minors, list) and len(minors) > 0:
                            minors[0]['sites'] = sites
                        fixed_count += 1
                        print(f"  ✅ [{big_name}]→[{sub_name}] 中类层 sites 已下沉到小类 ({len(sites)} 个网站)")

                # 修复3：清理叠词名称
                for pattern in REDUNDANT_NAME_PATTERNS:
                    if sub_name == pattern:
                        # 推断正确的名称
                        name_map = {
                            '工具工具': '相关工具',
                            '平台平台': '综合平台',
                            '教程教程': '学习教程',
                            '资源资源': '综合资源'
                        }
                        new_name = name_map.get(pattern, pattern.replace('工具', ''))
                        subcat['name'] = new_name
                        fixed_count += 1
                        print(f"  ✅ [{big_name}]→[{pattern}] 已重命名为 [{new_name}]")

                minors = subcat.get('minor_categories', [])
                for minor in minors:
                    if not isinstance(minor, dict):
                        continue

                    minor_name = minor.get('name', 'Unknown')

                    # 修复4：清理小类叠词
                    for pattern in REDUNDANT_NAME_PATTERNS:
                        if minor_name == pattern:
                            name_map = {
                                '工具工具': '相关工具',
                                '平台平台': '综合平台',
                                '教程教程': '学习教程',
                                '资源资源': '综合资源'
                            }
                            new_name = name_map.get(pattern, pattern[:-2])
                            minor['name'] = new_name
                            fixed_count += 1
                            print(f"  ✅ [{big_name}]→[{sub_name}]→[{pattern}] 已重命名为 [{new_name}]")

        # 保存修复后的数据
        if not self.dry_run and fixed_count > 0:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\n💾 已保存修复后的数据到 {self.file_path}")

        print(f"\n✅ 修复完成！共修复 {fixed_count} 个问题")
        self.fixed_count = fixed_count
        return fixed_count

    def report(self):
        """输出验证报告"""
        print("\n📊 === 结构验证报告 ===")
        print(f"文件: {self.file_path}")
        print(f"大类: {self.stats['big_categories']}")
        print(f"中类: {self.stats['mid_categories']}")
        print(f"小类: {self.stats['minor_categories']}")
        print(f"网站: {self.stats['sites']}")
        print(f"结构违规: {self.stats['structure_violations']}")
        print(f"命名异常: {self.stats['name_anomalies']}")

        if self.errors:
            print(f"\n❌ 错误 ({len(self.errors)} 项)：")
            for err in self.errors:
                print(f"  - {err}")

        if self.warnings:
            print(f"\n⚠️ 警告 ({len(self.warnings)} 项)：")
            for warn in self.warnings:
                print(f"  - {warn}")

        if not self.errors and not self.warnings:
            print("\n✅ 验证通过！数据结构完全符合规范。")

        return len(self.errors) == 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    file_path = sys.argv[1]
    dry_run = "--fix" not in sys.argv

    validator = StructureValidator(file_path, dry_run=dry_run)
    is_valid = validator.validate()
    validator.report()

    if not is_valid and "--fix" in sys.argv:
        print("\n" + "=" * 60)
        # 重新执行修复
        validator2 = StructureValidator(file_path, dry_run=False)
        validator2.fix()

    # 返回适当的退出码
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()