import os
import sys
import time
import json
import urllib.parse
import requests

def main():
    if len(sys.argv) < 2:
        print('Usage: python test_batch.py <folder>')
        sys.exit(1)
    folder = sys.argv[1]
    if not os.path.isdir(folder):
        print(f'Folder not found: {folder}')
        sys.exit(1)

    exts = {'.jpg', '.jpeg', '.png'}
    files = [os.path.join(folder, f) for f in os.listdir(folder) if os.path.splitext(f)[1].lower() in exts]
    if not files:
        print('No image files found')
        sys.exit(0)

    # Optionally set detector params
    try:
        requests.post('http://localhost:8001/config/ultra', params={'conf_thresh': 0.20, 'iou_thresh': 0.45}, timeout=5)
    except Exception:
        pass

    for fp in files:
        enc = urllib.parse.quote(fp)
        url = f'http://localhost:8001/process/path?file_path={enc}&analysis_type=plate_recognition'
        t0 = time.time()
        try:
            resp = requests.post(url, timeout=30)
            dt = int((time.time() - t0) * 1000)
            if resp.status_code != 200:
                print(f'{os.path.basename(fp)} -> ERROR status={resp.status_code} time_ms={dt}')
                continue
            data = resp.json()
            results = data.get('results', {})
            det = results.get('total_detections', 0)
            plates = results.get('detected_plates', []) or []
            first_plate = plates[0].get('plate_number') if plates else None
            print(f'{os.path.basename(fp)} -> det={det} plates={len(plates)} first_plate={first_plate} time_ms={dt}')
        except Exception as e:
            dt = int((time.time() - t0) * 1000)
            print(f'{os.path.basename(fp)} -> ERROR {e} time_ms={dt}')

if __name__ == '__main__':
    main()