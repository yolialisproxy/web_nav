#!/usr/bin/env python3
"""
分类网站数量统计工具 v2.0
支持九九九九四层级分类法

使用方法:
    python3 tools/count_categories.py data/sites-v2.json
"""

import json
import sys
from collections import Counter

def get_categories(data):
    """提取 categories 数组（支持 v2 格式）"""
    if isinstance(data, dict) and "categories" in data:
        return data.get("categories", [])
    elif isinstance(data, list):
        return data
    return data

def analyze_categories(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    categories = get_categories(data)

    counts = []
    total_sites = 0
    big_category_stats = {}

    for big_cat in categories:
        if not isinstance(big_cat, dict):
            continue
        big_name = big_cat.get('name', 'Unknown')
        big_category_stats[big_name] = {
            'mid_count': 0,
            'minor_count': 0,
            'site_count': 0
        }

        for sub in big_cat.get('subcategories', []):
            if not isinstance(sub, dict):
                continue
            big_category_stats[big_name]['mid_count'] += 1

            # 遍历小类（minor_categories）- 四层级结构
            for minor in sub.get('minor_categories', []):
                if not isinstance(minor, dict):
                    continue
                big_category_stats[big_name]['minor_count'] += 1
                site_count = len(minor.get('sites', []))
                big_category_stats[big_name]['site_count'] += site_count
                total_sites += site_count

                counts.append({
                    'count': site_count,
                    'big': big_name,
                    'mid': sub.get('name', 'Unknown'),
                    'minor': minor.get('name', 'Unknown')
                })

            # 向下兼容：旧格式是中类直接有 sites
            if sub.get('sites') and not sub.get('minor_categories'):
                site_count = len(sub.get('sites', []))
                big_category_stats[big_name]['site_count'] += site_count
                total_sites += site_count
                counts.append({
                    'count': site_count,
                    'big': big_name,
                    'mid': sub.get('name', 'Unknown'),
                    'minor': '默认(旧格式)'
                })

    # 按数量升序排序
    counts.sort(key=lambda x: x['count'])

    print("📊 === 分类网站数量统计 (四层级结构) ===\n")
    print(f"✅ 总网站数量: {total_sites}")
    print(f"✅ 总小类数量: {len(counts)}")
    if counts:
        avg = total_sites / len(counts)
        print(f"✅ 平均每个小类: {avg:.1f} 个网站\n")
    else:
        print("⚠️ 没有找到任何小类或网站\n")

    # 大类统计
    print("📁 === 大类统计 ===")
    for big_name, stats in big_category_stats.items():
        print(f" {big_name}: {stats['mid_count']} 中类, {stats['minor_count']} 小类, {stats['site_count']} 网站")

    print("\n🔴 === 优先填充分类（0个网站） ===")
    empty_count = 0
    for cat in counts:
        if cat['count'] == 0:
            print(f" [ ] {cat['big']} → {cat['mid']} → {cat['minor']}")
            empty_count += 1
    if empty_count == 0:
        print(" 暂无空分类")

    print("\n🟡 === 数量不足分类（1-10个网站） ===")
    low_count = 0
    for cat in counts:
        if 1 <= cat['count'] <= 10:
            print(f" {cat['count']:2d} 个 | {cat['big']} → {cat['mid']} → {cat['minor']}")
            low_count += 1
    if low_count == 0:
        print(" 暂无数量不足的分类")

    print("\n✅ === 合格分类（12+） ===")
    ok_count = sum(1 for c in counts if c['count'] >= 12)
    if counts:
        print(f" 已合格: {ok_count} / {len(counts)} ({ok_count/len(counts)*100:.0f}%)")

    return counts

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使用方法: python count_categories.py <数据文件路径>")
        print("示例: python count_categories.py data/sites-v2.json")
        sys.exit(1)
    analyze_categories(sys.argv[1])