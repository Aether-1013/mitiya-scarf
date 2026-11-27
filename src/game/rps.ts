/**
 * 跟围巾猜拳：反应式状态机。
 * 玩家一做出稳定手势（石头/剪刀/布），围巾立刻"想一下"再出自己的手型。
 * 不需要按钮，不需要倒计时。
 */
export type RPS = "rock" | "scissors" | "paper";
export type Outcome = "win" | "lose" | "draw";

export const RPS_CN: Record<RPS, string> = { rock: "石头", scissors: "剪刀", paper: "布" };

/** 围巾用 4 根须子摆出的手型：索引 拇指/食指/中指/无名指/小指（0 伸直，1 蜷起） */
export const RPS_CURLS: Record<RPS, number[]> = {
  rock: [1, 1, 1, 1, 1],
  scissors: [1, 0, 0, 1, 1],
  paper: [0, 0, 0, 0, 0],
};

const BEATS: Record<RPS, RPS> = { rock: "scissors", scissors: "paper", paper: "rock" };
const LIST: RPS[] = ["rock", "scissors", "paper"];

export function judge(a: RPS, b: RPS): Outcome {
  if (a === b) return "draw";
  return BEATS[a] === b ? "win" : "lose";
}

function randomPick(): RPS {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return LIST[buf[0] % 3];
}

export class RpsGame {
  phase: "wait" | "think" | "reveal" = "wait";
  t = 0;
  hold = 0;
  lastSeen: RPS | null = null;
  playerPick: RPS | null = null;
  scarfPick: RPS | null = null;
  result: Outcome | null = null;
  score = { win: 0, lose: 0, draw: 0 };
  rounds = 0;
  /** 手势需要稳定多久才算出拳 */
  holdTime = 0.16;
  /** 围巾"想一下"的时间 */
  thinkTime = 0.24;
  /** 揭晓停留 */
  revealTime = 2.0;
  /** 每次都出克制玩家的手型（?counter=1） */
  counter = false;

  constructor(private forced?: RPS | null) {}

  update(dt: number, sample: () => RPS | null) {
    this.t += dt;

    if (this.phase === "wait") {
      const g = sample();
      if (g && g === this.lastSeen) this.hold += dt;
      else {
        this.hold = 0;
        this.lastSeen = g;
      }
      if (g && this.hold >= this.holdTime) {
        this.playerPick = g;
        this.scarfPick = this.forced ?? (this.counter ? counterOf(g) : randomPick());
        this.result = judge(g, this.scarfPick);
        this.phase = "think";
        this.t = 0;
      }
      return;
    }

    if (this.phase === "think") {
      if (this.t >= this.thinkTime) {
        this.phase = "reveal";
        this.t = 0;
        if (this.result) this.score[this.result]++;
        this.rounds++;
      }
      return;
    }

    if (this.phase === "reveal" && this.t >= this.revealTime) {
      this.phase = "wait";
      this.t = 0;
      this.hold = 0;
      this.lastSeen = null;
      this.playerPick = null;
      this.scarfPick = null;
      this.result = null;
    }
  }

  /** 围巾这一帧该摆的手型；null = 继续跟随玩家 */
  curls(): number[] | null {
    if (this.phase === "reveal" && this.scarfPick) return RPS_CURLS[this.scarfPick];
    return null;
  }

  resetScore() {
    this.score = { win: 0, lose: 0, draw: 0 };
    this.rounds = 0;
  }
}

function counterOf(p: RPS): RPS {
  // 能赢 p 的那个
  return (Object.keys(BEATS) as RPS[]).find((k) => BEATS[k] === p) ?? p;
}
