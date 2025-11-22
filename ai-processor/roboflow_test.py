import os
import sys
import time
import json
from inference_sdk import InferenceHTTPClient

def main():
    if len(sys.argv) < 3:
        print('Usage: python roboflow_test.py <api_key> <image_or_folder>')
        sys.exit(1)
    api_key = sys.argv[1]
    target = sys.argv[2]
    client = InferenceHTTPClient(api_url="https://serverless.roboflow.com", api_key=api_key)
    paths = []
    if os.path.isdir(target):
        exts = {'.jpg', '.jpeg', '.png'}
        for f in os.listdir(target):
            p = os.path.join(target, f)
            if os.path.isfile(p) and os.path.splitext(p)[1].lower() in exts:
                paths.append(p)
    else:
        paths.append(target)
    if not paths:
        print('No images found')
        sys.exit(0)
    for p in paths:
        t0 = time.time()
        try:
            result = client.infer(p, model_id="license_plate_detector-oybhl/1")
            dt = int((time.time() - t0) * 1000)
            preds = result.get('predictions', []) if isinstance(result, dict) else []
            first = None
            if preds:
                first = preds[0]
            print(json.dumps({
                'file': os.path.basename(p),
                'predictions_count': len(preds),
                'first_prediction': first,
                'time_ms': dt
            }))
        except Exception as e:
            dt = int((time.time() - t0) * 1000)
            print(json.dumps({'file': os.path.basename(p), 'error': str(e), 'time_ms': dt}))

if __name__ == '__main__':
    main()