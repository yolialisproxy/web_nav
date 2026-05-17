#!/usr/bin/env python3
"""
网站性能审计和优化脚本
设计为被cron定时调用，每小时执行一次性能检查
"""

import os
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def analyze_css_resources():
    """分析CSS资源情况"""
    css_dir = Path("/home/yoli/GitHub/web_nav/assets/css")
    css_files = list(css_dir.glob("*.css"))

    total_size = 0
    file_details = []

    for css_file in css_files:
        size = css_file.stat().st_size
        lines = sum(1 for _ in open(css_file, 'r', encoding='utf-8'))
        total_size += size
        file_details.append({
            'name': css_file.name,
            'size_kb': round(size / 1024, 1),
            'lines': lines
        })

    return {
        'count': len(css_files),
        'total_size_kb': round(total_size / 1024, 1),
        'files': file_details
    }


def analyze_js_resources():
    """分析JavaScript资源情况"""
    js_dirs = [
        Path("/home/yoli/GitHub/web_nav/assets/js/core"),
        Path("/home/yoli/GitHub/web_nav/assets/js/intelligence"),
        Path("/home/yoli/GitHub/web_nav/assets/js/utils")
    ]

    js_files = []
    for js_dir in js_dirs:
        if js_dir.exists():
            js_files.extend(js_dir.glob("*.js"))

    # 排除备份文件
    js_files = [f for f in js_files if not f.name.endswith('.bak.js') and not '.backup.' in f.name]

    total_size = 0
    file_details = []

    for js_file in js_files:
        size = js_file.stat().st_size
        lines = sum(1 for _ in open(js_file, 'r', encoding='utf-8'))
        total_size += size
        file_details.append({
            'name': str(js_file.relative_to(Path("/home/yoli/GitHub/web_nav/assets/js"))),
            'size_kb': round(size / 1024, 1),
            'lines': lines
        })

    return {
        'count': len(js_files),
        'total_size_kb': round(total_size / 1024, 1),
        'files': file_details
    }


def check_optimization_opportunities():
    """检查可用的优化机会"""
    opportunities = []

    # 检查CSS合并机会
    css_analysis = analyze_css_resources()
    if css_analysis['count'] > 1:
        opportunities.append({
            'type': 'css_merging',
            'description': f"发现{css_analysis['count']}个CSS文件，建议合并以减少HTTP请求",
            'current_state': f"{css_analysis['count']} files, {css_analysis['total_size_kb']}KB total",
            'suggested_action': "合并main.css、themes.css、components.css为单一文件",
            'impact': 'medium'
        })

    # 检查JS文件数量
    js_analysis = analyze_js_resources()
    if js_analysis['count'] > 8:  # 认为超过8个文件可能需要合并
        opportunities.append({
            'type': 'js_optimization',
            'description': f"发现{js_analysis['count']}个JS文件，考虑合并减少请求次数",
            'current_state': f"{js_analysis['count']} files, {js_analysis['total_size_kb']}KB total",
            'suggested_action': "评估核心管理器脚本的合并可能性",
            'impact': 'medium'
        })

    # 检查是否有未压缩的文件（简单检查）
    # 实际项目中应使用更专业的工具
    return opportunities


def generate_performance_report():
    """生成性能审计报告"""
    timestamp = datetime.now().isoformat()

    css_analysis = analyze_css_resources()
    js_analysis = analyze_js_resources()
    opportunities = check_optimization_opportunities()

    report = {
        'timestamp': timestamp,
        'analysis': {
            'css_resources': css_analysis,
            'js_resources': js_analysis
        },
        'optimization_opportunities': opportunities,
        'summary': {
            'total_css_files': css_analysis['count'],
            'total_css_size_kb': css_analysis['total_size_kb'],
            'total_js_files': js_analysis['count'],
            'total_js_size_kb': js_analysis['total_size_kb'],
            'opportunities_found': len(opportunities)
        }
    }

    return report


def save_report(report):
    """保存性能审计报告"""
    reports_dir = Path("/home/yoli/GitHub/web_nav/performance_reports")
    reports_dir.mkdir(exist_ok=True)

    date_str = datetime.now().strftime("%Y-%m-%d")
    report_file = reports_dir / f"performance_audit_{date_str}.json"

    # 保存详细报告
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # 保存最新报告的副本
    latest_file = reports_dir / "latest_audit.json"
    with open(latest_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report_file


def print_summary(report):
    """打印审计摘要"""
    print(f"=== 网站性能审计报告 ===")
    print(f"时间: {report['timestamp']}")
    print()

    analysis = report['analysis']
    print(f"CSS资源: {analysis['css_resources']['count']}个文件, 合计 {analysis['css_resources']['total_size_kb']}KB")
    print(f"JS资源: {analysis['js_resources']['count']}个文件, 合计 {analysis['js_resources']['total_size_kb']}KB")
    print()

    opportunities = report['optimization_opportunities']
    if opportunities:
        print(f"发现 {len(opportunities)} 个优化机会:")
        for i, opp in enumerate(opportunities, 1):
            print(f"  {i}. [{opp['impact'].upper()}] {opp['description']}")
            print(f"     当前状态: {opp['current_state']}")
            print(f"     建议行动: {opp['suggested_action']}")
            print()
    else:
        print("未发现明显的优化机会")

    print(f"详细报告已保存至: performance_reports/ 目录")


def main():
    """主函数"""
    try:
        # 生成性能报告
        report = generate_performance_report()

        # 保存报告
        report_file = save_report(report)

        # 打印摘要
        print_summary(report)

        # 返回成功状态
        return 0

    except Exception as e:
        print(f"性能审计过程中发生错误: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())