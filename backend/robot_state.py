from typing import Literal
from pydantic import BaseModel, Field


class ConnectRequest(BaseModel):
    com_port: str = Field(..., examples=["COM3"])
    baud_rate: int = Field(..., gt=0, examples=[115200])


class JointsUpdateRequest(BaseModel):
    values: list[float]

    def model_post_init(self, __context):
        if len(self.values) != 6:
            raise ValueError("Joints muszą mieć dokładnie 6 wartości.")


class CartesianUpdateRequest(BaseModel):
    values: list[float]

    def model_post_init(self, __context):
        if len(self.values) != 6:
            raise ValueError("Cartesian muszą mieć dokładnie 6 wartości.")


class ModeRequest(BaseModel):
    mode: Literal["manual", "auto"]


class ManualMovePressRequest(BaseModel):
    joint_index: int = Field(..., ge=0, le=5)
    direction: Literal["+", "-"]
    speed: int


class ManualMoveReleaseRequest(BaseModel):
    joint_index: int = Field(..., ge=0, le=5)
    direction: Literal["+", "-"]


class ManualCartesianMovePressRequest(BaseModel):
    cartesian_index: int = Field(..., ge=0, le=5)
    direction: Literal["+", "-"]
    speed: int


class ManualCartesianMoveReleaseRequest(BaseModel):
    cartesian_index: int = Field(..., ge=0, le=5)
    direction: Literal["+", "-"]


class RobotStateResponse(BaseModel):
    connected: bool
    stopped: bool
    mode: Literal["manual", "auto"]
    com_port: str | None
    baud_rate: int | None
    joints: list[float]
    cartesian: list[float]


robot_state = {
    "connected": False,
    "stopped": False,
    "mode": "manual",
    "com_port": None,
    "baud_rate": None,
    "joints": [1.15, 1.52, 1.89, 2.26, 2.63, 3.00],
    "cartesian": [2.05, 2.42, 2.79, 3.16, 3.53, 3.90],
    "move_joint": ["0.0", "0", "0", "0", "0", "0", "0"],
    "move_cartesian": ["0.0", "0", "0", "0", "0", "0", "0"],
}

manual_move_state = {
    "pressed_joint": [
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
    ],
    "pressed_cartesian": [
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
        {"plus": False, "minus": False},
    ],
    "error_joint": False,
    "error_joint_message": "",
    "error_cartesian": False,
    "error_cartesian_message": "",
}