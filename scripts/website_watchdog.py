#!/usr/bin/env python3
"""
网站看门狗脚本 - 感知系统基础版本
功能：读取网站数据库，提供比较框架，为自动发现缺失链接做准备
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Set, Tuple


def load_website_data() -> Dict:
    """加载网站数据库"""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'websites.json')
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"错误：找不到数据文件 {data_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"错误：JSON文件格式无效 - {e}")
        sys.exit(1)


def extract_all_urls(data: Dict) -> Set[str]:
    """从数据库中提取所有URL"""
    urls = set()

    for big_category, big_category_data in data.items():
        if isinstance(big_category_data, dict) and 'subcategories' in big_category_data:
            for subcategory in big_category_data['subcategories']:
                if isinstance(subcategory, dict) and 'minor_categories' in subcategory:
                    for minor_category in subcategory['minor_categories']:
                        if isinstance(minor_category, dict) and 'sites' in minor_category:
                            for site in minor_category['sites']:
                                if isinstance(site, dict) and 'url' in site:
                                    urls.add(site['url'].strip().lower())

    return urls


def get_website_stats(data: Dict) -> Dict:
    """获取网站数据库统计信息"""
    stats = {
        'total_big_categories': 0,
        'total_subcategories': 0,
        'total_minor_categories': 0,
        'total_sites': 0
    }

    for big_category, big_category_data in data.items():
        stats['total_big_categories'] += 1
        if isinstance(big_category_data, dict) and 'subcategories' in big_category_data:
            stats['total_subcategories'] += len(big_category_data['subcategories'])
            for subcategory in big_category_data['subcategories']:
                if isinstance(subcategory, dict) and 'minor_categories' in subcategory:
                    stats['total_minor_categories'] += len(subcategory['minor_categories'])
                    for minor_category in subcategory['minor_categories']:
                        if isinstance(minor_category, dict) and 'sites' in minor_category:
                            stats['total_sites'] += len(minor_category['sites'])

    return stats


def save_discovered_urls(new_urls: Set[str], source_name: str = "external_source"):
    """
    保存发现的新URL到文件，供进化系统处理
    这是连接感知系统和进化系统的桥梁
    """
    if not new_urls:
        print("未发现新URL")
        return

    # 创建发现记录目录
    discoveries_dir = os.path.join(os.path.dirname(__file__), '..', 'discoveries')
    os.makedirs(discoveries_dir, exist_ok=True)

    # 按日期保存发现记录
    date_str = datetime.now().strftime("%Y-%m-%d")
    discovery_file = os.path.join(discoveries_dir, f"{source_name}_{date_str}.json")

    discovery_data = {
        "timestamp": datetime.now().isoformat(),
        "source": source_name,
        "new_urls": list(new_urls),
        "count": len(new_urls)
    }

    try:
        with open(discovery_file, 'w', encoding='utf-8') as f:
            json.dump(discovery_data, f, ensure_ascii=False, indent=2)
        print(f"发现 {len(new_urls)} 个新URL，已保存到 {discovery_file}")

        # 同时创建一个最新发现的软链接或副本，便于进化系统处理
        latest_file = os.path.join(discoveries_dir, "latest_discovery.json")
        with open(latest_file, 'w', encoding='utf-8') as f:
            json.dump(discovery_data, f, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"保存发现结果时出错: {e}")


def load_previous_discoveries() -> Set[str]:
    """加载以前的发现结果，避免重复处理"""
    discoveries_dir = os.path.join(os.path.dirname(__file__), '..', 'discoveries')
    if not os.path.exists(discoveries_dir):
        return set()

    all_previous_urls = set()
    try:
        for filename in os.listdir(discoveries_dir):
            if filename.endswith('.json') and filename != 'latest_discovery.json':
                filepath = os.path.join(discoveries_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'new_urls' in data:
                        all_previous_urls.update(url.lower().strip() for url in data['new_urls'])
    except Exception as e:
        print(f"加载以前发现结果时出错: {e}")

    return all_previous_urls


def simulate_competitor_analysis():
    """
    模拟竞品分析功能（实际使用时应替换为真实的firecrawl爬取）
    这个函数展示了如何集成外部数据源
    """
    print("=== 网站看门狗 - 感知系统 ===")
    print("当前模式：模拟竞品分析")
    print("在实际部署中，此处应集成firecrawl或其他爬虫工具")
    print()

    # 加载当前数据库
    print("正在加载网站数据库...")
    data = load_website_data()
    current_urls = extract_all_urls(data)
    stats = get_website_stats(data)

    print(f"当前数据库统计:")
    print(f"  - 大类别: {stats['total_big_categories']}")
    print(f"  - 中类别: {stats['total_subcategories']}")
    print(f"  - 小类别: {stats['total_minor_categories']}")
    print(f"  - 网站总数: {stats['total_sites']}")
    print()

    # 这里应该是调用firecrawl爬取竞品站点的位置
    # 由于无法直接使用firecrawl，我们提供一个示例数据结构
    print("正在分析竞品导航站点...")
    print("[模拟] 竞品分析完成")
    print()

    # 为了演示，让我们创建一些示例的"新发现"URL
    # 在实际使用中，这些应该来自真实的爬取结果
    example_new_urls = {
        "https://example-ai-tool.com",
        "https://another-cool-site.org",
        "https://yet-another-resource.net"
    }

    # 过滤掉已经存在的URL
    truly_new_urls = {url for url in example_new_urls
                     if url.lower().strip() not in current_urls}

    if truly_new_urls:
        print(f"发现 {len(truly_new_urls)} 个潜在新链接:")
        for url in sorted(truly_new_urls):
            print(f"  - {url}")
        print()

        # 保存发现结果供进化系统使用
        save_discovered_urls(truly_new_urls, "competitor_analysis")

        # 显示如何继续处理
        print("后续步骤（进化系统）:")
        print("1. 检查 discoveries/latest_discovery.json 获取新URL")
        print("2. 为每个URL使用AI生成简介和寻找配图")
        print("3. 自动将新网站添加到适当的分类中")
        print("4. 提交代码更改")
    else:
        print("未发现新链接（在模拟数据中）")

        # 仍然显示以前的发现作为示例
        previous = load_previous_discoveries()
        if previous:
            print(f"提示：系统中还有 {len(previous)} 个以前的发现待处理")
            print("  文件位置：discoveries/ 目录")


def main():
    """主函数"""
    try:
        simulate_competitor_analysis()
    except KeyboardInterrupt:
        print("\n用户中断操作")
    except Exception as e:
        print(f"发生未预期的错误: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())