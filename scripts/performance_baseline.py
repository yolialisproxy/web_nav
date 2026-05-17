#!/usr/bin/env python3
"""
网站性能基线测试脚本
帮助您测量当前网站加载性能，作为优化的基准
"""

import subprocess
import sys
import json
from datetime import datetime
from pathlib import Path


def run_lighthouse_like_test():
    """
    模拟轻量级性能测试
    实际使用中，建议使用真实的Lighthouse或WebPageTest
    此处提供框架和示例实现
    """
    print("=== 网站性能基线测试 ===")
    print("正在收集网站资源信息作为性能基线...")

    # 读取我们之前创建的性能分析功能
    from performance_audit import analyze_css_resources, analyze_js_resources

    css_analysis = analyze_css_resources()
    js_analysis = analyze_js_resources()

    # 计算一个简化的性能分数（实际项目中应使用更专业的工具）
    # 这里我们基于资源数量和大小给出一个相对分数

    # 基础分数100分
    base_score = 100

    # 根据CSS文件数量扣分（每超过1个文件扣10分）
    css_penalty = min((css_analysis['count'] - 1) * 10, 30)  # 最多扣30分

    # 根据JS文件数量扣分（每超过5个文件扣5分）
    js_penalty = min(max(0, (js_analysis['count'] - 5)) * 5, 25)  # 最多扣25分

    # 根据总大小扣分（每超过50KB扣1分）
    total_size_kb = css_analysis['total_size_kb'] + js_analysis['total_size_kb']
    size_penalty = min(int(total_size_kb / 50), 20)  # 最多扣20分

    # 计算最终分数
    performance_score = max(base_score - css_penalty - js_penalty - size_penalty, 0)

    # 资源效率评分（越少请求和越小越好）
    request_efficiency = max(0, 100 - (css_analysis['count'] + js_analysis['count']) * 2)
    size_efficiency = max(0, 100 - int(total_size_kb / 2))

    # 综合性能指数（实际应用中应使用更专业的评估）
    performance_index = int((performance_score + request_efficiency + size_efficiency) / 3)

    result = {
        'timestamp': datetime.now().isoformat(),
        'performance_index': performance_index,
        'details': {
            'css_resources': css_analysis,
            'js_resources': js_analysis,
            'total_size_kb': round(total_size_kb, 1),
            'scoring_breakdown': {
                'base_score': base_score,
                'css_penalty': css_penalty,
                'js_penalty': js_penalty,
                'size_penalty': size_penalty,
                'performance_score': performance_score,
                'request_efficiency': request_efficiency,
                'size_efficiency': size_efficiency
            }
        },
        'notes': {
            'description': '这是一个简化的性能评估模型。实际性能测试应使用Lighthouse、WebPageTest或类似专业工具。',
            'suggestion': '建议使用Chrome DevTools Lighthouse或在线工具如PageSpeed Insights获得更准确的性能评分。',
            'improvement_target': f"目标是将性能指数从 {performance_index} 提高到 {int(performance_index * 1.5)} (提升50%)"
        }
    }

    return result


def save_baseline_result(result):
    """保存基线测试结果"""
    baseline_dir = Path("/home/yoli/GitHub/web_nav/performance_baselines")
    baseline_dir.mkdir(exist_ok=True)

    date_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    baseline_file = baseline_dir / f"baseline_{date_str}.json"

    with open(baseline_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    # 保存最新基线的副本
    latest_file = baseline_dir / "latest_baseline.json"
    with open(latest_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return baseline_file


def print_baseline_result(result):
    """打印基线测试结果"""
    print(f"\n=== 性能基线测试结果 ===")
    print(f"测试时间: {result['timestamp']}")
    print(f"性能指数: {result['performance_index']}/100")
    print()

    print("=== 资源统计 ===")
    css = result['details']['css_resources']
    js = result['details']['js_resources']
    print(f"CSS文件: {css['count']} 个, 总大小: {css['total_size_kb']} KB")
    print(f"JS文件:  {js['count']} 个, 总大小: {js['total_size_kb']} KB")
    print(f"合计大小: {result['details']['total_size_kb']} KB")
    print()

    print("=== 分数分解 ===")
    breakdown = result['details']['scoring_breakdown']
    print(f"基础分数: {breakdown['base_score']}")
    print(f"CSS文件数量扣分: -{breakdown['css_penalty']} (超过1个文件每个扣10分)")
    print(f"JS文件数量扣分: -{breakdown['js_penalty']} (超过5个文件每个扣5分)")
    print(f"总大小扣分: -{breakdown['size_penalty']} (每50KB扣1分)")
    print(f"核心性能分数: {breakdown['performance_score']}")
    print(f"请求效率分数: {breakdown['request_efficiency']}")
    print(f"大小效率分数: {breakdown['size_efficiency']}")
    print()

    print("=== 改进目标 ===")
    print(result['notes']['improvement_target'])
    print()
    print(f"建议: {result['notes']['suggestion']}")
    print()


def main():
    """主函数"""
    try:
        # 运行基线测试
        result = run_lighthouse_like_test()

        # 保存结果
        baseline_file = save_baseline_result(result)

        # 打印结果
        print_baseline_result(result)

        print(f"基线测试结果已保存至: {baseline_file}")
        print("建议：")
        print("1. 保存此基线结果作为优化的起点")
        print("2. 根据优化建议修改网站代码")
        print("3. 重新运行此脚本测量改进效果")
        print("4. 重复直到性能指数达到目标值")

        return 0

    except Exception as e:
        print(f"性能基线测试过程中发生错误: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())