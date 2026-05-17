#!/usr/bin/env python3
"""
Git提交分析脚本 - 生成个人开发准则

此脚本分析过去N次Git提交，识别常见的错误模式和改进点，
然后生成一个个性化的“开发准则”文件，帮助在未来的编工作中避免类似错误。
"""

import subprocess
import re
import os
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import json


def run_git_command(command):
    """安全地运行Git命令并返回输出"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd="/home/yoli/GitHub/web_nav"
        )
        if result.returncode != 0:
            print(f"Git命令执行失败: {command}")
            print(f"错误: {result.stderr}")
            return None
        return result.stdout.strip()
    except Exception as e:
        print(f"执行Git命令时发生异常: {e}")
        return None


def get_recent_commits(count=10):
    """获取最近N次提交的详细信息"""
    # 获取提交哈希列表
    log_output = run_git_command(f"git log --oneline -{count}")
    if not log_output:
        return []

    commits = []
    for line in log_output.split('\n'):
        if not line.strip():
            continue
        parts = line.split(' ', 1)
        if len(parts) < 2:
            continue
        commit_hash, description = parts
        commits.append({
            'hash': commit_hash,
            'description': description
        })

    # 获取每个提交的详细信息
    detailed_commits = []
    for commit in commits:
        # 获取提交的完整信息
        show_output = run_git_command(f"git show --stat --name-only {commit['hash']}")
        if show_output:
            lines = show_output.split('\n')
            # 第一行是提交信息
            header = lines[0] if lines else ""
            # 提取作者和日期
            author_match = re.search(r'Author:.*<(.*)>', show_output)
            date_match = re.search(r'Date:   (.*)', show_output)

            # 获取变更的文件
            files_changed = []
            for line in lines:
                if ' | ' in line and ('insertion' in line or 'deletion' in line):
                    # 这是统计行格式： files changed, insertions(+), deletions(-)
                    file_part = line.split(' | ')[0]
                    if file_part not in ['', ' files changed']:
                        files_changed.append(file_part.strip())

            detailed_commits.append({
                'hash': commit['hash'],
                'description': commit['description'],
                'author': author_match.group(1) if author_match else 'unknown',
                'date': date_match.group(1).strip() if date_match else 'unknown',
                'files_changed': files_changed,
                'raw_output': show_output
            })

    return detailed_commits


def analyze_commit_patterns(commits):
    """分析提交模式，识别常见问题"""
    patterns = {
        'commit_message_issues': [],
        'file_change_patterns': [],
        'potential_errors': [],
        'workflow_issues': []
    }

    # 分析提交消息问题
    vague_messages = ['Update', 'Fix', 'Modify', 'Change']
    for commit in commits:
        desc = commit['description']
        # 检查是否太泛泛而谈
        if any(desc.startswith(vague) for vague in vague_messages) and len(desc) < 20:
            patterns['commit_message_issues'].append({
                'type': 'vague_message',
                'commit': commit['hash'],
                'message': desc,
                'suggestion': '使用更具体的描述，说明是什么问题被修复或什么功能被添加'
            })

        # 检查是否缺少类型前缀（如feat:, fix:等）
        if not re.match(r'^(feat|fix|refactor|docs|test|chore|perf|ci)\(?\):?', desc, re.I):
            patterns['commit_message_issues'].append({
                'type': 'missing_conventional_type',
                'commit': commit['hash'],
                'message': desc,
                'suggestion': '考虑使用约定式提交格式，如: feat: 添加新功能 或 fix: 修复具体问题'
            })

    # 分析文件变更模式
    file_change_counter = Counter()
    for commit in commits:
        for file in commit['files_changed']:
            file_change_counter[file] += 1

    # 识别经常被修改的文件（可能表明设计问题）
    for file, count in file_change_counter.items():
        if count >= 3:  # 在最近10次提交中被修改3次或以上
            patterns['file_change_patterns'].append({
                'type': 'frequently_changed_file',
                'file': file,
                'change_count': count,
                'suggestion': f'文件 {file} 在最近的{count}次提交中被修改，考虑是否需要重构或更好的模块化'
            })

    # 分析潜在错误模式（基于提交描述中的关键词）
    error_indicators = ['fix', 'error', 'bug', 'issue', 'problem']
    for commit in commits:
        desc_lower = commit['description'].lower()
        if any(indicator in desc_lower for indicator in error_indicators):
            patterns['potential_errors'].append({
                'type': 'error_fix_commit',
                'commit': commit['hash'],
                'message': commit['description'],
                'suggestion': '此提交修复了错误，考虑添加防止类似错误再次发生的措施到开发准则中'
            })

    # 工作流问题分析
    merge_commits = [c for c in commits if 'merge' in c['description'].lower()]
    if len(merge_commits) > 2:  # 如果合并提交太多
        patterns['workflow_issues'].append({
            'type': 'excessive_merging',
            'count': len(merge_commits),
            'suggestion': '考虑减少不必要的分支，或改进工作流以减少合并频率'
        })

    return patterns


def generate_development_guidelines(patterns, commits):
    """基于分析结果生成开发准则"""
    guidelines = []

    guidelines.append("# 个人开发准则")
    guidelines.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    guidelines.append(f"基于最近 {len(commits)} 次Git提交的分析")
    guidelines.append("")
    guidelines.append("## 提交消息规范")
    guidelines.append("")

    # 基于提交消息问题生成准则
    if patterns['commit_message_issues']:
        guidelines.append("### 1. 提交消息应清晰具体")
        guidelines.append("")
        guidelines.append("**问题**：发现模糊不清的提交消息，如单纯的'Update main.css'或'Fix bug'")
        guidelines.append("**影响**：难以理解变更目的，不利于代码审查和历史追溯")
        guidelines.append("")
        guidelines.append("**准则**：")
        guidelines.append("- 使用约定式提交格式: `<type>(<scope>): <description>`")
        guidelines.append("- 类型选项: feat(新功能), fix(错误修复), refactor(重构), docs(文档), test(测试), chore(杂务), perf(性能), ci(持续集成)")
        guidelines.append("- 描述应具体说明做了什么改变，避免使用'Update','Modify','Fix'等泛泛而谈的词")
        guidelines.append("- 良好示例: `fix(layout): 修正导致内容区域与导航栏间距异常的CSS计算错误`")
        guidelines.append("- 需要避免: `Update main.css`, `Fix bug`, `changes`")
        guidelines.append("")

    # 基于文件变更模式生成准则
    if patterns['file_change_patterns']:
        guidelines.append("### 2. 关注频繁修改的文件")
        guidelines.append("")
        guidelines.append("**问题**：某些文件被反复修改，可能表明设计或实现存在问题")
        guidelines.append("**影响**：增加维护成本，可能暗示架构不佳或需求不明确")
        guidelines.append("")
        guidelines.append("**准则**：")
        guidelines.append("- 当发现同一文件在短时间内被多次修改时，停下来审视是否需要重构")
        guidelines.append("- 考虑将大文件拆分为更小、更专注的模块")
        guidelines.append("- 检查是否可以通过更好的抽象或接口设计来减少修改频率")
        guidelines.append("- 当前需要特别关注的文件:")
        for item in patterns['file_change_patterns']:
            guidelines.append(f"  - `{item['file']}` (最近{item['change_count']}次提交中被修改)")
        guidelines.append("")

    # 基于错误修复生成准则
    if patterns['potential_errors']:
        guidelines.append("### 3. 从错误中学习，防止类似问题再次发生")
        guidelines.append("")
        guidelines.append("**问题**：提交历史显示反复出现类似的错误需要修复")
        guidelines.append("**影响**：重复犯同样的错误浪费时间，影响代码质量")
        guidelines.append("")
        guidelines.append("**准则**：")
        guidelines.append("- 在修复错误后，思考：这个错误本可以如何被预防？")
        guidelines.append("- 考虑添加断言、类型检查、单元测试或代码审查检查点")
        guidelines.append("- 记录常见错误类型及其预防措施到个人知识库")
        guidelines.append("- 在代码中添加注释说明为什么这样写可以避免已知问题")
        guidelines.append("")

    # 工作流改进建议
    if patterns['workflow_issues']:
        guidelines.append("### 4. 改进开发工作流")
        guidelines.append("")
        guidelines.append("**问题**：开发工作流中存在可以改进的方面")
        guidelines.append("**影响**：效率低下，增加不必要的工作量")
        guidelines.append("")
        guidelines.append("**准则**：")
        for issue in patterns['workflow_issues']:
            if issue['type'] == 'excessive_merging':
                guidelines.append("- 考虑使用特性开关(feature flags)而不是频繁分支合并")
                guidelines.append("- 保持分支更新以减少合并冲突")
                guidelines.append("- 在适当时使用撕弃式合并(squash merge)保持历史简洁")
        guidelines.append("")

    # 添加通用最佳实践
    guidelines.append("### 5. 通用编码最佳实践")
    guidelines.append("")
    guidelines.append("**这些建议基于通用软件工程最佳实践而非特定提交分析**")
    guidelines.append("")
    guidelines.append("**代码质量**：")
    guidelines.append("- 每次提交前运行代码检查和测试")
    guidelines.append("- 函数应专注于单一职责，建议不超过50行")
    guidelines.append("- 文件应保持适度大小，建议不超过500行")
    guidelines.append("- 有意义的变量和函数命名")
    guidelines.append("- 适当注释解释为什么而非什么")
    guidelines.append("")
    guidelines.append("**测试意识**：")
    guidelines.append("- 优先编写测试（TDD理念）")
    guidelines.append("- 为修复的错误添加回归测试")
    guidelines.append("- 测试应覆盖正常路径和边界情况")
    guidelines.append("")
    guidelines.append("**审查与反馈**：")
    guidelines.append("- 代码提交前进行自行审查")
    guidelines.append("- 善用工具进行静态代码分析")
    guidelines.append("- 愿意接受和他人的代码审查反馈")
    guidelines.append("")

    guidelines.append("---")
    guidelines.append("")
    guidelines.append("*此准则由Git提交分析脚本自动生成*")
    guidelines.append("*建议定期重新运行此脚本以更新准则*")
    guidelines.append("*在开始新的编码工作前，请先阅读本准则*")

    return "\n".join(guidelines)


def save_guidelines(guidelines, filename="DEVELOPMENT_GUIDELINES.md"):
    """保存开发准则到文件"""
    filepath = os.path.join("/home/yoli/GitHub/web_nav", filename)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(guidelines)
        print(f"开发准则已成功保存至: {filepath}")
        return filepath
    except Exception as e:
        print(f"保存开发准则时发生错误: {e}")
        return None


def display_summary(commits, patterns):
    """显示分析摘要"""
    print("=== Git提交分析摘要 ===")
    print(f"分析了最近 {len(commits)} 次提交")
    print()

    print("发现的问题模式:")
    print(f"- 提交消息问题: {len(patterns['commit_message_issues'])} 项")
    print(f"- 文件变更模式问题: {len(patterns['file_change_patterns'])} 项")
    print(f"- 潜在错误模式: {len(patterns['potential_errors'])} 项")
    print(f"- 工作流问题: {len(patterns['workflow_issues'])} 项")
    print()

    if patterns['commit_message_issues']:
        print("最近的提交消息问题示例:")
        for issue in patterns['commit_message_issues'][:3]:  # 显示前3个
            print(f"  - [{issue['type']}] {issue['message']}")
        print()

    if patterns['file_change_patterns']:
        print("频繁修改的文件:")
        for item in patterns['file_change_patterns'][:3]:  # 显示前3个
            print(f"  - {item['file']}: {item['change_count']} 次修改")
        print()


def main():
    """主函数"""
    print("正在分析最近的Git提交...")

    # 获取最近10次提交
    commits = get_recent_commits(10)
    if not commits:
        print("错误：无法获取Git提交历史")
        return 1

    # 分析提交模式
    patterns = analyze_commit_patterns(commits)

    # 显示分析摘要
    display_summary(commits, patterns)

    # 生成开发准则
    print("正在生成个人开发准则...")
    guidelines = generate_development_guidelines(patterns, commits)

    # 保存开发准则
    guidelines_file = save_guidelines(guidelines)
    if guidelines_file:
        print(f"\n开发准则已生成！请在以后的编工作中参考: {guidelines_file}")
        print("建议：在开始新的编码工作前，先阅读一次此准则文件")
    else:
        print("错误：生成开发准则失败")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())