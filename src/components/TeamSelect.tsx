import "@/assets/css/scan.css";

export const TEAMS = [
  { key: 1,  name: "A-ploeg"     },
  { key: 3,  name: "Tempo's"     },
  { key: 4,  name: "Sportivo's"  },
  { key: 5,  name: "Cyclo's"     },
  { key: 6,  name: "Toeristen"   },
  { key: 7,  name: "D-Ploeg"     },
  { key: 9,  name: "Trappers"    },
  { key: 10, name: "Moderato's"  },
  { key: 11, name: "Volgwagen"   },
] as const;

export type Team = (typeof TEAMS)[number];

// Numpad layout: null = empty slot
const ROWS: (Team | null)[][] = [
  [TEAMS[0], null,     TEAMS[1]],   // 1  _  3
  [TEAMS[2], TEAMS[3], TEAMS[4]],   // 4  5  6
  [TEAMS[5], null,     TEAMS[6]],   // 7  _  9
  [TEAMS[7], TEAMS[8], null    ],   // 10 11 _
];

interface Props {
  niss: string;
  onSelect: (team: Team) => void;
  onCancel: () => void;
}

export default function TeamSelect({ niss, onSelect, onCancel }: Props) {
  return (
    <div className="resultModal">
      <div className="result">{niss}</div>
      <div className="numpad">
        {ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="numpad-row">
            {row.map((team, colIdx) =>
              team ? (
                <button key={team.key} className="numpad-key" onClick={() => onSelect(team)}>
                  <span className="numpad-num">{team.key}</span>
                  <span className="numpad-name">{team.name}</span>
                </button>
              ) : (
                <div key={`empty-${colIdx}`} className="numpad-key numpad-key--empty" />
              )
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <a
          href="!#"
          className="myHref"
          style={{ padding: 12 }}
          onClick={(e) => { e.preventDefault(); onCancel(); }}
        >
          ANNULEREN
        </a>
      </div>
    </div>
  );
}
