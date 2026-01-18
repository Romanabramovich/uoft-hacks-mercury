import requests
import time

BASE_URL = "http://localhost:8000"

def test_tracker():
    print("Testing Tracker API...")
    
    # Start Tracker
    try:
        response = requests.post(f"{BASE_URL}/api/tracker/start")
        print(f"Start Response: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return

    time.sleep(2)

    # Stop Tracker
    try:
        response = requests.post(f"{BASE_URL}/api/tracker/stop")
        print(f"Stop Response: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Failed to stop tracker: {e}")

if __name__ == "__main__":
    test_tracker()
