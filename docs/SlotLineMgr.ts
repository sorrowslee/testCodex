
/**
 * 繼承SlotLineClass 實作龍骨的表演  by.JH
 *
 * 1.symbol特效生成 Set_Symbol / line特效生成 Set_Line / way特效生成 Set_Way
 * 2.清除函式 Clear_AniGroup_All 有分各物件跟全部
 * 5.取得symbol特效物件 symbol_aniGroup / way_aniGroup / line_aniGroup
 */

class CSlotLineMgr extends SlotLineClass
{
    /**symbol動畫相關容器 */
    private slot_aniSymbolAnchor: eui.Component;
    /**中獎線(Line)動畫相關容器 */
    private slot_aniLineAnchor: eui.Component;
    /**中獎線(Way)動畫相關容器 */
    private slot_aniWayAnchor: eui.Component;

    /**line型的總中獎線數 */
    private slot_total_line_count: number = 0;
    /**中獎線的armatureName名稱 */
    private slot_line_armatureName: string = "";
    /**每輪的起始位置 */
    private slot_arr_posY: number[];

    /**slot symbol龍骨特效 */
    private plate_symbol_aniGroup: Array<Array<RDragonBones>> = new Array<Array<RDragonBones>>();
    /**slot line特效 */
    private plate_line_aniGroup: Array<RDragonBones> = Array<RDragonBones>();
    /**slot way特效 */
    private plate_way_aniGroup: Array<Array<RDragonBones>> = new Array<Array<RDragonBones>>();

    /**是否為長symbol */
    private isLong_Symbol: boolean = false;
    /**設定是否為長symbol */
    set Symbol_Long(isLong: boolean)
    {
        this.isLong_Symbol = isLong;
    }

    /**是否要調整W圖層 */
    private isChangeLayer_Symbol: boolean = true;
    /**設定是否要設調整W圖層 */
    set Symbol_ChangeLayer(isChange: boolean)
    {
        this.isChangeLayer_Symbol = isChange;
    }

    /**取得symbol特效 */
    get symbol_aniGroup(): Array<Array<RDragonBones>>
    {
        return this.plate_symbol_aniGroup;
    }

    /** 取得line特效 */
    get line_aniGroup(): Array<RDragonBones>
    {
        return this.plate_line_aniGroup;
    }

    /**取得way特效 */
    get way_aniGroup(): Array<Array<RDragonBones>>
    {
        return this.plate_way_aniGroup;
    }

    /**特效symbol生成的設定 (備註:可以參考slotController初始化的數值)
   * @param arr_posY 每一輪起始的位置
   * @param symbol_anchor symbol特效的容器(請跟其他容器分開)
   */
    public Set_Symbol(arr_posY: number[], symbol_anchor: eui.Component): void
    {
        this.isChangeLayer_Symbol = true;
        this.slot_arr_posY = arr_posY;
        this.slot_aniSymbolAnchor = symbol_anchor;

        this.InitAni_Symbol();
        this.Clear_AniGroup_Symbol();
    }

    /**產生or檢查 symbol物件 */
    private InitAni_Symbol(): void
    {
        let row_count: number = this.slot_reel_symCount.length;
        let resName: string = GameConfig.page_name + "_a";

        this.Check_Symbol(row_count, this.slot_rowSpace, this.slot_colSpace, resName);
        this.Reset_Symbol_ResName(resName);
    }

    /**檢查Symbol生成or重置*/
    private Check_Symbol(row_count: number, rowSpace: number, colSpace: number, resName): void
    {
        let col_count: number = 0;
        let sym_row_count: number = this.plate_symbol_aniGroup.length;
        let sym_col_count: number = 0;

        for (let x: number = 0; x < row_count; ++x)
        {
            if (x >= sym_row_count)
            {
                let temp_arr: Array<RDragonBones> = new Array<RDragonBones>();
                this.plate_symbol_aniGroup.push(temp_arr);
            }

            col_count = this.slot_reel_symCount[x];
            sym_col_count = this.plate_symbol_aniGroup[x].length;
            for (let y: number = col_count - 1; y >= 0; y--)
            {
                let symbol: RDragonBones;
                if (y >= sym_col_count)
                {
                    //生成symbol特效
                    symbol = new RDragonBones(resName);
                    this.plate_symbol_aniGroup[x][y] = symbol;
                }
                else
                {
                    symbol = this.plate_symbol_aniGroup[x][y];
                }

                symbol.x = (rowSpace / 2) + (rowSpace * x);
                symbol.y = (colSpace / 2) + (colSpace * y) + this.slot_arr_posY[x];
                symbol.name = String(x) + String(y);

                this.slot_aniSymbolAnchor.addChild(symbol);
            }
        }
    }

    /**重置symbol的resName */
    private Reset_Symbol_ResName(resName: string): void
    {
        let row_count: number = this.plate_symbol_aniGroup.length;
        let col_count: number = 0;

        for (let x: number = 0; x < row_count; ++x)
        {
            col_count = this.plate_symbol_aniGroup[x].length;
            for (let y: number = 0; y < col_count; ++y)
            {
                this.plate_symbol_aniGroup[x][y].resName = resName;
                this.plate_symbol_aniGroup[x][y].reset();
            }
        }
    }

    /**特效line生成的設定
    * @param line_count 中獎線數量(line型)
    * @param line_armatureName 中獎線的armatureNam名稱(line型)
    * @param line_anchor line特效的容器(請跟其他容器分開)
    */
    public Set_Line(line_count: number = 0, line_armatureName: string = "", line_anchor: eui.Component): void
    {
        this.slot_total_line_count = line_count;
        this.slot_line_armatureName = line_armatureName;
        this.slot_aniLineAnchor = line_anchor;

        let resName: string = GameConfig.page_name + "_a";

        this.Check_Line(resName);
        this.Clear_AniGroup_Line();
    }

    /**line檢查生成or重置 */
    private Check_Line(resName: string): void
    {
        let lineGroup_length: number = this.plate_line_aniGroup.length;

        if (lineGroup_length <= 0 || lineGroup_length < this.slot_total_line_count)
        {
            this.Create_Line(resName);
        }

        this.Reset_Line_ResName(resName, this.slot_line_armatureName);
    }

    /**line中獎特效生成 */
    private Create_Line(resName: string): void
    {
        //中獎線物件的數量
        let lineGroup_length: number = (this.plate_line_aniGroup.length <= 0) ? 0 : this.plate_line_aniGroup.length - 1;
        //中獎線總數
        let line_total_count: number = this.slot_total_line_count;

        for (let x: number = lineGroup_length; x < line_total_count; ++x)
        {
            let line = new RDragonBones(resName, this.slot_line_armatureName);
            this.plate_line_aniGroup.push(line);
        }
    }

    /**重新設定line */
    private Reset_Line_ResName(resName: string, armatureName: string): void
    {
        //容器的中心點
        let anchor_center_pos = this.slot_aniLineAnchor.globalToLocal(360, 640);
        //中獎線物件的數量
        let lineGroup_length: number = this.plate_line_aniGroup.length;

        for (let x: number = 0; x < lineGroup_length; ++x)
        {
            let line = this.plate_line_aniGroup[x];
            line.x = anchor_center_pos.x;
            line.y = anchor_center_pos.y;
            line.resName = resName;
            line.armatureName = armatureName;
            line.reset();
            this.slot_aniLineAnchor.addChild(line);
        }
    }

    /**特效way生成的設定
    * @param rowSpace 列距
    * @param colSpace 行距
    * @param arr_symCount 每一輪symbol數量
    * @param arr_posY 每一輪起始的位置
    * @param way_anchor way特效的容器(請跟其他容器分開)
    */
    public Set_Way(arr_posY: number[], way_anchor: eui.Component): void
    {
        this.slot_arr_posY = arr_posY;
        this.slot_aniWayAnchor = way_anchor;

        this.InitAni_Way();
        this.Clear_AniGroup_Way();
    }

    /**設置way中獎線特效 */
    private InitAni_Way(): void
    {
        let row_count: number = this.slot_reel_symCount.length;
        let resName: string = GameConfig.page_name + "_a";

        this.Check_Way(row_count, this.slot_rowSpace, this.slot_colSpace, resName);
        this.Reset_Way_ResName(resName);
    }

    /**way檢查生成or重置  */
    private Check_Way(row_count: number, rowSpace: number, colSpace: number, resName): void
    {
        let col_count: number = 0;
        let way_row_count: number = this.plate_way_aniGroup.length;
        let way_col_count: number = 0;

        for (let x: number = 0; x < row_count; ++x)
        {
            if (x >= way_row_count)
            {
                let temp_arr: Array<RDragonBones> = new Array<RDragonBones>();
                this.plate_way_aniGroup.push(temp_arr);
            }

            col_count = this.slot_reel_symCount[x];
            way_col_count = this.plate_way_aniGroup[x].length;
            for (let y: number = 0; y < col_count; ++y)
            {
                let connect: RDragonBones;
                if (y >= way_col_count)
                {
                    //生成symbol特效
                    connect = new RDragonBones(resName, 'Anim_Connect');
                    this.plate_way_aniGroup[x][y] = connect;
                }
                else
                {
                    connect = this.plate_way_aniGroup[x][y];
                }

                connect.x = (rowSpace / 2) + (rowSpace * x);
                connect.y = (colSpace / 2) + (colSpace * y) + this.slot_arr_posY[x];

                this.slot_aniWayAnchor.addChild(connect);
            }
        }
    }

    /**重置way的resName */
    private Reset_Way_ResName(resName: string): void
    {
        let row_count: number = this.plate_way_aniGroup.length;
        let col_count: number = 0;

        for (let x: number = 0; x < row_count; ++x)
        {
            col_count = this.plate_way_aniGroup[x].length;
            for (let y: number = 0; y < col_count; ++y)
            {
                if (this.plate_way_aniGroup.length > 0)
                {
                    this.plate_way_aniGroup[x][y].resName = resName;
                    this.plate_way_aniGroup[x][y].reset();
                }
            }
        }
    }

    //=================================================================================
    //--------------------------單線輪播------------------------------------------------
    //=================================================================================

    /**取的單線分數要顯示在第幾輪(從0開始算) */
    protected Get_ReelIndex_For_SymbolScore(length: number): number
    {
        let reel: number = 0;

        //line類固定第3列
        if (this.type == Line_Type.Line || this.type == Line_Type.Line_way)
        {
            reel = 2;
        }
        //way依中獎數量去決定位置(3、4個:第2列 5個:第3列)-
        else if (this.type == Line_Type.Way)
        {
            reel = (length < 5) ? 1 : 2;
        }

        return reel;
    }

    //==================================================================================
    //--------------------------全線表演------------------------------------------------
    //==================================================================================

    /**檢查中獎線物件 */
    protected Set_AniLine_In_Total(): void
    {
        if (this.winning_list.length <= this.plate_line_aniGroup.length)
        {
            this.Do_LineFnc_In_Total();
        }
        else
        {
            console.log("中獎線物件不夠喔~");
        }
    }

    //======================================================================================
    //---------------------_(┐「ε:)_資料清除_(┐「ε:)_----------------------------------------
    //======================================================================================

    /**關閉物件 */
    protected Clear_ShowObj(): void
    {
        this.Clear_AniGroup_All();
    }

    /**關閉所有動畫(symbol跟中獎線) */
    public Clear_AniGroup_All(): void
    {
        this.Clear_AniGroup_Symbol();

        if (this.type === Line_Type.Line)
        {
            this.Clear_AniGroup_Line();
        }
        else if (this.type === Line_Type.Way)
        {
            this.Clear_AniGroup_Way();
        }
        else if (this.type === Line_Type.Line_way)
        {
            this.Clear_AniGroup_Line();
            this.Clear_AniGroup_Way();
        }
        else
        {
            console.log("說好的 _type 呢? " + this.type);
        }
    }

    /**關閉symbol動畫 */
    public Clear_AniGroup_Symbol(): void
    {
        let row_count: number = this.slot_reel_symCount.length;
        let col_count: number = 0;

        for (let row: number = 0; row < row_count; ++row)
        {
            col_count = this.slot_reel_symCount[row];
            for (let col: number = 0; col < col_count; ++col)
            {
                //開啟slot模組的圖
                this.slot_controller.getSymbol(row, col).visible = true;

                //清除symbol特效
                this.plate_symbol_aniGroup[row][col].release_dragon(false);
                this.plate_symbol_aniGroup[row][col].visible = false;  //release_dragon會把visble設成true
            }
        }
    }

    /**關閉line中獎線動畫 */
    public Clear_AniGroup_Line(): void
    {
        let line_count: number = this.plate_line_aniGroup.length;
        for (let i: number = 0; i < line_count; ++i)
        {
            this.plate_line_aniGroup[i].release_dragon(false);
            this.plate_line_aniGroup[i].visible = false;
        }
    }

    /**關閉way中獎線動畫 */
    public Clear_AniGroup_Way(): void
    {
        let row_count: number = this.plate_way_aniGroup.length;
        let col_count: number = 0;

        for (let row: number = 0; row < row_count; ++row)
        {
            col_count = this.plate_way_aniGroup[row].length;
            for (let col: number = 0; col < col_count; ++col)
            {
                this.plate_way_aniGroup[row][col].release_dragon(false);
                this.plate_way_aniGroup[row][col].visible = false;
            }
        }
    }

    /**分數顯示 */
    public Do_ScoreFnc(row, col, score): void
    {
        this.Set_SymbolScore(row, col, score);

        this.ani_symbolScore.play();
        this.score_TimeOut = SetTimeOutMgr.call_SetTimeOut(function ()
        {
            this.txt_symbolScore.visible = true;
        }.bind(this), 300); //分數延遲顯示
    }

    /**symbol表演 */
    protected Do_SymbolFnc(row: number, col: number, loop: boolean = false): void
    {
        let symbolName: string = this.plate_result[row][col];
        let armatureName: string = "Anim_Sym_" + symbolName;

        if (armatureName == "Anim_Sym_SSW")
        {
            symbolName = "W";
        }

        /**
         * 判斷如果是長條symbol，固定col，調整座標
         * ToDo 利用策略模式分開，並新增大symbol判斷?
         */
        /*if (this.isLong_Symbol && (symbolName.indexOf("W") != -1)) //目前只判斷 W
        {
            col = 0;
            this.plate_symbol_aniGroup[row][col].y = ((this.slot_colSpace * this.slot_reel_symCount[row]) / 2) + this.slot_arr_posY[row];
        }
        else
        {
            this.plate_symbol_aniGroup[row][col].x = (this.slot_rowSpace / 2) + (this.slot_rowSpace * row);
            this.plate_symbol_aniGroup[row][col].y = (this.slot_colSpace / 2) + (this.slot_colSpace * col) + this.slot_arr_posY[row];
        }*/

        if (!this.plate_symbol_aniGroup[row][col].visible)
        {
            //關閉slot模組的圖
            this.slot_controller.getSymbol(row, col).visible = false;

            let num_child = this.slot_aniSymbolAnchor.numChildren;
            let row_num = this.slot_reel_symCount.length;
            let sym_end = this.slot_reel_symCount[row];

            if (this.isChangeLayer_Symbol)
            {
                //如果是wild，將圖層調高
                if (symbolName.indexOf("W") != -1)
                {
                    this.slot_aniSymbolAnchor.setChildIndex(this.plate_symbol_aniGroup[row][col], (num_child - (row_num - row)) - (col + 1));
                }
                else
                {
                    this.slot_aniSymbolAnchor.setChildIndex(this.plate_symbol_aniGroup[row][col], ((num_child - sym_end) - (row_num - row)) - (col + 1));
                }
            }

            //播放中獎龍骨特效
            let loop_count: number = (!loop) ? 1 : 0;
            this.plate_symbol_aniGroup[row][col].info_res_play(armatureName, symbolName, loop_count, false);
        }
    }

    /**中獎框表演 */
    protected Do_WayFnc(row: number, col: number): void
    {
        this.plate_way_aniGroup[row][col].play(0, false, 'Connect');
    };

    /**中獎線表演 */
    protected Do_LineFnc(index: number): void
    {
        let line_number: number = this.winning_line_index_list[index];
        this.plate_line_aniGroup[line_number].play(1, false, String(line_number + 1));
    }
}

const SlotLineMgr = new CSlotLineMgr();

