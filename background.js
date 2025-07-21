
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