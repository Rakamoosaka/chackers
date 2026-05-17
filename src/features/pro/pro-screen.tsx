"use client";

import { BarChart3, Brain, Lock, Palette } from "lucide-react";
import { GetPro } from "./get-pro";
import {
  FREE_COACH_REPORT_LIMIT,
  useProAccess,
} from "./pro-access";

export function ProScreen() {
  const {
    canUseSkin,
    coachReportsRemaining,
    isPro,
    pieceSkins,
    proStartedAt,
    selectedSkin,
    setSelectedSkin,
  } = useProAccess();

  return (
    <div className="pro-page">
      <section className="game-column">
        <div className="profile-header">
          <div>
            <h2>Chackers Pro</h2>
            <p className="muted-line">
              {isPro
                ? `Active since ${formatDate(proStartedAt)}`
                : "Fake checkout for the prototype. No real payment is made."}
            </p>
          </div>
          <strong>{isPro ? "Pro" : "$4/mo"}</strong>
        </div>

        <div className="pro-feature-list">
          <ProFeature icon={<Brain size={18} />} title="Unlimited AI Coach" text={`Free players get ${FREE_COACH_REPORT_LIMIT} post-game reports per day.`} />
          <ProFeature icon={<BarChart3 size={18} />} title="Advanced Analytics" text="Accuracy trend, rating projection, and city-rank movement." />
          <ProFeature icon={<Palette size={18} />} title="Premium Skins" text="Readable board themes without reducing piece clarity." />
        </div>

        <GetPro label="Get Pro" showStatus />
        <p className="muted-line">
          {isPro
            ? "Premium skins and unlimited coach reports are unlocked."
            : "Press Get Pro to open billing."}
        </p>
      </section>

      <aside className="context-panel">
        <section className="panel-section">
          <h2>Skin selector</h2>
          <div className="skin-list">
            {pieceSkins.map((nextSkin) => (
              <button
                className="skin-row"
                data-current={selectedSkin === nextSkin.id}
                key={nextSkin.id}
                onClick={() => setSelectedSkin(nextSkin.id)}
                type="button"
              >
                <span className={`skin-swatch ${nextSkin.id}`} />
                <strong>{nextSkin.name}</strong>
                {canUseSkin(nextSkin.id) ? null : (
                  <span className="skin-lock">
                    <Lock size={14} />
                    Pro
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
        <section className="panel-section">
          <h2>Free limits</h2>
          <p className="coach-note">
            {isPro
              ? "Your account has unlimited coach reports and all piece skins in this prototype."
              : `${coachReportsRemaining} AI Coach reports left today. Classic is the only free piece skin.`}
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

function formatDate(value: string | null) {
  if (!value) {
    return "today";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
