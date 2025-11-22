import os
import time
from typing import List, Tuple, Dict, Any
import cv2
import numpy as np


class YOLODetector:
    def __init__(self):
        self.net = None
        self.input_size = (640, 640)
        self.conf_thresh = float(os.getenv('YOLO_CONF_THRESH', '0.25'))
        self.nms_thresh = float(os.getenv('YOLO_NMS_THRESH', '0.45'))
        env_classes = os.getenv('YOLO_CLASSES', '')
        plate_model = os.getenv('PLATE_DETECTOR_ONNX_PATH', '')
        if env_classes:
            self.classes = [c.strip() for c in env_classes.split(',')]
        elif plate_model:
            self.classes = ['license_plate', 'plate', 'placa']
        else:
            self.classes = self._default_coco_classes()

    def _default_coco_classes(self) -> List[str]:
        return [
            'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
            'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
            'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
            'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
            'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
            'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
            'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
            'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
            'hair drier', 'toothbrush'
        ]

    def load(self, onnx_path: str) -> Dict[str, Any]:
        if not onnx_path or not os.path.exists(onnx_path):
            return { 'loaded': False, 'error': f'Modelo ONNX não encontrado: {onnx_path}' }
        self.net = cv2.dnn.readNetFromONNX(onnx_path)
        self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_DEFAULT)
        self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
        return { 'loaded': True, 'model_path': onnx_path }

    def set_params(self, conf_thresh: float, nms_thresh: float):
        self.conf_thresh = float(conf_thresh)
        self.nms_thresh = float(nms_thresh)

    def _letterbox(self, image: np.ndarray, new_shape=(640, 640)) -> Tuple[np.ndarray, float, Tuple[int, int]]:
        h, w = image.shape[:2]
        r = min(new_shape[0] / h, new_shape[1] / w)
        nh, nw = int(h * r), int(w * r)
        resized = cv2.resize(image, (nw, nh), interpolation=cv2.INTER_LINEAR)
        canvas = np.full((new_shape[0], new_shape[1], 3), 114, dtype=np.uint8)
        top = (new_shape[0] - nh) // 2
        left = (new_shape[1] - nw) // 2
        canvas[top:top+nh, left:left+nw] = resized
        return canvas, r, (left, top)

    def infer(self, image: np.ndarray) -> Dict[str, Any]:
        if self.net is None:
            return { 'success': False, 'error': 'Modelo não carregado' }
        t0 = time.time()
        blob_img, ratio, (dwx, dwy) = self._letterbox(image, self.input_size)
        blob = cv2.dnn.blobFromImage(blob_img, 1/255.0, self.input_size, swapRB=True, crop=False)
        self.net.setInput(blob)
        preds = self.net.forward()
        preds = np.squeeze(preds)
        if preds.ndim == 1:
            preds = np.expand_dims(preds, axis=0)

        boxes = []
        confidences = []
        class_ids = []

        for det in preds:
            conf = float(det[4])
            if conf < self.conf_thresh:
                continue
            if det.shape[0] > 5:
                scores = det[5:]
                if scores.size > 0:
                    class_id = int(np.argmax(scores))
                    score = float(scores[class_id])
                    total_conf = conf * score
                else:
                    class_id = 0
                    total_conf = conf
            else:
                class_id = 0
                total_conf = conf
            if total_conf < self.conf_thresh:
                continue
            cx, cy, w, h = float(det[0]), float(det[1]), float(det[2]), float(det[3])
            x = cx - w / 2
            y = cy - h / 2
            x = (x - dwx) / ratio
            y = (y - dwy) / ratio
            w = w / ratio
            h = h / ratio
            boxes.append([int(x), int(y), int(w), int(h)])
            confidences.append(float(total_conf))
            class_ids.append(class_id)

        idxs = cv2.dnn.NMSBoxes(boxes, confidences, self.conf_thresh, self.nms_thresh)
        results = []
        if len(idxs) > 0:
            for i in idxs.flatten():
                bx, by, bw, bh = boxes[i]
                results.append({
                    'bbox': { 'x': bx, 'y': by, 'width': bw, 'height': bh },
                    'confidence': confidences[i],
                    'class_id': class_ids[i],
                    'class_name': self.classes[class_ids[i]] if class_ids[i] < len(self.classes) else str(class_ids[i])
                })

        dt = time.time() - t0
        return { 'success': True, 'detections': results, 'fps': (1.0 / dt) if dt > 0 else 0.0 }