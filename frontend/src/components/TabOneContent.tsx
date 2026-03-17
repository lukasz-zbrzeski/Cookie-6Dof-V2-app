import { useEffect, useState } from "react";
import { RightControls } from "./RightControls";
import { ValueCard } from "./ValueCard";
import {
    connectRobot,
    decrementCartesian,
    decrementJoint,
    getRobotState,
    incrementCartesian,
    incrementJoint,
    nextPosition,
    pauseMotion,
    playMotion,
    prevPosition,
    recordPosition,
    resetRobot,
    resumeMotion,
    setRobotMode,
    stopRobot,
} from "../api/robotApi";

type RobotMode = "manual" | "auto";

const fallbackCard3 = [3.42, 3.79, 4.16, 4.53, 4.9, 5.27];
const fallbackCard4 = [4.18, 4.55, 4.92, 5.29, 5.66, 6.03];

export function TabOneContent() {
    const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [cartesian, setCartesian] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [connected, setConnected] = useState(false);
    const [isStopPressed, setIsStopPressed] = useState(false);
    const [mode, setMode] = useState<RobotMode>("manual");
    const [selectedCom, setSelectedCom] = useState("COM1");
    const [baudRate, setBaudRate] = useState("115200");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const loadState = async () => {
        try {
            setError("");
            const state = await getRobotState();
            setJoints(state.joints);
            setCartesian(state.cartesian);
            setConnected(state.connected);
            setIsStopPressed(state.stopped);
            setMode(state.mode);
            setSelectedCom(state.com_port ?? "COM1");
            setBaudRate(state.baud_rate ? String(state.baud_rate) : "115200");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się pobrać stanu robota.");
        }
    };

    useEffect(() => {
        loadState();
    }, []);

    const withBusy = async (callback: () => Promise<void>) => {
        try {
            setBusy(true);
            setError("");
            await callback();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wystąpił błąd komunikacji z API.");
        } finally {
            setBusy(false);
        }
    };

    const handleConnect = async () => {
        await withBusy(async () => {
            await connectRobot(selectedCom, Number(baudRate));
            await loadState();
        });
    };

    const handleStop = async () => {
        await withBusy(async () => {
            await stopRobot();
            await loadState();
        });
    };

    const handleReset = async () => {
        await withBusy(async () => {
            await resetRobot();
            await loadState();
        });
    };

    const handleToggleMode = async () => {
        await withBusy(async () => {
            const nextMode: RobotMode = mode === "manual" ? "auto" : "manual";
            await setRobotMode(nextMode);
            await loadState();
        });
    };

    const handleIncrementJoint = async (index: number) => {
        await withBusy(async () => {
            const response = await incrementJoint(index);
            setJoints(response.values);
        });
    };

    const handleDecrementJoint = async (index: number) => {
        await withBusy(async () => {
            const response = await decrementJoint(index);
            setJoints(response.values);
        });
    };

    const handleIncrementCartesian = async (index: number) => {
        await withBusy(async () => {
            const response = await incrementCartesian(index);
            setCartesian(response.values);
        });
    };

    const handleDecrementCartesian = async (index: number) => {
        await withBusy(async () => {
            const response = await decrementCartesian(index);
            setCartesian(response.values);
        });
    };

    const handleRecord = async () => {
        await withBusy(async () => {
            await recordPosition();
        });
    };

    const handleResume = async () => {
        await withBusy(async () => {
            await resumeMotion();
        });
    };

    const handlePlay = async () => {
        await withBusy(async () => {
            await playMotion();
        });
    };

    const handlePrevPosition = async () => {
        await withBusy(async () => {
            await prevPosition();
        });
    };

    const handlePause = async () => {
        await withBusy(async () => {
            await pauseMotion();
        });
    };

    const handleNextPosition = async () => {
        await withBusy(async () => {
            await nextPosition();
        });
    };

    return (
        <div className="tab-one-layout">
            <RightControls
                isStopPressed={isStopPressed}
                selectedCom={selectedCom}
                baudRate={baudRate}
                mode={mode}
                busy={busy}
                onSelectedComChange={setSelectedCom}
                onBaudRateChange={setBaudRate}
                onConnect={handleConnect}
                onStop={handleStop}
                onReset={handleReset}
                onToggleMode={handleToggleMode}
                onRecord={handleRecord}
                onResume={handleResume}
                onPlay={handlePlay}
                onPrevPosition={handlePrevPosition}
                onPause={handlePause}
                onNextPosition={handleNextPosition}
            />

            <div className="cards-grid">
                <ValueCard
                    title="Current Joint values"
                    values={joints}
                    editable
                    onIncrement={handleIncrementJoint}
                    onDecrement={handleDecrementJoint}
                />

                <ValueCard
                    title="Current Cartesian values"
                    values={cartesian}
                    editable
                    onIncrement={handleIncrementCartesian}
                    onDecrement={handleDecrementCartesian}
                />

                <ValueCard title="Ramka 3" values={fallbackCard3} />
                <ValueCard title="Ramka 4" values={fallbackCard4} />
            </div>

            <div className="status-bar">
                <span>Connected: {connected ? "Yes" : "No"}</span>
                <span>STOP: {isStopPressed ? "Active" : "Inactive"}</span>
                <span>Mode: {mode}</span>
                {busy && <span>Komunikacja z API...</span>}
                {error && <span className="status-bar__error">{error}</span>}
            </div>
        </div>
    );
}