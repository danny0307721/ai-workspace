"use client";

import { useAppSettings, type DateFormat, type FontSize, type TableDensity } from "../components/settings-provider";

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const hasCustomSettings = settings.dateFormat !== "mdy"
    || settings.fontSize !== "standard"
    || settings.tableDensity !== "comfortable";

  return <main>
    <header className="page-heading">
      <h1>Settings</h1>
      <p>Personalize how Ledger AI displays your records.</p>
    </header>
    <section className="settings-section" aria-labelledby="display-settings-title">
      <div className="settings-section-header">
        <h2 id="display-settings-title">Display</h2>
        {hasCustomSettings && <button type="button" onClick={resetSettings}>Reset defaults</button>}
      </div>
      <div className="settings-row">
        <div>
          <h3>Date format</h3>
          <p>Choose how dates appear in the ledgers.</p>
        </div>
        <label className="settings-control">
          <span className="visually-hidden">Date format</span>
          <select value={settings.dateFormat} onChange={(event) => updateSetting("dateFormat", event.target.value as DateFormat)}>
            <option value="mdy">MM/DD/YYYY</option>
            <option value="dmy">DD/MM/YYYY</option>
            <option value="iso">YYYY-MM-DD</option>
          </select>
        </label>
      </div>
      <div className="settings-row">
        <div>
          <h3>Font size</h3>
          <p>Adjust text size throughout the app.</p>
        </div>
        <label className="settings-control">
          <span className="visually-hidden">Font size</span>
          <select value={settings.fontSize} onChange={(event) => updateSetting("fontSize", event.target.value as FontSize)}>
            <option value="small">Small</option>
            <option value="standard">Standard</option>
            <option value="large">Large</option>
          </select>
        </label>
      </div>
      <div className="settings-row">
        <div>
          <h3>Table density</h3>
          <p>Choose between roomier rows or more records on screen.</p>
        </div>
        <label className="settings-control">
          <span className="visually-hidden">Table density</span>
          <select value={settings.tableDensity} onChange={(event) => updateSetting("tableDensity", event.target.value as TableDensity)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
      </div>
    </section>
  </main>;
}