import React from 'react';
import { X } from 'lucide-react';
import { SpeciesProfile } from '../types/pet';

interface CareGuideModalProps {
  species: SpeciesProfile;
  onClose: () => void;
}

export const CareGuideModal: React.FC<CareGuideModalProps> = ({ species, onClose }) => {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${species.name} Care Guide`}
      onClick={onClose}
    >
      <div className="modal-card guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{species.difficulty.toUpperCase()} CARE</span>
            <h2>{species.name} Care Guide</h2>
            <p className="subtitle">{species.scientificName} — Real-World Biological &amp; Play Needs</p>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close Care Guide"
          >
            <X size={18} />
          </button>
        </div>

        <p className="guide-overview">{species.overview}</p>

        <div className="guide-list">
          {species.needs.map((need) => (
            <div key={need.id} className="guide-item">
              <div className="guide-item-head">
                <span className="guide-emoji">{need.emoji}</span>
                <strong>{need.label}</strong>
                <span className="guide-station-tag">📍 {need.stationTitle}</span>
                <span className={`guide-cat cat-${need.category}`}>
                  {need.category === 'biological' ? 'Biological' : 'Play'}
                </span>
              </div>
              <p>{need.careTip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
