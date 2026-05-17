# 网站看门狗系统 (Website Watchdog System)

## 系统概述

这是一个分阶段实现的"看门狗"系统，旨在自动化维护和改进网站导航体系。当前实现为第一阶段 - 感知系统基础版本。

## 第一阶段：感知系统基础版本

### 功能
- 读取和分析现有网站数据库 (`data/websites.json`)
- 提供发现新URL的框架和存储机制
- 为后续的自动化处理准备数据接口

### 文件结构
```
scripts/
├── website_watchdog.py          # 主脚本 - 感知系统
├── README_WATCHDOG.md           # 本说明文件
└── discoveries/                 # 发现结果存储目录 (自动创建)
    ├── latest_discovery.json    # 最新发现结果
    └── YYYY-MM-DD_discovery.json # 按日期的发现历史
```

### 使用方法
```bash
# 运行感知系统
python3 scripts/website_watchdog.py

# 输出示例:
# 正在加载网站数据库...
# 当前数据库统计:
#   - 大类别: 9
#   - 中类别: 85
#   - 小类别: 732
#   - 网站总数: 6561
#
# 正在分析竞品导航站点...
# [模拟] 竞品分析完成
#
# 发现 3 个潜在新链接:
#   - https://another-cool-site.org
#   - https://example-ai-tool.com
#   - https://yet-another-resource.net
#
# 发现 3 个新URL，已保存到 discoveries/2026-05-11_competitor_analysis.json
#
# 后续步骤（进化系统）:
#   1. 检查 discoveries/latest_discovery.json 获取新URL
#   2. 为每个URL使用AI生成简介和寻找配图
#   3. 自动将新网站添加到适当的分类中
#   4. 提交代码更改
```

## 第二阶段：进化系统 (待实施)

当发现新链接时，进化系统应该：
1. 读取 `discoveries/latest_discovery.json`
2. 对每个新URL：
   - 使用AI服务（如Claude API）生成网站简介
   - 尝试获取或生成合适的配图（网站截图、Logo等）
   - 根据网站内容自动确定合适的分类位置
3. 自动修改 `data/websites.json` 添加新网站
4. 提交代码更改到版本库

### 实现建议
进化系统可以是另一个Python脚本，例如：
```python
# scripts/website_evolver.py
def evolve_discovered_sites():
    # 读取最新发现
    # 对每个URL调用AI服务生成描述
    # 确定分类位置
    # 更新websites.json
    # git commit 和推送
```

## 第三阶段：反馈系统 (待实施)

反馈系统应该：
1. 集成Cloudflare或Vercel的访问分析
2. 监控页面点击率、停留时间等指标
3. 当检测到表现异常低的页面时：
   - 分析可能原因（UI问题、内容过时、加载慢等）
   - 生成改进建议
   - 可选：自动应用某些UI调整
   - 通知管理员进行人工审核

### 技术选项
- **Cloudflare Analytics**：通过API访问页面浏览数据
- **Vercel Analytics**：内置的访问洞察
- **自定义埋点**：在网站中添加轻量级访问统计

## 实际部署建议

### 定时执行
由于脚本需要定期运行，建议使用系统定时任务：
```bash
# 每天凌晨2点运行感知系统
0 2 * * * /usr/bin/python3 /path/to/web_nav/scripts/website_watchdog.py
```

### 环境要求
- Python 3.7+
- 访问外部网络（用于实际的爬虫功能）
- 可选：AI服务API密钥（用于进化系统）
- 可选：版本控制访问权限（用于自动提交）

## 注意事项

1. **当前限制**：此实现为基础框架，实际的网站爬取功能需要集成firecrawl或类似工具
2. **数据安全**：请确保定时任务在适当的用户权限下运行
3. **异常处理**：生产环境中应添加更完善的错误处理和日志记录
4. **手动审核**：即使是自动化系统，也建议对新增内容进行人工审核