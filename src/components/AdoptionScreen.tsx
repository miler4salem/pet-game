import React, { useState } from 'react';
import { Dices, Sparkles, Heart, ArrowLeft, ShieldCheck, Gamepad2 } from 'lucide-react';
import { SPECIES_LIST } from '../data/species';
import { SpeciesId, SpeciesProfile } from '../types/pet';
import { PetArtwork } from './PetArtwork';

interface AdoptionScreenProps {
  onAdopt: (speciesId: SpeciesId, name: string) => void;
  canCancel?: boolean;
  onCancel?: () => void;
}

export const AdoptionScreen: React.FC<AdoptionScreenProps> = ({
  onAdopt,
  canCancel = false,
  onCancel,
}) => {
  const [selected, setSelected] = useState<SpeciesProfile>(SPECIES_LIST[0]);
  const [petName, setPetName] = useState<string>(SPECIES_LIST[0].suggestedNames[0]);

  const handleSelectSpecies = (species: SpeciesProfile) => {
    setSelected(species);
    const randomName =
      species.suggestedNames[Math.floor(Math.random() * species.suggestedNames.length)];
    setPetName(randomName);
  };

  const handleRollName = () => {
    const others = selected.suggestedNames.filter((n) => n !== petName);
    const pool = others.length > 0 ? others : selected.suggestedNames;
    setPetName(pool[Math.floor(Math.random() * pool.length)]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = petName.trim() || selected.suggestedNames[0];
    onAdopt(selected.id, cleaned);
  };

  const bioNeeds = selected.needs.filter((n) => n.category === 'biological');
  const playNeeds = selected.needs.filter((n) => n.category === 'play');

  return (
    <div className="adoption-container">
      <header className="adoption-header">
        {canCancel && onCancel && (
          <button type="button" className="btn-ghost back-btn" onClick={onCancel}>
            <ArrowLeft size={18} />
            Back to Sanctuary
          </button>
        )}
        <div className="adoption-title-block">
          <span className="pill-badge">
            <Sparkles size={14} /> Paws &amp; Claws Sanctuary
          </span>
          <h1>Choose Your Companion</h1>
          <p>
            Every species has its own real-world biological and play needs. Pick an animal to
            explore its care routine and welcome them home!
          </p>
        </div>
      </header>

      <div className="adoption-layout">
        {/* Species Grid */}
        <section className="species-grid" aria-label="Available Pet Species">
          {SPECIES_LIST.map((species) => {
            const isSelected = species.id === selected.id;
            return (
              <button
                key={species.id}
                type="button"
                className={`species-card ${isSelected ? 'selected' : ''}`}
                style={{
                  '--accent': species.accentColor,
                  '--soft-bg': species.softBg,
                } as React.CSSProperties}
                onClick={() => handleSelectSpecies(species)}
              >
                <div className="species-card-top">
                  <span className={`difficulty-tag diff-${species.difficulty.toLowerCase()}`}>
                    {species.difficulty}
                  </span>
                  <span className="needs-count-tag">{species.needs.length} Needs</span>
                </div>
                <div className="species-card-art">
                  <PetArtwork
                    speciesId={species.id}
                    mood={isSelected ? 'thriving' : 'happy'}
                    size={112}
                  />
                </div>
                <h3>{species.name}</h3>
                <p className="species-habitat">{species.habitatName}</p>
              </button>
            );
          })}
        </section>

        {/* Selected Pet Preview & Adoption Form */}
        <aside
          className="adoption-detail-panel"
          style={{
            '--accent': selected.accentColor,
            '--soft-bg': selected.softBg,
          } as React.CSSProperties}
        >
          <div className="detail-hero">
            <PetArtwork speciesId={selected.id} mood="thriving" size={160} />
            <div>
              <div className="detail-species-title">
                <h2>{selected.name}</h2>
                <span className="scientific-name">{selected.scientificName}</span>
              </div>
              <p className="detail-tagline">{selected.tagline}</p>
            </div>
          </div>

          <div className="detail-needs-preview">
            <div className="preview-group">
              <h4>
                <ShieldCheck size={16} /> Biological Needs
              </h4>
              <div className="need-chips">
                {bioNeeds.map((n) => (
                  <span key={n.id} className="need-chip bio-chip">
                    <span>{n.emoji}</span> {n.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="preview-group">
              <h4>
                <Gamepad2 size={16} /> Play &amp; Enrichment
              </h4>
              <div className="need-chips">
                {playNeeds.map((n) => (
                  <span key={n.id} className="need-chip play-chip">
                    <span>{n.emoji}</span> {n.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form className="adopt-form" onSubmit={handleSubmit}>
            <label htmlFor="pet-name-input">Name your {selected.name}</label>
            <div className="name-input-row">
              <input
                id="pet-name-input"
                type="text"
                maxLength={22}
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter a name..."
                required
              />
              <button
                type="button"
                className="btn-icon"
                onClick={handleRollName}
                title="Random Name"
                aria-label="Generate Random Name"
              >
                <Dices size={20} />
              </button>
            </div>
            <button type="submit" className="btn-adopt">
              <Heart size={18} />
              Adopt {petName.trim() || selected.suggestedNames[0]}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
