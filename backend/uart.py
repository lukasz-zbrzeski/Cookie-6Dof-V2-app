# COMMUNICATION WITH ROBOT ARM VIA UART
import serial
import serial.tools.list_ports
import time

# Global variable to hold the serial connection
ser = None


def list_serial_ports():
    com_ports = list(serial.tools.list_ports.comports())
    stm_port = []
    for p in com_ports:
        if "STM" in p.description:  # Szukamy portu, który zawiera "STM"
            stm_port.append(p.device)
    return stm_port


def connect(com_port: str, baud_rate: int):
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
        odpowiedz_start = raw_bytes.decode("utf-8", errors="ignore").strip()

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


def disconnect():
    global ser
    if ser and ser.is_open:
        ser.close()
        print("Port zamknięty.")


def get_config():
    global ser
    if ser and ser.is_open:
        try:
            ser.write(b"GET_CONFIG;")
            ser.flush()

            # readline() samo z siebie czeka na znak '\n',
            # więc sleep(0.1) można zostawić tylko jako mały bufor bezpieczeństwa
            time.sleep(0.1)

            raw_bytes = ser.readline()
            config_str = raw_bytes.decode("utf-8", errors="ignore").strip()
            print(f"[DEBUG] Otrzymana konfiguracja: '{raw_bytes}'")

            # --- ROZPOCZYNAMY PARSOWANIE ---
            # Sprawdzamy, czy ramka ma poprawny nagłówek i zakończenie
            if config_str.startswith("CFG[") and config_str.endswith("];"):
                # Wycinamy sam środek (bez 'CFG[' i '];')
                content = config_str[4:-2]
                servos_data = content.split("|")

                # Upewniamy się, że przyszło dokładnie 6 serw
                if len(servos_data) != 6:
                    print(f"[BŁĄD] Ramka zawiera {len(servos_data)} serw zamiast 6!")
                    return None

                parsed_servos = []

                # Przechodzimy przez każde serwo i wyciągamy parametry
                for index, servo_str in enumerate(servos_data):
                    parts = servo_str.split(",")

                    # Sprawdzamy, czy serwo ma dokładnie 4 parametry (offset, min, max, angle)
                    if len(parts) == 4:
                        servo_dict = {
                            "id": index,
                            "offset": int(parts[0]),
                            "map_min": int(parts[1]),
                            "map_max": int(parts[2]),
                            "angle": float(parts[3]),
                        }
                        parsed_servos.append(servo_dict)
                    else:
                        print(f"[BŁĄD] Uszkodzone dane w serwie {index}: {servo_str}")
                        return None

                print("[SUKCES] Konfiguracja rozpakowana pomyślnie!")
                return parsed_servos  # Zwracamy gotową listę obiektów!
            else:
                print("[BŁĄD] Ramka ma nieprawidłowy format (brak 'CFG[' lub '];')")
                return None

        except Exception as e:
            print(f"[BŁĄD PODCZAS ODCZYTU KONFIGURACJI]: {e}")
            return None
    else:
        print("[BŁĄD] Port nie jest otwarty!")
        return None
