# cirkitBasic｜電路遊樂場

[開啟線上教具](https://hikaruhen.github.io/cirkitBasic/)

九年級互動電學教具。拖放電池、燈泡、電阻、開關與儀表，自由接線，觀察亮度、電子流動與傳統電流方向。

- 一顆燈、串聯、並聯場景，可繼續自由改接。
- 一般外觀／標準電路符號切換保留同一電路；直接點開關圖示切換通斷。
- 元件可90度旋轉，接柱與導線端點同步轉動，值／量程／播放狀態不變。選元件按旋轉，桌面可按R。
- 點兩端或拖端接線；點線先高亮，再以就近按鈕或Delete斷開。單點端點可新增分支，拖端點改接；無效落點保留原線。
- 可拖轉折點及重整所選線；選取／切圖／播放不重新洗牌走線，誤操作可復原。
- 電子以粒子呈現；傳統電流以帶桿箭頭表示方向與大小，不代表物質。可暫停及慢速。
- 滑桿即時改變電壓／電阻、燈光與流動。毫安培計50/500/5000mA，伏特計3/15/30V，可放大。
- 支援手機直橫向、至少44px接點與選線熱區、最近端點判定、雙指縮放及平移。

## 使用與模型

直接開啟index.html可離線使用，無須登入或安裝。GitHub Pages由main分支根目錄發布。

理想直流電壓源，零阻導線／閉合開關／安培計，無限阻伏特計。燈泡為非線性穩態示意I=0.1V/√(1+|V|)，V以V、I以A；亮度與速度不是實物校準或電子實際漂移速度。

MNA使用秩揭露消去，合法旁路、冗餘開關與等壓並聯電源不凍結全場。欠定支流使用一致代表解作動畫，電流表支流不唯一時局部標未定。真正短路／電源衝突採明示的全場保護，標紅相關部分；仍能改線並恢復。全場保護也暫停獨立的健康電路，不代表每個回路都短路。

不同電氣網路自動避讓，交叉畫弧形跳線。手動轉折可能形成不佳線形，可重整。旋轉儀表的刻度保持正向並可一鍵放大。尚無永久存檔、元件內阻或熱暫態；瀏覽器模擬不等於真實裝置及學生理解驗收。

版本local-20261029-r6-operation；release-manifest.json記錄六個執行檔雜湊。本機備份及教材不包含在發布包。

## 測試與發布

```
node --check sim.js
node --check solver.js
node --check flow.js
node tests/circuit.test.cjs
node tests/flow.test.cjs
node tests/reasonableness-r5.test.cjs
```

瀏覽器測試tests/*-r6.cjs涵蓋144次旋轉、直接開關、短線選取、改接／無效落點／復原、觸控按鈕與圖像模式；需自行安裝playwright與Microsoft Edge。測試截圖由.gitignore排除。

本教具每次修改驗收後接續更新既有線上版，範圍與核對流程見[DEPLOYMENT.md](DEPLOYMENT.md)。

## 授權與來源

新增介面採CC BY-NC 4.0，見LICENSE.md。phet-original.html逐位元保留原檔與授權，為獨立參考模擬，不與本工作區互通。

Simulation by PhET Interactive Simulations, University of Colorado Boulder：[PhET](https://phet.colorado.edu)，[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)。非PhET官方作品；原檔第三方說明與商標註記均保留。
