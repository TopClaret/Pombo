import os
import tempfile
import cv2
import numpy as np
from typing import Any, Dict, List

class RoboflowClient:
    def __init__(self):
        self.api_url = os.getenv('ROBOFLOW_API_URL', 'https://serverless.roboflow.com')
        self.api_key = os.getenv('ROBOFLOW_API_KEY', '')
        self.model_id = os.getenv('ROBOFLOW_MODEL_ID', '')
        self.client = None
        try:
            from inference_sdk import InferenceHTTPClient
            self.client_class = InferenceHTTPClient
        except Exception:
            self.client_class = None

    def load(self, api_url: str = '', api_key: str = '', model_id: str = '') -> Dict[str, Any]:
        url = api_url or self.api_url
        key = api_key or self.api_key
        mid = model_id or self.model_id
        if not self.client_class:
            return {'loaded': False, 'error': 'inference-sdk not available'}
        if not key or not mid:
            return {'loaded': False, 'error': 'api_key or model_id missing'}
        try:
            self.client = self.client_class(api_url=url, api_key=key)
            self.model_id = mid
            return {'loaded': True, 'model_id': mid}
        except Exception as e:
            return {'loaded': False, 'error': str(e)}

    def infer_image(self, image: np.ndarray) -> List[Dict[str, Any]]:
        if self.client is None:
            return []
        fd, tmp_path = tempfile.mkstemp(suffix='.jpg')
        try:
            os.close(fd)
            cv2.imwrite(tmp_path, image)
            result = self.client.infer(tmp_path, model_id=self.model_id)
            preds = result.get('predictions', []) if isinstance(result, dict) else []
            dets: List[Dict[str, Any]] = []
            for p in preds:
                x = int(p.get('x', 0) - p.get('width', 0) / 2)
                y = int(p.get('y', 0) - p.get('height', 0) / 2)
                w = int(p.get('width', 0))
                h = int(p.get('height', 0))
                dets.append({'bbox': {'x': x, 'y': y, 'width': w, 'height': h}, 'class': str(p.get('class', '')), 'confidence': float(p.get('confidence', 0.0))})
            return dets
        except Exception:
            return []
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass