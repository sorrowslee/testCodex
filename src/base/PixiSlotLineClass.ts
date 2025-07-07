import * as PIXI from 'pixi.js';
import { PixiDragonBones } from './PixiDragonBones';

export enum Line_Type {
  Line,
  Way,
  /** Show Line & Way simultaneously */
  Line_way
}

export abstract class SlotLineClass {
  protected type: Line_Type = Line_Type.Line;
  protected slot_rowSpace = 140;
  protected slot_colSpace = 142;
  private slot_aniScoreAnchor?: PIXI.Container;
  protected slot_reel_symCount: number[] = [];

  protected line_index = 0;
  private line_next_time = 100;
  private oneLine_TimeOut?: number;
  public score_TimeOut?: number;

  private isSound = true;

  protected winning_list: Array<Array<number>> = [];
  protected winning_score: Array<number> = [];
  protected winning_line_index_list: Array<number> = [];
  protected plate_result: Array<Array<string>> = [];

  protected slot_controller: any = null;

  protected txt_symbolScore!: PIXI.BitmapText;
  protected ani_symbolScore!: PixiDragonBones;

  public Set_LineController(
    slot_controller: any,
    line_type: Line_Type,
    rowSpace: number,
    colSpace: number,
    arr_symCount: number[]
  ): void {
    this.slot_controller = slot_controller;
    this.type = line_type;
    this.slot_rowSpace = rowSpace;
    this.slot_colSpace = colSpace;
    this.slot_reel_symCount = arr_symCount;
  }

  public Set_Winning(
    plate_result: Array<Array<string>>,
    winning_list: Array<Array<number>>,
    winning_score: Array<number>,
    winning_line_index_list: Array<number> = []
  ): void {
    this.Init_Winning();
    this.plate_result = plate_result;
    this.winning_list = winning_list;
    this.winning_score = winning_score;
    this.winning_line_index_list = winning_line_index_list;
  }

  private Init_Winning(): void {
    this.line_index = 0;
    this.isSound = true;
    this.plate_result = [];
    this.winning_list = [];
    this.winning_score = [];
    this.winning_line_index_list = [];
    this.line_next_time = 100;
  }

  public Init_SymbolScore_BitmapText(
    width: number,
    height: number,
    scaleX: number,
    scaleY: number,
    bitmapFont: string,
    score_anchor: PIXI.Container
  ): void {
    this.slot_aniScoreAnchor = score_anchor;
    this.ani_symbolScore = new PixiDragonBones('common', 'Anim_Score', 'Score');
    this.slot_aniScoreAnchor.addChild(this.ani_symbolScore);

    this.txt_symbolScore = new PIXI.BitmapText('0', {
      fontName: bitmapFont,
      fontSize: height
    });
    this.txt_symbolScore.scale.set(scaleX, scaleY);
    this.txt_symbolScore.pivot.set(width / 2, height / 2);
    this.txt_symbolScore.visible = false;
    this.slot_aniScoreAnchor.addChild(this.txt_symbolScore);
  }

  // ==================== Single Line ====================
  public Do_OneLine_Loop(): void {
    this.Set_OneLine();
    this.Do_LineSound();
    this.Update_LineCount();
    this.Do_NextLine();
  }

  private Set_OneLine(): void {
    if (!this.winning_list[this.line_index]) return;
    if (!this.Check_ValueIsNumber(this.winning_list[this.line_index])) return;

    this.Do_OneLine_Of_Symbol();
    if (this.type === Line_Type.Line) {
      this.Do_LineFnc(this.line_index);
    } else if (this.type === Line_Type.Way) {
      this.Do_OneLine_Of_Way();
    } else if (this.type === Line_Type.Line_way) {
      this.Do_OneLine_Of_Way();
      this.Do_LineFnc(this.line_index);
    }
  }

  private Check_ValueIsNumber(array: any[]): boolean {
    for (const item of array) {
      if (typeof item !== 'number') {
        console.log('資料類型錯誤喔~');
        return false;
      }
    }
    return true;
  }

  private Do_OneLine_Of_Symbol(): void {
    let isShow = false;
    const symbol_plate_result = this.plate_result;
    const winning_line = this.winning_list[this.line_index];
    const line_count = winning_line.length;
    const symScore_ReelIndex = this.Get_ReelIndex_For_SymbolScore(line_count);

    for (let symbol_index = 0; symbol_index < line_count; ++symbol_index) {
      const col = winning_line[symbol_index];
      if (col >= 0) {
        this.Do_SymbolFnc(symbol_index, col);
        if (
          symbol_index === symScore_ReelIndex &&
          symbol_plate_result[symbol_index][col] !== 'SS'
        ) {
          isShow = true;
          this.Do_ScoreFnc(
            symbol_index,
            col,
            this.winning_score[this.line_index]
          );
        }
      }
    }

    if (!isShow) {
      this.Set_SymboScore_Center();
    }
  }

  private Do_OneLine_Of_Way(): void {
    const winning_line = this.winning_list[this.line_index];
    const line_count = winning_line.length;

    for (let symbol_index = 0; symbol_index < line_count; ++symbol_index) {
      const col = winning_line[symbol_index];
      if (col >= 0) {
        this.Do_WayFnc(symbol_index, col);
      }
    }
  }

  protected abstract Get_ReelIndex_For_SymbolScore(length: number): number;

  private Set_SymboScore_Center(): void {
    const row = Math.floor((this.slot_reel_symCount.length - 1) / 2);
    const col = Math.floor((this.slot_reel_symCount[row] - 1) / 2);
    this.Do_ScoreFnc(row, col, this.winning_score[this.line_index]);
  }

  protected abstract Do_ScoreFnc(
    row: number,
    col: number,
    score: number
  ): void;

  public Set_SymbolScore(
    x: number,
    y: number,
    score: number,
    txt_delaytime = 0
  ): void {
    if (!this.ani_symbolScore || !this.txt_symbolScore || score == null) {
      console.log('RRRRRRRRRRRRRRRRRRR~ 沒東西喔');
      return;
    }

    const rowSpace = this.slot_rowSpace;
    const colSpace = this.slot_colSpace;
    const posX = rowSpace / 2 + rowSpace * x;
    const posY = colSpace + colSpace * y;

    this.ani_symbolScore.position.set(posX, posY);
    this.txt_symbolScore.position.set(posX, posY);
    this.txt_symbolScore.text = String(score);

    if (txt_delaytime > 0) {
      this.txt_symbolScore.visible = false;
      this.score_TimeOut = window.setTimeout(() => {
        this.txt_symbolScore.visible = true;
      }, txt_delaytime);
    } else {
      this.txt_symbolScore.visible = true;
    }
  }

  private Do_LineSound(): void {
    // placeholder for sound
  }

  private Update_LineCount(): void {
    this.line_index++;
    if (this.line_index >= this.winning_list.length) {
      this.line_index = 0;
      this.isSound = false;
    }
  }

  private Do_NextLine(): void {
    this.oneLine_TimeOut = window.setTimeout(() => {
      this.Clear_Score();
      this.Clear_ShowObj();
      this.Do_OneLine_Loop();
    }, this.line_next_time);
  }

  // ==================== Total Line ====================
  public Set_TotalLine(): void {
    if (this.Check_TotalLine() === false) return;

    this.Do_TotalLine_Of_Fnc(this.Do_SymbolFnc.bind(this));
    if (this.type === Line_Type.Line) {
      this.Set_AniLine_In_Total();
    } else if (this.type === Line_Type.Way) {
      this.Do_TotalLine_Of_Fnc(this.Do_WayFnc.bind(this));
    } else if (this.type === Line_Type.Line_way) {
      this.Do_TotalLine_Of_Fnc(this.Do_WayFnc.bind(this));
      this.Set_AniLine_In_Total();
    }
  }

  public Set_TotalLine_Way(loop = false): void {
    if (this.Check_TotalLine() === false || this.type !== Line_Type.Way) return;
    this.Do_TotalLine_Of_Fnc_By_Way(loop);
  }

  private Check_TotalLine(): boolean {
    for (const line of this.winning_list) {
      if (!this.Check_ValueIsNumber(line)) return false;
    }
    return true;
  }

  private Do_TotalLine_Of_Fnc(Do_Fnc: Function): void {
    const winning_count = this.winning_list.length;
    for (let line_index = 0; line_index < winning_count; ++line_index) {
      const line_count = this.winning_list[line_index].length;
      for (let symbol_index = 0; symbol_index < line_count; ++symbol_index) {
        const col = this.winning_list[line_index][symbol_index];
        if (col >= 0) {
          Do_Fnc(symbol_index, col);
        }
      }
    }
  }

  private Do_TotalLine_Of_Fnc_By_Way(loop = false): void {
    const winning_len = this.winning_list.length;
    for (let reel = 0; reel < winning_len; ++reel) {
      const col_count = this.winning_list[reel].length;
      for (let symbol_index = 0; symbol_index < col_count; ++symbol_index) {
        const col = this.winning_list[reel][symbol_index];
        if (col >= 0) {
          this.Do_SymbolFnc(reel, col, loop);
          this.Do_WayFnc(reel, col);
        }
      }
    }
  }

  protected abstract Set_AniLine_In_Total(): void;

  protected Do_LineFnc_In_Total(): void {
    const winning_count = this.winning_list.length;
    for (let i = 0; i < winning_count; ++i) {
      this.Do_LineFnc(i);
    }
  }

  public Clear_OneLine_Loop(): void {
    if (this.oneLine_TimeOut) clearTimeout(this.oneLine_TimeOut);
    if (this.score_TimeOut) clearTimeout(this.score_TimeOut);
    this.Clear_Score();
    this.Clear_ShowObj();
  }

  private Clear_Score(): void {
    this.ani_symbolScore?.stop();
    this.txt_symbolScore.visible = false;
  }

  protected abstract Clear_ShowObj(): void;
  protected abstract Do_SymbolFnc(
    row: number,
    col: number,
    loop?: boolean
  ): void;
  protected abstract Do_WayFnc(row: number, col: number): void;
  protected abstract Do_LineFnc(index: number): void;

  public Change_SSPos_To_Array(pos: Array<Array<number>>): Array<number> {
    const result: number[] = [];
    const reel_length = pos.length;
    for (let reel = 0; reel < reel_length; ++reel) {
      if (pos[reel].length <= 0) {
        result[reel] = -1;
      } else {
        result[reel] = pos[reel][0];
      }
    }
    return result;
  }
}
