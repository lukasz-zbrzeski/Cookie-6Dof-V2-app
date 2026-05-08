import { ActionButton } from "./ActionButton";

type LeftMainControlsProps = {
    isStopPressed: boolean;
    connected: boolean;
    availableComPorts: string[];
    selectedCom: string;
    baudRate: string;
    positionNumber: number | null;
    mode: "manual" | "auto";
    motionType: "ptp" | "lin";
    speed: number;
    busy?: boolean;
    controlsDisabled?: boolean;
    onSelectedComChange: (value: string) => void;
    onBaudRateChange: (value: string) => void;
    onConnectToggle: () => void;
    onStop: () => void;
    onReset: () => void;
    onToggleMode: () => void;
    onToggleMotionType: () => void;
    onIncreaseSpeed: () => void;
    onDecreaseSpeed: () => void;
    onRecord: () => void;
    onResume: () => void;
    onPlay: () => void;
    onPrevPosition: () => void;
    onPause: () => void;
    onNextPosition: () => void;
};

export function LeftMainControls({
                                     isStopPressed,
                                     connected,
                                     availableComPorts,
                                     selectedCom,
                                     baudRate,
                                     positionNumber,
                                     mode,
                                     motionType,
                                     speed,
                                     busy = false,
                                     controlsDisabled = false,
                                     onSelectedComChange,
                                     onBaudRateChange,
                                     onConnectToggle,
                                     onStop,
                                     onReset,
                                     onToggleMode,
                                     onToggleMotionType,
                                     onIncreaseSpeed,
                                     onDecreaseSpeed,
                                     onRecord,
                                     onResume,
                                     onPlay,
                                     onPrevPosition,
                                     onPause,
                                     onNextPosition,
                                 }: LeftMainControlsProps) {
    const noDevicesAvailable = availableComPorts.length === 0;
    const uiDisabled = controlsDisabled || busy || !connected || isStopPressed;

    return (
        <aside className="left-main-controls">
            <div className="connection-panel">
                <select
                    className="connection-panel__select"
                    value={noDevicesAvailable ? "NO_DEVICE" : selectedCom}
                    onChange={(e) => onSelectedComChange(e.target.value)}
                    disabled={busy || noDevicesAvailable || connected}
                >
                    {noDevicesAvailable ? (
                        <option value="NO_DEVICE">No connected devices</option>
                    ) : (
                        availableComPorts.map((port) => (
                            <option key={port} value={port}>
                                {port}
                            </option>
                        ))
                    )}
                </select>

                <input
                    className="connection-panel__input"
                    type="number"
                    value={baudRate}
                    onChange={(e) => onBaudRateChange(e.target.value)}
                    placeholder="Baud rate"
                    disabled={busy || connected}
                />

                <button
                    className="connection-panel__button"
                    onClick={onConnectToggle}
                    disabled={busy || (!connected && noDevicesAvailable)}
                >
                    {connected ? "Disconnect" : "Connect"}
                </button>
            </div>

            <div className="left-main-controls__top">
                <div className="left-main-controls__stop-wrap">
                    <ActionButton
                        label="STOP!"
                        variant="danger"
                        circle
                        pressed={isStopPressed}
                        onClick={onStop}
                        disabled={uiDisabled || isStopPressed}
                    />
                </div>

                <div className="left-main-controls__side-buttons">
                    <button
                        className="reset-button"
                        onClick={onReset}
                        disabled={busy || !connected}
                    >
                        Reset
                    </button>

                    <button
                        className="mode-button"
                        type="button"
                        onClick={onToggleMode}
                        disabled={uiDisabled}
                    >
                        {mode === "manual" ? "Man/Auto (Manual)" : "Man/Auto (Auto)"}
                    </button>
                </div>
            </div>

            <div className="left-main-controls__grid">
                <ActionButton
                    label="Record"
                    variant="ghost"
                    onClick={onRecord}
                    disabled={uiDisabled}
                />
                <ActionButton
                    label="Resume"
                    variant="ghost"
                    onClick={onResume}
                    disabled={uiDisabled}
                />
                <ActionButton
                    label="Play"
                    variant="ghost"
                    onClick={onPlay}
                    disabled={uiDisabled}
                />
                <ActionButton
                    label="Prev position"
                    variant="ghost"
                    onClick={onPrevPosition}
                    disabled={uiDisabled}
                />
                <ActionButton
                    label="Pause"
                    variant="ghost"
                    onClick={onPause}
                    disabled={uiDisabled}
                />
                <ActionButton
                    label="Next position"
                    variant="ghost"
                    onClick={onNextPosition}
                    disabled={uiDisabled}
                />
            </div>

            <div className="position-number-box">
                Position number: {positionNumber ?? "-"}
            </div>

            <div className="left-main-controls__bottom">
                <button
                    className="motion-type-button"
                    type="button"
                    onClick={onToggleMotionType}
                    disabled={uiDisabled}
                >
                    {motionType === "ptp" ? "PTP/LIN (PTP)" : "PTP/LIN (LIN)"}
                </button>

                <div className="speed-controls">
                    <button
                        className="speed-controls__button"
                        type="button"
                        onClick={onDecreaseSpeed}
                        disabled={uiDisabled}
                    >
                        vel-
                    </button>

                    <div className="speed-controls__value">{speed}%</div>

                    <button
                        className="speed-controls__button"
                        type="button"
                        onClick={onIncreaseSpeed}
                        disabled={uiDisabled}
                    >
                        vel+
                    </button>
                </div>
            </div>
        </aside>
    );
}