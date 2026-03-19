import serial
import time

# 1. Otwieramy port (Zwiększyłem timeout do 0.1s dla pewności)
try:
    ser = serial.Serial('/dev/ttyACM0', 115200, timeout=0.1)
    print(f"Otwarto port: {ser.name}")
except Exception as e:
    print(f"Blad otwarcia portu: {e}")
    exit()

# UWAGA: Otwarcie portu często resetuje STM32. 
# Dajemy mu 2 sekundy na uruchomienie się i wysłanie "Zaczynamy!..."
print("Czekam na uruchomienie STM32...")
time.sleep(2)

# Czyścimy bufory! Usuwamy to, co STM32 wysłał przy starcie, 
# żeby mieć czystą linię przed wysłaniem komend.
ser.reset_input_buffer()
ser.reset_output_buffer()

# 2. Wysyłamy komendę aktywującą strumień
print("\n--- INICJALIZACJA ---")
ser.write(b"START_STREAM;")
ser.flush()  # FLUSH: Wymusza fizyczne wypchnięcie danych z Linuxa na kabel USB!
time.sleep(0.1) # Dajemy STM32 ułamek sekundy na przetworzenie

# Czytamy odpowiedź (używamy readline, żeby czekał na znak nowej linii \n)
odpowiedz_start = ser.readline().decode('utf-8').strip()
print("Odpowiedz STM32:", odpowiedz_start)

# # 3. Definiujemy testowe ramki
# test_frames = [
#     # "JN[0,0.0,0.0,0.0,0.0,0.0,0.0];",
#     # "JN[1,-180.55,45.21,12.0,-90.0,15.5,-120.4];",
#     # "JN[2,5.0,-5.0,5.0,-5.0,5.0,-5.0];",
#     # "JN[3,90.0,90.0,90.0,90.0,90.0,90.0];"
#     "JN[0,0.0,0.0,0.0,0.0,0.0,0.0];",
  

# ]
test_frames = []
for i in range(180):
    j1 = 0.0
    j3 = i*0.25
    test_frames.append(f"JN[{i},{j1},0.0,{j3},0.0,0.0,0.0];")
    

print("\n--- TEST RUCHU (RÓŻNE DŁUGOŚCI RAMEK) ---")

for frame in test_frames:
    dlugosc = len(frame)
    print(f"\n[TX] Wysylam {dlugosc} bajtow: {frame}")
    
    # Wysyłamy i robimy flush
    ser.write(frame.encode('utf-8'))
    ser.flush() 
    
    # Czekamy 20ms (nasze 50Hz)
    time.sleep(0.02) 
    
    # Czytamy echo
    odpowiedz = ser.readline().decode('utf-8').strip()
    if odpowiedz:
        print(f"[RX] Echo od STM32: {odpowiedz}")
    else:
        print("[RX] Brak odpowiedzi...")


# Zamykamy port
ser.close()
print("\nTest zakonczony. Port zamkniety.")