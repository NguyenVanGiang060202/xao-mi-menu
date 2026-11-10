import type { HolidayTheme } from "@/lib/menu-data";

const icons = {
  book: <g stroke="#594778">
    <path d="M38 22c-9-7-19-9-29-5v33c12-3 22 0 29 7 7-7 17-10 29-7V17c-10-4-20-2-29 5Z" fill="#fff0cb" strokeWidth="2.4" />
    <path d="M38 22v35M16 27q9-1 16 4m-16 5q9-1 16 4m12-9q7-5 16-4m-16 13q7-5 16-4" />
    <path d="m54 12 4-5 5 4-17 23-6 2 1-6Z" fill="#f4a15e" />
  </g>,
  lotus: <g stroke="#875170" strokeWidth="2.2">
    <path d="M38 61c-13 3-23-3-27-11 8-2 15-1 20 2m7 9c13 3 23-3 27-11-8-2-15-1-20 2" fill="#a3bb7a" stroke="#52774d" />
    <path d="M38 55C17 55 11 45 9 31c10 0 18 5 24 12-4-9-4-18 5-28 9 10 9 19 5 28 6-7 14-12 24-12-2 14-8 24-29 24Z" fill="#ef9ab8" />
    <path d="M38 53c-10-5-12-14-8-21 4 2 7 6 8 10 1-4 4-8 8-10 4 7 2 16-8 21Z" fill="#ffe4df" />
  </g>,
  drum: <g stroke="#87562d">
    <circle cx="38" cy="38" r="27" fill="#d99a51" strokeWidth="2.4" />
    <circle cx="38" cy="38" r="22" fill="#ffe0a1" />
    <circle cx="38" cy="38" r="16" strokeDasharray="2 3" />
    <path d="m38 25 2 9 7-5-5 7 9 2-9 2 5 7-7-5-2 9-2-9-7 5 5-7-9-2 9-2-5-7 7 5Z" fill="#a75c36" />
  </g>,
  fan: <g stroke="#63596d" strokeWidth="2">
    <path d="M38 62 9 31a40 40 0 0 1 58 0Z" fill="#e9bfc8" />
    <path d="M38 62 18 25m20 37-9-42m9 42 9-42m-9 42 20-37" stroke="#a07083" />
    <path d="M16 35a34 34 0 0 1 44 0" stroke="#fff1d8" strokeWidth="3" />
    <circle cx="38" cy="60" r="4" fill="#cc944b" />
  </g>,
  flag: <g stroke="#8d302b">
    <path d="M17 12v52" stroke="#875333" strokeWidth="4" />
    <path d="M19 15c16-7 29 7 47 0v33c-18 7-31-7-47 0Z" fill="#d84a42" strokeWidth="2" />
    <path d="m43 22 2 7h8l-6 4 2 7-6-4-6 4 2-7-6-4h8Z" fill="#ffde78" stroke="none" />
  </g>,
  city: <g stroke="#834936" strokeWidth="2.2">
    <path d="M10 61h56v-7H10Zm8-7V36h40v18m-33-18V22h26v14m-13-14V12" fill="#ffdcaa" />
    <path d="M24 43h4m10 0h4m10 0h4M24 49h4m10 0h4m10 0h4" />
    <path d="M38 12h14v8H38" fill="#df6650" />
  </g>,
  stars: <g stroke="#a05a34" strokeWidth="2">
    <path d="m38 11 7 18 19 1-15 12 5 19-16-11-16 11 5-19-15-12 19-1Z" fill="#ffd377" />
    <path d="M60 14v10m-5-5h10M13 46v10m-5-5h10m47 0v8m-4-4h8" stroke="#cd6c43" />
  </g>,
  lantern: <g stroke="#87506b" strokeWidth="2.1">
    <path d="M38 11v8m-7 1h14m-14 34h14m-11 2v8m4-8v12m4-12v8" />
    <ellipse cx="38" cy="37" rx="22" ry="17" fill="#ea885b" />
    <ellipse cx="38" cy="37" rx="11" ry="17" fill="#ffc580" />
    <path d="M38 21v32" stroke="#aa575a" />
  </g>,
  moon: <g stroke="#8c6b37" strokeWidth="2">
    <path d="M48 13c-14 1-24 14-19 27 4 11 15 16 27 11-7 12-23 15-35 7-12-8-15-24-7-36 7-11 22-15 34-9Z" fill="#ffdc91" />
    <path d="m56 17 2 6 6 2-6 2-2 6-2-6-6-2 6-2Zm7 20v10m-5-5h10" fill="#ffbc72" />
  </g>,
  bouquet: <g stroke="#93526b" strokeWidth="2">
    <path d="M25 38 35 64l13 1 11-27-17 6Z" fill="#ffe6b9" />
    <path d="M31 44 23 29m17 17 1-20m6 19 10-16" stroke="#60804a" strokeWidth="2.6" />
    <circle cx="22" cy="25" r="9" fill="#ef9cae" />
    <circle cx="41" cy="20" r="11" fill="#efb1d0" />
    <circle cx="58" cy="27" r="9" fill="#f2aa80" />
    <path d="M38 21q4-6 8-1m-27 7 5-4m32 6 5-3m-29 27 19 3" />
  </g>,
};

const holidayArt: Record<HolidayTheme, readonly [keyof typeof icons, keyof typeof icons, keyof typeof icons]> = {
  "teachers-day": ["book", "bouquet", "stars"],
  "culture-day": ["lotus", "fan", "drum"],
  "hung-kings": ["drum", "lotus", "fan"],
  "april-holiday": ["city", "flag", "stars"],
  "national-day": ["flag", "stars", "city"],
  "mid-autumn": ["lantern", "moon", "stars"],
  "womens-day": ["bouquet", "fan", "lotus"],
};

export function holidaySticker(theme: HolidayTheme, index: number) {
  return icons[holidayArt[theme][index % 3]];
}
