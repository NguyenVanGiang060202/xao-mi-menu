import type { CSSProperties } from "react";
import type { ThemeName } from "@/lib/menu-data";

type CategorySlot = "combo" | "fried" | "mixed" | "sides" | "drinks";

const placements = new Map<string, { slot: CategorySlot; position: "start" | "end" }>([
  ["Combo", { slot: "combo", position: "end" }],
  ["Mì xào", { slot: "fried", position: "start" }],
  ["Mì trộn", { slot: "mixed", position: "end" }],
  ["Ăn kèm", { slot: "sides", position: "end" }],
  ["Đồ uống", { slot: "drinks", position: "start" }],
]);

const artwork = {
  christmas: {
    logo: <g stroke="#245740">
      <path d="M34 57h8v8h-8z" fill="#9d6246" />
      <path d="m38 17-13 18h6L21 48h8l-10 11h38L47 48h8L45 35h6L38 17Z" fill="#45966c" />
      <path d="m38 10 2 4 5 .6-3.5 3.2 1 4.7-4.5-2.4-4.5 2.4 1-4.7-3.5-3.2 5-.6Z" fill="#ffd366" stroke="#a76b28" />
      <circle cx="31" cy="44" r="2.5" fill="#ffd366" stroke="none" /><circle cx="45" cy="51" r="2.5" fill="#f7a5a1" stroke="none" />
    </g>,
    combo: <>
      <rect x="19" y="34" width="38" height="27" rx="3" fill="#ba4038" stroke="#8b302d" />
      <rect x="15" y="29" width="46" height="11" rx="3" fill="#e46a53" stroke="#8b302d" />
      <path d="M33 29h10v32H33Z" fill="#ffe38b" stroke="#ac742e" />
      <path d="M38 29c-15 1-19-8-12-12 5-3 10 3 12 12Zm0 0c15 1 19-8 12-12-5-3-10 3-12 12Z" fill="#ffcf66" stroke="#ac742e" />
    </>,
    fried: <g stroke="#357b81">
      {[0, 60, 120, 180, 240, 300].map(angle => <path key={angle} transform={`rotate(${angle} 38 38)`}
        d="M38 38V14m-7 8 7 7 7-7" strokeWidth="3.1" />)}
      <path d="m38 32 5 3v6l-5 3-5-3v-6Z" fill="#e5fbff" />
    </g>,
    mixed: <>
      <path d="M29 59V31a12 12 0 0 1 24 0" stroke="#863232" strokeWidth="14" />
      <path d="M29 59V31a12 12 0 0 1 24 0" stroke="#fff9e9" strokeWidth="11" />
      <path d="m24 55 10-7m-10-5 10-7m-10-5 10-6m0-8 4 10m6-10-2 10m10-5-7 7m13 0-8 6" stroke="#c74643" strokeWidth="3.1" strokeLinecap="butt" />
      <path d="m23 44 7 2m-1 0 5-4" stroke="#d19549" strokeWidth="2" />
    </>,
    sides: <>
      <path d="M36 45q-9 0-12-8l-6-1 3-7-4-8 10 1 5-4 2 8 6 3q3 8-4 16Z" fill="#55a274" stroke="#25634b" />
      <path d="M40 44q-4-8 0-14l-1-7 8 1 8-8 3 9 6 2-6 6q0 12-18 11Z" fill="#75aa6c" stroke="#25634b" />
      <path d="m25 28 13 19 17-20" stroke="#25634b" />
      <g fill="#d35047" stroke="#96302c">
        <circle cx="31" cy="48" r="6" /><circle cx="46" cy="46" r="6" /><circle cx="40" cy="55" r="6" />
      </g>
    </>,
    drinks: <g stroke="#87463b">
      <path d="M52 33h5a7 7 0 0 1 0 14h-6" strokeWidth="3.6" />
      <path d="M19 30h34v15a12 12 0 0 1-12 12H31a12 12 0 0 1-12-12Z" fill="#c95647" />
      <ellipse cx="36" cy="30" rx="17" ry="5" fill="#6f402e" />
      <path d="M27 29l5 1m8-2 4 1M22 60h31" stroke="#ffe0ab" strokeWidth="2" />
      <path d="M31 23c-6-4 5-6 0-10m11 10c-6-4 5-6 0-10" stroke="#e59650" />
      <path d="M36 36v11m-5-8 10 5m0-5-10 5" stroke="#fff5d9" />
    </g>,
    "gutter-start": <>
      <path d="M25 46c4-5 3-12 5-17 3-10 15-10 18 0 2 5 1 12 5 17l4 6H21Z" fill="#e8af46" stroke="#936229" />
      <ellipse cx="39" cy="51" rx="18" ry="4" fill="#f9ce70" stroke="#936229" />
      <path d="M35 52a4 4 0 0 0 8 0" fill="#d88632" stroke="#936229" />
      <path d="M39 23c-18-1-14-16 0-5 14-11 18 4 0 5Z" fill="#d05049" stroke="#973330" />
    </>,
    "gutter-end": <>
      <path d="M29 54 17 38c-4-6 3-12 8-7l6 6V22c0-13 21-13 22 0l-2 33Z" fill="#c74a42" stroke="#8a352f" />
      <rect x="27" y="51" width="27" height="11" rx="3" fill="#fcf0cf" stroke="#8a352f" />
      <path d="m37 36 10 8m0-8-10 8" stroke="#fcf0cf" strokeWidth="2.5" />
    </>,
    "gutter-extra-1": <>
      <path d="M39 11c0-6 8-6 8 0s-8 3-8 8" stroke="#976528" />
      <rect x="31" y="18" width="15" height="8" rx="2" fill="#edbf5d" stroke="#976528" />
      <circle cx="38.5" cy="43" r="20" fill="#c74a42" stroke="#87362f" />
      <path d="M21 44c10-10 25-10 35 0m-31 9c9-7 19-7 27 0" stroke="#ffe29a" strokeWidth="2.6" />
      <path d="M28 33c2-3 4-4 7-4" stroke="#ffd7b3" />
    </>,
    "gutter-extra-2": <>
      <path d="M27 20h21v23c0 7-7 14-19 17-9 3-16-2-13-9 2-4 7-6 11-8Z" fill="#c95647" stroke="#8d3932" />
      <rect x="23" y="15" width="29" height="11" rx="3" fill="#fff0cb" stroke="#8d3932" />
      <path d="M17 50c8-2 13 3 14 9m6-29v12m-5-9 10 6m0-6-10 6" stroke="#fff0cb" strokeWidth="2" />
    </>,
    "gutter-extra-3": <>
      <circle cx="38" cy="38" r="20" stroke="#387758" strokeWidth="13" />
      <circle cx="38" cy="38" r="20" stroke="#71a578" strokeWidth="7" strokeDasharray="3 8" />
      <path d="M38 52c-16-11-19 1 0 2 19-1 16-13 0-2Zm0 2-8 11m8-11 8 11" fill="#d45146" stroke="#913731" strokeWidth="2.4" />
      <circle cx="23" cy="34" r="2.4" fill="#e9bd54" /><circle cx="41" cy="20" r="2.4" fill="#e9bd54" /><circle cx="53" cy="40" r="2.4" fill="#e9bd54" />
    </>,
    "gutter-extra-4": <>
      <path d="M31 32c-7-6-6-18 4-21 10-3 18 6 14 15l-4 6 12 5c7 3 4 10-2 9l-10-3 6 13c4 8-5 12-9 6l-5-10-6 11c-4 6-12 1-9-5l6-15-10 3c-7 2-10-6-4-9Z" fill="#b97943" stroke="#794628" />
      <path d="M34 24q4 4 8 0m-8 12 4 4 4-4m-23 5 3 4m32-3 3-4m-31 19 5 2m13 0 5-2" stroke="#fff0d3" strokeWidth="2" />
      <circle cx="35" cy="20" r="1.6" fill="#57382a" /><circle cx="42" cy="20" r="1.6" fill="#57382a" />
      <circle cx="38" cy="46" r="2" fill="#d45146" />
    </>,
  },
  "new-year": {
    logo: <>
      <path d="M37 31q-1-12-10-16m12 17q4-12 13-13M34 33q-11-7-20-2m28 4q12-4 19 4M34 38q-10 4-12 13m19-11q8 7 5 17m-9-16q0 16-8 23" stroke="#6555a0" strokeWidth="3" />
      <path d="m38 28 2 5 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#edb73f" stroke="#a77424" />
      <g fill="#d6972d"><circle cx="24" cy="13" r="2.6" /><circle cx="55" cy="17" r="2.4" /><circle cx="63" cy="42" r="2" /><circle cx="19" cy="54" r="2.3" /><circle cx="48" cy="60" r="2.3" /></g>
    </>,
    combo: <>
      <path d="m19 59 11-30 18 18-29 12Z" fill="#edbb50" stroke="#9b641b" />
      <path d="M37 34c1-8 8-9 8-17m-1 25c9-3 14-1 18-8m-13-2 6-8M26 48l9 4" stroke="#62539b" strokeWidth="2.5" />
      <path d="m54 12 2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#c9861b" />
      <circle cx="59" cy="45" r="2.2" fill="#62539b" /><circle cx="30" cy="21" r="2.2" fill="#c9861b" />
    </>,
    fried: <>
      <rect x="12" y="23" width="52" height="29" rx="7" fill="#5d4c97" stroke="#423575" />
      <rect x="16" y="27" width="44" height="21" rx="4" fill="#eee5fa" />
      <path d="m22 33 3-2v13m6-11 3-2v13m14-13h-5v6h5v7h-5m13-7h-5v-6h5v13h-5" stroke="#4d3d80" strokeWidth="2" />
      <circle cx="38" cy="35" r="0.9" fill="#4d3d80" /><circle cx="38" cy="40" r="0.9" fill="#4d3d80" />
      <path d="M56 13v7m-3.5-3.5h7M20 55v8m-4-4h8" stroke="#d6972d" strokeWidth="2" />
    </>,
    mixed: <>
      <path d="M18 56c17-2 22-12 17-21-4-7-14-6-14-13 0-5 7-7 13-6-2 1-6 4-3 7 7 6 17 8 15 19-2 10-13 17-28 14Z" fill="#a992d6" stroke="#6555a0" />
      <path d="M49 16q11-1 11 8c0 6-12 9-9 16 1 3 5 4 8 3-5 7-13 4-15-2-3-9 9-14 9-18 0-3-2-5-4-7Z" fill="#f2c96b" stroke="#b37b24" />
      <path d="m18 37-4-3m40 20 6 3m-21-39 3-6" stroke="#b37b24" strokeWidth="2.4" />
    </>,
    sides: <>
      <path d="m37 17 6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2Z" fill="#f5c45c" stroke="#9b641b" />
      <path d="M57 45v12m-6-6h12M18 19v9m-4.5-4.5h9" stroke="#62539b" />
    </>,
    drinks: <>
      <g transform="rotate(17 27 42)" stroke="#62539b">
        <path d="M20 23h14l-1 16a6 6 0 0 1-12 0Z" fill="#f8f1ff" />
        <path d="M22 32h10l-.5 7a4.5 4.5 0 0 1-9 0Z" fill="#f3ce76" stroke="none" />
        <path d="M27 45v12m-6 0h12" />
      </g>
      <g transform="rotate(-17 49 42)" stroke="#62539b">
        <path d="M42 23h14l-1 16a6 6 0 0 1-12 0Z" fill="#f8f1ff" />
        <path d="M44 32h10l-.5 7a4.5 4.5 0 0 1-9 0Z" fill="#f3ce76" stroke="none" />
        <path d="M49 45v12m-6 0h12" />
      </g>
      <path d="M38 12v6m-9-5 4 5m14-5-4 5" stroke="#b97d20" />
    </>,
    "gutter-start": <>
      <ellipse cx="38" cy="31" rx="16" ry="19" fill="#8e7ac6" stroke="#56478d" />
      <path d="M31 23c2-4 4-5 8-6" stroke="#f6e7ff" strokeWidth="2.6" />
      <path d="m38 50-4 5h8Zm0 5c7 6-6 9-1 13" fill="#8e7ac6" stroke="#56478d" />
      <path d="M59 32v10m-5-5h10" stroke="#b97d20" strokeWidth="2.5" />
    </>,
    "gutter-end": <>
      <path d="m34 17 25 40H17Z" fill="#f4c667" stroke="#936229" />
      <path d="m28 30 22 15m-29 1 18 11" stroke="#62539b" strokeWidth="4" />
      <circle cx="34" cy="15" r="6" fill="#a08cda" stroke="#62539b" />
      <path d="M60 18v11m-5.5-5.5h11" stroke="#b97d20" strokeWidth="2.4" />
    </>,
    "gutter-extra-1": <>
      <path d="M38 12v11m-10 38h20" stroke="#6557a0" strokeWidth="3" />
      <path d="m38 22 15 7 6 13-8 13-13 5-13-5-8-13 6-13Z" fill="#a698dd" stroke="#56478d" />
      <path d="m38 22-8 13 8 9 8-9-8-13Zm-15 7 7 6-13 7 12 4-4 9m28-26-7 6 13 7-12 4 4 9M29 46l9-2 9 2-9 14Z" fill="#eee5ff" stroke="#7564b4" />
      <path d="M61 22v9m-4.5-4.5h9M14 19v8m-4-4h8" stroke="#cb8e28" />
    </>,
    "gutter-extra-2": <>
      <path d="m36 33-18-9c-3-2-5 0-5 3v22c0 3 2 5 5 3l18-9m4-10 18-9c3-2 5 0 5 3v22c0 3-2 5-5 3l-18-9" fill="#a48cd9" stroke="#5a488c" />
      <rect x="33" y="32" width="10" height="12" rx="3" fill="#f2c96b" stroke="#a17324" />
      <path d="m22 32 8 4m-8 8 8-4m24-8-8 4m8 8-8-4" stroke="#eee5ff" />
      <path d="M54 12v8m-4-4h8m-37 42v8m-4-4h8" stroke="#b98128" />
    </>,
    "gutter-extra-3": <>
      <path d="M20 29c8-1 14-5 18-12 4 7 10 11 18 12l-5 19H25Z" fill="#f6ce74" stroke="#a17324" />
      <path d="M25 42h26m-13-7v3" stroke="#8e59a6" strokeWidth="2.4" />
      <circle cx="20" cy="27" r="3" fill="#9a87d3" /><circle cx="38" cy="17" r="3" fill="#9a87d3" /><circle cx="56" cy="27" r="3" fill="#9a87d3" />
      <path d="M29 56h18m-9-4v8" stroke="#6557a0" />
    </>,
    "gutter-extra-4": <>
      <path d="m15 30 27 2 13-10-2 27-14-10-25 1Z" fill="#9a84d4" stroke="#56478d" />
      <path d="m26 40 5 14h8l-3-14m17-18c3 5 3 21 0 27m7-25 5-5m-5 28 5 4m-4-15h7" stroke="#56478d" strokeWidth="2.4" />
      <path d="m18 34 19 1" stroke="#efe6ff" />
    </>,
  },
  tet: {
    logo: <>
      <path d="M38 12v10" stroke="#8b2927" strokeWidth="2.6" />
      <path d="M31 22c-19 2-22 26 0 29h14c22-3 19-27 0-29Z" fill="#cf4937" stroke="#8b2927" />
      <path d="M34 23c-10 7-10 19 0 27m8-27c10 7 10 19 0 27M38 22v29" stroke="#ffd173" />
      <path d="M30 22h16m-16 29h16" stroke="#b37723" strokeWidth="3" />
      <path d="M38 53v8m-4 0v5m4-5v6m4-6v5" stroke="#a33826" />
    </>,
    combo: <>
      <rect x="30" y="15" width="25" height="41" rx="2.5" transform="rotate(15 42 35)" fill="#e66a4c" stroke="#9c3729" />
      <g transform="rotate(-13 34 41)">
        <rect x="20" y="21" width="27" height="41" rx="2.5" fill="#b9342b" stroke="#8b2229" />
        <path d="m22 24 12 10 11-10" stroke="#f29e62" />
        <path d="m34 39 7 7-7 7-7-7Z" fill="#ffda7c" />
        <path d="M34 43v6m-3-3h6" stroke="#b9342b" />
      </g>
    </>,
    fried: <>
      <path d="M38 34C21 20 36 10 44 17c6 5 2 13-6 17 10-11 23-8 23 3 0 9-12 11-22 3 12 4 18 15 10 21-8 6-15-2-11-17-3 13-13 20-20 13-7-8 3-17 16-18-15 0-23-9-16-16 7-6 15 0 20 11Z" fill="#ffd36a" stroke="#b87526" />
      <circle cx="38" cy="39" r="5" fill="#ae4730" />
      <path d="M38 30v5m10 3-5 1m2 8-4-4m-9 5 3-5m-7-8 6 3" stroke="#ae4730" />
    </>,
    mixed: <>
      <path d="m17 30 24-13 19 13-24 15Z" fill="#80a760" stroke="#395c36" />
      <path d="m17 30 19 15v18L17 48Z" fill="#507b44" stroke="#395c36" />
      <path d="m36 45 24-15v18L36 63Z" fill="#64914d" stroke="#395c36" />
      <path d="m26 25 19 14v18m-10-37 19 14v18M23 35l24-14M31 41l24-14m-32 8v18m8-12v18" stroke="#d9dd98" strokeWidth="2.7" />
    </>,
    sides: <>
      <path d="M31 55c-3-15 3-26 12-33m-1 0c-1-7 6-11 13-9-1 7-6 11-13 9Z" fill="#6d9a57" stroke="#416437" />
      <circle cx="29" cy="43" r="11" fill="#ec9e38" stroke="#a55e2d" /><circle cx="47" cy="44" r="11" fill="#f3b94d" stroke="#a55e2d" />
      <circle cx="38" cy="52" r="10" fill="#ea8b38" stroke="#a55e2d" />
      <path d="M44 39c1-2 3-3 5-3m-24 3c1-2 3-3 5-3" stroke="#fff0a3" />
    </>,
    drinks: <>
      <path d="M50 34c10-5 14 0 14 6 0 7-6 11-14 9v-4c5 1 9-1 9-5 0-3-3-4-8-2Z" fill="#cb4937" stroke="#8b2229" />
      <path d="m24 37-11-8-4 2 4 7 10 11" fill="#ce5542" stroke="#8b2229" />
      <path d="M29 28h20c9 8 10 22 2 27-4 3-22 3-26 0-8-5-6-19 4-27Z" fill="#ce5542" stroke="#8b2229" />
      <path d="M27 29q1-7 11-7t13 7Zm9-7v-3h5v3" fill="#ed8960" stroke="#8b2229" />
      <path d="M32 42c4-4 8-4 12 0-4 4-8 4-12 0Z" fill="#ffd173" />
      <path d="M35 19c-5-4 5-6 0-10m10 10c-5-4 5-6 0-10" stroke="#c28b3c" />
    </>,
    "gutter-start": <>
      <path d="M14 29a32 32 0 0 1 48 0L38 58Z" fill="#dd5f48" stroke="#9a362e" />
      <path d="m24 22 14 36m0-41v41m14-36L38 58" stroke="#ffc965" strokeWidth="2" />
      <circle cx="38" cy="57" r="3.5" fill="#ffc965" stroke="#9a362e" />
    </>,
    "gutter-end": <>
      <path d="M28 19c12-8 24-4 26 5M30 21l20 36" stroke="#b77a31" />
      <g fill="#c9473d" stroke="#8b2927">
        <rect x="21" y="23" width="16" height="11" rx="2" transform="rotate(-28 29 28)" />
        <rect x="37" y="33" width="16" height="11" rx="2" transform="rotate(25 45 38)" />
        <rect x="26" y="44" width="16" height="11" rx="2" transform="rotate(-30 34 49)" />
        <rect x="44" y="51" width="16" height="11" rx="2" transform="rotate(20 52 56)" />
      </g>
      <path d="M57 17v8m-4-4h8M17 48v8m-4-4h8" stroke="#cd8c2b" strokeWidth="2.4" />
    </>,
    "gutter-extra-1": <>
      <path d="M28 49h20l-4 13H32Z" fill="#c85541" stroke="#8b322c" />
      <path d="M38 48V19" stroke="#6a5231" strokeWidth="2.5" />
      <path d="M18 38c-4-10 1-19 10-19 1-8 17-10 22-2 10 1 14 10 9 20-7 9-32 11-41 1Z" fill="#74a665" stroke="#3e663d" />
      <g fill="#f5ae3f" stroke="#a9602a">
        <circle cx="26" cy="29" r="4" /><circle cx="39" cy="20" r="4" /><circle cx="48" cy="31" r="4" /><circle cx="36" cy="37" r="4" />
      </g>
    </>,
    "gutter-extra-2": <>
      <path d="M18 49h40l-7 11H25Z" fill="#c94b3b" stroke="#8c372d" />
      <path d="M18 43c1-9 9-12 20-12s19 3 20 12l-3 6H21Z" fill="#f7cb64" stroke="#a76d27" />
      <path d="m27 37 5 5m7-7 3 6m5-5 5 4" stroke="#c95239" strokeWidth="2.4" />
      <path d="M30 25c-4-3 3-5 0-9m13 9c-4-3 3-5 0-9" stroke="#a76d27" />
    </>,
    "gutter-extra-3": <>
      <path d="M19 56c16-5 27-16 35-34m-15 16c-9-4-13-11-12-18m18 13c6 2 12 1 17-3" stroke="#815133" strokeWidth="3" />
      <g fill="#f6b3a5" stroke="#bc645e">
        <path d="M27 19c-9-7-13 3-7 6-3 7 8 10 10 3 7 3 10-8 3-9 0-6-6-6-6 0Z" />
        <path d="M53 21c-8-6-12 2-7 5-2 7 7 8 9 2 7 3 9-7 3-8 0-5-5-5-5 1Z" />
      </g>
      <circle cx="27" cy="25" r="2.5" fill="#9c4039" /><circle cx="53" cy="25" r="2.5" fill="#9c4039" />
    </>,
    "gutter-extra-4": <>
      <path d="m38 15 23 23-23 23-23-23Z" fill="#bf4436" stroke="#842e2d" />
      <path d="m38 21 17 17-17 17-17-17Z" stroke="#ffd678" />
      <path d="M32 34h12m-10 5h8m-7 5h6" stroke="#ffd678" strokeWidth="2.4" />
      <path d="M38 61v6m-4-2h8" stroke="#a86b2d" />
    </>,
  },
};

const gutterArtwork = ["gutter-start", "gutter-end", "gutter-extra-1", "gutter-extra-2", "gutter-extra-3", "gutter-extra-4"] as const;
type GutterSlot = typeof gutterArtwork[number];
type GutterPlacement = { slot: GutterSlot; side: "start" | "end"; style: CSSProperties };

function mix(value: number) {
  return Math.imul(value ^ (value >>> 16), 0x45d9f3b) >>> 0;
}

export function SeasonGutterStickers({ theme, index, seed }: { theme: ThemeName; index: number; seed: number }) {
  if (theme === "default" || index > 4) return null;

  // Reserve two designs for each of the first two categories, then one per category.
  const first = index < 2 ? index * 2 : index + 2;
  const count = index < 2 ? 2 : 1;
  const offset = mix(seed) % gutterArtwork.length;
  const order = (mix(seed + 1) & 1) === 0 ? 1 : -1;
  const startsOnLeft = (mix(seed + index * 117) & 1) === 0;

  return Array.from({ length: count }, (_, number) => {
    const ordinal = first + number;
    if (ordinal >= gutterArtwork.length) return null;
    const slot = gutterArtwork[(offset + ordinal * order + gutterArtwork.length) % gutterArtwork.length];
    const scatter = mix(seed + ordinal * 481 + 31);
    const side = startsOnLeft === (number === 0) ? "start" : "end";
    return <SeasonSticker key={slot} theme={theme} gutter={{
      slot, side,
      style: {
        "--gutter-top": `${12 + (scatter % 41)}%`,
        "--gutter-tilt": `${((scatter >>> 8) % 51) - 25}deg`,
        "--gutter-scale": 0.66 + ((scatter >>> 16) % 35) / 100,
        "--gutter-offset": `${((scatter >>> 24) % 18) + 3}px`,
      } as CSSProperties,
    }} />;
  });
}

export function SeasonSticker({ theme, category, gutter }: { theme: ThemeName; category?: string; gutter?: GutterPlacement }) {
  if (theme === "default") return null;
  const placement = gutter ? { slot: gutter.slot, position: "gutter" }
    : category === undefined ? { slot: "logo", position: "logo" } as const : placements.get(category);
  if (!placement) return null;

  return <svg className="menu-season-sticker" aria-hidden="true" viewBox="0 0 76 76" fill="none"
    data-season={theme} data-position={placement.position} data-sticker={placement.slot} data-side={gutter?.side} style={gutter?.style}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {artwork[theme][placement.slot]}
  </svg>;
}
