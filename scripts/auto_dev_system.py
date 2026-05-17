#!/usr/bin/env python3
"""
自动开发系统 - 结合性能监控和开发准则生成
设计为被cron定时调用，可以配置不同任务的执行频率
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path

# 导入我们之前创建的模块功能
# 为了避免循环导入，我们这里直接实现所需功能
# 或者可以重构原来的脚本作为模块导入，但为简单起见这里我们重写核心逻辑

def run_performance_audit():
    """执行性能审计"""
    print(f"[{datetime.now().isoformat()}] 开始性能审计...")

    # 复用performance_audit.py的核心逻辑
    from performance_audit import analyze_css_resources, analyze_js_resources, check_optimization_opportunities, generate_performance_report, save_report, print_summary

    try:
        css_analysis = analyze_css_resources()
        js_analysis = analyze_js_resources()
        opportunities = check_optimization_opportunities()
        report = generate_performance_report()
        report_file = save_report(report)
        print_summary(report)
        print(f"[{datetime.now().isoformat()}] 性能审计完成，报告已保存至: {report_file}")
        return True
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] 性能审计失败: {e}")
        return False

def run_git_commit_analysis():
    """执行Git提交分析并生成开发准则"""
    print(f"[{datetime.now().isoformat()}] 开始Git提交分析...")

    try:
        # 这里我们复用git_commit_analyzer.py的核心逻辑
        # 为了避免复杂的导入，我们直接调用脚本
        import subprocess
        result = subprocess.run([
            sys.executable,
            '/home/yoli/GitHub/web_nav/scripts/git_commit_analyzer.py'
        ], capture_output=True, text=True, cwd='/home/yoli/GitHub/web_nav')

        if result.returncode == 0:
            print(result.stdout)
            if result.stderr:
                print("STDERR:", result.stderr)
            print(f"[{datetime.now().isoformat()}] Git提交分析完成")
            return True
        else:
            print(f"[{datetime.now().isoformat()}] Git提交分析失败:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] Git提交分析异常: {e}")
        return False

def main():
    """主函数 - 根据参数决定执行哪个任务"""
    if len(sys.argv) < 2:
        print("用法: python3 auto_dev_system.py [performance|git-analysis|both]")
        print("  performance: 只执行性能审计")
        print("  git-analysis: 只执行Git提交分析和开发准则生成")
        print("  both: 执行两个任务")
        return 1

    task = sys.argv[1].lower()

    success = True

    if task in ['performance', 'both']:
        if not run_performance_audit():
            success = False

    if task in ['git-analysis', 'both']:
        if not run_git_commit_analysis():
            success = False

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())