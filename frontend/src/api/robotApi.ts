const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type Mode = "manual" | "auto";

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error ${response.status}`);
    }

    return response.json();
}

export async function getRobotState() {
    const response = await fetch(`${API_BASE_URL}/robot/state`);
    return handleResponse<{
        connected: boolean;
        stopped: boolean;
        mode: Mode;
        com_port: string | null;
        baud_rate: number | null;
        joints: number[];
        cartesian: number[];
    }>(response);
}

export async function connectRobot(comPort: string, baudRate: number) {
    const response = await fetch(`${API_BASE_URL}/robot/connect`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            com_port: comPort,
            baud_rate: baudRate,
        }),
    });

    return handleResponse(response);
}

export async function stopRobot() {
    const response = await fetch(`${API_BASE_URL}/robot/stop`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function resetRobot() {
    const response = await fetch(`${API_BASE_URL}/robot/reset`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function setRobotMode(mode: Mode) {
    const response = await fetch(`${API_BASE_URL}/robot/mode`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode }),
    });

    return handleResponse(response);
}

export async function incrementJoint(index: number) {
    const response = await fetch(`${API_BASE_URL}/robot/joints/${index}/increment`, {
        method: "PATCH",
    });

    return handleResponse<{ values: number[] }>(response);
}

export async function decrementJoint(index: number) {
    const response = await fetch(`${API_BASE_URL}/robot/joints/${index}/decrement`, {
        method: "PATCH",
    });

    return handleResponse<{ values: number[] }>(response);
}

export async function incrementCartesian(index: number) {
    const response = await fetch(`${API_BASE_URL}/robot/cartesian/${index}/increment`, {
        method: "PATCH",
    });

    return handleResponse<{ values: number[] }>(response);
}

export async function decrementCartesian(index: number) {
    const response = await fetch(`${API_BASE_URL}/robot/cartesian/${index}/decrement`, {
        method: "PATCH",
    });

    return handleResponse<{ values: number[] }>(response);
}

export async function recordPosition() {
    const response = await fetch(`${API_BASE_URL}/robot/record`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function resumeMotion() {
    const response = await fetch(`${API_BASE_URL}/robot/resume`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function playMotion() {
    const response = await fetch(`${API_BASE_URL}/robot/play`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function prevPosition() {
    const response = await fetch(`${API_BASE_URL}/robot/prev-position`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function pauseMotion() {
    const response = await fetch(`${API_BASE_URL}/robot/pause`, {
        method: "POST",
    });

    return handleResponse(response);
}

export async function nextPosition() {
    const response = await fetch(`${API_BASE_URL}/robot/next-position`, {
        method: "POST",
    });

    return handleResponse(response);
}