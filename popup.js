document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsList = document.getElementById('results-list');
  
  let allItems = [];
  let selectedIndex = 0;
  
  // 初始化时获取焦点
  searchInput.focus();
  
  // 加载所有数据
  Promise.all([
    getAllTabs(),
    getAllBookmarks(),
    getRecentHistory()
  ]).then(([tabs, bookmarks, history]) => {
    // 合并所有数据
    allItems = [
      ...tabs.map(tab => ({ ...tab, type: 'tab' })),
      ...bookmarks.map(bookmark => ({ ...bookmark, type: 'bookmark' })),
      ...history.map(historyItem => ({ ...historyItem, type: 'history' }))
    ];
    
    
    // 初始显示所有打开的标签页
    renderResults(tabs.map(tab => ({ ...tab, type: 'tab' })));
    // 默认选中第一个结果
    selectedIndex = 0;
    const resultItems = document.querySelectorAll('.result-item');
    updateSelection(resultItems);
  });
  
  // 监听输入事件
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query === '') {
      // 如果查询为空，只显示标签页
      const tabs = allItems.filter(item => item.type === 'tab');
      renderResults(tabs);
    } else {
      // 否则搜索所有项目
      const results = searchItems(query);
      renderResults(results);
    }
    // 默认选中第一个结果
    selectedIndex = 0;
    const resultItems = document.querySelectorAll('.result-item');
    updateSelection(resultItems);
  });
  
  // 监听键盘事件
  searchInput.addEventListener('keydown', (e) => {
    const resultItems = document.querySelectorAll('.result-item');
    const itemCount = resultItems.length;
    
    // 处理方向键
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (itemCount > 0) {
        selectedIndex = (selectedIndex + 1) % itemCount;
        updateSelection(resultItems);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (itemCount > 0) {
        selectedIndex = (selectedIndex - 1 + itemCount) % itemCount;
        updateSelection(resultItems);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // 如果有选中项，则打开它
      if (itemCount > 0 && selectedIndex >= 0 && selectedIndex < itemCount) {
        resultItems[selectedIndex].click();
      } else if (searchInput.value.trim() !== '') {
        // 如果没有选中项但有输入内容，则作为URL打开
        openAsUrl(searchInput.value.trim());
      }
    }
  });
  
  // 更新选中项的样式
  function updateSelection(resultItems) {
    resultItems.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add('selected');
        // 确保选中项可见
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  // 渲染结果列表
  function renderResults(results) {
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
      resultsList.innerHTML = '<div class="no-results">没有找到匹配结果，按回车键在新标签页中打开</div>';
      selectedIndex = -1; // 没有结果时重置选择
      return;
    }
    
    results.forEach(item => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      let iconUrl = item.favIconUrl || '';
      if (!iconUrl && item.type === 'bookmark') {
        // 使用默认书签图标
        iconUrl = 'images/bookmark-icon.svg';
      } else if (!iconUrl && item.type === 'history') {
        // 使用默认历史记录图标
        iconUrl = 'images/history-icon.svg';
      }
      
      let typeLabel = '';
      let typeClass = '';
      
      switch (item.type) {
        case 'tab':
          typeLabel = '标签页';
          typeClass = 'result-type-tab';
          break;
        case 'bookmark':
          typeLabel = '书签';
          typeClass = 'result-type-bookmark';
          break;
        case 'history':
          typeLabel = '历史';
          typeClass = 'result-type-history';
          break;
      }
      
      resultItem.innerHTML = `
        <img class="result-icon" src="${iconUrl || 'images/default-icon.svg'}" onerror="this.src='images/default-icon.svg'">
        <div class="result-content">
          <div class="result-title">${escapeHtml(item.title || 'Untitled')}</div>
          <div class="result-url">${escapeHtml(item.url)}</div>
        </div>
        <div class="result-type ${typeClass}">${typeLabel}</div>
      `;
      
      // 点击事件
      resultItem.addEventListener('click', () => {
        if (item.type === 'tab') {
          // 如果是标签页，切换到该标签页
          chrome.tabs.update(item.id, { active: true });
          chrome.windows.update(item.windowId, { focused: true });
        } else {
          // 如果是书签或历史记录，在新标签页打开
          chrome.tabs.create({ url: item.url });
        }
        window.close();
      });
      
      resultsList.appendChild(resultItem);
    });
  }
  
  // 搜索项目
  function searchItems(query) {
    // 按照优先级排序：标签页 > 书签 > 历史记录
    const matchedItems = allItems.filter(item => {
      const titleMatch = (item.title || '').toLowerCase().includes(query);
      const urlMatch = item.url.toLowerCase().includes(query);
      return titleMatch || urlMatch;
    });
    
    // 按类型排序
    return matchedItems.sort((a, b) => {
      const typeOrder = { tab: 0, bookmark: 1, history: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  }
  
  // 获取所有标签页
  function getAllTabs() {
    return new Promise(resolve => {
      chrome.tabs.query({}, tabs => {
        resolve(tabs);
      });
    });
  }
  
  // 获取所有书签
  function getAllBookmarks() {
    return new Promise(resolve => {
      chrome.bookmarks.getRecent(100, bookmarks => {
        resolve(bookmarks.filter(bookmark => bookmark.url));
      });
    });
  }
  
  // 获取最近的历史记录
  function getRecentHistory() {
    return new Promise(resolve => {
      chrome.history.search({ text: '', maxResults: 100 }, historyItems => {
        resolve(historyItems);
      });
    });
  }
  
  // 作为URL打开
  function openAsUrl(input) {
    let url = input;
    
    // 如果不是有效的URL，则使用搜索引擎
    if (!isValidUrl(url)) {
      // 检查是否可能是域名（包含点但不是以点开头，且不包含空格）
      if (!url.includes(' ') && url.includes('.') && !url.startsWith('.')) {
        // 可能是域名，添加https://
        url = 'https://' + url;
      } else {
        // 作为搜索词处理
        // 从存储中获取默认搜索引擎设置
        chrome.storage.sync.get(['searchEngine'], (result) => {
          const searchEngine = result.searchEngine || 'google';
          let searchUrl;
          
          switch (searchEngine) {
            case 'bing':
              searchUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(url);
              break;
            case 'baidu':
              searchUrl = 'https://www.baidu.com/s?wd=' + encodeURIComponent(url);
              break;
            case 'google':
            default:
              searchUrl = 'https://www.google.com/search?q=' + encodeURIComponent(url);
              break;
          }
          
          chrome.tabs.create({ url: searchUrl });
          window.close();
        });
        return; // 提前返回，避免执行下面的代码
      }
    }
    
    // 如果是有效URL或可能的域名，直接打开
    chrome.tabs.create({ url });
    window.close();
  }
  
  // 检查是否是有效的URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  // HTML转义
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});