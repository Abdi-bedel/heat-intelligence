// The 4 hero carousel scene visualisations, ported from ux-guide/heat-b2b-landing.html.
// Each scene matches one of the readings in Hero.tsx and uses the same animations
// (line draw → fade-up callout) so the carousel feels alive.

const ANIM_STYLES = `
  @keyframes draw { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes growBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  .scene-line { stroke-dasharray: 600; stroke-dashoffset: 600; animation: draw 1.4s ease-out 0.2s forwards; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .scene-line-2 { stroke-dasharray: 600; stroke-dashoffset: 600; animation: draw 1.6s ease-out 0.7s forwards; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .scene-fade { opacity: 0; animation: fadeUp 0.6s ease-out 1.4s forwards; }
  .scene-fade-late { opacity: 0; animation: fadeUp 0.6s ease-out 2s forwards; }
  .scene-bar { transform-origin: bottom; transform: scaleY(0); animation: growBar 0.6s ease-out forwards; }
`;

export function HeroScene({ index }: { index: number }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <style>{ANIM_STYLES}</style>
      {index === 0 && <SceneGap />}
      {index === 1 && <SceneTonight />}
      {index === 2 && <SceneWin />}
      {index === 3 && <SceneDrift />}
    </div>
  );
}

// Scene 0 — Gap chart. Dashed neighbourhood line above solid coral venue line, with -40% callout.
function SceneGap() {
  return (
    <svg viewBox="0 0 360 200" className="h-full w-full overflow-visible">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
        <text
          key={d}
          x={i * 60}
          y={14}
          fontSize="10"
          fill="var(--text-tertiary)"
          fontFamily="Inter, sans-serif"
          letterSpacing="0.05em"
        >
          {d}
        </text>
      ))}
      <line x1="0" y1="180" x2="360" y2="180" stroke="var(--border)" strokeWidth="0.5" />
      <line x1="0" y1="120" x2="360" y2="120" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
      <path
        className="scene-line"
        d="M 0 90 Q 40 84 60 80 Q 90 75 120 70 Q 150 67 180 65 Q 210 60 240 55 Q 270 52 300 50"
        stroke="var(--text-tertiary)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <path
        className="scene-line-2"
        d="M 0 150 Q 40 144 60 138 Q 90 134 120 130 Q 150 120 180 112 Q 210 110 240 108 Q 270 112 300 115"
        stroke="var(--coral)"
        strokeWidth="2.5"
      />
      <g className="scene-fade-late">
        <line x1="305" y1="115" x2="335" y2="82" stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="2 2" />
        <rect x="245" y="58" width="115" height="36" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5" />
        <text x="253" y="74" fontSize="11" fill="var(--text-primary)" fontWeight="500" fontFamily="Inter, sans-serif">Gap to baseline</text>
        <text x="253" y="88" fontSize="13" fill="var(--coral)" fontWeight="500" fontFamily="Inter, sans-serif">−40%</text>
      </g>
    </svg>
  );
}

// Scene 1 — Hourly trace, peak at 22:00, "1.4× baseline" callout.
function SceneTonight() {
  return (
    <svg viewBox="0 0 360 200" className="h-full w-full overflow-visible">
      {[
        ['18:00', 10],
        ['20:00', 80],
        ['22:00', 150],
        ['00:00', 220],
        ['02:00', 290],
      ].map(([label, x]) => (
        <text
          key={label as string}
          x={x as number}
          y={192}
          fontSize="10"
          fill="var(--text-tertiary)"
          fontFamily="Inter, sans-serif"
          letterSpacing="0.05em"
        >
          {label}
        </text>
      ))}
      <line x1="0" y1="175" x2="360" y2="175" stroke="var(--border)" strokeWidth="0.5" />
      <line x1="0" y1="115" x2="360" y2="115" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 3" />
      <text x="0" y="112" fontSize="10" fill="var(--text-tertiary)" fontFamily="Inter, sans-serif">Baseline</text>
      <path
        className="scene-line"
        d="M 10 150 Q 50 140 80 130 Q 110 120 150 110 Q 180 102 220 100 Q 250 108 290 120 Q 320 135 350 150"
        stroke="var(--text-tertiary)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <path
        className="scene-line-2"
        d="M 10 155 Q 50 140 80 120 Q 110 100 150 80 Q 180 70 220 68 Q 250 80 290 98 Q 320 120 350 140"
        stroke="var(--coral)"
        strokeWidth="2.5"
      />
      <g className="scene-fade">
        <circle cx="220" cy="68" r="4" fill="var(--coral)" />
        <line x1="220" y1="64" x2="220" y2="40" stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="2 2" />
        <rect x="170" y="20" width="100" height="22" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5" />
        <text x="180" y="34" fontSize="11" fill="var(--coral)" fontWeight="500" fontFamily="Inter, sans-serif">Peak · 1.4× baseline</text>
      </g>
    </svg>
  );
}

// Scene 2 — Weekday bar chart, Thursday in teal.
function SceneWin() {
  const days = [
    { label: 'Mon', x: 6, h: 35, peak: false },
    { label: 'Tue', x: 56, h: 55, peak: false },
    { label: 'Wed', x: 106, h: 65, peak: false },
    { label: 'Thu', x: 156, h: 105, peak: true },
    { label: 'Fri', x: 206, h: 115, peak: false },
    { label: 'Sat', x: 256, h: 125, peak: false },
    { label: 'Sun', x: 306, h: 50, peak: false },
  ];
  return (
    <svg viewBox="0 0 360 200" className="h-full w-full overflow-visible">
      {days.map((d, i) => (
        <text
          key={d.label}
          x={d.x + 8}
          y={192}
          fontSize="10"
          fill="var(--text-tertiary)"
          fontFamily="Inter, sans-serif"
        >
          {d.label}
        </text>
      ))}
      <line x1="0" y1="175" x2="360" y2="175" stroke="var(--border)" strokeWidth="0.5" />
      {days.map((d, i) => (
        <g key={d.label} className="scene-bar" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
          <rect
            x={d.x}
            y={175 - d.h}
            width="38"
            height={d.h}
            fill={d.peak ? 'var(--teal)' : 'var(--text-tertiary)'}
            rx="3"
          />
        </g>
      ))}
      <g className="scene-fade-late">
        <line x1="175" y1="70" x2="175" y2="42" stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="2 2" />
        <rect x="135" y="22" width="80" height="22" rx="6" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="0.5" />
        <text x="143" y="36" fontSize="11" fill="var(--teal)" fontWeight="500" fontFamily="Inter, sans-serif">Your best night</text>
      </g>
    </svg>
  );
}

// Scene 3 — Four week tiles + amber descending line.
function SceneDrift() {
  const weeks = [
    { label: 'Week 1', value: '102%', delta: '+2%', color: 'text-teal' },
    { label: 'Week 2', value: '96%', delta: '−4%', color: 'text-text-tertiary' },
    { label: 'Week 3', value: '93%', delta: '−3%', color: 'text-text-tertiary' },
    { label: 'Week 4', value: '90%', delta: '−3%', color: 'text-coral' },
  ];
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="grid grid-cols-4 gap-2.5">
        {weeks.map((w, i) => (
          <div
            key={w.label}
            className="rounded-md border-hairline border-border bg-bg-card px-3 py-2.5"
          >
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
              {w.label}
            </div>
            <div
              className={`font-serif text-[20px] font-medium tracking-tight tabular-nums ${i === 3 ? 'text-amber-text' : 'text-text-primary'}`}
            >
              {w.value}
            </div>
            <div className={`text-[11px] ${w.color}`}>{w.delta}</div>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 360 80" className="h-20 w-full overflow-visible">
        <line x1="0" y1="20" x2="360" y2="20" stroke="var(--border)" strokeDasharray="2 3" strokeWidth="0.5" />
        <text x="0" y="16" fontSize="10" fill="var(--text-tertiary)" fontFamily="Inter, sans-serif">
          Neighbourhood baseline
        </text>
        <path
          className="scene-line-2"
          d="M 20 18 Q 90 28 170 38 Q 250 50 340 56"
          stroke="var(--amber-text)"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
