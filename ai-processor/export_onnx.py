import sys
from ultralytics import YOLO

def main():
    if len(sys.argv) < 2:
        print('Usage: python export_onnx.py <weights_pt_path>')
        sys.exit(1)
    weights = sys.argv[1]
    model = YOLO(weights)
    model.export(format='onnx', dynamic=False, simplify=True)

if __name__ == '__main__':
    main()