// The checker, run on the kit itself. The kit is where the shared shapes are
// defined, so each rule's home is named here; everything else in src must
// keep every rule a panel keeps.
export default {
  scan: ["src"],
  // The kit is not an app: there is no stylesheet of its own to point @source.
  css: null,
  legacyKit: ["@/components/admin/", "@/components/kit/"],
  homes: {
    // The shapes' own definitions.
    "gradient-button": ["src/classes.ts"],
    "panel-shell": ["src/classes.ts"],
    "chip": ["src/classes.ts"],
    "icon-button": ["src/classes.ts"],
    "field-box": ["src/classes.ts"],
    "raw-table": ["src/data-table.tsx"],
    "hand-drawer": ["src/drawer.tsx", "src/modal.tsx"],
    // The five places a full brand fill is allowed: the buttons and the solid
    // tile (classes.ts), the switch, the picked day and month, the + seat.
    "brand-slab": ["src/classes.ts", "src/switch.tsx", "src/date-field.tsx", "src/new-record-button.tsx"],
  },
  exempt: [
    { match: "src/brand.ts", rules: ["typed-colour"], why: "the house lime and the two inks the brand maths reads against" },
  ],
};
