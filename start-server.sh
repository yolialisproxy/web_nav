#!/bin/bash
# 导航功能演示脚本

echo "========================================="
echo "啃魂导航 - 三级分类导航功能演示"
echo "========================================="
echo ""
echo "启动本地开发服务器..."
echo ""

# 检查Python是否安装
if command -v python3 &> /dev/null; then
    echo "使用 Python 3 HTTP 服务器"
    echo "访问地址: http://localhost:8888"
    echo ""
    echo "测试页面: http://localhost:8888/test-navigation.html"
    echo "主页面: http://localhost:8888/index.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""

    # 启动服务器
    python3 -m http.server 8888
elif command -v python &> /dev/null; then
    echo "使用 Python 2 HTTP 服务器"
    echo "访问地址: http://localhost:8888"
    echo ""
    echo "测试页面: http://localhost:8888/test-navigation.html"
    echo "主页面: http://localhost:8888/index.html"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""

    # 启动服务器
    python -m SimpleHTTPServer 8888
else
    echo "错误: 未找到 Python，请安装 Python 后重试"
    exit 1
fi
