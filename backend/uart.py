# COMMUNICATION WITH ROBOT ARM VIA UART
import serial
import serial.tools.list_ports
import time

# Global variable to hold the serial connection
ser = None 


def list_serial_ports():
    com_ports = list(serial.tools.list_ports.comports())
    stm_port =[]
    for p in com_ports:
        if "STM" in p.description:  # Szukamy portu, który zawiera "STM" 
            stm_port.append(p.device)
    return stm_port 

def uart_connect(com_port: str, baud_rate: int):
    # 1. Otwieramy port (Zwiększyłem timeout do 0.1s dla pewności)
    global ser

    try:
        ser = serial.Serial(com_port, baud_rate, timeout=0.1)
        print(f"Otwarto port: {ser.name}")
    except Exception as e:
        print(f"Blad otwarcia portu: {e}")
        return False
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
    
    try:
        ser.write(b"START_STREAM;")
        ser.flush()  
        time.sleep(0.1) 

        # Odczyt z zabezpieczeniem przed "krzakami" (errors='ignore')
        raw_bytes = ser.readline()
        odpowiedz_start = raw_bytes.decode('utf-8', errors='ignore').strip()
        
        # SUPER WAŻNE DEBUGOWANIE - to zobaczysz w logach Dockera:
        print(f"[DEBUG] Surowe bajty z STM32: {raw_bytes}")
        print(f"[DEBUG] Zdekodowany tekst: '{odpowiedz_start}'")

        if odpowiedz_start != "ACK_STREAM":
            print("[BŁĄD] Oczekiwano 'ACK_STREAM', a otrzymano coś innego. Przerywam.")
            ser.close()
            return False
            
        print("[SUKCES] Strumień danych aktywowany!") 
        return True

    except Exception as e:
        print(f"[KRYTYCZNY BŁĄD PODCZAS CZYTANIA]: {e}")
        if ser.is_open:
            ser.close()
        return False
