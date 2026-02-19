export type TaskId = "WP" | "R";

export type TaskDef = {
  id: TaskId;
  label: string;
  // svg thumbnail (ทำแบบง่ายก่อน)
  thumbSvg: string;
};

export const TASKS: TaskDef[] = [
  {
    id: "WP",
    label: "WP",
    thumbSvg: `
      <svg width="72" height="36" viewBox="0 0 72 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18H56" stroke="#2f7fff" stroke-width="3" />
        <path d="M56 18L48 12M56 18L48 24" stroke="#2f7fff" stroke-width="3" />
        <text x="26" y="14" font-size="10" fill="#2f7fff">WP</text>
      </svg>
    `,
  },
  {
    id: "R",
    label: "R",
    thumbSvg: `
      <svg width="72" height="36" viewBox="0 0 72 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18H56" stroke="#7a1b6d" stroke-width="3" />
        <path d="M56 18L48 12M56 18L48 24" stroke="#7a1b6d" stroke-width="3" />
        <text x="30" y="14" font-size="10" fill="#7a1b6d">R</text>
      </svg>
    `,
  },
];
