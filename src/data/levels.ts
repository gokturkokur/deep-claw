import type { ObjType } from '../config/economy';

export interface LevelObject {
  type: ObjType;
  x: number;
  y: number;
  /** Beetles walk between these x values. */
  laneMinX?: number;
  laneMaxX?: number;
  /** Beetle speed (px/s). */
  speed?: number;
  /** Beetle carries a diamond. */
  carriesDiamond?: boolean;
}

export interface LevelDef {
  id: number;
  name: string;
  /** Money that must be earned during the level. */
  target: number;
  /** Swing speed multiplier (late levels are slightly faster). */
  swingMult?: number;
  objects: LevelObject[];
}

// ---- authoring shortcuts -------------------------------------------------
const gS = (x: number, y: number): LevelObject => ({ type: 'goldS', x, y });
const gM = (x: number, y: number): LevelObject => ({ type: 'goldM', x, y });
const gL = (x: number, y: number): LevelObject => ({ type: 'goldL', x, y });
const dm = (x: number, y: number): LevelObject => ({ type: 'diamond', x, y });
const rS = (x: number, y: number): LevelObject => ({ type: 'rockS', x, y });
const rL = (x: number, y: number): LevelObject => ({ type: 'rockL', x, y });
const bg = (x: number, y: number): LevelObject => ({ type: 'bag', x, y });
const kg = (x: number, y: number): LevelObject => ({ type: 'keg', x, y });
const bt = (y: number, laneMinX: number, laneMaxX: number, speed = 70, carriesDiamond = false): LevelObject => ({
  type: 'beetle',
  x: Math.round(laneMinX + (laneMaxX - laneMinX) * 0.35),
  y,
  laneMinX,
  laneMaxX,
  speed,
  carriesDiamond,
});

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: "Warm Up",
    target: 1100,
    objects: [
      gS(160, 520), gS(560, 520), gM(360, 600), gS(250, 700), gS(470, 700),
      gM(110, 820), gM(610, 820), gL(360, 860), gS(230, 980), gS(490, 980),
      gM(130, 1080), gM(590, 1080), gS(360, 1090), rS(300, 1160), rS(430, 1160),
    ],
  },
  {
    id: 2,
    name: "Shallow Seam",
    target: 1500,
    objects: [
      gM(150, 520), gM(570, 520), gS(360, 540), gS(260, 640), gS(460, 640),
      dm(100, 700), rS(360, 720), gM(360, 830), gL(150, 920), gL(570, 920),
      gS(260, 990), gS(460, 990), dm(360, 1030), gM(100, 1080), gM(620, 1080),
      rS(250, 1140), rS(470, 1140),
    ],
  },
  {
    id: 3,
    name: "Lucky Dip",
    target: 1800,
    objects: [
      gS(110, 520), gS(250, 500), gS(470, 500), gS(610, 520), bg(360, 580),
      rS(200, 650), rS(520, 650), gM(130, 770), gM(590, 770), gM(360, 760),
      gL(260, 900), gM(480, 890), dm(120, 980), dm(610, 990), bg(360, 1003),
      gS(110, 1100), gM(250, 1090), rL(480, 1110), gM(620, 1110),
    ],
  },
  {
    id: 4,
    name: "Boulder Gate",
    target: 2000,
    objects: [
      gS(100, 500), gS(620, 500), gM(220, 580), gM(500, 580), rL(255, 675),
      gL(200, 880), rL(465, 675), gL(520, 880), gM(360, 700), gS(360, 800),
      rS(90, 700), rS(630, 700), dm(360, 1000), gM(110, 1010), gM(610, 1010),
      bg(260, 1080), gS(460, 1090), rL(360, 1150),
    ],
  },
  {
    id: 5,
    name: "Powder Day",
    target: 2200,
    objects: [
      gS(110, 520), gS(250, 540), gS(470, 540), gS(610, 520), kg(360, 640),
      gM(200, 720), gM(520, 720), rS(100, 800), rS(620, 800), gL(189, 920),
      rL(248, 625), gL(531, 920), kg(360, 900), dm(360, 1060), gM(110, 1070),
      gM(610, 1070), rL(240, 1130), rL(480, 1130), bg(360, 1160), dm(80, 880),
      dm(640, 880),
    ],
  },
  {
    id: 6,
    name: "Gem Pocket",
    target: 2500,
    objects: [
      gM(130, 520), gM(590, 520), gS(360, 520), rL(260, 569), rL(460, 569),
      dm(360, 760), dm(110, 740), dm(610, 740), rL(240, 670), dm(160, 960),
      rL(480, 670), dm(560, 960), gL(360, 930), gS(250, 1080), gS(470, 1080),
      rS(90, 1130), rS(630, 1130), gM(360, 1140),
    ],
  },
  {
    id: 7,
    name: "Mystery Vein",
    target: 2700,
    objects: [
      bg(130, 520), bg(590, 520), gS(360, 500), gM(250, 620), gM(470, 620),
      rS(110, 680), rS(610, 680), gL(360, 760), bg(180, 840), bg(540, 840),
      rS(185, 743), gM(110, 960), rS(535, 743), gM(610, 960), dm(300, 1000),
      dm(420, 1000), kg(360, 1100), gS(150, 1120), gS(570, 1120), rL(250, 1154),
      rL(470, 1154),
    ],
  },
  {
    id: 8,
    name: "Beetle Lane",
    target: 2900,
    objects: [
      gM(120, 500), gM(600, 500), gS(360, 480), bt(580, 150, 570, 70), gL(200, 710),
      gM(520, 700), rS(360, 690), dm(360, 800), bt(1036, 470, 650, 85, true), gM(130, 960),
      gM(590, 960), gL(360, 980), rL(237, 880), rL(483, 880), gS(180, 1100),
      gS(540, 1100), dm(360, 1130), bg(80, 1160), bg(640, 1160),
    ],
  },
  {
    id: 9,
    name: "Deep Pockets",
    target: 3100,
    objects: [
      gS(140, 500), gS(580, 500), rL(255, 534), rL(465, 534), gM(360, 640),
      rL(230, 635), gL(150, 880), rL(490, 635), gL(570, 880), dm(360, 840),
      rS(250, 760), rS(470, 760), gM(240, 1000), gM(480, 1000), rS(360, 911),
      dm(360, 1080), bg(110, 1060), bg(620, 1060), gS(250, 1150), gS(470, 1150),
      bt(435, 130, 600, 75), dm(80, 660), dm(640, 660), gM(360, 1000),
    ],
  },
  {
    id: 10,
    name: "Minefield",
    target: 3300,
    objects: [
      gM(130, 510), gM(590, 510), kg(360, 520), gL(240, 650), gL(480, 650),
      kg(110, 760), kg(610, 760), dm(230, 810), dm(490, 810), rL(360, 800),
      gM(120, 893), gM(600, 893), kg(360, 960), gL(220, 1000), gL(500, 1000),
      bt(430, 100, 620, 90, true), gS(90, 1170), gS(630, 1170), bg(360, 1164),
    ],
  },
  {
    id: 11,
    name: "Rock Garden",
    target: 3350,
    swingMult: 1.05,
    objects: [
      gS(100, 500), gM(250, 520), gM(470, 520), gS(620, 500), gM(180, 620),
      gM(540, 620), rL(360, 505), rL(360, 695), dm(360, 800), rL(96, 760),
      rL(624, 760), gL(250, 900), gL(470, 900), rL(217, 716), gM(130, 1010),
      rL(503, 716), gM(590, 1010), bg(360, 1030), kg(250, 1110), kg(470, 1110),
      gS(360, 1160), bt(420, 120, 600, 80), dm(80, 880), dm(640, 880), gM(360, 600),
    ],
  },
  {
    id: 12,
    name: "Glitter Fall",
    target: 3700,
    swingMult: 1.05,
    objects: [
      dm(130, 490), gM(360, 490), dm(590, 490), gS(240, 590), gS(480, 590),
      kg(360, 660), gM(130, 720), gM(590, 720), rS(250, 760), rS(470, 760),
      gL(360, 850), dm(160, 880), dm(560, 880), bt(960, 100, 620, 90, true), bg(100, 1070),
      gL(240, 1070), gL(480, 1070), bg(620, 1070), rL(360, 1160), gS(110, 1160),
      gS(610, 1160),
    ],
  },
  {
    id: 13,
    name: "Crossfire",
    target: 3800,
    swingMult: 1.1,
    objects: [
      gM(110, 500), gM(250, 520), gM(470, 520), gM(610, 500), kg(360, 600),
      rL(230, 615), gL(150, 760), rL(490, 615), gL(570, 760), rS(360, 740),
      dm(280, 840), dm(440, 840), kg(110, 900), kg(610, 900), bt(985, 140, 580, 95),
      gL(250, 1080), gL(470, 1080), bg(110, 1150), bg(610, 1150), dm(360, 1130),
    ],
  },
  {
    id: 14,
    name: "The Wall",
    target: 3850,
    swingMult: 1.1,
    objects: [
      rL(100, 560), rL(230, 560), rL(360, 560), rL(490, 560), rL(620, 560),
      gM(110, 670), gM(240, 670), gM(370, 670), gM(500, 670), gM(620, 670),
      gM(170, 790), gL(360, 810), gM(550, 790), dm(100, 930), dm(620, 930),
      kg(250, 960), kg(470, 960), bg(360, 1000), gM(170, 1010), gM(550, 1010),
      bt(1110, 90, 630, 90, true),
    ],
  },
  {
    id: 15,
    name: "Gambler's Cave",
    target: 4100,
    swingMult: 1.15,
    objects: [
      bg(120, 500), bg(240, 520), bg(480, 520), bg(600, 500), dm(360, 520),
      gL(180, 690), gL(540, 690), kg(360, 736), rS(90, 800), rS(630, 800),
      rL(360, 637), gL(360, 940), dm(160, 920), dm(570, 920), bt(425, 110, 610, 95, true),
      rL(130, 1110), rL(590, 1110), gM(260, 1130), gM(460, 1130),
    ],
  },
  {
    id: 16,
    name: "Tight Squeeze",
    target: 4250,
    swingMult: 1.15,
    objects: [
      gM(100, 520), gM(620, 520), gM(154, 615), gM(517, 600), kg(416, 685),
      gL(130, 740), gL(590, 740), rL(275, 586), dm(300, 820), rL(396, 586),
      dm(420, 820), kg(110, 900), kg(610, 900), bt(925, 190, 530, 100, true), gL(240, 1020),
      gL(480, 1020), gS(185, 848), gM(110, 1110), gS(535, 848), gM(610, 1110),
      bg(360, 1130), dm(360, 1040),
    ],
  },
  {
    id: 17,
    name: "Ember Run",
    target: 4400,
    swingMult: 1.2,
    objects: [
      dm(100, 500), dm(620, 500), gL(360, 520), kg(229, 536), kg(491, 536),
      rL(130, 700), rL(590, 700), gM(271, 730), gM(449, 730), bt(840, 90, 630, 105),
      rL(264, 635), gL(200, 980), rL(456, 635), gL(520, 980), dm(360, 960),
      kg(360, 1065), bg(110, 1083), bg(610, 1083), gM(250, 1150), gM(470, 1150),
      bt(880, 100, 620, 100, true), dm(80, 1000), dm(640, 1000), gM(360, 760),
    ],
  },
  {
    id: 18,
    name: "Heavy Metal",
    target: 4500,
    swingMult: 1.2,
    objects: [
      gL(130, 520), gL(360, 520), gL(590, 520), rL(240, 650), rL(480, 650),
      rS(360, 700), gL(110, 780), gL(610, 780), dm(360, 800), kg(250, 830),
      kg(470, 830), dm(110, 910), dm(610, 910), gL(250, 990), gL(470, 990),
      bt(1090, 100, 620, 105, true), dm(100, 1170), bg(360, 1170), dm(620, 1170), gM(240, 1170),
      gM(480, 1170),
    ],
  },
  {
    id: 19,
    name: "Last Shaft",
    target: 4600,
    swingMult: 1.25,
    objects: [
      gM(100, 500), gM(250, 500), gM(470, 500), gM(620, 500), kg(360, 570),
      dm(140, 650), dm(580, 650), rL(330, 740), gL(480, 760), dm(330, 860),
      rS(150, 800), rS(620, 800), gL(120, 920), gL(600, 920), bt(1020, 120, 600, 110, true),
      dm(200, 1110), kg(360, 1110), dm(520, 1110), bg(80, 1170), bg(640, 1170),
      gM(280, 1180), gM(440, 1180),
    ],
  },
  {
    id: 20,
    name: "Heart of the Deep",
    target: 4800,
    swingMult: 1.25,
    objects: [
      dm(120, 490), gL(360, 490), dm(600, 490), rL(220, 570), rL(500, 570),
      kg(110, 680), kg(610, 680), rL(360, 600), bg(360, 700), gL(210, 790),
      gL(510, 790), rL(360, 820), bt(900, 100, 620, 110, true), dm(360, 1000), gL(150, 1010),
      gL(570, 1010), kg(260, 1040), kg(460, 1040), dm(360, 1085), gM(100, 1150),
      bg(250, 1150), bg(470, 1150), gM(620, 1150), dm(360, 1190),
    ],
  },
];
