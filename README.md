# cirkitBasic｜電路遊樂場

九年級互動電學教具。拖放電池、燈泡、電阻、開關與儀表，自由接線，觀察亮度、電子流動與傳統電流方向。

- 一顆燈、串聯、並聯一鍵場景，可繼續自由改接。
- 一般外觀與標準電路符號在同一工作區切換，保留所有電路狀態。
- 電子以粒子呈現；傳統電流以帶桿箭頭表示，不代表物質。可暫停及慢速。
- 電池與電阻滑桿即時改變求解、燈光與流動。毫安培計50/500/5000mA，伏特計3/15/30V，可放大。
- 支援觸控拖線、端點吸附、拖放、雙指縮放、平移、復原及手機直橫向。

## 使用

直接開啟index.html，可離線使用，無須登入或安裝。GitHub Pages由main分支根目錄發布。

點兩個接柱可接線；也可拖線至另一接柱。點元件調整，拖元件移動。剪刀模式浮顯導線，點線可剪開，再按復原接回。右上切換圖示，底部切換電子／傳統電流與動畫播放。

## 模型

理想直流電壓源、零電阻導線／閉合開關／安培計、無限電阻伏特計。燈泡採非線性穩態示意I=0.1V/√(1+|V|)，V以V、I以A；亮度與速度為教學示意，不是實物校準或電子實際漂移速度。

修正節點分析使用秩揭露消去：合法旁路、冗餘閉合開關、等壓並聯電源不凍結全場；欠定支流使用一致代表解作動畫，電流表支流不唯一時局部標未定。真正短路或衝突電源會明示全場保護，標紅相關部分；改接線後恢復。全場保護也暫停獨立的健康電路，並非判定每個回路都短路。

不同電氣網路自動避讓；交叉畫出弧形跳線。未提供手動轉折點、元件旋轉、永久存檔、內阻或熱暫態。瀏覽器裝置模擬不等於實體裝置／學生理解驗收。

版本local-20261029-r5-circuits，release-manifest.json記錄發布的六個原始執行檔雜湊。歷史版本與提供的教材僅保留於本機，不包含在發布包。

## 測試

```
node --check sim.js
node --check solver.js
node --check flow.js
node tests/circuit.test.cjs
node tests/flow.test.cjs
node tests/reasonableness-r5.test.cjs
```

三組物理檢查涵蓋串並聯、分流、旁路、冗餘開關、電源衝突、量測未定及故障恢復。瀏覽器操作測試位於tests/*-r5.cjs及觸控回歸腳本；需自行安裝playwright及Microsoft Edge後執行。測試截圖已由.gitignore排除。

## 授權與來源

新增教具介面採CC BY-NC 4.0，詳見LICENSE.md。phet-original.html保留原檔與授權，是獨立參考模擬，未與本工作區互通。

Simulation by PhET Interactive Simulations, University of Colorado Boulder：[PhET](https://phet.colorado.edu)，[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)。非PhET官方作品；原檔第三方說明與商標註記均保留。
