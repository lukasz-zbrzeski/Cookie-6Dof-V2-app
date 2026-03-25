import { useCallback, useEffect, useState } from "react";
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

export type RobotMode = "manual" | "auto";

export function useRobotState() {
    const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [cartesian, setCartesian] = useState<number[]>([0, 0, 0, 0, 0, 0]);
    const [connected, setConnected] = useState(false);
    const [isStopPressed, setIsStopPressed] = useState(false);
    const [mode, setMode] = useState<RobotMode>("manual");
    const [selectedCom, setSelectedCom] = useState("COM1");
    const [baudRate, setBaudRate] = useState("115200");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const loadState = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadState();
    }, [loadState]);

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

    return {
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
        loadState,
        handleConnect,
        handleStop,
        handleReset,
        handleToggleMode,
        handleIncrementJoint,
        handleDecrementJoint,
        handleIncrementCartesian,
        handleDecrementCartesian,
        handleRecord,
        handleResume,
        handlePlay,
        handlePrevPosition,
        handlePause,
        handleNextPosition,
    };
}