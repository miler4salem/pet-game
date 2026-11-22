import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  FastForward,
  Gamepad2,
  Heart,
  Info,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ActionEffectType,
  NeedDefinition,
  PetInstance,
  PetMood,
  SpeciesProfile,
} from '../types/pet';
import { PetArtwork } from './PetArtwork';

interface CareDashboardProps {
  pet: PetInstance;
  species: SpeciesProfile;
  simSpeed: 0 | 1 | 2;
  onChangeSimSpeed: (speed: 0 | 1 | 2) => void;
  cooldowns: Record<string, number>;
  onPerformAction: (need: NeedDefinition) => void;
  onPetClick: () => void;
  onReleasePet: (petId: string) => void;
  activeEffect: { id: number; type: ActionEffectType; emoji: string } | null;
}

const EFFECT_PARTICLES: Record<ActionEffectType, string[]> = {
  food: ['✨', '😋', '🌟'],
  water: ['💧', '💦', '🫧'],
  clean: ['✨', '🫧', '🌟'],
  play: ['⭐', '🎉', '✨'],
  love: ['❤️', '💖', '💕'],
  warmth: ['☀️', '✨', '🔥'],
  music: ['🎵', '🎶', '✨'],
};

function getBondInfo(xp: number): { level: number; title: string; progress: number } {
  const levels = [
    { min: 0, title: 'New Pal' },
    { min: 60, title: 'Curious Friend' },
    { min: 150, title: 'Good Buddy' },
    { min: 280, title: 'Trusted Companion' },
    { min: 450, title: 'Best Friend' },
    { min: 700, title: 'Soulmate' },
  ];
  let idx = 0;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].min) idx = i;
  }
  const current = levels[idx];
  const next = levels[idx + 1];
  const progress = next
    ? Math.min(100, Math.round(((xp - current.min) / (next.min - current.min)) * 100))
    : 100;
  return { level: idx + 1, title: current.title, progress };
}

function getBarColor(val: number): string {
  if (val >= 65) return '#10b981';
  if (val >= 35) return '#f59e0b';
  return '#ef4444';
}

export const CareDashboard: React.FC<CareDashboardProps> = ({
  pet,
  species,
  simSpeed,
  onChangeSimSpeed,
  cooldowns,
  onPerformAction,
  onPetClick,
  onReleasePet,
  activeEffect,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);

  const bioNeeds = useMemo(
    () => species.needs.filter((n) => n.category === 'biological'),
    [species.needs]
  );
  const playNeeds = useMemo(
    () => species.needs.filter((n) => n.category === 'play'),
    [species.needs]
  );

  const { wellness, mood, lowestNeed } = useMemo(() => {
    const values = species.needs.map((n) => ({
      def: n,
      val: pet.needs[n.id] ?? 100,
    }));
    const avg = values.reduce((sum, item) => sum + item.val, 0) / values.length;
    const sorted = [...values].sort((a, b) => a.val - b.val);
    const minItem = sorted[0];

    let computedMood: PetMood = 'happy';
    if (minItem.val < 25 || avg < 40) computedMood = 'urgent';
    else if (minItem.val < 48 || avg < 62) computedMood = 'needs_care';
    else if (avg >= 82) computedMood = 'thriving';

    return {
      wellness: Math.round(avg),
      mood: computedMood,
      lowestNeed: minItem,
    };
  }, [pet.needs, species.needs]);

  const bond = useMemo(() => getBondInfo(pet.bondXp), [pet.bondXp]);

  const moodLabel: Record<PetMood, string> = {
    thriving: 'Thriving & Overjoyed',
    happy: 'Content & Happy',
    needs_care: 'Needs Attention',
    urgent: 'Needs Care Soon!',
  };

  const renderNeedCard = (need: NeedDefinition) => {
    const value = Math.round(pet.needs[need.id] ?? 100);
    const cd = cooldowns[need.id] ?? 0;
    const isUrgent = value < 35;
    const isTipOpen = expandedTipId === need.id;

    return (
      <div
        key={need.id}
        className={`need-card ${isUrgent ? 'need-urgent' : ''}`}
      >
        <div className="need-card-header">
          <div className="need-title-wrap">
            <span className="need-emoji" aria-hidden="true">
              {need.emoji}
            </span>
            <div>
              <div className="need-label">{need.label}</div>
              <div className="need-percent" style={{ color: getBarColor(value) }}>
                {value}%
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`tip-toggle-btn ${isTipOpen ? 'active' : ''}`}
            onClick={() => setExpandedTipId(isTipOpen ? null : need.id)}
            title="Care fact"
            aria-label={`Read care tip for ${need.label}`}
          >
            <Info size={15} />
          </button>
        </div>

        <div className="meter-track">
          <div
            className="meter-fill"
            style={{
              width: `${Math.max(2, value)}%`,
              backgroundColor: getBarColor(value),
            }}
          />
        </div>

        {isTipOpen && <p className="need-tip-box">{need.careTip}</p>}

        <button
          type="button"
          className="need-action-btn"
          disabled={cd > 0}
          onClick={() => onPerformAction(need)}
        >
          {cd > 0 ? `Ready in ${Math.ceil(cd)}s` : need.actionLabel}
        </button>
      </div>
    );
  };

  const particles = activeEffect ? EFFECT_PARTICLES[activeEffect.type] : [];

  return (
    <div
      className="dashboard-layout"
      style={{
        '--accent': species.accentColor,
        '--soft-bg': species.softBg,
      } as React.CSSProperties}
    >
      {/* Left Column: Habitat Stage + Status + Journal */}
      <div className="stage-column">
        <section className={`habitat-stage habitat-${species.id}`}>
          <div className="habitat-topbar">
            <div>
              <span className="habitat-pill">{species.habitatName}</span>
              <h2 className="pet-name-heading">
                {pet.name}{' '}
                <span className="species-sublabel">the {species.name}</span>
              </h2>
            </div>

            <div className="sim-controls" role="group" aria-label="Simulation speed">
              <button
                type="button"
                className={`sim-btn ${simSpeed === 0 ? 'active' : ''}`}
                onClick={() => onChangeSimSpeed(0)}
                title="Pause simulation"
              >
                <Pause size={14} />
              </button>
              <button
                type="button"
                className={`sim-btn ${simSpeed === 1 ? 'active' : ''}`}
                onClick={() => onChangeSimSpeed(1)}
                title="Normal speed (1x)"
              >
                <Play size={14} />
              </button>
              <button
                type="button"
                className={`sim-btn ${simSpeed === 2 ? 'active' : ''}`}
                onClick={() => onChangeSimSpeed(2)}
                title="Fast speed (2x)"
              >
                <FastForward size={14} />
              </button>
            </div>
          </div>

          {/* Interactive Pet Area */}
          <div className="pet-stage-center">
            {lowestNeed && lowestNeed.val < 48 && (
              <div className="thought-bubble" title={`${pet.name} needs ${lowestNeed.def.label}`}>
                <span className="thought-emoji">{lowestNeed.def.emoji}</span>
                <span className="thought-text">{lowestNeed.def.label}?</span>
              </div>
            )}

            {activeEffect && (
              <div key={activeEffect.id} className="particle-burst" aria-hidden="true">
                <span className="particle p1">{activeEffect.emoji}</span>
                <span className="particle p2">{particles[0]}</span>
                <span className="particle p3">{particles[1]}</span>
                <span className="particle p4">{particles[2]}</span>
              </div>
            )}

            <button
              type="button"
              className="pet-interactive-btn"
              onClick={onPetClick}
              title={`Tap to pet ${pet.name}!`}
            >
              <PetArtwork
                speciesId={species.id}
                mood={mood}
                isReacting={Boolean(activeEffect)}
                size={215}
              />
            </button>
            <span className="tap-hint">Tap {pet.name} for affection</span>
          </div>

          {/* Stage Footer Stats */}
          <div className="stage-stats-bar">
            <div className="stat-chip">
              <Sparkles size={15} />
              <div>
                <span className="stat-label">Wellness</span>
                <strong>{wellness}%</strong>
              </div>
            </div>
            <div className="stat-chip">
              <Heart size={15} />
              <div>
                <span className="stat-label">
                  Lv.{bond.level} {bond.title}
                </span>
                <div className="mini-progress">
                  <div style={{ width: `${bond.progress}%` }} />
                </div>
              </div>
            </div>
            <div className={`mood-badge mood-${mood}`}>{moodLabel[mood]}</div>
          </div>
        </section>

        {/* Care Guide & Quick Actions Bar */}
        <div className="stage-meta-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowGuide(true)}
          >
            <BookOpen size={16} />
            {species.name} Care Guide
          </button>

          <span className="day-counter">
            Day {Math.max(1, Math.floor(pet.ageDays) + 1)} • {pet.actionsCompleted} Care Actions
          </span>

          {!confirmRelease ? (
            <button
              type="button"
              className="btn-danger-ghost"
              onClick={() => setConfirmRelease(true)}
              title="Rehome pet"
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="confirm-release">
              <span>Rehome {pet.name}?</span>
              <button
                type="button"
                className="btn-danger-sm"
                onClick={() => {
                  setConfirmRelease(false);
                  onReleasePet(pet.id);
                }}
              >
                Yes
              </button>
              <button
                type="button"
                className="btn-ghost-sm"
                onClick={() => setConfirmRelease(false)}
              >
                No
              </button>
            </div>
          )}
        </div>

        {/* Activity Journal */}
        <section className="activity-journal">
          <h3>Recent Care Moments</h3>
          {pet.log.length === 0 ? (
            <p className="empty-log">
              Start caring for {pet.name} using the biological and play actions!
            </p>
          ) : (
            <ul className="log-list">
              {pet.log.slice(0, 6).map((entry) => (
                <li key={entry.id} className={`log-item log-${entry.category}`}>
                  <span className="log-emoji">{entry.emoji}</span>
                  <span className="log-text">{entry.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Right Column: Dynamically Loaded Needs */}
      <div className="needs-column">
        <section className="needs-section">
          <div className="section-heading">
            <ShieldCheck size={20} className="section-icon bio" />
            <div>
              <h3>Biological &amp; Habitat Needs</h3>
              <p>Essential daily health and maintenance for a {species.name.toLowerCase()}</p>
            </div>
          </div>
          <div className="needs-grid">{bioNeeds.map(renderNeedCard)}</div>
        </section>

        <section className="needs-section">
          <div className="section-heading">
            <Gamepad2 size={20} className="section-icon play" />
            <div>
              <h3>Play &amp; Enrichment Needs</h3>
              <p>Species-specific exercise, foraging, and social bonding</p>
            </div>
          </div>
          <div className="needs-grid">{playNeeds.map(renderNeedCard)}</div>
        </section>
      </div>

      {/* Species Care Guide Modal */}
      {showGuide && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${species.name} Care Guide`}
          onClick={() => setShowGuide(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="pill-badge">{species.difficulty} Care</span>
                <h2>{species.name} Care Guide</h2>
                <span className="scientific-name">{species.scientificName}</span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowGuide(false)}
                aria-label="Close Care Guide"
              >
                <X size={20} />
              </button>
            </div>
            <p className="modal-overview">{species.overview}</p>
            <div className="guide-list">
              {species.needs.map((need) => (
                <div key={need.id} className="guide-item">
                  <div className="guide-item-title">
                    <span>{need.emoji}</span>
                    <strong>{need.label}</strong>
                    <span className={`guide-cat cat-${need.category}`}>
                      {need.category === 'biological' ? 'Biological' : 'Play & Enrichment'}
                    </span>
                  </div>
                  <p>{need.careTip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
