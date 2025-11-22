import os
from typing import Any, Dict, List, Tuple
import numpy as np

class UltraDetector:
    def __init__(self):
        self.model = None
        self.conf = float(os.getenv('ULTRA_CONF_THRESH', '0.25'))
        self.iou = float(os.getenv('ULTRA_IOU_THRESH', '0.45'))
        self.names = None

    def load(self, weights_path: str) -> Dict[str, Any]:
        try:
            from ultralytics import YOLO
        except Exception as e:
            return {'loaded': False, 'error': str(e)}
        if not weights_path:
            return {'loaded': False, 'error': 'Modelo não informado'}
        try:
            self.model = YOLO(weights_path)
            self.names = self.model.names
            return {'loaded': True, 'model_path': weights_path}
        except Exception as e:
            return {'loaded': False, 'error': str(e)}

    def set_params(self, conf: float, iou: float):
        self.conf = float(conf)
        self.iou = float(iou)

    def infer(self, image: np.ndarray) -> Dict[str, Any]:
        if self.model is None:
            return {'success': False, 'error': 'Modelo não carregado'}
        try:
            res = self.model.predict(source=image, imgsz=640, conf=self.conf, iou=self.iou, verbose=False)
            detections: List[Dict[str, Any]] = []
            for r in res:
                if hasattr(r, 'boxes') and r.boxes is not None:
                    boxes = r.boxes
                    xyxy = boxes.xyxy.cpu().numpy()
                    confs = boxes.conf.cpu().numpy()
                    clss = boxes.cls.cpu().numpy()
                    for i in range(len(confs)):
                        x1, y1, x2, y2 = xyxy[i]
                        w = max(0, int(x2 - x1))
                        h = max(0, int(y2 - y1))
                        x = int(x1)
                        y = int(y1)
                        c = float(confs[i])
                        cls_id = int(clss[i]) if clss is not None else 0
                        name = str(self.names.get(cls_id, str(cls_id))) if isinstance(self.names, dict) else str(cls_id)
                        detections.append({'bbox': {'x': x, 'y': y, 'width': w, 'height': h}, 'confidence': c, 'class_id': cls_id, 'class_name': name})
            return {'success': True, 'detections': detections}
        except Exception as e:
            return {'success': False, 'error': str(e)}