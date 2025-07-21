
// 初始化默认设置
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['searchEngine'], (result) => {
    // 如果没有搜索引擎设置，则设置默认值
    if (!result.searchEngine) {
      chrome.storage.sync.set({
        searchEngine: 'google'
      });
    }
  });
});

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === "_execute_action") {
    // 打开popup（这个命令会自动触发popup打开）
    // 由于使用了_execute_action，Chrome会自动打开popup
    console.log('快捷键被触发');
  }
});

// 监听快捷键触发的action点击事件
chrome.action.onClicked.addListener((tab) => {
  // 这个监听器在使用popup时通常不会被触发
  // 但保留以防需要自定义行为
  console.log('扩展图标被点击');
});