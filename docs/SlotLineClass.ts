
/**
 * slot遊戲 Line跟Way類型 執行單線跟全線表演  by.JH
 *
 * 1.初始化設定 Set_LineController / Init_SymbolScore_RBitmapLabel
 * 2.執行前要給中獎線資料 Set_Winning
 * 3.執行使用 Do_OneLine_Loop / Set_TotalLine / Set_SymbolScore
 * 4.清除函式 Clear_OneLine_Loop
 * 5.複寫函式 Get_ReelIndex_For_SymbolScore
 *            Set_ScoreFnc
 *            Set_AniLine_In_Total
 *            Clear_ShowObj
 *            Do_SymbolFnc
 *            Do_WayFnc
 *            Do_LineFnc
 */

enum Line_Type
{
    Line = 0,
    Way = 1,
    /**同時顯示Line&Way型的中獎方式 */
    Line_way
}

abstract class SlotLineClass
{
    /**slot的類型 */
    protected type: number = Line_Type.Line;
    /**行距(跟symbol圖大小無關) */
    protected slot_rowSpace: number = 140;
    /**列距(跟symbol圖大小無關) */
    protected slot_colSpace: number = 142;
    /**分數相關容器 */
    private slot_aniScoreAnchor: eui.Component;
    /**每輪的symbo數量 */
    protected slot_reel_symCount: number[];

    /**單線播放到第幾線 */
    protected line_index: number = 0;
    /**單線輪播的間隔 */
    private line_next_time: number = 0;
    /**單線執行時的timeOut */
    private oneLine_TimeOut: number = 0;
    /**單線分數顯示的timeOut */
    public score_TimeOut: number = 0;

    /**單線是否要播放聲音 */
    private isSound: boolean = true;

    /**中獎線資料，每一筆資料為一條中獎線，中獎線資料依序為每輪的第幾個symbol (-1代表那輪沒有)
     *  ex : winning_list = [
                [1, 0, 0],
                [0, -1, 2, 0],
                [-1, -1, 1, 0, 1],
            ];
    */
    protected winning_list: Array<Array<number>> = new Array<Array<number>>();
    /**中獎線分數
     *  ex : winning_score = [1.5, 2, 100];
     */
    protected winning_score: Array<number> = new Array<number>();
    /**中獎線的編號
     *  ex : winning_line_index_list = [1, 0, 5];
    */
    protected winning_line_index_list: Array<number> = new Array<number>();
    /**slot盤面(server回傳)
     *  ex : plate_result = [
                ["W", "K", "Q", "SS"],
                ["A", "SD", "10", "SD"],
                ["10", "K", "J", "W"],
                ["W", "SA", "A", "SS"],
                ["SS", "SB", "SC", "W"]
            ];
    */
    protected plate_result: Array<Array<string>> = new Array<Array<string>>();

    /**各遊戲的SlotController(由各gamepage傳入) */
    protected slot_controller: SlotController | SlotControllerPattern = null;

    /**單線的分數 */
    protected txt_symbolScore: RBitmapLabel;
    /**單線的背景 */
    protected ani_symbolScore: RDragonBones;

    /**設定初始資料 */
    public Set_LineController(slot_controller: SlotController | SlotControllerPattern, line_type: Line_Type, rowSpace: number, colSpace: number, arr_symCount: number[]): void
    {
        this.slot_controller = slot_controller;
        this.type = line_type;
        this.slot_rowSpace = rowSpace;
        this.slot_colSpace = colSpace;
        this.slot_reel_symCount = arr_symCount;
    }

    //可以參考ffg用法，或是變數註解裡面的範例
    /**設定中獎線資料
     * @param plate_result slot盤面
     * @param winning_list 中獎symbol位置資料
     * @param winning_score 中獎線分數
     * @param winning_line_index_list 中獎線編號
    */
    public Set_Winning(plate_result: Array<Array<string>>, winning_list: Array<Array<number>>, winning_score: Array<number>, winning_line_index_list: Array<number> = []): void
    {
        this.Init_Winning();

        this.plate_result = plate_result;
        this.winning_list = winning_list;
        this.winning_score = winning_score;
        this.winning_line_index_list = winning_line_index_list;
    }

    /**中獎資料初始化 */
    private Init_Winning(): void
    {
        this.line_index = 0;
        this.isSound = true;

        this.plate_result = [];
        this.winning_list = [];
        this.winning_score = [];
        this.winning_line_index_list = [];

        if (GameConfig.pageConfig[GameConfig.page_name + '_show_line_next_time'] != null)
        {
            this.line_next_time = GameConfig.pageConfig[GameConfig.page_name + '_show_line_next_time'];
        }
        else
        {
            console.log(GameConfig.page_name + '_show_line_next_time' + "數值沒有設定喔");
            this.line_next_time = 100;
        }
    }

    /**設置單線分數文字
     * @param width 寬
     * @param height 高(為所有文字圖檔最高的數值)
     * @param scaleX X縮放大小
     * @param scaleY Y縮放大小
     * @param bitmap_font 套用的美術字名稱
     * @param score_anchor 分數的容器(請跟其他容器分開)
    */
    public Init_SymbolScore_RBitmapLabel(width: number, height: number, scaleX: number, scaleY: number, bitmap_font: string, score_anchor: eui.Component): void
    {
        this.slot_aniScoreAnchor = score_anchor;
        //特效本身已置中
        this.ani_symbolScore = new RDragonBones(GameConfig.page_name + "_b", "Anim_Score", "Score");
        this.slot_aniScoreAnchor.addChild(this.ani_symbolScore);

        this.txt_symbolScore = new RBitmapLabel();
        this.txt_symbolScore.width = width;
        this.txt_symbolScore.scaleX = scaleX;
        this.txt_symbolScore.scaleY = scaleY;
        this.txt_symbolScore.font = bitmap_font;
        this.txt_symbolScore.text = "0,.";  //讓預設的高度為所有圖裡最高的
        this.txt_symbolScore.textAlign = "center";
        this.txt_symbolScore.anchorOffsetX = width / 2;
        this.txt_symbolScore.anchorOffsetY = height / 2;
        this.txt_symbolScore.touchEnabled = false;
        this.txt_symbolScore.visible = false;
        this.slot_aniScoreAnchor.addChild(this.txt_symbolScore);
    }

    //==================================== 單線 =============================================

    /**執行單線輪播 */
    public Do_OneLine_Loop(): void
    {
        this.Set_OneLine();
        this.Do_LineSound();
        this.Update_LineCount();
        this.Do_NextLine();
    }

    /**設定單線要執行的表演 */
    private Set_OneLine(): void
    {
        if (this.Check_ValueIsNumber(this.winning_list[this.line_index]) === false) return;

        this.Do_OneLine_Of_Symbol();
        if (this.type == Line_Type.Line)
        {
            this.Do_LineFnc(this.line_index);
        }
        else if (this.type == Line_Type.Way)
        {
            this.Do_OneLine_Of_Way();
        }
        else if (this.type == Line_Type.Line || this.type == Line_Type.Line_way)
        {
            this.Do_OneLine_Of_Way();
            this.Do_LineFnc(this.line_index);
        }

        //執行單線回傳事件
        EventSystem.on_event(eEvent.slot_oneline);
    }

    /**檢查陣列的資料是否為number */
    private Check_ValueIsNumber(array: any[]): boolean
    {
        let isNumber: boolean = true;
        for (let item of array)
        {
            //判斷資料型態
            if (Utils.isNumber(item) == false)
            {
                console.log("資料類型錯誤喔~");
                isNumber = false;
                return isNumber;
            }
        }
        return isNumber;
    }

    /**單線symbol表演 */
    private Do_OneLine_Of_Symbol(): void
    {
        /**是否有顯示分數 */
        let isShow: boolean = false;
        /**盤面資料 */
        let symbol_plate_result: string[][] = this.plate_result;
        /**單線資料 */
        let winning_line: number[] = this.winning_list[this.line_index];
        /**單線中獎數量 */
        let line_count: number = winning_line.length;
        /**分數顯示在第幾輪 */
        let symScore_ReelIndex: number = this.Get_ReelIndex_For_SymbolScore(line_count);
        /**symbol在第幾行 */
        let col: number = 0;

        for (let symbol_index: number = 0; symbol_index < line_count; ++symbol_index)
        {
            col = winning_line[symbol_index];
            if (col >= 0)
            {
                //symbol表演
                this.Do_SymbolFnc(symbol_index, col);
                //單線分數顯示
                if (symbol_index == symScore_ReelIndex && symbol_plate_result[symbol_index][col] != "SS")
                {
                    isShow = true;
                    this.Do_ScoreFnc(symbol_index, col, this.winning_score[this.line_index]);
                }
            }
        }

        //如果沒顯示，強制顯示在中央
        if (!isShow)
        {
            this.Set_SymboScore_Center();
        }
    }

    /**單線Way表演 */
    private Do_OneLine_Of_Way(): void
    {
        /**單線資料 */
        let winning_line: number[] = this.winning_list[this.line_index];
        /**單線中獎數量 */
        let line_count: number = winning_line.length;
        /**symbol在第幾行 */
        let col: number = 0;

        for (let symbol_index: number = 0; symbol_index < line_count; ++symbol_index)
        {
            col = winning_line[symbol_index];
            if (col >= 0)
            {
                //symbol表演
                this.Do_WayFnc(symbol_index, col);
            }
        }
    }

    /**取的單線分數要顯示在第幾輪(從0開始算) */
    protected abstract Get_ReelIndex_For_SymbolScore(length: number): number

    /**單線分數&背景顯示顯示在中央 */
    private Set_SymboScore_Center(): void
    {
        let row: number = Math.floor(((this.slot_reel_symCount.length - 1) / 2)); //正中間那輪
        let col: number = Math.floor(((this.slot_reel_symCount[row] - 1) / 2));   //當輪中間symbol的位置
        //console.log("symScore ~ row = " + row + " col = " + col);

        this.Do_ScoreFnc(row, col, this.winning_score[this.line_index]);
    }

    /**設置分數演出 */
    protected abstract Do_ScoreFnc(row, col, score): void

    /**單線分數&背景顯示 */
    public Set_SymbolScore(x: number, y: number, score: number, txt_delaytime: number = 0): void
    {
        if (this.ani_symbolScore == null || this.txt_symbolScore == null || score == null)
        {
            console.log("RRRRRRRRRRRRRRRRRRR~ 沒東西喔");
            return;
        }

        let rowSpace: number = this.slot_rowSpace;
        let colSpace: number = this.slot_colSpace;
        let posX: number = (rowSpace / 2) + (rowSpace * x);
        let posY: number = colSpace + (colSpace * y);

        //分數背景動畫
        this.ani_symbolScore.x = posX;
        this.ani_symbolScore.y = posY;
        //分數
        this.txt_symbolScore.x = posX;
        this.txt_symbolScore.y = posY;
        this.txt_symbolScore.init_set_money();
        this.txt_symbolScore.setMoneyText(score);
    }

    /**單線音效播放 */
    private Do_LineSound(): void
    {
        let sound_name = GameConfig.page_name + '_linewin_aac';
        if (this.isSound && RES.hasRes(sound_name))
        {
            SoundMgr.play_more(sound_name);
        }
    }
    /**單線次數累積 */
    private Update_LineCount(): void
    {
        this.line_index++;
        if (this.line_index >= this.winning_list.length)
        {
            this.line_index = 0;
            this.isSound = false;
        }
    }
    /**執行下一條線 */
    private Do_NextLine(): void
    {
        this.oneLine_TimeOut = SetTimeOutMgr.call_SetTimeOut(function ()
        {
            //清除畫面上的特效
            this.Clear_Score();
            this.Clear_ShowObj();

            this.Do_OneLine_Loop();
        }.bind(this), this.line_next_time);
    }

    //==================================== 全線 =============================================

    /**設置全線要執行的表演 */
    public Set_TotalLine(): void
    {
        if (this.Check_TotalLine() === false) return;

        //表演
        this.Do_TotalLine_Of_Fnc(this.Do_SymbolFnc.bind(this));
        if (this.type === Line_Type.Line)
        {
            this.Set_AniLine_In_Total();
        }
        else if (this.type === Line_Type.Way)
        {
            this.Do_TotalLine_Of_Fnc(this.Do_WayFnc.bind(this));
        }
        else if (this.type === Line_Type.Line_way)
        {
            this.Do_TotalLine_Of_Fnc(this.Do_WayFnc.bind(this));
            this.Set_AniLine_In_Total();
        }
    }
    /**檢查全線資料 */
    private Check_TotalLine(): boolean
    {
        let isNumber: boolean = true;
        for (let line of this.winning_list)
        {
            isNumber = this.Check_ValueIsNumber(line);
            if (isNumber === false) return isNumber;
        }
        return isNumber;
    }

    /**執行全線中獎
     * @param Do_Fnc 迴圈中執行的事情
     */
    private Do_TotalLine_Of_Fnc(Do_Fnc: Function): void
    {
        /**所有中獎線的數量 */
        let winning_count: number = this.winning_list.length;
        /**單線中獎數量 */
        let line_count: number = 0;
        /**第幾行 */
        let col: number = 0;

        for (let line_index: number = 0; line_index < winning_count; ++line_index)
        {
            line_count = this.winning_list[line_index].length;
            for (let symbol_index: number = 0; symbol_index < line_count; ++symbol_index)
            {
                col = this.winning_list[line_index][symbol_index];
                if (col >= 0)
                {
                    Do_Fnc(symbol_index, col);
                }
            }
        }
    }


    /**設置全線要執行的表演(Way) 註:新版way不執行單線輪播，所以資料格式有換，之後Refactor完後，再統一修改 */
    public Set_TotalLine_Way(loop:boolean = false): void
    {
        if (this.Check_TotalLine() === false || this.type != Line_Type.Way) return;

        //表演
        this.Do_TotalLine_Of_Fnc_By_Way(loop);
    }

    /**執行全線中獎(Way)
     * @param Do_Fnc 迴圈中執行的事情
     */
    private Do_TotalLine_Of_Fnc_By_Way(loop: boolean = false): void
    {
        /**所有中獎線的數量 */
        let winning_len: number = this.winning_list.length;
        /**單軸顯示數量 */
        let col_count: number = 0;
        /**第幾行 */
        let col: number = 0;

        for (let reel: number = 0; reel < winning_len; ++reel)
        {
            col_count = this.winning_list[reel].length;
            for (let symbol_index: number = 0; symbol_index < col_count; ++symbol_index)
            {
                col = this.winning_list[reel][symbol_index];
                if (col >= 0)
                {
                    this.Do_SymbolFnc(reel, col, loop);
                    this.Do_WayFnc(reel, col);
                }
            }
        }
    }

    /**檢查中獎線物件 */
    protected abstract Set_AniLine_In_Total(): void

    /**中獎線的表演(全線) */
    protected Do_LineFnc_In_Total(): void
    {
        let winning_count: number = this.winning_list.length;
        for (let i = 0; i < winning_count; ++i)
        {
            //中獎線表演
            this.Do_LineFnc(i);
        }
    }

    //======================================================================================
    //---------------------_(┐「ε:)_資料清除_(┐「ε:)_----------------------------------------
    //======================================================================================

    /**清除單線輪播 */
    public Clear_OneLine_Loop(): void
    {
        //清除等待中的TimeOut
        SetTimeOutMgr.clear_one_TimeOut(this.oneLine_TimeOut);
        SetTimeOutMgr.clear_one_TimeOut(this.score_TimeOut);
        //清除畫面上的特效
        this.Clear_Score();
        this.Clear_ShowObj();
    }

    /**關閉單線分數 */
    private Clear_Score(): void
    {
        //關閉單線的分數與背景
        this.ani_symbolScore.reset();
        this.txt_symbolScore.visible = false;
    }

    /**重置畫面(symbol、line、way等特效清除) */
    protected abstract Clear_ShowObj(): void

    /**symbol要做的演出 */
    protected abstract Do_SymbolFnc(row: number, col: number, loop?: boolean): void

    /**中獎框(way)要做的演出 */
    protected abstract Do_WayFnc(row: number, col: number): void

    /**中獎線(line)要做的演出 */
    protected abstract Do_LineFnc(index: number): void

    //======================================================================================
    //----------------------------------資料轉換---------------------------------------------
    //======================================================================================
    //可以參考ffg用法
    /**轉換ss的座標 二維 -> 一維 (備註:如果同一輪有複數的ss也只會取第一個)
     * @param {number[][]} pos
    */
    public Change_SSPos_To_Array(pos: Array<Array<number>>): Array<number>
    {
        let result: Array<number> = [];
        let reel_length: number = pos.length;

        for (let reel: number = 0; reel < reel_length; ++reel)
        {
            if (pos[reel].length <= 0)
            {
                result[reel] = -1;
            }
            else
            {
                result[reel] = pos[reel][0];
            }
        }

        return result;
    }
}