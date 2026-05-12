import { LeftMainControls } from "./LeftMainControls";
import { ValueCard } from "./ValueCard";
import { useRobotState } from "../hooks/useRobotState";

type MainTabProps = {
    robot: ReturnType<typeof useRobotState>;
};

export function MainTab({ robot }: MainTabProps) {
    const {
        displayedJoints,
        cartesian,
        positionNumber,
        targetJoints,
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
        handleCartesianButtonPress,
        handleCartesianButtonRelease,
        handleJointButtonPress,
        handleJointButtonRelease,
        gripperClosed,
        handleHome,
        handleToggleGripper,
    } = robot;

    const controlsDisabled = !connected || busy || isStopPressed;

    return (
        <div className="main-tab-layout">
            <LeftMainControls
                isStopPressed={isStopPressed}
                connected={connected}
                availableComPorts={availableComPorts}
                selectedCom={selectedCom}
                baudRate={baudRate}
                positionNumber={positionNumber}
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
                gripperClosed={gripperClosed}
                onHome={handleHome}
                onToggleGripper={handleToggleGripper}
            />

            <div className="cards-grid">
                <ValueCard
                    title="Current Joint values"
                    values={displayedJoints}
                    editable={mode === "manual"}
                    disabled={!connected || busy}
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
                    onIncrementPress={(index) => handleCartesianButtonPress(index, "+")}
                    onIncrementRelease={(index) => handleCartesianButtonRelease(index, "+")}
                    onDecrementPress={(index) => handleCartesianButtonPress(index, "-")}
                    onDecrementRelease={(index) => handleCartesianButtonRelease(index, "-")}
                />

                <ValueCard title="Target Joint Values" values={targetJoints} />
                <ValueCard title="Current Cartesian Values (future feature)" values={[]} />
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