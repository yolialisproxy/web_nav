
import json
import sys

def validate_site_data(data):
    results = {
        'total_sites': 0,
        'duplicates': 0,
        'invalid_urls': [],
        'misclassified_suggestions': [],
        'errors': []
    }
    seen_urls = set()
    KEYWORDS_MAP = {
        '开发资源': ['github', 'stackoverflow', 'npm', 'api', 'dev', 'code', 'git', 'vscode'],
        'AI智能': ['openai', 'claude', 'gemini', 'llm', 'chatgpt', 'ai'],
        '视频娱乐': ['youtube', 'bilibili', 'twitch', 'netflix', 'video'],
        '学习教育': ['coursera', 'edx', 'khan', 'udemy', 'wiki', 'edu'],
    }
    try:
        for cat_name, cat_data in data.items():
            if not isinstance(cat_data, dict) or 'subcategories' not in cat_data:
                continue
            for sub in cat_data['subcategories']:
                for site in sub.get('sites', []):
                    results['total_sites'] += 1
                    url = site.get('url', '')
                    name = site.get('name', '')
                    if not url or not url.startswith('http'):
                        results['invalid_urls'].append({'name': name, 'url': url})
                    if url in seen_urls:
                        results['duplicates'] += 1
                    seen_urls.add(url)
                    content = (url + name).lower()
                    for target_cat, kws in KEYWORDS_MAP.items():
                        if any(kw in content for kw in kws) and target_cat != cat_name:
                            results['misclassified_suggestions'].append({
                                'name': name, 'url': url, 'current': cat_name, 'suggested': target_cat
                            })
                            break
    except Exception as e:
        results['errors'].append(str(e))
    return results

if __name__ == '__main__':
    file_path = sys.argv[1] if len(sys.argv) > 1 else 'data/websites.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        report = validate_site_data(data)
        print(json.dumps(report, ensure_ascii=False, indent=2))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
