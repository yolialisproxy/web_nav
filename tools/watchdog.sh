#!/bin/bash
# ✅ 永久自动恢复看门狗
# 这个脚本会每15分钟运行一次，检查循环状态，如果中断就自动继续

cd /home/yoli/GitHub/web_nav

if [ -f .loop_state.json ]; then
    STATE=$(cat .loop_state.json)
    NEXT=$(echo "$STATE" | python3 -c "import sys, json; print(json.load(sys.stdin)['next_action'])")
    
    echo "✅ 看门狗激活，上次中断任务：$NEXT"
    
    # 自动唤醒hermes agent继续任务
    echo "$NEXT" | hermes --non-interactive
fi
