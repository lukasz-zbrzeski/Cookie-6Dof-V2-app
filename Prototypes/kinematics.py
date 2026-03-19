import os

# Czyści terminal zaraz po starcie (Linux/macOS)
os.system('clear')
import numpy as np
import roboticstoolbox as rtb
from spatialmath import SE3
import serial 

serial_port = 'COM3'  # Zmień na odpowiedni port
baud_rate = 115200

# #Serial connection
# ser = serial.Serial('/dev/ttyACM0',115200)  # open serial port
# print(ser.name)         # check which port was really used

# while True:
#     line = ser.readline()          # read one byte
#     print(line)             # print the byte as a character
# ser.write(b'hello')     # write a string
# ser.close()             # close port

# Modified DH notation parameters:

BASE_OFFSET = 40.0
a1 = 47.0
a2 = 135.0
a3 = 29.55
d1 = 101.0 + BASE_OFFSET  # 141.0
d4 = 154.25
d6 = 56.122

# Tworzenie modelu kinematycznego robota
robot = rtb.DHRobot(
    [
        rtb.RevoluteMDH(d=d1, a=0,  alpha=0),          # Joint 1
        rtb.RevoluteMDH(d=0,  a=a1, alpha=np.pi/2),    # Joint 2
        rtb.RevoluteMDH(d=0,  a=a2, alpha=0),          # Joint 3
        rtb.RevoluteMDH(d=d4, a=a3, alpha=np.pi/2),    # Joint 4
        rtb.RevoluteMDH(d=0,  a=0,  alpha=-np.pi/2),   # Joint 5
        rtb.RevoluteMDH(d=d6, a=0,  alpha=np.pi/2),    # Joint 6
    ],
    name="Cookie6dof",
)

# Definiujemy transformację flanszy (z Twojej tabeli)
flange = SE3.Tz(25.5) 

# Definiujemy transformację samego narzędzia względem flanszy 
# (np. chwytak o długości 100mm)
tool_offset = SE3.Tz(0.0)

# Całkowite narzędzie to iloczyn tych transformacji
robot.tool = flange * tool_offset

print(robot.q)
T = robot.fkine([0,np.pi/2,0,0,0,0])
print(T)
