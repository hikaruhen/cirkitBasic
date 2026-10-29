# 本專案發布與交接慣例

適用範圍僅為電路遊樂場／cirkitBasic，不擴及其他教具或儲存庫。

使用者已要求：此教具每次修改並完成驗收後，接續更新既有線上版，不必再詢問相同的一般發布授權。

- 原始碼修改與驗收先在本機完成，保留上一穩定版；未驗收的中途版本不直接發布。
- 發布目標固定為https://github.com/hikaruhen/cirkitBasic，GitHub Pages為https://hikaruhen.github.io/cirkitBasic/ 。保持既有可見性與發布方式。
- 先核對來源manifest、發布checkout及遠端狀態，保留無關修改，不強推、不改寫遠端歷史、不複製教材或本機歷史備份。
- 本機慣例使用獨立publish-cirkitBasic checkout。執行檔（r7起七個，含safety.js）逐位元同步，更新release-manifest.json；公開測試避免使用個人本機依賴路徑。
- 完成必要測試後正常commit/push。若分支保護要求PR，遵守保護；遇真正權限阻礙才說明具體問題。
- 必須等待Pages建置對應提交成功，實際開啟網址，核對執行檔（r7起七個，含safety.js）SHA256與主要桌面／手機功能。僅push成功不代表部署完成。
- 保存部署提交、網址、時間與驗證結果，最後回報實際可用網址。認證僅在程序記憶體使用，不寫入儲存庫或紀錄。

未來使用者明確要求暫停或只保留本機時，以當次最新指示為準。

當前r11完成必要本機自驗及完整獨立驗收，依既有授權更新正式版。history-r10保留前版與其部署receipt。
