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

const WF_UNKNOWN_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="44" fill="#85e6ff" stroke="#111827" stroke-width="4"/>
  <text x="60" y="78" text-anchor="middle" font-size="64" font-weight="900" fill="#111827">?</text>
</svg>`.trim();

export const FORMATION_GROUPS: Record<string, FormationItem[]> = {
  "Unknown Warfighting Symbol": [
    {
      id: "wf-unknown",
      iconSize: 1,
      svg: WF_UNKNOWN_SVG,
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
    {
      id: "wf_armor_track",
      iconSize: 1,
      symbolCode: "SFGPUCAT---H---",
      shortName: "Armor Track",
      abbreviation: "trk arm",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Armor / Track",
    },
    {
      id: "wf_field_artillery",
      iconSize: 1,
      symbolCode: "SFGPUCF----H---",
      shortName: "Field Artillery",
      abbreviation: "fldart",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Field Artillery",
    },
    {
      id: "wf_engineer",
      iconSize: 1,
      symbolCode: "SFGPUCE----H---",
      shortName: "Engineer",
      abbreviation: "eng",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Engineer",
    },
    {
      id: "wf_recon",
      iconSize: 1,
      symbolCode: "SFGPUCR----H---",
      shortName: "Reconnaissance",
      abbreviation: "recon",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Reconnaissance",
    },
    {
      id: "wf_missile_ss",
      iconSize: 1,
      symbolCode: "SFGPUCM----H---",
      shortName: "Missile (Surf-Surf)",
      abbreviation: "msl",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Missile (Surf-Surf)",
    },
    {
      id: "wf_isf",
      iconSize: 1,
      symbolCode: "SFGPUCS----H---",
      shortName: "Internal Security Forces",
      abbreviation: "isf",
      fullName: "Warfighting Symbols / Ground / Unit / Combat / Internal Security Forces",
    },
  ],

  "Combat Support Units": [
    {
      id: "cs",
      iconSize: 1,
      symbolCode: "SFGPUU-----I---",
      shortName: "Combat Support",
      abbreviation: "cs",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support",
    },
    {
      id: "cbrn",
      iconSize: 1,
      symbolCode: "SFGPUUA----H---",
      shortName: "Combat Support CBRN",
      abbreviation: "cbrn",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Combat Support CBRN",
    },
    {
      id: "milint",
      iconSize: 1,
      symbolCode: "SFGPUUM----H---",
      shortName: "Military Intelligence",
      abbreviation: "milint",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Military Intelligence",
    },
    {
      id: "lawenu",
      iconSize: 1,
      symbolCode: "SFGPUUL----H---",
      shortName: "Law Enforcement Unit",
      abbreviation: "lawenu",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Law Enforcement Unit",
    },
    {
      id: "sigunt",
      iconSize: 1,
      symbolCode: "SFGPUUS----H---",
      shortName: "Signal Unit",
      abbreviation: "sigunt",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Signal Unit",
    },
    {
      id: "iwu",
      iconSize: 1,
      symbolCode: "SFGPUUI----H---",
      shortName: "Information Warfare Unit",
      abbreviation: "iwu",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Information Warfare Unit",
    },
    {
      id: "ldsup",
      iconSize: 1,
      symbolCode: "SFGPUUP----H---",
      shortName: "Landing Support",
      abbreviation: "ldsup",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Landing Support",
    },
    {
      id: "eod",
      iconSize: 1,
      symbolCode: "SFGPUUE----H---",
      shortName: "Explosive Ordnance Disposal",
      abbreviation: "eod",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Support / Explosive Ordnance Disposal",
    },
  ],

  "Combat Service Support Units": [
    {
      id: "wf_css",
      iconSize: 1,
      symbolCode: "SFGPUS-----I---",
      shortName: "Combat Service Support",
      abbreviation: "css",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Service Support",
    },
    {
      id: "wf_admin",
      iconSize: 1,
      symbolCode: "SFGPUSA----H---",
      shortName: "Administrative",
      abbreviation: "admin",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Service Support / Administrative",
    },
    {
      id: "wf_med",
      iconSize: 1,
      symbolCode: "SFGPUSM----H---",
      shortName: "Medical",
      abbreviation: "med",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Service Support / Medical",
    },
    {
      id: "wf_slp",
      iconSize: 1,
      symbolCode: "SFGPUSS----H---",
      shortName: "Supply",
      abbreviation: "slp",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Service Support / Supply",
    },
    {
      id: "wf_tpt",
      iconSize: 1,
      symbolCode: "SFGPUST----H---",
      shortName: "Transportation",
      abbreviation: "tpt",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Service Support / Transportation",
    },
    {
      id: "wf_maint",
      iconSize: 1,
      symbolCode: "SFGPUSX----H---",
      shortName: "Maintenance",
      abbreviation: "maint",
      fullName: "Warfighting Symbols / Ground / Unit / Combat Service Support / Maintenance",
    },
  ],

  "Command and Control": [
    {
      id: "c2hq",
      iconSize: 1,
      symbolCode: "SFGPUH-----H---",
      shortName: "Special C2 Headquarters Component",
      abbreviation: "c2hq",
      fullName: "Warfighting Symbols / Ground / Unit / Special C2 Headquarters Component",
    },
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
