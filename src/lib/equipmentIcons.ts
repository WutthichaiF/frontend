// src/lib/equipmentIcons.ts
export type EquipmentItem = {
  id: string;
  symbolCode?: string;     
  thumb?: string;          
  iconSize?: number;
  shortName?: string;
  abbreviation?: string;
  fullName?: string;
  canRotate?: boolean;
};

export const EQUIPMENT_GROUPS: Record<string, EquipmentItem[]> = {
  "Installation": [
  ],

  "Raw Material Production / Storage": [
  ],

  "Processing Facility": [
  ],

  "Service, Research, Utility Facility": [
  ],

  "Military Materiel Facility": [
  ],

  "Actions Points": [
  ],

  "Post": [
  ],

  "Medical and Supply Points": [
  ],

  "Fire Weapons and Artillery": [
  ],

  "Antitank": [
  ],

  "Air Defense": [
  ],

  "Fixed Wings": [
  ],

  "Rotary Wing": [
  ],

  "Fixed Wings Drone": [
    
  ],

  "Rotary Wing Drone": [
    
  ],

  "Armored Vehicle": [
    
  ],

  "Utility Vehicle": [
   
  ],

  "Engineer Vehicle": [
    
  ],

  "Civilian Vehicle": [
    
  ],

  "Other Vehicle": [
    
  ],

  "Missile Support Vehicle": [
    
  ],

  "Combatant Ship": [
    
  ],

  "Amphibious Warfare Ship": [
    
  ],

  "Mine Warfare Vessel": [
    
  ],

  "Patrol Ship": [
   
  ],

  "Unmanned Surface Vehicle": [
    
  ],

  "Navy Group": [
    
  ],

  "Noncombatant Ship": [
    
  ],

  "Other Ship": [
    
  ],

  "Non-Military Ship": [
    
  ],

  "Submarine": [
   
  ],

  "Non-Submarine": [
    
  ],

  "Underwater Weapons": [
   
  ],

  "Sea Mine": [
    
  ],

  "Sea Mine (Ground)": [
    
  ],

  "Sea Mine (Moored)": [
   
  ],

  "Sea Mine (Floating)": [
    
  ],

  "Sea Mine Rising Mine": [
    
  ],

  "Sea Mine (other position)": [
    
  ],

  "Decoy": [
    
  ],
}