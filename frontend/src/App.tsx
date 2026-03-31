import { useEffect, useState } from "react";
import { TabButton } from "./components/TabButton";
import { MainTab } from "./components/MainTab";
import { ConfigTab } from "./components/ConfigTab";
import { useRobotState } from "./hooks/useRobotState";

export type TabKey = "tab1" | "tab2" | "tab3";

export default function App() {
    const [activeTab, setActiveTab] = useState<TabKey>("tab1");
    const robot = useRobotState();

    useEffect(() => {
        if (!robot.connected && activeTab !== "tab1") {
            setActiveTab("tab1");
        }
    }, [robot.connected, activeTab]);

    const handleTabChange = (tab: TabKey) => {
        if ((tab === "tab2" || tab === "tab3") && !robot.connected) {
            return;
        }

        setActiveTab(tab);
    };

    return (
        <div className="app-shell">
            <header className="tabs-row">
                <TabButton
                    label="Main"
                    active={activeTab === "tab1"}
                    onClick={() => handleTabChange("tab1")}
                />

                <TabButton
                    label="Plots"
                    active={activeTab === "tab2"}
                    disabled={!robot.connected}
                    onClick={() => handleTabChange("tab2")}
                />

                <TabButton
                    label="Config"
                    active={activeTab === "tab3"}
                    disabled={!robot.connected}
                    onClick={() => handleTabChange("tab3")}
                />
            </header>

            <main>
                {activeTab === "tab1" && <MainTab robot={robot} />}
                {activeTab === "tab2" && <div />}
                {activeTab === "tab3" && (
                    <ConfigTab
                        connected={robot.connected}
                        isStopPressed={robot.isStopPressed}
                        mode={robot.mode}
                        busy={robot.busy}
                        error={robot.error}
                    />
                )}
            </main>
        </div>
    );
}