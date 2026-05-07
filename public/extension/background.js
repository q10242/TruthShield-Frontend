const defaults = {
  tooltipOrigin: 'http://127.0.0.1:15173',
  apiOrigin: 'http://127.0.0.1:18080',
}

const menuItems = [
  {
    id: 'truthshield-link-status',
    title: 'TruthShield：查看連結標籤',
    contexts: ['link'],
  },
  {
    id: 'truthshield-link-vote',
    title: 'TruthShield：我已閱讀此連結，提交評分',
    contexts: ['link'],
  },
  {
    id: 'truthshield-page-status',
    title: 'TruthShield：查看此頁評分',
    contexts: ['page'],
  },
  {
    id: 'truthshield-page-vote',
    title: 'TruthShield：我已閱讀此頁，提交評分',
    contexts: ['page'],
  },
  {
    id: 'truthshield-report-domain',
    title: 'TruthShield：回報未收錄新聞站',
    contexts: ['page', 'link'],
  },
]

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    menuItems.forEach((item) => chrome.contextMenus.create(item))
  })
}

function getSettings() {
  return chrome.storage.sync.get(defaults)
}

function targetUrl(info, tab) {
  return info.linkUrl || info.pageUrl || tab?.url || ''
}

function openTruthShieldWindow(url, width = 440, height = 680) {
  chrome.windows.create({
    url,
    type: 'popup',
    width,
    height,
    focused: true,
  })
}

async function openStatus(url) {
  const settings = await getSettings()
  const target = new URL('/iframe-tooltip', settings.tooltipOrigin)
  target.searchParams.set('news_url', url)
  openTruthShieldWindow(target.toString(), 420, 260)
}

async function openVote(url) {
  const settings = await getSettings()
  const target = new URL('/iframe-vote-panel', settings.tooltipOrigin)
  target.searchParams.set('news_url', url)
  openTruthShieldWindow(target.toString(), 460, 720)
}

async function openReport(url, title = '') {
  const settings = await getSettings()
  const target = new URL('/report-domain', settings.tooltipOrigin)
  target.searchParams.set('url', url)
  target.searchParams.set('page_title', title)
  openTruthShieldWindow(target.toString(), 540, 760)
}

chrome.runtime.onInstalled.addListener(createMenus)
chrome.runtime.onStartup.addListener(createMenus)
createMenus()

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = targetUrl(info, tab)
  if (!url) return

  if (info.menuItemId === 'truthshield-link-status' || info.menuItemId === 'truthshield-page-status') {
    openStatus(url)
    return
  }

  if (info.menuItemId === 'truthshield-link-vote' || info.menuItemId === 'truthshield-page-vote') {
    openVote(url)
    return
  }

  if (info.menuItemId === 'truthshield-report-domain') {
    openReport(url, tab?.title || '')
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'TRUTH_SHIELD_FETCH_STATUS' || !message.url) {
    return false
  }

  getSettings()
    .then((settings) => fetch(`${settings.apiOrigin}/api/news/status?url=${encodeURIComponent(message.url)}`, {
      headers: { Accept: 'application/json' },
    }))
    .then(async (response) => {
      const payload = await response.json().catch(() => null)
      sendResponse({ ok: response.ok, status: response.status, payload })
    })
    .catch((error) => {
      sendResponse({ ok: false, status: 0, message: error?.message || 'fetch failed' })
    })

  return true
})
