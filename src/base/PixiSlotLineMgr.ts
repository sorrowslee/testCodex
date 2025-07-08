import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';
import { SlotLineClass, Line_Type } from './PixiSlotLineClass';
declare const SetTimeOutMgr: {
  call_SetTimeOut(cb: () => void, time: number): number;
};

/**
 * PixiSlotLineMgr
 * Translated from CSlotLineMgr for use with Pixi.js.
 * Manages slot line animations using PixiDragonBones.
 */
class PixiSlotLineMgr extends SlotLineClass {
  /** Current game code used for loading DragonBones assets */
  private gameCode = '';

  public setGameCode(code: string): void {
    this.gameCode = code;
  }
  private slot_aniSymbolAnchor!: PIXI.Container;
  private slot_aniLineAnchor!: PIXI.Container;
  private slot_aniWayAnchor!: PIXI.Container;

  private slot_total_line_count = 0;
  private slot_line_armatureName = '';
  private slot_arr_posY!: number[];

  private plate_symbol_aniGroup: Array<Array<PixiDragonBones>> = [];
  private plate_line_aniGroup: Array<PixiDragonBones> = [];
  private plate_way_aniGroup: Array<Array<PixiDragonBones>> = [];

  private isLong_Symbol = false;
  set Symbol_Long(isLong: boolean) {
    this.isLong_Symbol = isLong;
  }

  private isChangeLayer_Symbol = true;
  set Symbol_ChangeLayer(isChange: boolean) {
    this.isChangeLayer_Symbol = isChange;
  }

  get symbol_aniGroup(): Array<Array<PixiDragonBones>> {
    return this.plate_symbol_aniGroup;
  }
  get line_aniGroup(): Array<PixiDragonBones> {
    return this.plate_line_aniGroup;
  }
  get way_aniGroup(): Array<Array<PixiDragonBones>> {
    return this.plate_way_aniGroup;
  }

  /**
   * 初始化 Symbol 動畫
   */
  public Set_Symbol(arr_posY: number[], symbol_anchor: PIXI.Container): void {
    this.isChangeLayer_Symbol = true;
    this.slot_arr_posY = arr_posY;
    this.slot_aniSymbolAnchor = symbol_anchor;

    this.InitAni_Symbol();
    this.Clear_AniGroup_Symbol();
  }

  private InitAni_Symbol(): void {
    const row_count = this.slot_reel_symCount.length;
    const resName = this.gameCode + '_a';

    this.Check_Symbol(row_count, this.slot_rowSpace, this.slot_colSpace, resName);
    this.Reset_Symbol_ResName(resName);
  }

  private Check_Symbol(row_count: number, rowSpace: number, colSpace: number, resName: string): void {
    let col_count = 0;
    let sym_row_count = this.plate_symbol_aniGroup.length;
    let sym_col_count = 0;

    for (let x = 0; x < row_count; ++x) {
      if (x >= sym_row_count) {
        this.plate_symbol_aniGroup.push([]);
      }

      col_count = this.slot_reel_symCount[x];
      sym_col_count = this.plate_symbol_aniGroup[x].length;
      for (let y = col_count - 1; y >= 0; y--) {
        let symbol: PixiDragonBones;
        if (y >= sym_col_count) {
          symbol = new PixiDragonBones(this.gameCode, resName, '');
          this.plate_symbol_aniGroup[x][y] = symbol;
        } else {
          symbol = this.plate_symbol_aniGroup[x][y];
        }

        symbol.position.set(
          rowSpace / 2 + rowSpace * x,
          colSpace / 2 + colSpace * y + this.slot_arr_posY[x]
        );
        symbol.name = String(x) + String(y);

        this.slot_aniSymbolAnchor.addChild(symbol);
      }
    }
  }

  private Reset_Symbol_ResName(_resName: string): void {
    const row_count = this.plate_symbol_aniGroup.length;
    for (let x = 0; x < row_count; ++x) {
      const col_count = this.plate_symbol_aniGroup[x].length;
      for (let y = 0; y < col_count; ++y) {
        this.plate_symbol_aniGroup[x][y].stop();
        this.plate_symbol_aniGroup[x][y].visible = false;
      }
    }
  }

  /**
   * 初始化 Line 動畫
   */
  public Set_Line(line_count = 0, line_armatureName = '', line_anchor: PIXI.Container): void {
    this.slot_total_line_count = line_count;
    this.slot_line_armatureName = line_armatureName;
    this.slot_aniLineAnchor = line_anchor;

    const resName = this.gameCode + '_a';

    this.Check_Line(resName);
    this.Clear_AniGroup_Line();
  }

  private Check_Line(resName: string): void {
    const lineGroup_length = this.plate_line_aniGroup.length;

    if (lineGroup_length <= 0 || lineGroup_length < this.slot_total_line_count) {
      this.Create_Line(resName);
    }

    this.Reset_Line_ResName(resName, this.slot_line_armatureName);
  }

  private Create_Line(resName: string): void {
    const lineGroup_length = this.plate_line_aniGroup.length <= 0 ? 0 : this.plate_line_aniGroup.length - 1;
    const line_total_count = this.slot_total_line_count;

    for (let x = lineGroup_length; x < line_total_count; ++x) {
      const line = new PixiDragonBones(this.gameCode, resName, this.slot_line_armatureName);
      this.plate_line_aniGroup.push(line);
    }
  }

  private Reset_Line_ResName(_resName: string, _armatureName: string): void {
    const anchor_center_pos = new PIXI.Point(
      this.slot_aniLineAnchor.width / 2,
      this.slot_aniLineAnchor.height / 2
    );
    const lineGroup_length = this.plate_line_aniGroup.length;

    for (let x = 0; x < lineGroup_length; ++x) {
      const line = this.plate_line_aniGroup[x];
      line.position.set(anchor_center_pos.x, anchor_center_pos.y);
      line.stop();
      this.slot_aniLineAnchor.addChild(line);
    }
  }

  /**
   * 初始化 Way 動畫
   */
  public Set_Way(arr_posY: number[], way_anchor: PIXI.Container): void {
    this.slot_arr_posY = arr_posY;
    this.slot_aniWayAnchor = way_anchor;

    this.InitAni_Way();
    this.Clear_AniGroup_Way();
  }

  private InitAni_Way(): void {
    const row_count = this.slot_reel_symCount.length;
    const resName = this.gameCode + '_a';

    this.Check_Way(row_count, this.slot_rowSpace, this.slot_colSpace, resName);
    this.Reset_Way_ResName(resName);
  }

  private Check_Way(row_count: number, rowSpace: number, colSpace: number, resName: string): void {
    let col_count = 0;
    const way_row_count = this.plate_way_aniGroup.length;
    let way_col_count = 0;

    for (let x = 0; x < row_count; ++x) {
      if (x >= way_row_count) {
        this.plate_way_aniGroup.push([]);
      }

      col_count = this.slot_reel_symCount[x];
      way_col_count = this.plate_way_aniGroup[x].length;
      for (let y = 0; y < col_count; ++y) {
        let connect: PixiDragonBones;
        if (y >= way_col_count) {
          connect = new PixiDragonBones(this.gameCode, resName, 'Anim_Connect');
          this.plate_way_aniGroup[x][y] = connect;
        } else {
          connect = this.plate_way_aniGroup[x][y];
        }

        connect.position.set(
          rowSpace / 2 + rowSpace * x,
          colSpace / 2 + colSpace * y + this.slot_arr_posY[x]
        );

        this.slot_aniWayAnchor.addChild(connect);
      }
    }
  }

  private Reset_Way_ResName(_resName: string): void {
    const row_count = this.plate_way_aniGroup.length;
    for (let x = 0; x < row_count; ++x) {
      const col_count = this.plate_way_aniGroup[x].length;
      for (let y = 0; y < col_count; ++y) {
        this.plate_way_aniGroup[x][y].stop();
        this.plate_way_aniGroup[x][y].visible = false;
      }
    }
  }

  protected Get_ReelIndex_For_SymbolScore(length: number): number {
    let reel = 0;
    if (this.type == Line_Type.Line || this.type == Line_Type.Line_way) {
      reel = 2;
    } else if (this.type == Line_Type.Way) {
      reel = length < 5 ? 1 : 2;
    }
    return reel;
  }

  protected Set_AniLine_In_Total(): void {
    if (this.winning_list.length <= this.plate_line_aniGroup.length) {
      this.Do_LineFnc_In_Total();
    } else {
      console.log('中獎線物件不夠喔~');
    }
  }

  protected Clear_ShowObj(): void {
    this.Clear_AniGroup_All();
  }

  public Clear_AniGroup_All(): void {
    this.Clear_AniGroup_Symbol();

    if (this.type === Line_Type.Line) {
      this.Clear_AniGroup_Line();
    } else if (this.type === Line_Type.Way) {
      this.Clear_AniGroup_Way();
    } else if (this.type === Line_Type.Line_way) {
      this.Clear_AniGroup_Line();
      this.Clear_AniGroup_Way();
    } else {
      console.log('說好的 _type 呢? ' + this.type);
    }
  }

  public Clear_AniGroup_Symbol(): void {
    const row_count = this.slot_reel_symCount.length;
    let col_count = 0;

    for (let row = 0; row < row_count; ++row) {
      col_count = this.slot_reel_symCount[row];
      for (let col = 0; col < col_count; ++col) {
        this.slot_controller.getSymbol(row, col).visible = true;
        this.plate_symbol_aniGroup[row][col].stop();
        this.plate_symbol_aniGroup[row][col].visible = false;
      }
    }
  }

  public Clear_AniGroup_Line(): void {
    const line_count = this.plate_line_aniGroup.length;
    for (let i = 0; i < line_count; ++i) {
      this.plate_line_aniGroup[i].stop();
      this.plate_line_aniGroup[i].visible = false;
    }
  }

  public Clear_AniGroup_Way(): void {
    const row_count = this.plate_way_aniGroup.length;
    let col_count = 0;

    for (let row = 0; row < row_count; ++row) {
      col_count = this.plate_way_aniGroup[row].length;
      for (let col = 0; col < col_count; ++col) {
        this.plate_way_aniGroup[row][col].stop();
        this.plate_way_aniGroup[row][col].visible = false;
      }
    }
  }

  public Do_ScoreFnc(row: number, col: number, score: any): void {
    this.Set_SymbolScore(row, col, score);

    this.ani_symbolScore.play();
    this.score_TimeOut = SetTimeOutMgr.call_SetTimeOut(() => {
      this.txt_symbolScore.visible = true;
    }, 300);
  }

  protected Do_SymbolFnc(row: number, col: number, loop = false): void {
    let symbolName = this.plate_result[row][col];
    let armatureName = 'Anim_Sym_' + symbolName;

    if (armatureName == 'Anim_Sym_SSW') {
      symbolName = 'W';
    }

    if (!this.plate_symbol_aniGroup[row][col].visible) {
      // Keep original symbol visible so it doesn't disappear while the
      // DragonBones animation plays on top of it.
      const loop_flag = !loop;
      this.plate_symbol_aniGroup[row][col].visible = true;
      this.plate_symbol_aniGroup[row][col].play(symbolName, loop_flag);
    }
  }

  protected Do_WayFnc(row: number, col: number): void {
    this.plate_way_aniGroup[row][col].visible = true;
    this.plate_way_aniGroup[row][col].play('Connect', false);
  }

  protected Do_LineFnc(index: number): void {
    const lineIndex = this.winning_line_index_list[index];
    this.plate_line_aniGroup[lineIndex].visible = true;
    const animName = String(lineIndex + 1);
    PixiDragonBones.play(this.plate_line_aniGroup[lineIndex], animName, 1);
  }
}

const SlotLineMgr = new PixiSlotLineMgr();
export { PixiSlotLineMgr, SlotLineMgr };
