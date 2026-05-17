"use client";

import { BarChart3, Brain, Check, Palette } from "lucide-react";
import { useState } from "react";

const skins = ["Classic", "Neon", "Nomad", "Minimal"];

export function ProScreen() {
  const [skin, setSkin] = useState("Classic");

  return (
    <div className="pro-page">
      <section className="game-column">
        <div className="profile-header">
          <div>
            <h2>Chackers Pro</h2>
            <p className="muted-line">Roadmap monetization surface, not a live checkout.</p>
          </div>
          <strong>$4/mo</strong>
        </div>

        <div className="pro-feature-list">
          <ProFeature icon={<Brain size={18} />} title="Unlimited AI Coach" text="Deeper post-game notes, opening mistakes, and tactical patterns." />
          <ProFeature icon={<BarChart3 size={18} />} title="Advanced Analytics" text="Accuracy trend, rating projection, and city-rank movement." />
          <ProFeature icon={<Palette size={18} />} title="Premium Skins" text="Readable board themes without reducing piece clarity." />
        </div>

        <button className="button primary" disabled type="button">
          <Check size={18} />
          Payments planned
        </button>
      </section>

      <aside className="context-panel">
        <section className="panel-section">
          <h2>Skin selector</h2>
          <div className="skin-list">
            {skins.map((nextSkin) => (
              <button
                className="skin-row"
                data-current={skin === nextSkin}
                key={nextSkin}
                onClick={() => setSkin(nextSkin)}
                type="button"
              >
                <span className={`skin-swatch ${nextSkin.toLowerCase()}`} />
                <strong>{nextSkin}</strong>
              </button>
            ))}
          </div>
        </section>
        <section className="panel-section">
          <h2>Business note</h2>
          <p className="coach-note">
            Pro is positioned around learning and personalization, while core play remains free.
          </p>
        </section>
      </aside>
    </div>
  );
}

function ProFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="pro-feature">
      {icon}
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}
