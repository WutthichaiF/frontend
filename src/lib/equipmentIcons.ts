// src/lib/equipmentIcons.ts
export type EquipmentItem = {
  id: string;
  thumb: string;       
  svg?: string;         
  iconSize?: number;    
  canRotate?: boolean;
};

export const EQUIPMENT_GROUPS: Record<string, EquipmentItem[]> = {
  "Installation": [
    { id: "inst_01", thumb: "/equipment/installations/inst_01.png", iconSize: 0.17 , canRotate: false},
    { id: "inst_02", thumb: "/equipment/installations/inst_02.png", iconSize: 0.17 , canRotate: false},
    { id: "inst_03", thumb: "/equipment/installations/inst_03.png", iconSize: 0.17 , canRotate: false},
    { id: "inst_04", thumb: "/equipment/installations/inst_04.png", iconSize: 0.17 , canRotate: false},
    { id: "inst_05", thumb: "/equipment/installations/inst_05.png", iconSize: 0.17 , canRotate: false},
  ],
  
  "Raw Material Production / Storage": [
    { id: "rawmat_01", thumb: "/equipment/raw_material/rawmat_01.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_02", thumb: "/equipment/raw_material/rawmat_02.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_03", thumb: "/equipment/raw_material/rawmat_03.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_04", thumb: "/equipment/raw_material/rawmat_04.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_05", thumb: "/equipment/raw_material/rawmat_05.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_06", thumb: "/equipment/raw_material/rawmat_06.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_07", thumb: "/equipment/raw_material/rawmat_07.png", iconSize: 0.17 , canRotate: false},
    { id: "rawmat_08", thumb: "/equipment/raw_material/rawmat_08.png", iconSize: 0.17 , canRotate: false},
  ],

  "Processing Facility": [
    { id: "proc_01", thumb: "/equipment/processing/proc_01.png", iconSize: 0.17 },
    { id: "proc_02", thumb: "/equipment/processing/proc_02.png", iconSize: 0.17 },
  ],

  "Service, Research, Utility Facility": [
    { id: "srv_01", thumb: "/equipment/sru/srv_01.png", iconSize: 0.17 },
    { id: "srv_02", thumb: "/equipment/sru/srv_02.png", iconSize: 0.17 },
    { id: "srv_03", thumb: "/equipment/sru/srv_03.png", iconSize: 0.17 },
    { id: "srv_04", thumb: "/equipment/sru/srv_04.png", iconSize: 0.17 },
    { id: "srv_05", thumb: "/equipment/sru/srv_05.png", iconSize: 0.17 },
  ],

  "Military Materiel Facility": [
    { id: "milmat_01", thumb: "/equipment/mil_mat/milmat_01.png", iconSize: 0.17 },
    { id: "milmat_02", thumb: "/equipment/mil_mat/milmat_02.png", iconSize: 0.17 },
    { id: "milmat_03", thumb: "/equipment/mil_mat/milmat_03.png", iconSize: 0.17 },
    { id: "milmat_04", thumb: "/equipment/mil_mat/milmat_04.png", iconSize: 0.17 },
    { id: "milmat_05", thumb: "/equipment/mil_mat/milmat_05.png", iconSize: 0.17 },
    { id: "milmat_06", thumb: "/equipment/mil_mat/milmat_06.png", iconSize: 0.17 },
    { id: "milmat_07", thumb: "/equipment/mil_mat/milmat_07.png", iconSize: 0.17 },
    { id: "milmat_08", thumb: "/equipment/mil_mat/milmat_08.png", iconSize: 0.17 },
    { id: "milmat_09", thumb: "/equipment/mil_mat/milmat_09.png", iconSize: 0.17 },
    { id: "milmat_10", thumb: "/equipment/mil_mat/milmat_10.png", iconSize: 0.17 },
  ],

  "Actions Points": [
  ],

  "Post": [
    { id: "post_01", thumb: "/equipment/post/post_01.png", iconSize: 0.17 },
    { id: "post_02", thumb: "/equipment/post/post_02.png", iconSize: 0.17 },
    { id: "post_03", thumb: "/equipment/post/post_03.png", iconSize: 0.17 },
    { id: "post_04", thumb: "/equipment/post/post_04.png", iconSize: 0.17 },
    { id: "post_05", thumb: "/equipment/post/post_05.png", iconSize: 0.17 },
    { id: "post_06", thumb: "/equipment/post/post_06.png", iconSize: 0.17 },
  ],

  "Medical and Supply Points": [
  ],

  "Fire Weapons and Artillery": [
    { id: "wp_01", thumb: "/equipment/weapons/wp_01.png", iconSize: 0.17 },
    { id: "wp_02", thumb: "/equipment/weapons/wp_02.png", iconSize: 0.17 },
    { id: "wp_03", thumb: "/equipment/weapons/wp_03.png", iconSize: 0.17 },
    { id: "wp_04", thumb: "/equipment/weapons/wp_04.png", iconSize: 0.17 },
    { id: "wp_05", thumb: "/equipment/weapons/wp_05.png", iconSize: 0.17 },
    { id: "wp_06", thumb: "/equipment/weapons/wp_06.png", iconSize: 0.17 },
    { id: "wp_07", thumb: "/equipment/weapons/wp_07.png", iconSize: 0.17 },
    { id: "wp_08", thumb: "/equipment/weapons/wp_08.png", iconSize: 0.17 },
    { id: "wp_09", thumb: "/equipment/weapons/wp_09.png", iconSize: 0.17 },
    { id: "wp_10", thumb: "/equipment/weapons/wp_10.png", iconSize: 0.17 },
    { id: "wp_11", thumb: "/equipment/weapons/wp_11.png", iconSize: 0.17 },
  ],

  "Antitank": [
    { id: "at_01", thumb: "/equipment/antitank/at_01.png", iconSize: 0.17 },
    { id: "at_02", thumb: "/equipment/antitank/at_02.png", iconSize: 0.17 },
    { id: "at_03", thumb: "/equipment/antitank/at_03.png", iconSize: 0.17 },
    { id: "at_04", thumb: "/equipment/antitank/at_04.png", iconSize: 0.17 },
  ],

  "Air Defense": [
    { id: "ad_01", thumb: "/equipment/air_defense/ad_01.png", iconSize: 0.17 },
    { id: "ad_02", thumb: "/equipment/air_defense/ad_02.png", iconSize: 0.17 },
    { id: "ad_03", thumb: "/equipment/air_defense/ad_03.png", iconSize: 0.17 },
    { id: "ad_04", thumb: "/equipment/air_defense/ad_04.png", iconSize: 0.17 },
    { id: "ad_05", thumb: "/equipment/air_defense/ad_05.png", iconSize: 0.17 },
  ],
};