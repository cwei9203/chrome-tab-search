document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const searchEngineSelect = document.getElementById('search-engine');
  const resultLimitInput = document.getElementById('result-limit');
  const showTypeLabelsCheckbox = document.getElementById('show-type-labels');
  const showFaviconsCheckbox = document.getElementById('show-favicons');
  const saveButton = document.getElementById('save-button');
  const resetButton = document.getElementById('reset-button');
  const statusMessage = document.getElementById('status-message');
  
  // 加载当前设置
  loadSettings();
  
  // 保存按钮点击事件
  saveButton.addEventListener('click', saveSettings);
  
  // 重置按钮点击事件
  resetButton.addEventListener('click', resetSettings);
  
  // 加载当前设置
  function loadSettings() {
    chrome.storage.sync.get([
      'searchEngine',
      'resultLimit',
      'showTypeLabels',
      'showFavicons'
    ], (result) => {
      // 设置搜索引擎
      if (result.searchEngine) {
        searchEngineSelect.value = result.searchEngine;
      } else {
        searchEngineSelect.value = 'google';
      }
      
      // 设置结果数量限制
      if (result.resultLimit) {
        resultLimitInput.value = result.resultLimit;
      } else {
        resultLimitInput.value = 50;
      }
      
      // 设置是否显示类型标签
      if (result.showTypeLabels !== undefined) {
        showTypeLabelsCheckbox.checked = result.showTypeLabels;
      } else {
        showTypeLabelsCheckbox.checked = true;
      }
      
      // 设置是否显示网站图标
      if (result.showFavicons !== undefined) {
        showFaviconsCheckbox.checked = result.showFavicons;
      } else {
        showFaviconsCheckbox.checked = true;
      }
    });
  }
  
  // 保存设置
  function saveSettings() {
    // 验证输入
    const resultLimit = parseInt(resultLimitInput.value, 10);
    if (isNaN(resultLimit) || resultLimit < 10 || resultLimit > 200) {
      showStatus('搜索结果数量必须在10到200之间', 'error');
      return;
    }
    
    // 保存设置
    chrome.storage.sync.set({
      searchEngine: searchEngineSelect.value,
      resultLimit: resultLimit,
      showTypeLabels: showTypeLabelsCheckbox.checked,
      showFavicons: showFaviconsCheckbox.checked
    }, () => {
      showStatus('设置已保存', 'success');
    });
  }
  
  // 重置设置
  function resetSettings() {
    chrome.storage.sync.set({
      searchEngine: 'google',
      resultLimit: 50,
      showTypeLabels: true,
      showFavicons: true
    }, () => {
      loadSettings();
      showStatus('设置已重置为默认值', 'success');
    });
  }
  
  // 显示状态消息
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    
    setTimeout(() => {
      statusMessage.className = '';
    }, 3000);
  }
});