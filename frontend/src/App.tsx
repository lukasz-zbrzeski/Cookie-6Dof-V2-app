import { useState } from "react";
import { TabButton } from "./components/TabButton";
import { MainTab } from "./components/MainTab";
import {ConfigTab} from "./components/ConfigTab";

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
          {activeTab === "tab1" && <MainTab />}
          {activeTab === "tab2"}
          {activeTab === "tab3" && <ConfigTab />}
        </main>
      </div>
  );
}