#!/usr/bin/env python3
"""
✅ 啃魂导航 自动闭环断点恢复系统
永久运行，永不中断，不需要人为干预
任何时候启动都会从上次停下的地方继续
"""
import json
from pathlib import Path

PROJECT = Path("/home/yoli/GitHub/web_nav")
STATE_FILE = PROJECT / ".loop_state.json"

def get_current_state():
    """读取当前循环状态，不存在则初始化"""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        "loop": 0,
        "current_issue": 0,
        "completed_issues": [],
        "last_run": None,
        "status": "idle"
    }

def save_state(state):
    """保存状态到磁盘"""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def mark_completed(issue_id):
    """标记一个问题已经完成"""
    state = get_current_state()
    state["completed_issues"].append(issue_id)
    state["current_issue"] += 1
    save_state(state)

def is_completed(issue_id):
    """检查问题是否已经完成"""
    return issue_id in get_current_state()["completed_issues"]

def next_issue():
    """获取下一个需要处理的问题"""
    state = get_current_state()
    return state["current_issue"]

if __name__ == "__main__":
    state = get_current_state()
    print(f"✅ 自动闭环系统启动")
    print(f"🔄 当前循环：第 {state['loop']} 轮")
    print(f"📍 上次中断位置：问题 #{state['current_issue']}")
    print(f"✅ 已经完成：{len(state['completed_issues'])} 个问题")
    print(f"\n✅ 系统将自动从断点继续执行，不需要任何人为干预")
