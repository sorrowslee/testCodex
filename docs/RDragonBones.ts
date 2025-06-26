// Desc : DragonBones 的控制實體
// Date : 2018/09/27 Min

class RDragonBones extends eui.Component
{
    // 骨架對象
    public armature: dragonBones.Armature = undefined;
    // 檔案名
    public resName: string = "";
    // 骨架名
    public armatureName: string = "";
    // 動畫名
    public animationName: string = "";
    // 顯示容器
    public get display(): dragonBones.EgretArmatureDisplay
    {
        if (this.armature == undefined)
            return undefined;
        return this.armature.display;
    }
    // slot的index
    public slot_index: number = -1;

    private BindEvevntFun: Function;

    // 播放次數
    private playTimes: number = 1;
    // 是否需要隱藏
    private is_hide: boolean = false;
    // Loop撥放的事件關鍵字
    private end_event: string = "undefined";
    // Loop播放的事件的開始時間
    private ReStartTime: number = -1;

    private ishaveEvent: boolean = false;

    //-------------------------------------------
    // 創建一個通用龍骨動畫介面 - 存放資源 、 骨架 、 動畫名稱
    //-------------------------------------------
    /** 創建一個通用龍骨動畫介面
     * - 存放資源、骨架、動畫名稱
     * @param resName 導入的資源包名稱 @param armatureName 使用的骨架名稱 @param animationName 預設的動畫名稱-通常推薦留空 */
    public constructor(resName: string = "", armatureName: string = "", animationName: string = "")
    {
        super();
        if (resName != "")
        {
            this.resName = resName;
            this.armatureName = armatureName;
            this.animationName = animationName;
        }
        // 設成點不到 就算這邊設成禁止，也有可能因為父級容器沒禁用導致 擋住其他按鈕
        this.touchEnabled = false;

        this.BindEvevntFun = this.on_switch_scene.bind(this);
        // 註冊切換場景事件
        this.ishaveEvent = true;
        EventSystem.register_event(EventSystem.get_now_scene(), eEvent.switch_scene, this.BindEvevntFun);
    }

    /** 播放動畫
     * - 會先去取得骨架 參考 #init
     * @param playTimes 播放次數設定 若為0 則無限循環 @param is_hide 撥放完後是否需要隱藏? @param animationName 要播放的動畫名稱 @param timeScale 播放的速度 */
    public play(playTimes: number = this.playTimes, is_hide: boolean = undefined, animationName: string = "", timeScale: number = 1): void
    {
        // 做一下龍骨的初使化
        this.init_dragon();
        // 取骨架
        if (is_hide != undefined)
            this.is_hide = is_hide;
        // 設定上動畫名
        if (animationName != "")
            this.animationName = animationName;
        // 做播放的動作
        this.armature.animation.play(this.animationName, playTimes).timeScale = timeScale;


    }

    /** 停止動畫撥放 */
    public stop()
    {
        // 沒有實例 不做
        if (this.armature == null)
            return;
        // 停止
        this.armature.animation.stop();
    }

    /** 繼續撥放動畫 */
    public continue(): void
    {
        if (this.armature == null)
            return;
        this.armature.animation.play();
    }

    /** 重新設定資源檔案並撥放
     * - 若有切換骨架、資源檔案時才需要使用
     * @param armatureName 骨架名稱 @param animationName 動畫名稱 @param times 播放次數設定 若為0 則無限循環 @param is_hide 撥放完後是否需要隱藏? */
    public info_res_play(armatureName: string, animationName: string, times: number = 1, is_hide: boolean = false)
    {
        // 如果一樣 就直接play
        if (this.armatureName == armatureName)
        {
            this.play(times, is_hide, animationName);
            return;
        }
        this.release_dragon(false);
        // 設定為指定的骨架名稱、動畫名稱
        this.armatureName = armatureName;
        this.animationName = animationName;
        this.init_dragon();
        // 再跑起來
        this.play(times, is_hide);
    }

    /** 重新設定資源檔案並停止於指的時間
     * - 若有切換骨架、資源檔案時才需要使用
     * @param armatureName 骨架名稱 @param animationName 動畫名稱 @param time 要停止的時間(單位 秒) */
    public info_res_gotoAndStopByTime(armatureName: string, animationName: string, time: number)
    {
        // 如果一樣 就直接play
        if (this.armatureName == armatureName)
        {
            this.gotoAndStopByTime(time, animationName);
            return;
        }
        // 清空內容
        this.release_dragon(false);
        // 設定為指定的骨架名稱、動畫名稱
        this.armatureName = armatureName;
        this.animationName = animationName;
        this.init_dragon();
        // 再做播放的動作
        this.gotoAndStopByTime(time, animationName);
    }

    /** 重新設定資源檔案並從指定的時間開始播放
     * - 若有切換骨架、資源檔案時才需要使用
     * @param armatureName 骨架名稱 @param animationName 動畫名稱 @param time 要開始的時間(單位 秒) @param times 播放次數 */
    public info_res_gotoAndPlayByTime(armatureName: string, animationName: string, time: number, times: number = 1)
    {
        // 如果一樣 就直接play
        if (this.armatureName == armatureName)
        {
            this.gotoAndPlayByTime(times, animationName, time);
            return;
        }
        // 清空內容
        this.release_dragon(false);
        // 設定為指定的骨架名稱、動畫名稱
        this.armatureName = armatureName;
        this.animationName = animationName;
        this.init_dragon();
        // 再做播放的動作
        this.gotoAndPlayByTime(times, animationName, time);
    }

    /** 重新設定資源檔案並從指定的時間開始播放
     * - 若有切換骨架、資源檔案時才需要使用
     * @param armatureName 骨架名稱 @param animationName 動畫名稱 @param time 要開始的時間(單位 秒) @param times 播放次數 */
    public info_res_gotoAndPlayByFrame(armatureName: string, animationName: string, frame: number, times: number = 1)
    {
        // 如果一樣 就直接play
        if (this.armatureName == armatureName)
        {
            this.gotoAndPlayByFrame(times, animationName, frame);
            return;
        }
        // 清空內容
        this.release_dragon(false);
        // 設定為指定的骨架名稱、動畫名稱
        this.armatureName = armatureName;
        this.animationName = animationName;
        this.init_dragon();
        // 再做播放的動作
        this.gotoAndPlayByFrame(times, animationName, frame);
    }

    /** 將動畫從指定的時間開始播放
     * @param times 播放次數 @param animationName 動畫名稱 @param time  開始撥放的時間(單位 秒) */
    public gotoAndPlayByTime(times: number, animationName: string = this.animationName, time: number): void
    {
        // 設定上動畫名
        this.animationName = animationName;
        // 取骨架
        this.init_dragon();
        // 撥放
        this.visible = true;
        this.armature.animation.gotoAndPlayByTime(animationName, time, times);

    }

    /** 將動畫停止到指定的時間
     * @param time 要停止的時間(單位 秒) @param animationName 動畫名稱 */
    public gotoAndStopByTime(time: number, animationName: string = this.animationName): void
    {
        this.animationName = animationName;
        // 取骨架
        this.init_dragon();
        // 撥放
        this.visible = true;
        this.armature.animation.gotoAndStopByTime(animationName, time);
    }

    /** 將動畫從指定的Frame開始播放
     * @param times 播放次數 @param animationName 動畫名稱 @param time  開始撥放的時間(單位 秒) */
    public gotoAndPlayByFrame(times: number, animationName: string = this.animationName, frame: number): void
    {
        // 設定上動畫名
        this.animationName = animationName;
        // 取骨架
        this.init_dragon();
        // 撥放
        this.visible = true;
        this.armature.animation.gotoAndPlayByFrame(animationName, frame, times);

    }

    /** 將動畫停止到指定的Frame
     * @param time 要停止的時間(單位 秒) @param animationName 動畫名稱 */
    public gotoAndStopByFrame(frame: number, animationName: string = this.animationName): void
    {
        this.animationName = animationName;
        // 取骨架
        this.init_dragon();
        // 撥放
        this.visible = true;
        this.armature.animation.gotoAndStopByFrame(animationName, frame);
    }

    /** 取得 動畫撥放時間 單位: 毫秒
     * @param animationName 動畫名稱 */
    public get_animation_times(animationName: string, newArmatureName?: string)
    {
        let armatureName = newArmatureName == null ? this.armatureName : newArmatureName;
        let armature = DragonBonesMgr.get_armature(this.resName, armatureName);
        if (armature != null
            && armature.animation != null
            && armature.animation.animations[animationName] != null)
        {
            return armature.animation.animations[animationName].duration * 1000;
        }
        return 0;
    }

    public gotoLastFrameAndStop(armatureName: string = this.armatureName, animationName: string = this.animationName)
    {
        this.info_res_play(armatureName, animationName);
        var TotalTime: number = this.get_animation_times(animationName);
        TotalTime = MathUtils.div(TotalTime, 1000);
        this.info_res_gotoAndStopByTime(armatureName, animationName, TotalTime);
    }

    //-------------------------------------------
    // 重設動畫資訊並隱藏
    //-------------------------------------------
    /** 重設動畫資訊並隱藏 */
    public reset()
    {
        // 如果沒有就不做
        this.clear_value();
        if (this.armature == null)
            return;
        this.armature.animation.reset();
        this.visible = false;
    }
    /** 重製Loop判斷變數 */
    private clear_value()
    {
        this.playTimes = 1;
        this.end_event = "undefined";
        this.ReStartTime = -1;
    }

    //-------------------------------------------
    // 開始播放 呼叫的call back
    //-------------------------------------------
    /** 開始播放 呼叫的call back */
    private on_start_play(): void
    {
        // console.log (StringUtils.format("[start_play] res:{0}, armatureName:{1}, animationName:{2}", this.resName, this.armatureName, this.animationName));
        // 實作不中斷的動作
        if (this.armature.animation.isPlaying == false)
            return;
        // console.log ("[set visible]");
        // 顯示物件
        this.visible = true;
    }
    /** 場上所有龍骨的骨頭數量 */
    // public static DragonBones_Current_Sum_Bones: number = 0;

    /** 獲取骨架 & 初始化 */
    public init_dragon(): void
    {
        if (this.armature != undefined)
            return;
        // 拿骨架
        this.armature = DragonBonesMgr.get_armature(this.resName, this.armatureName);
        // RDragonBones.DragonBones_Current_Sum_Bones += this.armature.getBones().length;
        // console.log('當前骨頭總數: ' + RDragonBones.DragonBones_Current_Sum_Bones);
        // 新增事件
        this.armature.eventDispatcher.addDBEventListener(dragonBones.EventObject.COMPLETE, this.play_over, this);
        this.armature.eventDispatcher.addDBEventListener(dragonBones.EventObject.START, this.on_start_play, this);
        this.armature.eventDispatcher.addDBEventListener(dragonBones.EventObject.FRAME_EVENT, this.on_frame_event, this);
        // 放入場景播放
        this.addChild(this.armature.display);
    }

    /** 清除註冊事件並把龍骨給還回去 */
    public release_dragon(removeScene: boolean = true)
    {
        if (this.armature == undefined)
            return;
        // 清掉事件
        this.armature.eventDispatcher.removeDBEventListener(dragonBones.EventObject.COMPLETE, this.play_over, this);
        this.armature.eventDispatcher.removeDBEventListener(dragonBones.EventObject.START, this.on_start_play, this);
        this.armature.eventDispatcher.removeDBEventListener(dragonBones.EventObject.FRAME_EVENT, this.on_frame_event, this);

        if (this.ishaveEvent == true)
            EventSystem.unregister_event(EventSystem.get_now_scene(), eEvent.switch_scene, this.BindEvevntFun);

        this.ishaveEvent = false;
        // 消滅龍骨
        this.armature.animation.reset();
        this.armature.dispose();
        this.armature = undefined;
        // 重設定參數
        this.visible = true;
        // 清除子項目
        if (this.numChildren)
            this.removeChildren();
        if (removeScene == false)
            return;
        // 清除父項目
        if (this && this.parent)
        {
            this.parent.removeChild(this);
        }
    }

    //---------------------------------
    // 查詢/設定屬性相關
    //---------------------------------
    public getIsPlayIng(): boolean
    {
        if (this.armature == null || this.armature.animation == null)
            return false;
        return this.armature.animation.isPlaying;
    }
    //-------------------------------------------
    // 取得龍骨的對應Slot插槽
    //-------------------------------------------
    /** 取得龍骨的對應Slot插槽
     * - 建議使用 {@link #set_slot}
     * - 可以記錄目前的slot_index
     * @param slotName 插槽名稱 */
    public get_slot(slotName: string): dragonBones.Slot
    {
        let result = this.armature.getSlot(slotName);
        if (result == null)
        {
            console.warn('[Error] Not get any slot!!')
        }
        return result;
    }
    /**
     * 取得並更換插槽
     * @param slotName  插槽名稱
     * @param displayIndex  更換插槽的index
     */
    public set_slot(slotName: string, displayIndex: number)
    {
        let slot = this.get_slot(slotName);
        if (slot == null)
        {
            console.warn('[Error] Not get any slot!!')
            return;
        }
        slot.displayIndex = displayIndex;
        this.slot_index = displayIndex;
    }
    //-------------------------------------------
    // 取得龍骨的骨骼
    //-------------------------------------------
    /** 取得龍骨的骨骼
     * @param bones_name 骨骼名稱 */
    public get_bones(bones_name: string): dragonBones.Bone
    {
        if (this.armature == null)
            return undefined;
        return this.armature.getBone(bones_name);
    }
    //---------------------------------
    // 事件區
    //---------------------------------
    /** 龍骨撥放完成時的Callback
     *
     *  註:在設定播放次數的狀況下，當外部操作visible的時間點跟play_over執行時間點相近時，容易造成visible設定錯誤的問題，如果情況允許建議將次數設成0或是使用release_dragon清除關閉龍骨
    */
    protected play_over(): void
    {
        // 如果需要隱藏
        this.visible = !this.is_hide;
        // 派發事件給gamepage說我撥完了 並告訴page誰播完了
        EventSystem.on_event(eEvent.dragon_complete, this);
        this.clear_value();
    }

    //---------------------------------
    // 事件以及循環播放
    //---------------------------------
    // 自定義事件
    protected on_frame_event(e: dragonBones.EgretEvent): void
    {

        var event_txt: string = e.frameLabel; // 讀取特效設置的事件名稱

        if (event_txt.indexOf("Sound") == 0) // 如果是專屬音效的事件，就自動進行播放
        {
            this.event_play_sound(event_txt);
            return;
        }

        if (event_txt == this.end_event) // 如果當前事件，等同於Loop播放的事件的話
        {
            if (this.playTimes == 24601 || this.playTimes > 1) // 如果是無限或是還有循環次數的話
            {
                this.playTimes = this.playTimes == 24601 ? 24601 : this.playTimes - 1; // 進行次數扣除，如果是無限次數就不扣次數
                this.armature.animation.gotoAndPlayByTime(this.animationName, this.ReStartTime, 1); // 進行循環播放動作
            }
            else if (this.playTimes == 1) // 如果Play次數只有一次，就進行暫停
            {
                this.armature.animation.stop(); // 只暫停當前禎，嵌套特效不受影響
                // this.armature.animation.timeScale = 0; 絕對暫停，不論是否有嵌套特效
                this.play_over(); // 廣播結束事件，因為Loop不會自動觸發結束事件
            }
        }
        EventSystem.on_event(eEvent.dragon_frame_event, e.eventObject, this, e.frameLabel); // 廣播獲取到龍骨的事件，給予註冊者
    }

    /** 龍骨內事件-播放音樂音效用 */
    private event_play_sound(event_txt: string)
    {
        // 要把關鍵字去除，才能獲得真正的音效名稱
        var sound_name: string = event_txt.substring("Sound".length + 1);
        sound_name += "_aac";
        if (!GameConfig.json_config.release_mode) { console.log("偵測到龍骨音樂類型的事件，將要進行播放音效名稱 = " + sound_name); }
        SoundMgr.play_more(sound_name); // 播放音效
    }


    /** 循環播放 */
    public loop_play(
        start_time: number,
        end_event: string,
        ReStart_time: number,
        playTimes: number = this.playTimes,
        is_hide: boolean = this.is_hide,
        animationName: string = this.animationName)
    {
        this.init_dragon(); // 進行初始化，並且拿取骨架

        this.playTimes = playTimes == 0 ? 24601 : playTimes; // 判斷是否為無限模式
        this.is_hide = is_hide; // 進行更新數據
        this.animationName = animationName; // 設定上動畫名
        this.end_event = end_event;
        this.ReStartTime = ReStart_time;

        this.armature.animation.gotoAndPlayByTime(animationName, start_time, 1);
    }

    /** 切換場景 */
    private on_switch_scene(): void
    {
        // 釋放龍骨緩存
        this.release_dragon(false);
    }
}
