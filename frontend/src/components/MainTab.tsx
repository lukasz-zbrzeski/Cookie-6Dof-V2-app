import { LeftMainControls } from "./LeftMainControls";
import { ValueCard } from "./ValueCard";
import { useRobotState } from "../hooks/useRobotState";

const fallbackCard3 = [3.42, 3.79, 4.16, 4.53, 4.9, 5.27];
const fallbackCard4 = [4.18, 4.55, 4.92, 5.29, 5.66, 6.03];

type MainTabProps = {
    robot: ReturnType<typeof useRobotState>;
};

export function MainTab({ robot }: MainTabProps) {
    const {
        cartesian,
        connected,
        isStopPressed,
        mode,
        motionType,
        speed,
        selectedCom,
        baudRate,
        busy,
        error,
        availableComPorts,
        configRows,
        setSelectedCom,
        setBaudRate,
        handleConnectToggle,
        handleStop,
        handleReset,
        handleToggleMode,
        handleToggleMotionType,
        handleIncreaseSpeed,
        handleDecreaseSpeed,
        handleRecord,
        handleResume,
        handlePlay,
        handlePrevPosition,
        handlePause,
        handleNextPosition,
        handleIncrementCartesian,
        handleDecrementCartesian,
        handleJointButtonPress,
        handleJointButtonRelease,
    } = robot;

    const currentJointValues = configRows.map((row) => row.angle);
    const controlsDisabled = !connected || busy || isStopPressed;

    return (
        <div className="main-tab-layout">
            <LeftMainControls
                isStopPressed={isStopPressed}
                connected={connected}
                availableComPorts={availableComPorts}
                selectedCom={selectedCom}
                baudRate={baudRate}
                mode={mode}
                motionType={motionType}
                speed={speed}
                busy={busy}
                controlsDisabled={controlsDisabled}
                onSelectedComChange={setSelectedCom}
                onBaudRateChange={setBaudRate}
                onConnectToggle={handleConnectToggle}
                onStop={handleStop}
                onReset={handleReset}
                onToggleMode={handleToggleMode}
                onToggleMotionType={handleToggleMotionType}
                onIncreaseSpeed={handleIncreaseSpeed}
                onDecreaseSpeed={handleDecreaseSpeed}
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
                    values={currentJointValues}
                    editable={mode === "manual"}
                    disabled={controlsDisabled}
                    onIncrementPress={(index) => handleJointButtonPress(index, "+")}
                    onIncrementRelease={(index) => handleJointButtonRelease(index, "+")}
                    onDecrementPress={(index) => handleJointButtonPress(index, "-")}
                    onDecrementRelease={(index) => handleJointButtonRelease(index, "-")}
                />

                <ValueCard
                    title="Current Cartesian values"
                    values={cartesian}
                    editable={mode === "manual"}
                    disabled={controlsDisabled}
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