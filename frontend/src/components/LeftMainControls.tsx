import { ActionButton } from "./ActionButton";

type LeftMainControlsProps = {
    isStopPressed: boolean;
    connected: boolean;
    availableComPorts: string[];
    selectedCom: string;
    baudRate: string;
    mode: "manual" | "auto";
    busy?: boolean;
    onSelectedComChange: (value: string) => void;
    onBaudRateChange: (value: string) => void;
    onConnectToggle: () => void;
    onStop: () => void;
    onReset: () => void;
    onToggleMode: () => void;
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
                                     mode,
                                     busy = false,
                                     onSelectedComChange,
                                     onBaudRateChange,
                                     onConnectToggle,
                                     onStop,
                                     onReset,
                                     onToggleMode,
                                     onRecord,
                                     onResume,
                                     onPlay,
                                     onPrevPosition,
                                     onPause,
                                     onNextPosition,
                                 }: LeftMainControlsProps) {
    const noDevicesAvailable = availableComPorts.length === 0;
    const controlsDisabled = busy || !connected;

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
                        disabled={controlsDisabled || isStopPressed}
                    />
                </div>

                <div className="left-main-controls__side-buttons">
                    <button
                        className="reset-button"
                        onClick={onReset}
                        disabled={controlsDisabled}
                    >
                        Reset
                    </button>

                    <button
                        className="mode-button"
                        type="button"
                        onClick={onToggleMode}
                        disabled={controlsDisabled}
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
                    disabled={controlsDisabled}
                />
                <ActionButton
                    label="Resume"
                    variant="ghost"
                    onClick={onResume}
                    disabled={controlsDisabled}
                />
                <ActionButton
                    label="Play"
                    variant="ghost"
                    onClick={onPlay}
                    disabled={controlsDisabled}
                />
                <ActionButton
                    label="Prev position"
                    variant="ghost"
                    onClick={onPrevPosition}
                    disabled={controlsDisabled}
                />
                <ActionButton
                    label="Pause"
                    variant="ghost"
                    onClick={onPause}
                    disabled={controlsDisabled}
                />
                <ActionButton
                    label="Next position"
                    variant="ghost"
                    onClick={onNextPosition}
                    disabled={controlsDisabled}
                />
            </div>
        </aside>
    );
}