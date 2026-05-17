#!/usr/bin/env python3
"""
网站数据去重工具 v2.0
支持九九九九四层级分类法

使用方法:
    python3 tools/deduplicate_sites.py data/sites-v2.json
"""

import json
from urllib.parse import urlparse
import sys

def get_domain(url):
    """提取域名（去掉www前缀）"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.replace('www.', '')
        return domain
    except:
        return url

def get_categories(data):
    """提取 categories 数组（支持 v2 格式）"""
    if isinstance(data, dict) and "categories" in data:
        return data.get("categories", [])
    elif isinstance(data, list):
        return data
    return data

def deduplicate_data(data):
    """去重整个网站数据库（支持四层级结构）"""
    total_before = 0
    total_after = 0
    duplicates_removed = 0
    duplicates_detail = []

    global_seen_domains = set()
    global_seen_urls = set()

    categories = get_categories(data)

    # 遍历四层结构: 大类 -> 中类 -> 小类 -> 网站
    for big_cat in categories:
        if not isinstance(big_cat, dict):
            continue

        for sub in big_cat.get('subcategories', []):
            if not isinstance(sub, dict):
                continue

            # 遍历小类（minor_categories）- 四层级结构
            for minor in sub.get('minor_categories', []):
                if not isinstance(minor, dict):
                    continue

                sites = minor.get('sites', [])
                if not isinstance(sites, list):
                    continue

                count_before = len(sites)
                total_before += count_before

                unique_sites = []

                for site in sites:
                    url = site.get('url', '').strip().lower()
                    if not url:
                        continue

                    domain = get_domain(url)

                    if url in global_seen_urls:
                        duplicates_removed += 1
                        duplicates_detail.append(f"重复URL: {site.get('name', 'Unknown')} - {url}")
                        continue

                    if domain in global_seen_domains:
                        duplicates_removed += 1
                        duplicates_detail.append(f"重复域名: {site.get('name', 'Unknown')} - {domain}")
                        continue

                    global_seen_urls.add(url)
                    global_seen_domains.add(domain)
                    unique_sites.append(site)

                minor['sites'] = unique_sites
                total_after += len(unique_sites)

            # 向下兼容：旧格式是中类直接有 sites
            if sub.get('sites') and not sub.get('minor_categories'):
                sites = sub.get('sites', [])
                count_before = len(sites)
                total_before += count_before

                unique_sites = []

                for site in sites:
                    url = site.get('url', '').strip().lower()
                    if not url:
                        continue

                    domain = get_domain(url)

                    if url in global_seen_urls:
                        duplicates_removed += 1
                        duplicates_detail.append(f"重复URL(旧格式): {site.get('name', 'Unknown')} - {url}")
                        continue

                    if domain in global_seen_domains:
                        duplicates_removed += 1
                        duplicates_detail.append(f"重复域名(旧格式): {site.get('name', 'Unknown')} - {domain}")
                        continue

                    global_seen_urls.add(url)
                    global_seen_domains.add(domain)
                    unique_sites.append(site)

                sub['sites'] = unique_sites
                total_after += len(unique_sites)

    return {
        'total_before': total_before,
        'total_after': total_after,
        'duplicates_removed': duplicates_removed,
        'duplicates': duplicates_detail,
        'data': data
    }

def main():
    if len(sys.argv) < 2:
        print("使用方法: python deduplicate_sites.py <数据文件路径>")
        print("示例: python deduplicate_sites.py data/sites-v2.json")
        sys.exit(1)

    file_path = sys.argv[1]

    print(f"正在处理: {file_path}")
    print("=" * 60)

    # 读取数据
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 执行去重
    result = deduplicate_data(data)

    print(f"✅ 处理完成（四层级结构）！")
    print(f" 处理前网站数量: {result['total_before']}")
    print(f" 处理后网站数量: {result['total_after']}")
    print(f" 移除重复项: {result['duplicates_removed']}")
    print("=" * 60)

    if result['duplicates_removed'] > 0:
        print("\n📋 移除的重复项（前20项）:")
        for i, d in enumerate(result['duplicates'][:20]):
            print(f" - {d}")
        if len(result['duplicates']) > 20:
            print(f" ... 还有 {len(result['duplicates']) - 20} 项")

        # 保存去重后的数据
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(result['data'], f, ensure_ascii=False, indent=2)

        print(f"\n💾 已保存去重后的数据到 {file_path}")

    else:
        print("\n✅ 没有发现重复项")

if __name__ == "__main__":
    main()