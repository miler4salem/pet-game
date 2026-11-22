import React, { useState } from 'react';
import { Dices, Heart, ShieldCheck, Gamepad2, X } from 'lucide-react';
import { SPECIES_LIST } from '../data/species';
import { PlayerGender, SpeciesId, SpeciesProfile } from '../types/pet';
import { PetArtwork } from './PetArtwork';

interface AdoptionScreenProps {
  gender: PlayerGender;
  onChangeGender: (gender: PlayerGender) => void;
  onAdopt: (speciesId: SpeciesId, name: string) => void;
  canCancel?: boolean;
  onCancel?: () => void;
}

export const AdoptionScreen: React.FC<AdoptionScreenProps> = ({
  gender,
  onChangeGender,
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
    <div className="modal-backdrop">
      <div className="modal-card adoption-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">PAWS &amp; CLAWS HOME</span>
            <h2>Adopt Your Companion</h2>
            <p className="subtitle">
              Each animal loads its own indoor &amp; backyard care stations based on real-world needs!
            </p>
          </div>
          {canCancel && onCancel && (
            <button
              type="button"
              className="close-btn"
              onClick={onCancel}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="adoption-body">
          {/* Species Picker Grid */}
          <div className="species-grid" role="listbox" aria-label="Choose Pet Species">
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
                  <span className={`difficulty-tag diff-${species.difficulty.toLowerCase()}`}>
                    {species.difficulty}
                  </span>
                  <PetArtwork
                    speciesId={species.id}
                    mood={isSelected ? 'thriving' : 'happy'}
                    size={86}
                  />
                  <strong>{species.name}</strong>
                </button>
              );
            })}
          </div>

          {/* Selected Pet Preview + Caregiver Toggle + Name Form */}
          <div
            className="adoption-detail"
            style={{
              '--accent': selected.accentColor,
              '--soft-bg': selected.softBg,
            } as React.CSSProperties}
          >
            <div className="detail-top">
              <PetArtwork speciesId={selected.id} mood="thriving" size={108} />
              <div>
                <h3>{selected.name}</h3>
                <span className="scientific">{selected.scientificName}</span>
                <p>{selected.tagline}</p>
              </div>
            </div>

            <div className="preview-needs">
              <div>
                <h4>
                  <ShieldCheck size={14} /> Biological Stations
                </h4>
                <div className="chip-row">
                  {bioNeeds.map((n) => (
                    <span key={n.id} className="need-chip bio-chip">
                      {n.emoji} {n.label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4>
                  <Gamepad2 size={14} /> Play &amp; Backyard Stations
                </h4>
                <div className="chip-row">
                  {playNeeds.map((n) => (
                    <span key={n.id} className="need-chip play-chip">
                      {n.emoji} {n.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <form className="adopt-form" onSubmit={handleSubmit}>
              <div className="form-row-split">
                <div className="field-group">
                  <label htmlFor="pet-name-input">Pet Name</label>
                  <div className="name-row">
                    <input
                      id="pet-name-input"
                      type="text"
                      maxLength={20}
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="hud-btn icon-btn"
                      onClick={handleRollName}
                      title="Random Name"
                    >
                      <Dices size={16} />
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label>Your Caregiver</label>
                  <div className="gender-toggle">
                    <button
                      type="button"
                      className={`hud-btn ${gender === 'female' ? 'primary-btn' : ''}`}
                      onClick={() => onChangeGender('female')}
                    >
                      Girl
                    </button>
                    <button
                      type="button"
                      className={`hud-btn ${gender === 'male' ? 'primary-btn' : ''}`}
                      onClick={() => onChangeGender('male')}
                    >
                      Boy
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="hud-btn primary-btn adopt-submit-btn">
                <Heart size={16} />
                Move In With {petName.trim() || selected.suggestedNames[0]}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
