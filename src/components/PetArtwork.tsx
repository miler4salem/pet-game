import React from 'react';
import { PetMood, SpeciesId } from '../types/pet';

interface PetArtworkProps {
  speciesId: SpeciesId;
  mood?: PetMood;
  isReacting?: boolean;
  size?: number;
}

export const PetArtwork: React.FC<PetArtworkProps> = ({
  speciesId,
  mood = 'happy',
  isReacting = false,
  size = 180,
}) => {
  const isSad = mood === 'urgent';
  const isTired = mood === 'needs_care';
  const isJoyful = mood === 'thriving' || isReacting;

  const animClass = isReacting
    ? 'pet-react-bounce'
    : isSad
      ? 'pet-sad-sway'
      : 'pet-idle-breathe';

  return (
    <div
      className={`pet-svg-wrapper ${animClass}`}
      style={{ width: size, height: size }}
    >
      {speciesId === 'dog' && (
        <svg viewBox="0 0 200 200" width="100%" height="100%" aria-label="Golden Retriever">
          {/* Shadow */}
          <ellipse cx="100" cy="176" rx="54" ry="11" fill="rgba(0,0,0,0.12)" />
          {/* Wagging Tail */}
          <path
            className={isSad ? '' : 'pet-tail-wag'}
            d="M144 134 Q175 112 168 88"
            stroke="#e09f3e"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          {/* Body */}
          <ellipse cx="102" cy="138" rx="46" ry="34" fill="#f2b857" />
          <ellipse cx="102" cy="144" rx="28" ry="22" fill="#fce1a6" />
          {/* Collar */}
          <rect x="74" y="106" width="52" height="12" rx="6" fill="#dc2626" />
          <circle cx="100" cy="121" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
          {/* Paws */}
          <ellipse cx="74" cy="168" rx="14" ry="9" fill="#f2b857" />
          <ellipse cx="128" cy="168" rx="14" ry="9" fill="#f2b857" />
          {/* Floppy Ears */}
          <ellipse cx="52" cy="82" rx="16" ry="30" transform="rotate(14 52 82)" fill="#d48c2c" />
          <ellipse cx="148" cy="82" rx="16" ry="30" transform="rotate(-14 148 82)" fill="#d48c2c" />
          {/* Head */}
          <circle cx="100" cy="78" r="42" fill="#f5c26b" />
          {/* Muzzle */}
          <ellipse cx="100" cy="94" rx="22" ry="16" fill="#fff3d6" />
          {/* Nose */}
          <ellipse cx="100" cy="87" rx="8" ry="6" fill="#3b2618" />
          <ellipse cx="97" cy="85" rx="2.5" ry="1.5" fill="#fff" opacity="0.5" />
          {/* Eyes */}
          {isJoyful ? (
            <>
              <path d="M77 73 Q83 65 89 73" stroke="#2c1d12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M111 73 Q117 65 123 73" stroke="#2c1d12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="83" cy="72" r="5.5" fill="#2c1d12" />
              <circle cx="81" cy="70" r="2" fill="#fff" />
              <circle cx="117" cy="72" r="5.5" fill="#2c1d12" />
              <circle cx="115" cy="70" r="2" fill="#fff" />
              {isTired && (
                <>
                  <line x1="76" y1="67" x2="90" y2="69" stroke="#f5c26b" strokeWidth="4" />
                  <line x1="110" y1="69" x2="124" y2="67" stroke="#f5c26b" strokeWidth="4" />
                </>
              )}
            </>
          )}
          {/* Blush */}
          {isJoyful && (
            <>
              <ellipse cx="71" cy="85" rx="7" ry="4" fill="#fb7185" opacity="0.45" />
              <ellipse cx="129" cy="85" rx="7" ry="4" fill="#fb7185" opacity="0.45" />
            </>
          )}
          {/* Mouth / Tongue */}
          {isSad ? (
            <path d="M90 103 Q100 96 110 103" stroke="#3b2618" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <path d="M91 96 Q100 104 109 96" stroke="#3b2618" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {isJoyful && <path d="M95 100 Q100 114 105 100" fill="#fb7185" />}
            </>
          )}
        </svg>
      )}

      {speciesId === 'cat' && (
        <svg viewBox="0 0 200 200" width="100%" height="100%" aria-label="Ginger Tabby Cat">
          <ellipse cx="100" cy="176" rx="50" ry="10" fill="rgba(0,0,0,0.12)" />
          {/* Curled Tail */}
          <path
            className={isSad ? '' : 'pet-tail-wag'}
            d="M142 152 Q178 145 170 108 Q166 94 154 98"
            stroke="#ea7c31"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          {/* Body */}
          <ellipse cx="100" cy="140" rx="40" ry="34" fill="#f59247" />
          <ellipse cx="100" cy="146" rx="23" ry="24" fill="#fff0df" />
          {/* Paws */}
          <ellipse cx="82" cy="170" rx="12" ry="8" fill="#fff0df" />
          <ellipse cx="118" cy="170" rx="12" ry="8" fill="#fff0df" />
          {/* Ears */}
          <polygon points="62,72 56,30 90,54" fill="#f59247" />
          <polygon points="64,65 61,40 82,55" fill="#fda4af" />
          <polygon points="138,72 144,30 110,54" fill="#f59247" />
          <polygon points="136,65 139,40 118,55" fill="#fda4af" />
          {/* Head */}
          <ellipse cx="100" cy="82" rx="42" ry="36" fill="#f59247" />
          {/* Tabby Forehead Stripes */}
          <path d="M92 50 L94 60 M100 47 L100 61 M108 50 L106 60" stroke="#c2571a" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cheek stripes */}
          <path d="M58 84 L68 85 M58 92 L69 91 M142 84 L132 85 M142 92 L131 91" stroke="#c2571a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Eyes */}
          {isJoyful ? (
            <>
              <path d="M77 79 Q84 72 91 79" stroke="#2c1d12" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              <path d="M109 79 Q116 72 123 79" stroke="#2c1d12" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <ellipse cx="83" cy="79" rx="6.5" ry="7.5" fill="#15803d" />
              <ellipse cx="83" cy="79" rx="3" ry="6" fill="#111" />
              <circle cx="81" cy="76" r="2" fill="#fff" />
              <ellipse cx="117" cy="79" rx="6.5" ry="7.5" fill="#15803d" />
              <ellipse cx="117" cy="79" rx="3" ry="6" fill="#111" />
              <circle cx="115" cy="76" r="2" fill="#fff" />
            </>
          )}
          {/* Pink Nose */}
          <polygon points="95,89 105,89 100,95" fill="#fb7185" />
          {/* Mouth */}
          {isSad ? (
            <path d="M93 102 Q100 97 107 102" stroke="#3b2618" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M90 98 Q95 103 100 98 Q105 103 110 98" stroke="#3b2618" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          )}
          {/* Whiskers */}
          <g stroke="#7c4a26" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
            <line x1="48" y1="88" x2="72" y2="91" />
            <line x1="46" y1="96" x2="72" y2="96" />
            <line x1="152" y1="88" x2="128" y2="91" />
            <line x1="154" y1="96" x2="128" y2="96" />
          </g>
        </svg>
      )}

      {speciesId === 'parakeet' && (
        <svg viewBox="0 0 200 200" width="100%" height="100%" aria-label="Sky Blue Parakeet">
          {/* Wooden Perch */}
          <rect x="28" y="156" width="144" height="12" rx="6" fill="#a16207" />
          <rect x="28" y="156" width="144" height="4" rx="2" fill="#ca8a04" opacity="0.6" />
          {/* Long Tail */}
          <polygon points="94,142 108,142 118,192 98,188" fill="#0369a1" />
          {/* Body */}
          <ellipse cx="100" cy="116" rx="34" ry="44" fill="#38bdf8" />
          <ellipse cx="100" cy="126" rx="22" ry="30" fill="#bae6fd" />
          {/* Wings */}
          <ellipse
            className={isJoyful ? 'pet-wing-flutter' : ''}
            cx="68"
            cy="118"
            rx="14"
            ry="32"
            transform="rotate(14 68 118)"
            fill="#0284c7"
          />
          <ellipse
            className={isJoyful ? 'pet-wing-flutter' : ''}
            cx="132"
            cy="118"
            rx="14"
            ry="32"
            transform="rotate(-14 132 118)"
            fill="#0284c7"
          />
          {/* Head */}
          <circle cx="100" cy="68" r="28" fill="#fef08a" />
          {/* Crown Stripes */}
          <path d="M88 45 Q100 40 112 45 M84 51 Q100 46 116 51" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Cheek Patches */}
          <ellipse cx="80" cy="79" rx="6" ry="4" fill="#2563eb" opacity="0.8" />
          <ellipse cx="120" cy="79" rx="6" ry="4" fill="#2563eb" opacity="0.8" />
          {/* Eyes */}
          {isJoyful ? (
            <>
              <path d="M82 67 Q87 62 92 67" stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <path d="M108 67 Q113 62 118 67" stroke="#0f172a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="87" cy="67" r="4.5" fill="#0f172a" />
              <circle cx="85.5" cy="65.5" r="1.5" fill="#fff" />
              <circle cx="113" cy="67" r="4.5" fill="#0f172a" />
              <circle cx="111.5" cy="65.5" r="1.5" fill="#fff" />
            </>
          )}
          {/* Cere & Beak */}
          <ellipse cx="100" cy="74" rx="7" ry="4" fill="#60a5fa" />
          <polygon points="94,77 106,77 100,89" fill="#f59e0b" />
          {/* Feet gripping perch */}
          <path d="M88 154 L85 162 M92 154 L92 162 M108 154 L108 162 M112 154 L115 162" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      )}

      {speciesId === 'frog' && (
        <svg viewBox="0 0 200 200" width="100%" height="100%" aria-label="Green Tree Frog">
          {/* Broad Tropical Leaf */}
          <ellipse cx="100" cy="166" rx="72" ry="20" fill="#15803d" />
          <path d="M36 166 Q100 160 164 166" stroke="#4ade80" strokeWidth="2.5" fill="none" opacity="0.6" />
          {/* Back Legs */}
          <ellipse cx="58" cy="144" rx="22" ry="16" transform="rotate(-20 58 144)" fill="#22c55e" />
          <ellipse cx="142" cy="144" rx="22" ry="16" transform="rotate(20 142 144)" fill="#22c55e" />
          {/* Body */}
          <ellipse cx="100" cy="128" rx="46" ry="38" fill="#4ade80" />
          <ellipse cx="100" cy="138" rx="32" ry="24" fill="#dcfce7" />
          {/* Front Legs & Sticky Toe Pads */}
          <line x1="76" y1="138" x2="68" y2="160" stroke="#22c55e" strokeWidth="9" strokeLinecap="round" />
          <line x1="124" y1="138" x2="132" y2="160" stroke="#22c55e" strokeWidth="9" strokeLinecap="round" />
          <circle cx="63" cy="162" r="4.5" fill="#facc15" />
          <circle cx="72" cy="163" r="4.5" fill="#facc15" />
          <circle cx="128" cy="163" r="4.5" fill="#facc15" />
          <circle cx="137" cy="162" r="4.5" fill="#facc15" />
          {/* Head */}
          <ellipse cx="100" cy="96" rx="44" ry="30" fill="#4ade80" />
          {/* Big Bulging Frog Eyes */}
          <circle cx="72" cy="70" r="18" fill="#4ade80" />
          <circle cx="128" cy="70" r="18" fill="#4ade80" />
          <circle cx="72" cy="70" r="13" fill="#facc15" />
          <circle cx="128" cy="70" r="13" fill="#facc15" />
          {isJoyful ? (
            <>
              <path d="M64 71 Q72 62 80 71" stroke="#14532d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M120 71 Q128 62 136 71" stroke="#14532d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="72" cy="70" rx="7" ry="6" fill="#0f172a" />
              <circle cx="69" cy="67" r="2.5" fill="#fff" />
              <ellipse cx="128" cy="70" rx="7" ry="6" fill="#0f172a" />
              <circle cx="125" cy="67" r="2.5" fill="#fff" />
            </>
          )}
          {/* Rosy Cheeks */}
          <ellipse cx="66" cy="100" rx="8" ry="4.5" fill="#fb7185" opacity="0.4" />
          <ellipse cx="134" cy="100" rx="8" ry="4.5" fill="#fb7185" opacity="0.4" />
          {/* Wide Frog Smile */}
          {isSad ? (
            <path d="M78 108 Q100 98 122 108" stroke="#14532d" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M74 102 Q100 116 126 102" stroke="#14532d" strokeWidth="3" fill="none" strokeLinecap="round" />
          )}
        </svg>
      )}

      {speciesId === 'bearded_dragon' && (
        <svg viewBox="0 0 200 200" width="100%" height="100%" aria-label="Bearded Dragon">
          {/* Basking Rock */}
          <ellipse cx="100" cy="168" rx="70" ry="18" fill="#a8a29e" />
          <ellipse cx="100" cy="164" rx="60" ry="12" fill="#d6d3d1" />
          {/* Tail */}
          <path
            d="M140 144 Q182 150 184 126"
            stroke="#d97706"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          {/* Spiky Side Fringes */}
          <polygon points="56,126 48,132 58,136" fill="#b45309" />
          <polygon points="54,138 46,144 58,148" fill="#b45309" />
          <polygon points="144,126 152,132 142,136" fill="#b45309" />
          <polygon points="146,138 154,144 142,148" fill="#b45309" />
          {/* Pancake Body */}
          <ellipse cx="100" cy="138" rx="46" ry="28" fill="#f59e0b" />
          <ellipse cx="100" cy="140" rx="30" ry="18" fill="#fde68a" />
          {/* Legs */}
          <path d="M68 150 L54 162 M132 150 L146 162" stroke="#d97706" strokeWidth="10" strokeLinecap="round" />
          {/* Beard (turns dark if urgent, golden if happy!) */}
          <polygon
            points="66,94 134,94 118,120 100,126 82,120"
            fill={isSad ? '#44403c' : '#fb923c'}
          />
          {/* Head (Triangular Beardie Shape) */}
          <polygon points="100,52 142,88 128,110 72,110 58,88" fill="#f59e0b" />
          {/* Head Spikes */}
          <polygon points="62,84 52,80 60,94" fill="#b45309" />
          <polygon points="138,84 148,80 140,94" fill="#b45309" />
          {/* Eyes */}
          {isJoyful ? (
            <>
              <path d="M77 84 Q84 78 91 84" stroke="#451a03" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M109 84 Q116 78 123 84" stroke="#451a03" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="84" cy="84" r="6" fill="#fef3c7" />
              <circle cx="84" cy="84" r="3.5" fill="#1c1917" />
              <circle cx="116" cy="84" r="6" fill="#fef3c7" />
              <circle cx="116" cy="84" r="3.5" fill="#1c1917" />
            </>
          )}
          {/* Smile */}
          {isSad ? (
            <path d="M86 102 Q100 96 114 102" stroke="#451a03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M84 98 Q100 107 116 98" stroke="#451a03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </svg>
      )}

      {speciesId === 'pygmy_goat' && (
        <svg viewBox="0 0 200 200" width="100%" height="100%" aria-label="Pygmy Goat">
          <ellipse cx="100" cy="176" rx="54" ry="10" fill="rgba(0,0,0,0.12)" />
          {/* Cute Little Upright Goat Tail */}
          <path
            className={isSad ? '' : 'pet-tail-wag'}
            d="M146 126 Q160 110 156 100"
            stroke="#78350f"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          {/* Legs & Hooves */}
          <rect x="70" y="144" width="11" height="28" rx="5" fill="#fef3c7" />
          <rect x="70" y="164" width="11" height="9" rx="3" fill="#292524" />
          <rect x="118" y="144" width="11" height="28" rx="5" fill="#fef3c7" />
          <rect x="118" y="164" width="11" height="9" rx="3" fill="#292524" />
          {/* Body */}
          <ellipse cx="100" cy="132" rx="46" ry="30" fill="#d6b48e" />
          {/* Caramel Patch */}
          <ellipse cx="116" cy="128" rx="22" ry="18" fill="#a16207" opacity="0.55" />
          {/* Horns */}
          <path d="M84 54 Q76 32 64 36" stroke="#78716c" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M116 54 Q124 32 136 36" stroke="#78716c" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Perky Ears */}
          <ellipse cx="56" cy="68" rx="18" ry="8" transform="rotate(-18 56 68)" fill="#a16207" />
          <ellipse cx="144" cy="68" rx="18" ry="8" transform="rotate(18 144 68)" fill="#a16207" />
          {/* Head */}
          <ellipse cx="100" cy="78" rx="36" ry="34" fill="#f5e6d3" />
          {/* Forehead Patch */}
          <ellipse cx="100" cy="60" rx="18" ry="12" fill="#a16207" opacity="0.6" />
          {/* Cute Goatee */}
          <polygon points="91,108 109,108 100,124" fill="#78350f" />
          {/* Eyes */}
          {isJoyful ? (
            <>
              <path d="M77 74 Q83 68 89 74" stroke="#292524" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <path d="M111 74 Q117 68 123 74" stroke="#292524" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="83" cy="74" r="6" fill="#f59e0b" />
              <rect x="79" y="72.5" width="8" height="3" rx="1.5" fill="#1c1917" />
              <circle cx="117" cy="74" r="6" fill="#f59e0b" />
              <rect x="113" y="72.5" width="8" height="3" rx="1.5" fill="#1c1917" />
            </>
          )}
          {/* Pink Snout */}
          <ellipse cx="100" cy="94" rx="14" ry="10" fill="#fecdd3" />
          <circle cx="95" cy="92" r="2" fill="#881337" />
          <circle cx="105" cy="92" r="2" fill="#881337" />
          {isSad ? (
            <path d="M93 102 Q100 97 107 102" stroke="#57534e" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M92 99 Q100 105 108 99" stroke="#57534e" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </svg>
      )}
    </div>
  );
};
