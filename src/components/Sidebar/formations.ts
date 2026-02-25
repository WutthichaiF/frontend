// src/lib/formationIcons.ts
export type FormationItem = {
  id: string;
  thumb: string;
  svg?: string;
  iconSize?: number;
};

const BOX = (inner: string) => `
<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
  <rect x="14" y="18" width="92" height="60" rx="0" fill="#85e6ff" stroke="#111827" stroke-width="4"/>
  ${inner}
</svg>`;

const TXT = (t: string) => `
<text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#111827">${t}</text>`;

export const FORMATION_GROUPS: Record<string, FormationItem[]> = {
  "Combat Units": [
    { id: "cbt", thumb: "/formations/combat_Units/cbt.png", iconSize: 1.4 },
    { id: "arc", thumb: "/formations/combat_Units/arc.png", iconSize: 1.4 },
    { id: "bow", thumb: "/formations/combat_Units/bowtie.png", iconSize: 1.4 },
    { id: "boxx", thumb: "/formations/combat_Units/x.png", iconSize: 1.4 },
    { id: "tri", thumb: "/formations/combat_Units/xtri.png", iconSize: 1.4 },
    { id: "oval", thumb: "/formations/combat_Units/oval.png", iconSize: 1.4 },
    { id: "dot", thumb: "/formations/combat_Units/dot.png", iconSize: 1.4 },
    { id: "u", thumb: "/formations/combat_Units/u.png", iconSize: 1.4 },
    { id: "diag", thumb: "/formations/combat_Units/diag.png", iconSize: 1.4 },
    { id: "gate", thumb: "/formations/combat_Units/gate.png", iconSize: 1.4 },
    { id: "sec", thumb: "/formations/combat_Units/sec.png", iconSize: 1.4 },
  ],

  "Combat Support Units": [
    { id: "cs", thumb: "/formations/Combat_Support/cs.png", iconSize: 1.4 },
    { id: "antenna", thumb: "/formations/Combat_Support/antenna.png", iconSize: 1.4 },
    { id: "mi", thumb: "/formations/Combat_Support/mi.png", iconSize: 1.4 },
    { id: "mp", thumb: "/formations/Combat_Support/mp.png", iconSize: 1.4 },
    { id: "diag", thumb: "/formations/Combat_Support/diag.png", iconSize: 1.4 },
    { id: "iw", thumb: "/formations/Combat_Support/iw.png", iconSize: 1.4 },
    { id: "ls", thumb: "/formations/Combat_Support/ls.png", iconSize: 1.4 },
    { id: "eod", thumb: "/formations/Combat_Support/eod.png", iconSize: 1.4 },
  ],

  "Combat Service Support Units": [
    { id: "css", thumb: "/formations/Combat_Service/css.png", iconSize: 1.4 },
    { id: "adm", thumb: "/formations/Combat_Service/adm.png", iconSize: 1.4 },
    { id: "grid", thumb: "/formations/Combat_Service/grid.png", iconSize: 1.4 },
    { id: "hline", thumb: "/formations/Combat_Service/hline.png", iconSize: 1.4 },
    { id: "wheel", thumb: "/formations/Combat_Service/wheel.png", iconSize: 1.4 },
    { id: "link", thumb: "/formations/Combat_Service/link.png", iconSize: 1.4 },
  ],

  "Command and Control": [
    { id: "c2hq", thumb: "/formations/Command_Control/c2hq.png", iconSize: 1.4 },
  ],
  "Infantry": [
    { id: "inf_01", thumb: "/formations/infantry/inf_01.png", iconSize: 1},
    { id: "inf_02", thumb: "/formations/infantry/inf_02.png", iconSize: 1 },
    { id: "inf_03", thumb: "/formations/infantry/inf_03.png", iconSize: 1 },
    { id: "inf_04", thumb: "/formations/infantry/inf_04.png", iconSize: 1 },
    { id: "inf_05", thumb: "/formations/infantry/inf_05.png", iconSize: 1 },
    { id: "inf_06", thumb: "/formations/infantry/inf_06.png", iconSize: 1 },
    { id: "inf_07", thumb: "/formations/infantry/inf_07.png", iconSize: 1 },
    { id: "inf_08", thumb: "/formations/infantry/inf_08.png", iconSize: 1 },
    { id: "inf_09", thumb: "/formations/infantry/inf_09.png", iconSize: 1 },
    { id: "inf_10", thumb: "/formations/infantry/inf_10.png", iconSize: 1 },
    { id: "inf_11", thumb: "/formations/infantry/inf_11.png", iconSize: 1 },
  ],

  "Armored / Tracked": [
    { id: "arm_01", thumb: "/formations/armored_tracked/arm_01.png", iconSize: 1 },
    { id: "arm_02", thumb: "/formations/armored_tracked/arm_02.png", iconSize: 1 },
    { id: "arm_03", thumb: "/formations/armored_tracked/arm_03.png", iconSize: 1 },
    { id: "arm_04", thumb: "/formations/armored_tracked/arm_04.png", iconSize: 1 },
    { id: "arm_05", thumb: "/formations/armored_tracked/arm_05.png", iconSize: 1 },
    { id: "arm_06", thumb: "/formations/armored_tracked/arm_06.png", iconSize: 1 },
    { id: "arm_07", thumb: "/formations/armored_tracked/arm_07.png", iconSize: 1 },
    { id: "arm_08", thumb: "/formations/armored_tracked/arm_08.png", iconSize: 1 },
    { id: "arm_09", thumb: "/formations/armored_tracked/arm_09.png", iconSize: 1 },
  ],
  "Artillery": [
    { id: "art_01", thumb: "/formations/artillery/art_01.png", iconSize: 1 },
    { id: "art_02", thumb: "/formations/artillery/art_02.png", iconSize: 1 },
    { id: "art_03", thumb: "/formations/artillery/art_03.png", iconSize: 1 },
    { id: "art_04", thumb: "/formations/artillery/art_04.png", iconSize: 1 },
    { id: "art_05", thumb: "/formations/artillery/art_05.png", iconSize: 1 },
    { id: "art_06", thumb: "/formations/artillery/art_06.png", iconSize: 1 },
    { id: "art_07", thumb: "/formations/artillery/art_07.png", iconSize: 1 },
    { id: "art_08", thumb: "/formations/artillery/art_08.png", iconSize: 1 },
    { id: "art_09", thumb: "/formations/artillery/art_09.png", iconSize: 1 },
    { id: "art_10", thumb: "/formations/artillery/art_10.png", iconSize: 1 },
    { id: "art_11", thumb: "/formations/artillery/art_11.png", iconSize: 1 },
    { id: "art_12", thumb: "/formations/artillery/art_12.png", iconSize: 1 },
  ],
};
