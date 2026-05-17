/**
 * 工作区分配脚本
 * 根据网站特征自动分配workspace值 (work, entertainment, study)
 */

const fs = require('fs');
const path = require('path');

// 工作区分配规则
const workspaceRules = {
  // 工作相关关键词
  work: [
    // 明确的工作相关术语
    '办公', '工作', '职场', '商务', '协作', '项目管理', '任务管理', '日程', ' calendars',
    '邮件', '通讯', '沟通', '会议', '视频会议', '文档', '表格', '演示', 'PPT', 'Word', 'Excel',
    '开发', '编程', '代码', '开发工具', 'IDE', '编辑器', '版本控制', 'Git', 'GitHub', '代码托管',
    '设计', '设计工具', '原型', 'UI', 'UX', '绘图', '画图', '建模', 'CAD',
    '营销', '推广', 'SEO', 'SEM', '广告', '活动', '客户关系', 'CRM',
    '财务', '会计', '预算', '发票', '报表', '数据分析', '统计', '分析工具',
    '人力资源', 'HR', '招聘', '培训', '学习平台', '在线课程', '技能提升',
    '法律', '合同', '咨询', '顾问',
    // 英文工作相关术语
    'office', 'work', 'business', 'collab', 'project', 'task', 'schedule', 'calendar',
    'mail', 'email', 'communication', 'chat', 'meeting', 'video', 'conference',
    'doc', 'document', 'spreadsheet', 'sheet', 'presentation', 'slide', 'ppt',
    'dev', 'develop', 'program', 'code', 'coding', 'IDE', 'editor', 'git', 'github',
    'design', 'design', 'prototype', 'ui', 'ux', 'draw', 'model', 'cad',
    'market', 'marketing', 'seo', 'sem', 'ad', 'ads', 'campaign', 'crm',
    'finance', 'accounting', 'budget', 'invoice', 'report', 'analytics', 'stats', 'analysis',
    'hr', 'human', 'resource', 'recruit', 'train', 'training', 'course', 'education', 'skill',
    'legal', 'law', 'contract', 'consult', 'advisory'
  ],

  // 学习相关关键词
  study: [
    '学习', '教育', '培训', '课程', '教程', '知识', '百科', '词典', '翻译', '语言',
    '研究', '学术', '论文', '期刊', '出版', '图书', '阅读', '写作', '作文',
    '考试', '测试', '题库', '真题', '模拟', '练习', '作业', '答案', '解析',
    '大学', '学校', '教育网', '在线教育', 'MOOC', '网课', '微课',
    '编程学习', '编程教程', '代码学习', '开发学习', '技术文档', 'API文档',
    '科学', '科技', '实验', '探索', '发现', '地理', '历史', '文化',
    // 英文学习相关术语
    'learn', 'learning', 'education', 'train', 'training', 'course', 'tutorial', 'lesson',
    'knowledge', 'wiki', 'encyclopedia', 'dictionary', 'translate', 'translation', 'language',
    'research', 'academic', 'paper', 'journal', 'publication', 'book', 'read', 'reading', 'write', 'writing',
    'exam', 'test', 'question', 'practice', 'practise', 'exercise', 'homework', 'answer', 'solution',
    'university', 'school', 'college', 'academy', 'institute', 'mooc', 'online', 'webinar',
    'programming', 'coding', 'development', 'dev', 'tech', 'technical', 'documentation', 'api',
    'science', 'technology', 'experiment', 'lab', 'discover', 'discovery', 'geography', 'history', 'culture'
  ],

  // 娱乐相关关键词
  entertainment: [
    '娱乐', '游戏', '视频', '电影', '电视', '直播', '音乐', '听歌', '漫画', '动漫', '小说',
    '体育', '运动', '健身', '休闲', '趣味', '笑话', ' meme', '社交', '聊天', '交友',
    '下载', '资源', '素材', '模板', '插件', '工具箱',
    '直播', '短视频', '视频平台', '视频网站', '影视', '片库',
    // 英文娱乐相关术语
    'fun', 'game', 'gaming', 'play', 'video', 'movie', 'film', 'tv', 'television', 'live', 'stream',
    'music', 'song', 'audio', 'listen', 'radio', 'podcast', 'comic', 'anime', 'manga', 'novel', 'book',
    'sport', 'sports', 'fitness', 'workout', 'exercise', 'health', 'wellness', 'leisure', 'hobby',
    'joke', 'memes', 'social', 'chat', 'messenger', 'dating', 'friend',
    'download', 'resource', 'asset', 'template', 'plugin', 'addon', 'toolkit',
    'live', 'streaming', 'short', 'video', 'platform', 'site', 'media', 'film', 'movie', 'cinema'
  ]
};

// 根据网站信息判断workspace
function determineWorkspace(site) {
  const { name, description, url, big_category, middle_category, minor_category } = site;

  // 合并所有可用的文本字段进行匹配
  const textToMatch = [
    name || '',
    description || '',
    url || '',
    big_category || '',
    middle_category || '',
    minor_category || ''
  ].join(' ').toLowerCase();

  // 检查每个工作区的关键词匹配度
  const scores = {
    work: 0,
    study: 0,
    entertainment: 0
  };

  // 计算每个工作区的匹配分数
  for (const [workspace, keywords] of Object.entries(workspaceRules)) {
    for (const keyword of keywords) {
      if (textToMatch.includes(keyword.toLowerCase())) {
        scores[workspace]++;
      }
    }
  }

  // 找出得分最高的工作区
  let maxScore = 0;
  let bestWorkspace = '';

  for (const [workspace, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestWorkspace = workspace;
    }
  }

  // 如果没有明确匹配，则返回空字符串（保持原有行为）
  return maxScore > 0 ? bestWorkspace : '';
}

// 处理网站数据
function processWebsitesData(filePath) {
  console.log('正在读取网站数据...');

  // 读取JSON文件
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let updatedCount = 0;

  // 遍历所有分类
  for (const [bigCategory, bigCategoryData] of Object.entries(data)) {
    if (bigCategoryData.subcategories) {
      for (const subCategory of bigCategoryData.subcategories) {
        if (subCategory.minor_categories) {
          for (const minorCategory of subCategory.minor_categories) {
            if (minorCategory.sites) {
              for (const site of minorCategory.sites) {
                const oldWorkspace = site.workspace || '';
                const newWorkspace = determineWorkspace(site);

                // 只有当新工作区不同且不为空时才更新
                if (newWorkspace && newWorkspace !== oldWorkspace) {
                  site.workspace = newWorkspace;
                  updatedCount++;

                  // 为了调试，显示一些更新示例
                  if (updatedCount <= 10) {
                    console.log(`更新: ${site.name} (${bigCategory}) -> ${newWorkspace}`);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`共更新了 ${updatedCount} 条网站的workspace值`);

  // 写回文件
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('网站数据已更新并保存');

  return updatedCount;
}

// 主执行函数
function main() {
  const dataFilePath = path.join(__dirname, '../data/websites.json');

  try {
    const updatedCount = processWebsitesData(dataFilePath);
    console.log(`\n完成! 总共更新了 ${updatedCount} 条记录的workspace值`);

    // 显示统计信息
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    const workspaceCounts = { work: 0, study: 0, entertainment: 0, empty: 0 };

    for (const [bigCategory, bigCategoryData] of Object.entries(data)) {
      if (bigCategoryData.subcategories) {
        for (const subCategory of bigCategoryData.subcategories) {
          if (subCategory.minor_categories) {
            for (const minorCategory of subCategory.minor_categories) {
              if (minorCategory.sites) {
                for (const site of minorCategory.sites) {
                  const workspace = site.workspace || '';
                  if (workspace === 'work') workspaceCounts.work++;
                  else if (workspace === 'study') workspaceCounts.study++;
                  else if (workspace === 'entertainment') workspaceCounts.entertainment++;
                  else workspaceCounts.empty++;
                }
              }
            }
          }
        }
      }
    }

    console.log('\n更新后的workspace分布:');
    console.log(`工作区 (work): ${workspaceCounts.work}`);
    console.log(`学习区 (study): ${workspaceCounts.study}`);
    console.log(`娱乐区 (entertainment): ${workspaceCounts.entertainment}`);
    console.log(`未分配 (empty): ${workspaceCounts.empty}`);

  } catch (error) {
    console.error('处理过程中发生错误:', error);
    process.exit(1);
  }
}

main();