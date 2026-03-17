import { ActionButton } from "./ActionButton";

type RightControlsProps = {
    isStopPressed: boolean;
    selectedCom: string;
    baudRate: string;
    mode: "manual" | "auto";
    busy?: boolean;
    onSelectedComChange: (value: string) => void;
    onBaudRateChange: (value: string) => void;
    onConnect: () => void;
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

export function RightControls({
                                  isStopPressed,
                                  selectedCom,
                                  baudRate,
                                  mode,
                                  busy = false,
                                  onSelectedComChange,
                                  onBaudRateChange,
                                  onConnect,
                                  onStop,
                                  onReset,
                                  onToggleMode,
                                  onRecord,
                                  onResume,
                                  onPlay,
                                  onPrevPosition,
                                  onPause,
                                  onNextPosition,
                              }: RightControlsProps) {
    return (
        <aside className="right-controls">
            <div className="connection-panel">
                <select
                    className="connection-panel__select"
                    value={selectedCom}
                    onChange={(e) => onSelectedComChange(e.target.value)}
                    disabled={busy}
                >
                    <option value="COM1">COM1</option>
                    <option value="COM2">COM2</option>
                    <option value="COM3">COM3</option>
                    <option value="COM4">COM4</option>
                    <option value="COM5">COM5</option>
                    <option value="COM6">COM6</option>
                </select>

                <input
                    className="connection-panel__input"
                    type="number"
                    value={baudRate}
                    onChange={(e) => onBaudRateChange(e.target.value)}
                    placeholder="Baud rate"
                    disabled={busy}
                />

                <button
                    className="connection-panel__button"
                    onClick={onConnect}
                    disabled={busy}
                >
                    Connect
                </button>
            </div>

            <div className="right-controls__top">
                <div className="right-controls__stop-wrap">
                    <ActionButton
                        label="STOP!"
                        variant="danger"
                        circle
                        pressed={isStopPressed}
                        onClick={onStop}
                        disabled={busy || isStopPressed}
                    />
                </div>

                <div className="right-controls__side-buttons">
                    <button
                        className="reset-button"
                        onClick={onReset}
                        disabled={busy}
                    >
                        Reset
                    </button>

                    <button
                        className="mode-button"
                        type="button"
                        onClick={onToggleMode}
                        disabled={busy}
                    >
                        {mode === "manual" ? "Man/Auto (Manual)" : "Man/Auto (Auto)"}
                    </button>
                </div>
            </div>

            <div className="right-controls__grid">
                <ActionButton label="Record" variant="ghost" onClick={onRecord} disabled={busy} />
                <ActionButton label="Resume" variant="ghost" onClick={onResume} disabled={busy} />
                <ActionButton label="Play" variant="ghost" onClick={onPlay} disabled={busy} />
                <ActionButton label="Prev position" variant="ghost" onClick={onPrevPosition} disabled={busy} />
                <ActionButton label="Pause" variant="ghost" onClick={onPause} disabled={busy} />
                <ActionButton label="Next position" variant="ghost" onClick={onNextPosition} disabled={busy} />
            </div>
        </aside>
    );
}