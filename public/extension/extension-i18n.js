const dictionaries = {
  'zh-TW': {
    popupIntro: '新聞頁會顯示頂部橫幅；點擊橫幅可開啟投票與證據面板。連結也可用右鍵查看或回報。',
    monitoredDomains: '監控網域',
    votes: '投票數',
    apiStatus: 'API 狀態',
    version: '版本',
    currentTab: '目前分頁',
    loading: '讀取中...',
    openStatus: '查看目前頁面評分',
    openVote: '開啟投票與證據面板',
    openReport: '回報未收錄或分類錯誤',
    openDemo: '開啟本地測試新聞頁',
    openReadiness: '開啟願景準備中心',
    openHealth: '開啟系統健康狀態',
    openHub: '開啟真相總部',
    openInstall: '下載與安裝教學',
    settings: '設定',
    settingsTitle: 'TruthShield 設定',
    settingsIntro: '一般使用者只需要確認官網與 API 來源正確。滑過提示是低干擾提醒，新聞頁橫幅是主要入口。',
    connectionOrigins: '連線來源',
    webOrigin: '官網 / 內嵌頁來源',
    apiOrigin: 'API 來源',
    displayPrefs: '顯示偏好',
    enableTooltip: '啟用滑過標籤提示',
    enablePanel: '進入新聞頁時顯示頂部 TruthShield 橫幅',
    enableReportButton: '顯示未收錄新聞站回報按鈕',
    save: '儲存',
    resetDefaults: '恢復本地預設',
    checkHealth: '檢查 API 健康狀態',
    checkWeb: '檢查官網連線',
    openDiagnostics: '開啟診斷頁',
    settingsBackup: '設定備份',
    settingsBackupIntro: '匯出目前設定，或貼上 JSON 匯入到這個瀏覽器。',
    settingsJsonPlaceholder: '貼上或匯出 TruthShield 設定 JSON',
    exportSettings: '匯出設定',
    importSettings: '匯入設定',
    settingsExported: '設定已匯出到文字框',
    settingsImported: '設定已匯入',
    settingsImportFailed: '設定 JSON 格式錯誤',
    diagnosticsTitle: 'TruthShield 診斷',
    diagnosticsIntro: '確認插件設定、API 健康、後端摘要與目前儲存狀態。',
    runDiagnostics: '重新檢查',
    storageSnapshot: '儲存設定',
    backendSummary: '後端摘要',
    manifestInfo: 'Manifest',
    extensionVersion: '插件版本',
    saved: '已儲存',
    checking: '檢查中...',
    healthy: '健康',
    degraded: '降級',
    apiUnreachable: '無法連線 API',
    unavailableTab: '無法取得目前分頁',
    unsupportedTab: '目前分頁不支援 TruthShield 動作',
    readyStatus: '可直接開啟面板，也可使用右鍵選單',
    resetDone: '已恢復本地預設',
  },
  en: {
    popupIntro: 'News pages show a top banner. Click it to open voting and evidence. Links can also be checked or reported from the context menu.',
    monitoredDomains: 'Monitored domains',
    votes: 'Votes',
    apiStatus: 'API status',
    version: 'Version',
    currentTab: 'Current tab',
    loading: 'Loading...',
    openStatus: 'View current page rating',
    openVote: 'Open voting and evidence panel',
    openReport: 'Report missing or misclassified site',
    openDemo: 'Open local test news page',
    openReadiness: 'Open vision readiness',
    openHealth: 'Open system health',
    openHub: 'Open Truth Hub',
    openInstall: 'Download and install guide',
    settings: 'Settings',
    settingsTitle: 'TruthShield Settings',
    settingsIntro: 'Most users only need to verify the web and API origins. Hover hints are low-friction alerts; the news banner is the main entry point.',
    connectionOrigins: 'Connection origins',
    webOrigin: 'Website / iframe origin',
    apiOrigin: 'API origin',
    displayPrefs: 'Display preferences',
    enableTooltip: 'Enable hover label hints',
    enablePanel: 'Show the TruthShield top banner on news pages',
    enableReportButton: 'Show missing news-site report button',
    save: 'Save',
    resetDefaults: 'Restore local defaults',
    checkHealth: 'Check API health',
    checkWeb: 'Check website connection',
    openDiagnostics: 'Open diagnostics',
    settingsBackup: 'Settings backup',
    settingsBackupIntro: 'Export current settings, or paste JSON to import into this browser.',
    settingsJsonPlaceholder: 'Paste or export TruthShield settings JSON',
    exportSettings: 'Export settings',
    importSettings: 'Import settings',
    settingsExported: 'Settings exported to the text area',
    settingsImported: 'Settings imported',
    settingsImportFailed: 'Invalid settings JSON',
    diagnosticsTitle: 'TruthShield Diagnostics',
    diagnosticsIntro: 'Verify extension settings, API health, backend summary, and stored state.',
    runDiagnostics: 'Run diagnostics again',
    storageSnapshot: 'Stored settings',
    backendSummary: 'Backend summary',
    manifestInfo: 'Manifest',
    extensionVersion: 'Extension version',
    saved: 'Saved',
    checking: 'Checking...',
    healthy: 'Healthy',
    degraded: 'Degraded',
    apiUnreachable: 'Cannot connect to API',
    unavailableTab: 'Cannot access current tab',
    unsupportedTab: 'TruthShield actions are not supported on this tab',
    readyStatus: 'Open the panel directly or use the context menu',
    resetDone: 'Local defaults restored',
  },
}

const locale = navigator.language?.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en'
const dictionary = dictionaries[locale] || dictionaries['zh-TW']
window.truthShieldT = (key, params = {}) => {
  let value = dictionary[key] || key
  Object.entries(params).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, String(replacement))
  })
  return value
}

document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant' : 'en'

document.querySelectorAll('[data-i18n]').forEach((element) => {
  const key = element.getAttribute('data-i18n')
  if (dictionary[key]) element.textContent = window.truthShieldT(key)
})

document.querySelectorAll('[data-i18n-title]').forEach((element) => {
  const key = element.getAttribute('data-i18n-title')
  if (dictionary[key]) document.title = dictionary[key]
})

document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
  const key = element.getAttribute('data-i18n-placeholder')
  if (dictionary[key]) element.setAttribute('placeholder', window.truthShieldT(key))
})
