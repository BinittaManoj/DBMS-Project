import subprocess
import sys
import time
import requests

def run():
    print("=" * 60)
    print("Starting FastAPI Backend for Integration Tests...")
    print("=" * 60)

    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Wait for server to be up
    ready = False
    for i in range(25):
        time.sleep(0.5)
        try:
            r = requests.get("http://127.0.0.1:8000/docs", timeout=1)
            if r.status_code == 200:
                ready = True
                print(f"Backend is ready (attempt {i+1})!")
                break
        except Exception:
            pass

    if not ready:
        print("Backend failed to start within timeout.")
        server_process.terminate()
        out, err = server_process.communicate()
        print("STDOUT:", out.decode("utf-8", errors="ignore"))
        print("STDERR:", err.decode("utf-8", errors="ignore"))
        sys.exit(1)

    print("\nRunning Full Pytest Test Suite...")
    print("-" * 60)
    try:
        ret = subprocess.call([sys.executable, "-m", "pytest", "tests/", "-v"])
    finally:
        print("\nStopping Backend...")
        server_process.terminate()
        server_process.wait()

    sys.exit(ret)

if __name__ == "__main__":
    run()
