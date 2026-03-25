import { LeftMainControls } from "./LeftMainControls";
import { ValueCard } from "./ValueCard";
import { useRobotState } from "../hooks/useRobotState";

const fallbackCard3 = [3.42, 3.79, 4.16, 4.53, 4.9, 5.27];
const fallbackCard4 = [4.18, 4.55, 4.92, 5.29, 5.66, 6.03];

export function MainTab() {
    const {
        joints,
        cartesian,
        connected,
        isStopPressed,
        mode,
        selectedCom,
        baudRate,
        busy,
        error,
        setSelectedCom,
        setBaudRate,
        handleConnect,
        handleStop,
        handleReset,
        handleToggleMode,
        handleRecord,
        handleResume,
        handlePlay,
        handlePrevPosition,
        handlePause,
        handleNextPosition,
        handleIncrementJoint,
        handleDecrementJoint,
        handleIncrementCartesian,
        handleDecrementCartesian,
    } = useRobotState();

    return (
        <div className="main-tab-layout">
            <LeftMainControls
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