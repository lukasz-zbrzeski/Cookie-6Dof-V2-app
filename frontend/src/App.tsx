import { useState } from "react";
import { PlaceholderTab } from "./components/PlaceholderTab";
import { TabButton } from "./components/TabButton";
import { TabOneContent } from "./components/TabOneContent";

export type TabKey = "tab1" | "tab2" | "tab3";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("tab1");

  return (
      <div className="app-shell">
        <header className="tabs-row">
          <TabButton
              label="Main"
              active={activeTab === "tab1"}
              onClick={() => setActiveTab("tab1")}
          />
          <TabButton
              label="Plots"
              active={activeTab === "tab2"}
              onClick={() => setActiveTab("tab2")}
          />
          <TabButton
              label="Config"
              active={activeTab === "tab3"}
              onClick={() => setActiveTab("tab3")}
          />
        </header>

        <main>
          {activeTab === "tab1" && <TabOneContent />}
          {activeTab === "tab2" && (
              <PlaceholderTab
                  title="Plots"
                  description="Miejsce gotowe na kolejny widok panelu."
              />
          )}
          {activeTab === "tab3" && (
              <PlaceholderTab
                  title="Config"
                  description="Miejsce gotowe na kolejny widok panelu."
              />
          )}
        </main>
      </div>
  );
}