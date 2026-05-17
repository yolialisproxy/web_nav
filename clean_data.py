#!/usr/bin/env python3
import json
from urllib.parse import urlparse

def normalize_url(url):
    """标准化URL用于去重"""
    if not url:
        return url
    parsed = urlparse(url)
    # 移除www前缀、末尾斜杠，统一小写
    netloc = parsed.netloc.replace('www.', '').lower()
    path = parsed.path.rstrip('/')
    return f"{parsed.scheme}://{netloc}{path}"

def is_spam_site(site):
    """检测是否为垃圾站点/搜索引擎结果页"""
    url = site.get('url', '').lower()
    name = site.get('name', '').lower()
    desc = site.get('description', '').lower()

    spam_patterns = [
        'google.com/search',
        'baidu.com/s',
        'bing.com/search',
        'sogou.com/web',
        'so.com/s',
        'yahoo.com/search',
        'yandex.com/search',
        'duckduckgo.com/?q',
        'search?q=',
        '/search?',
    ]

    for pattern in spam_patterns:
        if pattern in url:
            return True
    return False

def main():
    input_path = '/home/yoli/GitHub/web_nav/data/websites_final_cleaned.json'
    output_path = '/home/yoli/GitHub/web_nav/data/websites_final_cleaned_final.json'

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_before = 0
    total_after = 0
    removed_duplicates = 0
    removed_empty = 0
    removed_spam = 0

    seen_urls = set()

    # 遍历所有分类
    for category_name, category_data in data.items():
        if 'subcategories' not in category_data:
            continue

        for subcat in category_data['subcategories']:
            if 'sites' not in subcat:
                continue

            original_count = len(subcat['sites'])
            total_before += original_count

            cleaned_sites = []
            for site in subcat['sites']:
                # 检查空标题
                if not site.get('name') or not site.get('name').strip():
                    removed_empty += 1
                    continue

                # 检查垃圾站点
                if is_spam_site(site):
                    removed_spam += 1
                    continue

                # 检查重复URL
                norm_url = normalize_url(site['url'])
                if norm_url in seen_urls:
                    removed_duplicates += 1
                    continue

                seen_urls.add(norm_url)
                cleaned_sites.append(site)

            subcat['sites'] = cleaned_sites
            total_after += len(cleaned_sites)

    # 保存清洗后的数据
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("✅ 数据清洗完成")
    print("="*40)
    print(f"原始站点总数: {total_before}")
    print(f"清洗后总数: {total_after}")
    print(f"移除重复URL: {removed_duplicates}")
    print(f"移除空标题站点: {removed_empty}")
    print(f"移除垃圾/搜索结果站点: {removed_spam}")
    print("="*40)
    print(f"最终有效站点: {total_after}")
    print(f"\n输出文件已保存: {output_path}")

if __name__ == "__main__":
    main()
