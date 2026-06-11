# TruthShield Chrome Web Store Listing - 0.1.26

## Package

- Chrome ZIP: `dist/truthshield-extension-v0.1.26.zip`
- Public download copy: `public/truthshield-extension-v0.1.26.zip`
- Submit only after the production API includes the 0.1.26 reaction/scoring changes.
- Do not add a Firefox store button on the website until the AMO listing is live.

## Short Description

### zh-TW

在新聞頁補上社群標籤、公開證據、事件時間線與脈絡需求。

### en

Add community labels, public evidence, timelines, and context requests to news pages.

## Detailed Description

### zh-TW

TruthShield 真相護盾不審查、不刪新聞，也不替你決定能不能看什麼。

它會在新聞頁補上一層可檢查的脈絡：社群加權標籤、公開證據、事件時間線、人物與組織關係、以及讀者還需要哪些來源或說明。

你可以用 TruthShield：

- 查看這篇新聞目前有哪些社群標籤與證據。
- 補充官方來源、原始文件、時間線或背景脈絡。
- 評價證據的可信度、相關性，以及它是支持、反駁或補充脈絡。
- 在事件頁追蹤同一議題的多篇報導與後續發展。
- 保留心情反應，但把它視為輔助訊號，不讓它取代證據與脈絡。

0.1.26 更新重點：

- 心情功能保留，但不再佔用主要查證流程的最大版面。
- 新增更貼近日常語感的反應選項，例如「很瞎」。
- 新聞頁橫幅降低干擾，重點回到結果、投票、證據與事件脈絡。
- 開始支援同篇新聞聚合與證據優先評分所需的資料欄位。

TruthShield 的目標不是讓另一個平台替新聞下判決，而是讓讀者更容易看到公開證據、不同來源和可追溯的整理過程。

### en

TruthShield does not censor news, remove content, or decide what you are allowed to read.

It adds an inspectable context layer to news pages: community-weighted labels, public evidence, event timelines, people and organization context, and open requests for missing sources.

With TruthShield, you can:

- See current community labels and evidence for a news article.
- Add official sources, original documents, timelines, or background context.
- Review evidence by credibility, relevance, and whether it supports, refutes, or adds context.
- Track related reports and follow-up developments on event pages.
- Keep reader reactions as a secondary signal without replacing evidence and context.

Version 0.1.26:

- Keeps reader reactions, while reducing their prominence in the main verification flow.
- Adds more natural reaction options, including the zh-TW reaction "很瞎".
- Makes the news-page banner less distracting and shifts focus back to results, voting, evidence, and event context.
- Prepares data support for same-story clustering and evidence-first scoring.

TruthShield is built to make public evidence, source differences, and transparent context easier to inspect.

## Release Notes

### zh-TW

0.1.26 調整新聞頁 UI 與心情呈現方式，保留心情但降低干擾，新增「很瞎」反應，並加入同篇新聞聚合與證據優先評分的前後端基礎。

### en

0.1.26 updates the news-page UI and reader reactions, keeps reactions as a secondary signal, adds the zh-TW "很瞎" reaction, and adds backend/frontend groundwork for story clustering and evidence-first scoring.

## Manual Chrome Web Store Steps

1. Confirm the production API has been deployed with the 0.1.26 backend changes.
2. Open the Chrome Web Store Developer Dashboard.
3. Select TruthShield.
4. Upload `dist/truthshield-extension-v0.1.26.zip`.
5. Paste the updated short and detailed descriptions above.
6. Submit for review.
