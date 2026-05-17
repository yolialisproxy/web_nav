#!/usr/bin/env python3
"""
CSS文件合并脚本
自动合并多个CSS文件以减少HTTP请求数量，提升加载性能
"""

import os
import sys
from pathlib import Path


def merge_css_files():
    """合并所有CSS文件为一个文件"""
    css_dir = Path("/home/yoli/GitHub/web_nav/assets/css")
    css_files = sorted([f for f in css_dir.glob("*.css") if f.name != "merged.css"])  # 排除已合并的文件

    if len(css_files) <= 1:
        print("CSS文件数量已为1个或以下（不含merged.css），无需合并")
        return False

    print(f"发现 {len(css_files)} 个CSS文件:")
    for css_file in css_files:
        size = css_file.stat().st_size
        print(f"  - {css_file.name}: {size // 1024}KB")

    # 定义合并顺序（保持依赖关系）
    # 通常主样式先，然后是主题，最后是组件（或者按实际依赖调整）
    preferred_order = ['main.css', 'themes.css', 'components.css']
    ordered_files = []

    # 首先按偏好顺序添加存在的文件
    for preferred in preferred_order:
        for css_file in css_files:
            if css_file.name == preferred and css_file not in ordered_files:
                ordered_files.append(css_file)

    # 添加剩余的文件
    for css_file in css_files:
        if css_file not in ordered_files:
            ordered_files.append(css_file)

    print(f"\n合并顺序:")
    for i, css_file in enumerate(ordered_files, 1):
        print(f"  {i}. {css_file.name}")

    # 读取并合并所有CSS内容
    merged_content = []
    merged_content.append(f"/* 合并的CSS文件 - 自动生成 */")
    merged_content.append(f"/* 原始文件数量: {len(css_files)} */")
    merged_content.append(f"/* 合并时间: {__import__('datetime').datetime.now().isoformat()} */")
    merged_content.append("")

    total_size = 0
    for css_file in ordered_files:
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                content = f.read()
                merged_content.append(f"/* ==== 开始: {css_file.name} ==== */")
                merged_content.append(content)
                merged_content.append(f"/* ==== 结束: {css_file.name} ==== */")
                merged_content.append("")
                total_size += len(content.encode('utf-8'))
        except Exception as e:
            print(f"读取文件 {css_file.name} 时出错: {e}")
            return False

    # 定义输出文件
    output_file = css_dir / "merged.css"
    backup_suffix = f"_{__import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')}"

    # 备份原始文件（可选）
    print(f"\n正在备份原始CSS文件...")
    backup_dir = css_dir / "backup"
    backup_dir.mkdir(exist_ok=True)

    for css_file in css_files:
        backup_file = backup_dir / f"{css_file.stem}{backup_suffix}{css_file.suffix}"
        try:
            with open(css_file, 'r', encoding='utf-8') as src:
                with open(backup_file, 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
            print(f"  已备份: {css_file.name} -> {backup_file.name}")
        except Exception as e:
            print(f"备份文件 {css_file.name} 时出错: {e}")

    # 写入合并后的文件
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(merged_content))
        print(f"\n成功创建合并文件: {output_file.name}")
        print(f"合并后文件大小: {total_size // 1024}KB")
        print(f"节省的HTTP请求: {len(css_files) - 1} 个")
        return True
    except Exception as e:
        print(f"写入合并文件时出错: {e}")
        return False


def update_html_references():
    """更新HTML文件中引用的CSS文件"""
    html_files = [
        Path("/home/yoli/GitHub/web_nav/index.html"),
        Path("/home/yoli/GitHub/web_nav/admin.html"),
        Path("/home/yoli/GitHub/web_nav/admin-business.html"),
        Path("/home/yoli/GitHub/web_nav/translate.html")
    ]

    updated_count = 0
    for html_file in html_files:
        if not html_file.exists():
            continue

        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 定义要查找和替换的CSS引用块（支持两种路径格式和不同的缩进）
            # 注意：保持原始的缩进和换行格式
            old_block1 = '''    <link rel="stylesheet" href="assets/css/main.css" />
    <link rel="stylesheet" href="assets/css/themes.css" />
    <link rel="stylesheet" href="assets/css/components.css" />'''

            old_block2 = '''    <link rel="stylesheet" href="./assets/css/main.css"/>
    <link rel="stylesheet" href="./assets/css/themes.css"/>
    <link rel="stylesheet" href="./assets/css/components.css"/>'''

            old_block3 = '''<link rel="stylesheet" href="assets/css/main.css" />
<link rel="stylesheet" href="assets/css/themes.css" />
<link rel="stylesheet" href="assets/css/components.css" />'''

            old_block4 = '''<link rel="stylesheet" href="./assets/css/main.css"/>
<link rel="stylesheet" href="./assets/css/themes.css"/>
<link rel="stylesheet" href="./assets/css/components.css"/>'''

            # 新的合并引用（使用与原文件相同的路径格式）
            if './assets/css/' in content:
                new_block = '''<link rel="stylesheet" href="./assets/css/merged.css"/>'''
            else:
                new_block = '''<link rel="stylesheet" href="assets/css/merged.css" />'''

            modified_content = content
            # 尝试替换各种格式
            if old_block1 in content:
                modified_content = content.replace(old_block1, new_block, 1)
                print(f"    使用格式1替换 (4空格缩进)")
            elif old_block2 in content:
                modified_content = content.replace(old_block2, new_block, 1)
                print(f"    使用格式2替换 (4空格缩进 + ./)")
            elif old_block3 in content:
                modified_content = content.replace(old_block3, new_block, 1)
                print(f"    使用格式3替换 (无缩进)")
            elif old_block4 in content:
                modified_content = content.replace(old_block4, new_block, 1)
                print(f"    使用格式4替换 (无缩进 + ./)")

            # 如果有修改，写回文件
            if modified_content != content:
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                updated_count += 1
                print(f"  已更新: {html_file.name}")
                print(f"    替换了3个CSS引用为1个合并引用")

        except Exception as e:
            print(f"处理文件 {html_file.name} 时出错: {e}")

    return updated_count > 0


def main():
    """主函数"""
    print("=== CSS文件合并工具 ===")
    print("此脚本将合并多个CSS文件以减少HTTP请求，提升加载性能")
    print()

    # 执行CSS合并
    if not merge_css_files():
        print("CSS合并失败")
        return 1

    print()
    print("正在更新HTML引用...")
    if update_html_references():
        print("HTML引用更新完成")
    else:
        print("警告: 未找到需要更新的HTML文件或更新过程中遇到问题")

    print()
    print("=== 后续步骤 ===")
    print("1. 手动验证网站功能和外观是否正常")
    print("2. 如果一切正常，可以考虑删除原始CSS文件或保留作为备份")
    print("3. 运行性能基线测试查看改进效果:")
    print("   python3 scripts/performance_baseline.py")
    print("4. 根据测试结果决定是否需要进一步优化")

    return 0


if __name__ == "__main__":
    sys.exit(main())