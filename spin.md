按下 SPIN 鍵後，程式呼叫 BaseSlotGame 的 spin()。spin() 會為每個轉輪建立 PIXI.Ticker 並開始以固定速度推動符號。當某個符號滑出可視範圍時，程式會隨機從 currentSymbols 中挑選名稱，立即在前端替換新符號並記錄名稱，因此過程中盤面上的非得獎符號完全由前端決定。【F:src/base/BaseSlotGame.ts†L630-L679】

當時間滿足對應轉輪的 spinTimes 後，Ticker 停止，並呼叫 populateReel() 為該轉輪產生最終符號。populateReel() 亦是用 Math.random() 從 currentSymbols 中抽選，每列逐一設定名稱與貼圖（除非設定 testPlateOpen 為真，才會改用指定盤面）。這些最終符號構成完整盤面。【F:src/base/BaseSlotGame.ts†L372-L404】

所有轉輪停下後，findLines() 會掃描盤面，依遊戲規則判斷連線並回傳中獎格子。可見專案中未找到任何向後端請求盤面資料的程式碼，非得獎符號與整體盤面均在前端隨機生成，再由 findLines() 本地計算得獎結果。【F:src/base/BaseSlotGame.ts†L424-L467】
