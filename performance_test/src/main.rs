#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::time::Instant;
use reqwest::Client;
use tokio::time::Duration;

/// 测量网站加载性能的主要函数
#[tokio::main]
async fn main() {
    if let Err(error) = run_performance_tests().await {
        eprintln!("性能测试失败: {error:?}");
        std::process::exit(1);
    }
}

/// 运行性能测试的主要逻辑
async fn run_performance_tests() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Web Nav 性能测试 ===");

    // 创建HTTP客户端
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()?;

    // 测试的URL列表
    let test_urls = vec![
        ("首页", "http://localhost:8080/"),
        ("翻译页面", "http://localhost:8080/translate.html"),
        ("管理后台", "http://localhost:8080/admin.html"),
        ("商业管理后台", "http://localhost:8080/admin-business.html"),
    ];

    // 存储所有测试结果
    let mut results = Vec::new();

    // 对每个URL进行性能测试
    for (name, url) in test_urls {
        println!("\\n测试 {} ({})", name, url);
        match test_page_load_performance(&client, url).await {
            Ok(duration) => {
                println!("  加载时间: {:.2?}", duration);
                results.push((name, url, duration, None));
            }
            Err(e) => {
                println!("  测试失败: {}", e);
                results.push((name, url, Duration::from_secs(0), Some(e.to_string())));
            }
        }
    }

    // 打印测试结果摘要
    print_test_summary(&results);

    Ok(())
}

/// 测量单个页面的加载性能
async fn test_page_load_performance(client: &Client, url: &str) -> Result<Duration, Box<dyn std::error::Error>> {
    let start = Instant::now();

    // 发送GET请求并等待响应
    let response = client.get(url).send().await?;

    // 确保响应成功
    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status(), response.status().canonical_reason().unwrap_or("Unknown")).into());
    }

    // 读取响应内容（为了确保完全下载页面）
    let _ = response.bytes().await?;

    let duration = start.elapsed();
    Ok(duration)
}

/// 打印测试结果摘要
fn print_test_summary(results: &[(&str, &str, Duration, Option<String>)]) {
    println!("\\n=== 测试结果摘要 ===");
    println!("{:<20} {:<30} {:<15} {:<20}", "页面名称", "URL", "加载时间", "状态");
    println!("{}", "-".repeat(90));

    let mut success_count = 0;
    let mut total_duration = Duration::from_secs(0);

    for &(name, url, duration, ref error) in results {
        let status = if let Some(err) = error {
            format!("失败: {}", err)
        } else {
            success_count += 1;
            total_duration = total_duration + duration;
            "成功".to_string()
        };

        println!("{:<20} {:<30} {:<15?} {:<20}", name, url, duration, status);
    }

    println!("{}", "-".repeat(90));
    if success_count > 0 {
        let avg_duration = total_duration / success_count as u32;
        println!("成功测试: {}/{}", success_count, results.len());
        println!("平均加载时间: {:.2?}", avg_duration);
    } else {
        println!("所有测试均失败");
    }
}