const effectiveDate = '2026-05-07'

const zh = {
  privacy: {
    title: '隱私權政策草案',
    subtitle: 'Draft for legal review',
    intro: '本文件是 TruthShield 上線前草案，供使用者理解資料處理方式，正式公開前應由台灣律師審閱。TruthShield 是新聞信譽評價與證據整理平台，不販售個人資料，不以廣告追蹤為目的處理資料。',
    sections: [
      {
        title: '一、我們蒐集的資料',
        body: [
          '帳號資料：姓名或暱稱、電子郵件、登入提供者、provider identity、公開身份標籤、信任分數、風險狀態與後台權限。',
          '新聞互動資料：新聞 URL、正規化 URL、URL 指紋、新聞標題快照、閱讀秒數、投票標籤、證據連結、證據說明、證據有用/沒幫助評分。',
          '官方澄清資料：作者、媒體、當事人或機構代表身份申請、證明連結、審核狀態、澄清內容與澄清反應。',
          '插件資料：目前頁面 URL 或新聞連結 URL、新聞站 domain、tooltip/status 查詢、橫幅/iframe 相容性事件、selector 檢查結果、錯誤與健康狀態摘要。',
          '安全與營運資料：IP 位址或其雜湊、user agent 或其雜湊、bot challenge 狀態、限流事件、audit log、系統健康與後台審核紀錄。',
          '捐款資料：捐款金額、顯示名稱、留言、付款狀態、綠界交易識別資料。TruthShield 不保存信用卡號。',
        ],
      },
      {
        title: '二、我們不刻意蒐集的資料',
        body: [
          '我們不保存完整瀏覽歷史，不記錄非新聞網站的一般瀏覽內容，不代管證據圖片或文件，不保存信用卡號。',
          '證據圖片、雲端文件、查核報告或相關新聞連結由使用者放在第三方服務；TruthShield 僅保存外部 URL、host、metadata、品質分與顯示狀態。',
          '若使用者自行在證據或澄清中揭露個資，該內容可能因公開證據用途而被展示。提交前請自行遮蔽不必要個資。',
        ],
      },
      {
        title: '三、處理目的',
        body: [
          '提供新聞頁 tooltip、頂部橫幅、投票結果、證據庫、官方澄清、媒體排行與透明治理頁。',
          '計算信任權重、閱讀門檻、證據品質分、72 小時定案快照、社群自治任務與反操縱風險訊號。',
          '處理登入、資料匯出、資料權利請求、申訴、檢舉、濫用事件、後台審核與資安事件。',
          '維護平台可靠性，例如快取、限流、bot protection、插件相容性、系統健康、備份與稽核。',
        ],
      },
      {
        title: '四、公開與非公開資料',
        body: [
          '可能公開：新聞 URL、標題快照、投票統計、加權結果、標籤分布、公開證據連結、證據說明、官方澄清、公開暱稱、公開身份標籤、公開審核摘要。',
          '預設不公開：電子郵件、provider 原始身份、證明文件的內部審核註記、IP、user agent、bot challenge token、後台操作細節、付款識別資料。',
          '使用者可選擇是否公開真名。預設前台顯示公開暱稱或系統顯示名稱，不直接顯示 Facebook/Google/GitHub 原始姓名。',
        ],
      },
      {
        title: '五、第三方服務',
        body: [
          '登入服務可能包含 Facebook、Google、GitHub 或開發期 dev login。正式 OAuth 只用於身份驗證與 provider identity 綁定。',
          '證據可使用 Imgur、Google Drive、Dropbox、OneDrive、Archive 或其他可信來源。第三方服務本身的資料處理依其政策。',
          '捐款付款由綠界處理。TruthShield 保存交易狀態與必要對帳資料，不保存信用卡號。',
          '若正式上線使用 CDN、雲端主機、PostgreSQL、Redis、queue 或監控服務，應在正式版本補上服務商與資料區域。',
        ],
      },
      {
        title: '六、保存期間',
        body: [
          '新聞 URL、投票結果、定案快照、公開證據與公開審核摘要原則上長期保存，因其構成公共查證紀錄。',
          '登入 token、OAuth state、bot challenge、nonce 與 session 類資料應採短期保存或到期失效。',
          'audit log、濫用事件、申訴與後台審核紀錄應保存足以稽核與處理爭議的期間；正式版應由營運政策設定具體年限。',
          '使用者要求刪除帳號時，平台可匿名化個人識別資料；但已定案之公共查證紀錄可能因公共利益、爭議處理或法律義務而保留去識別化版本。',
        ],
      },
      {
        title: '七、使用者權利',
        body: [
          '使用者可在個人頁匯出自己的資料，並可提出查詢、更正、刪除、停止處理或資料可攜請求。',
          '使用者可針對證據隱藏、官方澄清拒絕、身份申請拒絕、帳號限權或信用調整提出申訴。',
          '若請求涉及其他使用者權利、公共查證紀錄、法律義務或平台安全，TruthShield 可能採取部分遮蔽、匿名化、保留必要紀錄或拒絕不合理請求。',
        ],
      },
      {
        title: '八、聯絡與修訂',
        body: [
          '正式上線前應提供專用隱私聯絡信箱、資安通報信箱與資料權利處理 SLA。',
          '政策重大變更時，應在官網公告並保存版本紀錄。若變更會實質影響使用者權利，應提供明確通知。',
        ],
      },
    ],
  },
  terms: {
    title: '服務條款草案',
    subtitle: 'Draft for legal review',
    intro: '本條款規範 TruthShield 的使用方式。使用平台不代表平台保證任何新聞、投票、證據或澄清一定正確；TruthShield 提供的是公開評價、證據整理與透明治理工具。',
    sections: [
      {
        title: '一、平台定位',
        body: [
          'TruthShield 不刪除外部新聞、不封鎖外部內容、不替讀者做最終事實判斷。',
          '平台顯示的標籤、投票、證據、排行榜與澄清是社群加權結果與公開資料整理，不構成法律意見、投資建議、醫療建議或新聞倫理最終裁決。',
          '使用者仍應自行閱讀原文、查驗來源、比較多方證據。',
        ],
      },
      {
        title: '二、使用者義務',
        body: [
          '提交投票、證據、澄清、檢舉或申訴時，應基於真實使用經驗與合理證據，不得偽造、冒名、惡意誹謗、騷擾、揭露不必要個資或操縱投票。',
          '負面標籤應附公開可讀證據與簡短說明。若證據涉及第三人個資、未成年、醫療、家庭、性私密或其他高度敏感內容，應先遮蔽不必要資訊。',
          '不得使用 bot、腳本、多帳號、重複證據、協同灌票、短時間集體操作或其他方式規避信用權重與限流機制。',
        ],
      },
      {
        title: '三、內容與授權',
        body: [
          '使用者保留自己提交內容的權利，但授權 TruthShield 在平台上顯示、整理、索引、快取摘要、匯出、用於透明治理與查證紀錄。',
          '使用者應確保自己有權提交證據連結、截圖說明、澄清文字與相關資料。TruthShield 原則上不代管外部圖片或文件。',
          '若內容被檢舉或涉及法律風險，TruthShield 可隱藏、降權、加註、限制顯示或要求補充資料。',
        ],
      },
      {
        title: '四、信用權重與反操縱',
        body: [
          '投票結果以使用者投票乘上送出當下的信用權重、身份倍率與濫用風險倍率計算。',
          '低信用、高風險、疑似協同、未達閱讀門檻或違反規則之帳號，可能被降低權重、限制評分證據或暫停加權。',
          '信用調整與限權應留下 audit log、公開治理摘要或可申訴紀錄，但平台得保留部分風險模型細節以避免被規避。',
        ],
      },
      {
        title: '五、官方澄清與答辯權',
        body: [
          '作者、媒體、當事人或機構代表可申請身份驗證後提交官方澄清或答辯內容。',
          '官方澄清會在新聞頁高可見度顯示，但不直接改變已定案投票結果；讀者可獨立評估澄清是否有幫助。',
          '冒名、偽造證明、以澄清名義騷擾或散布不實內容者，可能被拒絕、隱藏、限權或停用相關權限。',
        ],
      },
      {
        title: '六、管理與申訴',
        body: [
          '管理員可審核證據檢舉、官方澄清、身份申請、濫用事件、社群自治任務與資料權利請求。',
          '管理員可隱藏證據、恢復證據、限制使用者權重、調整信用分或拒絕不合規內容；高影響操作應有理由與紀錄。',
          '使用者可對證據隱藏、澄清拒絕、身份拒絕、限權或信用調整提出申訴。申訴結果應通知使用者。',
        ],
      },
      {
        title: '七、責任限制',
        body: [
          'TruthShield 以現況提供服務。平台無法保證所有新聞站相容、所有資料即時正確、所有外部連結可用或所有操縱行為都能即時偵測。',
          '使用者因依賴平台資訊而採取行動，仍應自行承擔判斷責任。法律要求不得排除的責任不在此限。',
        ],
      },
    ],
  },
  governance: {
    title: '社群治理規則草案',
    subtitle: 'Community Guidelines Draft',
    intro: 'TruthShield 的治理目標不是讓管理員成為裁判，而是讓規則、證據、權重、申訴與自動化都可被社群檢查。',
    sections: [
      {
        title: '一、不審查，只提示',
        body: [
          '平台不移除外部新聞、不封鎖原始連結。TruthShield 只在新聞旁提供加權標籤、證據、澄清與透明紀錄。',
          '標籤代表社群在特定時間窗口內的加權判斷，不代表平台宣告新聞必然真或假。',
        ],
      },
      {
        title: '二、證據優先',
        body: [
          '負面標籤必須附外部證據與簡短說明。證據可以是截圖、雲端硬碟文件、Archive、相關新聞、官方資料或查核報告。',
          '證據應能讓其他讀者理解「為什麼這個標籤合理」。只貼情緒性評論、無關連結或不可讀連結，可能被降權或檢舉。',
        ],
      },
      {
        title: '三、社群自治',
        body: [
          '未收錄新聞站、URL 類型、可信證據來源、證據品質與需要官方澄清的新聞，可由社群任務池累積加權訊號。',
          '低風險資料維護可在達到門檻後自動套用；政治廣告、可疑 domain、短時間大量同向訊號或濫用事件，應升級人工審核。',
        ],
      },
      {
        title: '四、透明審核',
        body: [
          '證據隱藏、澄清發布/隱藏、身份申請通過/拒絕、信用調整、限權與申訴結果，應留下可稽核紀錄。',
          '公開治理頁只顯示必要摘要，不揭露私人證明文件、內部風險細節、IP 或付款識別資料。',
        ],
      },
      {
        title: '五、管理員約束',
        body: [
          '管理員不得因政治立場、媒體喜好或私人爭議調整使用者權重或隱藏證據。',
          '高影響操作應有二次確認、理由、audit log 與申訴通道。未來應將權限切分為 domain 管理、證據審核、信用調整、系統管理等角色。',
        ],
      },
    ],
  },
  dataProcessing: {
    title: '資料處理說明草案',
    subtitle: 'Data Processing Notice Draft',
    intro: '這份文件用較技術性的方式說明 TruthShield 每類資料的用途、公開狀態與保存方向，方便開發者、研究者與律師審閱。',
    sections: [
      {
        title: 'URL 與新聞資料',
        body: [
          '用途：URL 正規化、指紋查詢、快取、投票定案、新聞快照、改稿/刪文回報、媒體排行榜。',
          '公開狀態：新聞 URL、標題快照、定案狀態、快照摘要、archive URL 可能公開。',
          '保存方向：作為公共查證紀錄長期保存；若外部新聞刪除，平台仍可保留 URL 指紋、標題快照與證據摘要。',
        ],
      },
      {
        title: '投票與證據',
        body: [
          '用途：計算加權標籤、證據排序、信用結算、社群證據庫、反濫用偵測。',
          '公開狀態：聚合結果、證據 URL、證據說明、證據品質分與公開暱稱可能公開；個別使用者權重細節可在個人頁或後台查看。',
          '保存方向：投票窗口截止後凍結結果；投票與證據可因申訴、濫用或法務要求被隱藏、匿名化或標示狀態。',
        ],
      },
      {
        title: '身份與信用',
        body: [
          '用途：登入、token 發行、信用權重、身份倍率、官方澄清資格、後台權限與反操縱。',
          '公開狀態：公開暱稱、公開身份標籤、徽章與部分貢獻統計可公開；email、provider id、內部風險狀態預設不公開。',
          '保存方向：帳號存在期間保存；刪除請求可做匿名化，但需保留公共查證所需的去識別紀錄。',
        ],
      },
      {
        title: '插件與安全資料',
        body: [
          '用途：tooltip/status 查詢、新聞頁橫幅、投票面板、相容性診斷、bot protection、限流與資安稽核。',
          '公開狀態：聚合後的 domain 覆蓋率、selector 失敗統計與健康狀態可公開；IP/user agent 雜湊與 token 不公開。',
          '保存方向：相容性統計可保存供改善插件；短期 nonce、challenge、OAuth state 應到期失效。',
        ],
      },
    ],
  },
  officialResponse: {
    title: '官方澄清與答辯權政策草案',
    subtitle: 'Right of Reply Policy Draft',
    intro: 'TruthShield 應提供被報導者、作者、媒體與機構代表回應空間，但這個空間不能直接覆蓋社群投票或成為公關操作工具。',
    sections: [
      {
        title: '一、誰可以申請',
        body: [
          '新聞作者、媒體代表、被報導當事人、政府或民間機構代表、被引用資料來源或其他可合理證明與新聞有直接關係者。',
          '申請人應提供可公開或可由管理員檢查的證明連結，例如官方網站頁面、公開聲明、組織信箱、社群認證頁、雲端證明文件或其他可信資料。',
        ],
      },
      {
        title: '二、審核標準',
        body: [
          '管理員應確認申請人與新聞、domain、組織或事件的關聯性；不應因政治立場或媒體好惡拒絕。',
          '證明不足、疑似冒名、要求代表範圍過寬、涉及騷擾或濫用者，可以拒絕並提供理由。',
        ],
      },
      {
        title: '三、澄清呈現',
        body: [
          '澄清會在新聞頁獨立區塊顯示，包含回應類型、公開身份標籤、澄清文字、補充連結與有用/沒幫助評分。',
          '澄清不直接改變投票結果、不回溯修改已定案權重，但讀者可把澄清作為新證據評估。',
          '投票截止後仍可送出澄清，因答辯權不應被 72 小時窗口完全排除。',
        ],
      },
      {
        title: '四、限制與申訴',
        body: [
          '澄清不得包含冒名、威脅、騷擾、明顯不實、個資外洩、商業廣告或與新聞無關內容。',
          '被拒絕或被隱藏者可以提出申訴，並補充證明資料。申訴結果應通知使用者並保留治理紀錄。',
        ],
      },
    ],
  },
  security: {
    title: '安全漏洞回報政策草案',
    subtitle: 'Security Policy Draft',
    intro: 'TruthShield 處理新聞 URL、登入 token、投票權重、插件 iframe 與付款 callback，資安通報必須有清楚範圍與安全港規則。',
    sections: [
      {
        title: '一、優先回報範圍',
        body: [
          '登入 token、Sanctum token、OAuth callback、provider identity 綁定、後台權限繞過。',
          '投票權重繞過、閱讀門檻繞過、低信任評分繞過、濫用降權繞過、社群自治門檻繞過。',
          '插件 content script、iframe 注入、postMessage、extension nonce、tooltip/status 請求與 localStorage token handoff。',
          'Evidence URL SSRF、私網 URL 繞過、redirect 風險、archive/snapshot pipeline 風險。',
          'ECPay callback 驗簽、訂單狀態偽造、捐款資料外洩。',
        ],
      },
      {
        title: '二、請避免的測試',
        body: [
          '不要破壞資料、修改他人資料、公開真實 token、公開私人證據連結、進行大量壓測或社交工程。',
          '不要對第三方新聞站、圖床、雲端硬碟或付款服務進行未授權測試。',
          '若測試可能影響服務可用性，請先透過私密信箱聯絡。',
        ],
      },
      {
        title: '三、回報內容',
        body: [
          '請提供漏洞摘要、影響範圍、重現步驟、測試帳號、相關 URL、截圖或最小化 PoC。',
          '不要在公開 issue 貼出真實 token、付款識別碼、個資、未公開證據或可直接攻擊的 exploit。',
        ],
      },
      {
        title: '四、處理目標',
        body: [
          'Critical：72 小時內確認收到，7 天內初步修補或緩解。',
          'High：7 天內回覆處理計畫。',
          'Medium：14 天內排程。',
          '正式上線前應提供 security@truthshield.example 或等效私密通報管道。',
        ],
      },
    ],
  },
}

const en = {
  privacy: {
    ...zh.privacy,
    title: 'Privacy Policy Draft',
    intro: 'This is a pre-launch draft for legal review. TruthShield is a news credibility rating and evidence organization platform. It does not sell personal data or process data for advertising tracking.',
  },
  terms: {
    ...zh.terms,
    title: 'Terms of Service Draft',
    intro: 'These terms define how TruthShield may be used. TruthShield does not guarantee that any news article, vote, evidence, or response is correct; it provides public ratings, evidence organization, and transparent governance tools.',
  },
  governance: {
    ...zh.governance,
    title: 'Community Guidelines Draft',
    intro: 'TruthShield governance should make rules, evidence, weights, appeals, and automation inspectable by the community instead of turning administrators into final arbiters.',
  },
  dataProcessing: {
    ...zh.dataProcessing,
    title: 'Data Processing Notice Draft',
    intro: 'This document explains the purpose, visibility, and retention direction of each data category for developers, researchers, and legal review.',
  },
  officialResponse: {
    ...zh.officialResponse,
    title: 'Official Response and Right of Reply Policy Draft',
    intro: 'TruthShield should give authors, media, subjects, and organizations room to respond, without letting that response override community voting or become a PR manipulation channel.',
  },
  security: {
    ...zh.security,
    title: 'Security Vulnerability Reporting Policy Draft',
    intro: 'TruthShield handles news URLs, login tokens, vote weights, extension iframes, and payment callbacks, so security reports need a clear scope and safe-harbor rules.',
  },
}

export function legalDocument(locale, key) {
  const documents = locale === 'en' ? en : zh
  return {
    effectiveDate,
    ...(documents[key] || zh[key]),
  }
}
