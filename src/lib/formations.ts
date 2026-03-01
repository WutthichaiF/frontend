// src/lib/formationIcons.ts
export type FormationItem = {
  id: string;
  symbolCode?: string;
  iconSize?: number;
  // metadata สำหรับ tooltip/editor
  shortName?: string;
  abbreviation?: string;
  fullName?: string;
  thumb?: string;
  svg?: string;
};


export const FORMATION_GROUPS: Record<string, FormationItem[]> = {
  "Unknown Warfighting Symbol": [
    {
      id: "wf_unknown_warfighting",
      iconSize: 1,
      symbolCode: "SF-P----------G",
      shortName: "Warfighting Symbols",
      abbreviation: "war",
      fullName: "Warfighting Symbols",
    },
  ],

  "Unit Symbol (empty)": [
    {
      id: "wf_unit_empty",
      iconSize: 1,
      symbolCode: "SFGPU---------G",
      shortName: "Unit",
      abbreviation: "unt",
      fullName: "Warfighting Symbols / Ground / Unit",
    },
    {
      id: "wf_unknown_warfighting",
      iconSize: 1,
      symbolCode: "SF-P----------G",
      shortName: "Warfighting Symbols",
      abbreviation: "war",
      fullName: "Warfighting Symbols",
    },
  ],

  "Combat Units": [
    {
      id: "cbt-unit",
      iconSize: 1,
      symbolCode: "SFGPUC-----I---", 
      shortName: "Combat",
      abbreviation: "cbt unt",
      fullName: "Warfighting Symbols / Ground / Unit / Combat",
    },
    {
      id: "wf_inf",
      iconSize: 1,
      symbolCode: "SFGPUCD----H---",
      shortName: "Infantry",
      abbreviation: "inf",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Infantry",
    },
    {
      id: "wf_inf_mtn",
      iconSize: 1,
      symbolCode: "SFGPUCV----H---",
      shortName: "Infantry Mountain",
      abbreviation: "mnt inf",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Infantry / Mountain",
    },
    {
      id: "wf_avn",
      iconSize: 1,
      symbolCode: "SFGPUCI----H---",
      shortName: "Aviation",
      abbreviation: "avn",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Aviation",
    },
    {
      id: "wf_adf",
      iconSize: 1,
      symbolCode: "SFGPUCIO---H---",
      shortName: "Air Defense",
      abbreviation: "adf",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Air Defense",
    },

  ],

  "Combat Support Units": [

  ],

  "Combat Service Support Units": [
  ],

  "Command and Control": [
  ],
  "Infantry": [
  ],

  "Armored / Tracked": [
  ],

  "Artillery": [
  ],

  "Aviation": [
  ],

  "UAV": [
  ],

  "Air_base": [
  ],

  "GBAD": [
  ],

  "Combat Engineer": [
  ],

  "Construction": [
  ],

  "Command Support": [
  ],

  "Transmission": [
  ],

  "Command, Transmission and EW": [
  ],

  "Logistics": [
  ],

  "Transportation": [
  ],

  "Maintenance": [
  ],

  "Medical": [
  ],

  "Military Security": [
  ],

  "NBC Defense": [
  ],
  "Special Forces": [

  ],
  "Military Justice": [

  ],


};
