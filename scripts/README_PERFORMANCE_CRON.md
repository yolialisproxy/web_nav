# 性能审计定时任务设置指南

本文档说明如何设置系统定时任务(cron)来定期运行网站性能审计脚本。

## 概述

为了实持续监控和优化网站性能，建议设置定时任务每小时自动运行一次性能审计。这样可以：
- 持续跟踪性能趋势
- 及时发现性能退化
- 为优化决策提供数据依据

## 文件位置

- 性能审计脚本：`/home/yoli/GitHub/web_nav/scripts/performance_audit.py`
- 报告存储目录：`/home/yoli/GitHub/web_nav/performance_reports/`

## 设置系统定时任务（Cron）

### 步骤1：确认脚本可执行性
```bash
# 确保脚本有执行权限
chmod +x /home/yoli/GitHub/web_nav/scripts/performance_audit.py

# 测试脚本是否可以直接运行
/home/yoli/GitHub/web_nav/scripts/performance_audit.py
```

### 步骤2：编辑crontab
```bash
# 打开当前用户的crontab文件
crontab -e

# 添加以下行以每小时执行一次性能审计
0 * * * * /usr/bin/python3 /home/yoli/GitHub/web_nav/scripts/performance_audit.py >> /home/yoli/GitHub/web_nav/logs/performance_cron.log 2>&1
```

### 步骤3：创建日志目录（如果不存在）
```bash
mkdir -p /home/yoli/GitHub/web_nav/logs
```

### 完整的cron条目解释：
```
0 * * * * /usr/bin/python3 /home/yoli/GitHub/web_nav/scripts/performance_audit.py >> /home/yoli/GitHub/web_nav/logs/performance_cron.log 2>&1
```
- `0 * * * *` ：每小时的第0分钟执行（即每小时整点）
- `/usr/bin/python3` ：使用Python3解释器
- `/home/yoli/GitHub/web_nav/scripts/performance_audit.py` ：要执行的脚本完整路径
- `>> /home/yoli/GitHub/web_nav/logs/performance_cron.log 2>&1` ：将标准输出和错误都追加到日志文件

## 其他有用的cron表达式示例

| 表达式 | 含义 | 使用场景 |
|--------|------|----------|
| `0 * * * *` | 每小时整点执行 | 基础性能监控 |
| `0 */2 * * *` | 每2小时执行一次 | 资源受限环境 |
| `0 0 * * *` | 每天午夜执行一次 | 日报生成 |
| `0 9-18 * * 1-5` | 工作日9点到18点每小时执行 | 工作时间监控 |
| `30 2 * * *` | 每天凌晨2点30分执行 | 深夜低流量时段优化 |

## 查看和管理定时任务

### 查看现有定时任务
```bash
crontab -l
```

### 编辑定时任务
```bash
crontab -e
```

### 删除所有定时任务（慎用！）
```bash
crontab -r
```

## 日志轮转建议

为了防止日志文件无限增长，建议设置日志轮转。可以使用logrotate工具：

### 创建logrotate配置文件
```bash
sudo tee /etc/logrotate.d/web_nav_performance > /dev/null << 'EOF'
/home/yoli/GitHub/web_nav/logs/performance_cron.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 yoli yoli
    sharedscripts
    postrotate
        # 可以在这里添加日志轮转后的处理命令
    endscript
}
EOF
```

## 性能报告查看

性能审计脚本会生成JSON格式的详细报告，存储在：
- 最新报告：`/home/yoli/GitHub/web_nav/performance_reports/latest_audit.json`
- 历史报告：`/home/yoli/GitHub/web_nav/performance_reports/performance_audit_YYYY-MM-DD.json`

### 查看最新性能报告
```bash
cat /home/yoli/GitHub/web_nav/performance_reports/latest_audit.json | jq .
```
（需要安装jq工具：`sudo apt-get install jq`）

### 查看性能趋势
```bash
# 查看最近7天的CSS文件数量趋势
ls -la /home/yoli/GitHub/web_nav/performance_reports/performance_audit_*.json | head -7 | xargs cat | jq -s 'map(.summary.total_css_files)'
```

## 自动优化建议（进阶用法）

当前的`performance_audit.py`脚本专注于分析和报告。如果想要实现自动优化，可以：

1. **扩展脚本功能**：修改脚本使其在发现特定问题时自动应用安全的优化
2. **创建独立的优化脚本**：新建一个`performance_optimizer.py`脚本，读取审计结果并执行优化
3. **分离职责**：审计脚本只负责检测和报告，优化脚本负责修复

### 示例扩展方向
在`performance_audit.py`中添加自动优化功能：
```python
def apply_safe_optimizations(report):
    """应用安全的自动优化"""
    # 例如：如果检测到有超过5个CSS文件，自动触发合并过程
    # 但是这样的操作需要非常谨慎，最好是人工确认后执行
    pass
```

## 注意事项和最佳实践

1. **权限问题**：确保运行cron任务的用户有权限读取网站文件和写入报告目录
2. **环境变量**：cron环境与普通shell不同，可能需要显式指定路径
3. **执行时间**：选择网站访问较少的时候执行审计，避免对用户造成影响
4. **错误处理**：脚本已经包含基本的异常处理，生产环境中可能需要更完善的日志记录
5. **报告保留**：考虑实施报告保留政策，防止磁盘空间被历史报告占满
6. **测试验证**：在生产环境部署前，先在测试环境充分验证脚本行为

## 故障排除

### 常见问题及解决方案

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 脚本不执行 | 路径错误或权限问题 | 检查脚本路径和执行权限 |
| 日志为空 | 输出重定向问题 | 确保日志目录存在且可写 |
| 报告未生成 | 脚本执行出错 | 检查执行日志查看具体错误信息 |
| 执行时间过长 | 文件过多或脚本效率低 | 优化脚本或增加超时限制 |

### 查看执行日志
```bash
# 实时查看日志
tail -f /home/yoli/GitHub/web_nav/logs/performance_cron.log

# 查看最近的执行记录
tail -20 /home/yoli/GitHub/web_nav/logs/performance_cron.log
```

## 与其他系统的集成

性能审计结果可以进一步集成到其他监控系统中：

1. **告警系统**：当关键指标超过阈值时发送通知
2. **可视化看板**：使用Grafana等工具展示性能趋势
3. **issue自动创建**：当性能下降时自动创建GitHub issue
4. **性能预算**：作为性能预算检查的一部分

通过这个定时性能审计系统，您将能够持续监控网站性能状况，及时发现问题并为优化决策提供数据支持。