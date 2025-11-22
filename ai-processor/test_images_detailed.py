"""
Script para testar o reconhecimento de placas com análise detalhada e visualização.
"""

import sys
from pathlib import Path
import cv2
import numpy as np
from license_plate_recognition import LicensePlateRecognizer

def test_image_detailed(image_path: str, save_debug: bool = True):
    """
    Testa uma imagem com análise detalhada e salva imagens de debug.
    
    Args:
        image_path: Caminho para a imagem
        save_debug: Se True, salva imagens de debug
    """
    recognizer = LicensePlateRecognizer()
    
    img_path = Path(image_path)
    if not img_path.exists():
        print(f"[ERRO] Imagem nao encontrada: {image_path}")
        return
    
    print(f"\n{'='*80}")
    print(f"ANALISE DETALHADA: {img_path.name}")
    print(f"{'='*80}")
    
    # Carregar imagem
    image = cv2.imread(str(img_path))
    if image is None:
        print(f"[ERRO] Nao foi possivel carregar a imagem")
        return
    
    print(f"Dimensoes: {image.shape[1]}x{image.shape[0]}")
    
    # Tentar diferentes métodos de detecção
    print(f"\n--- Metodos de Deteccao ---")
    
    # Método 1: Contornos tradicionais
    try:
        plates_contours = recognizer.detect_plates(image)
        print(f"Contornos tradicionais: {len(plates_contours)} regiao(oes) encontrada(s)")
        if plates_contours:
            for i, (x, y, w, h) in enumerate(plates_contours, 1):
                print(f"  Regiao {i}: x={x}, y={y}, w={w}, h={h}, aspect_ratio={w/h:.2f}")
    except Exception as e:
        print(f"Contornos tradicionais: Erro - {e}")
        plates_contours = []
    
    # Método 2: MSER
    try:
        plates_mser = recognizer.detect_plates_mser(image)
        print(f"MSER: {len(plates_mser)} regiao(oes) encontrada(s)")
        if plates_mser:
            for i, (x, y, w, h) in enumerate(plates_mser, 1):
                print(f"  Regiao {i}: x={x}, y={y}, w={w}, h={h}, aspect_ratio={w/h:.2f}")
    except Exception as e:
        print(f"MSER: Erro - {e}")
        plates_mser = []
    
    # Método 3: YOLO
    try:
        plates_yolo = recognizer.detect_plates_yolo(image)
        print(f"YOLO: {len(plates_yolo)} regiao(oes) encontrada(s)")
        if plates_yolo:
            for i, (x, y, w, h) in enumerate(plates_yolo, 1):
                print(f"  Regiao {i}: x={x}, y={y}, w={w}, h={h}, aspect_ratio={w/h:.2f}")
    except Exception as e:
        print(f"YOLO: Erro - {e}")
        plates_yolo = []
    
    # Método 4: Ultralytics
    try:
        plates_ultra = recognizer.detect_plates_ultra(image)
        print(f"Ultralytics: {len(plates_ultra)} regiao(oes) encontrada(s)")
        if plates_ultra:
            for i, (x, y, w, h) in enumerate(plates_ultra, 1):
                print(f"  Regiao {i}: x={x}, y={y}, w={w}, h={h}, aspect_ratio={w/h:.2f}")
    except Exception as e:
        print(f"Ultralytics: Erro - {e}")
        plates_ultra = []
    
    # Método 5: Roboflow
    try:
        plates_rf = recognizer.detect_plates_roboflow(image)
        print(f"Roboflow: {len(plates_rf)} regiao(oes) encontrada(s)")
        if plates_rf:
            for i, (x, y, w, h) in enumerate(plates_rf, 1):
                print(f"  Regiao {i}: x={x}, y={y}, w={w}, h={h}, aspect_ratio={w/h:.2f}")
    except Exception as e:
        print(f"Roboflow: Erro - {e}")
        plates_rf = []
    
    # Processar com método completo
    print(f"\n--- Reconhecimento Completo ---")
    results = recognizer.recognize_from_image(str(img_path))
    
    if results:
        print(f"Placas reconhecidas: {len(results)}")
        for i, result in enumerate(results, 1):
            print(f"\n  Placa {i}:")
            print(f"    Numero: {result.get('plate_number', 'N/A')}")
            print(f"    Tipo: {result.get('plate_type', 'N/A')}")
            print(f"    Confianca: {result.get('confidence', 0.0):.2%}")
            bbox = result.get('bbox', {})
            print(f"    BBox: x={bbox.get('x', 0)}, y={bbox.get('y', 0)}, "
                  f"w={bbox.get('width', 0)}, h={bbox.get('height', 0)}")
    else:
        print(f"Nenhuma placa reconhecida")
    
    # Salvar imagens de debug se solicitado
    if save_debug:
        debug_dir = img_path.parent / "debug"
        debug_dir.mkdir(exist_ok=True)
        
        # Imagem com todas as detecções
        debug_img = image.copy()
        
        # Desenhar contornos tradicionais (verde)
        for x, y, w, h in plates_contours:
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(debug_img, "Contour", (x, y-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Desenhar MSER (azul)
        for x, y, w, h in plates_mser:
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (255, 0, 0), 2)
            cv2.putText(debug_img, "MSER", (x, y-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
        
        # Desenhar YOLO (amarelo)
        for x, y, w, h in plates_yolo:
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 255, 255), 2)
            cv2.putText(debug_img, "YOLO", (x, y-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        
        # Desenhar Ultralytics (roxo)
        for x, y, w, h in plates_ultra:
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (255, 0, 255), 2)
            cv2.putText(debug_img, "Ultra", (x, y-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 1)
        
        # Desenhar Roboflow (laranja)
        for x, y, w, h in plates_rf:
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 165, 255), 2)
            cv2.putText(debug_img, "Roboflow", (x, y-5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)
        
        # Desenhar resultados finais (vermelho)
        for result in results:
            bbox = result.get('bbox', {})
            x = bbox.get('x', 0)
            y = bbox.get('y', 0)
            w = bbox.get('width', 0)
            h = bbox.get('height', 0)
            plate_num = result.get('plate_number', 'N/A')
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 0, 255), 3)
            cv2.putText(debug_img, plate_num, (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        debug_file = debug_dir / f"{img_path.stem}_debug.jpg"
        cv2.imwrite(str(debug_file), debug_img)
        print(f"\nImagem de debug salva em: {debug_file}")
    
    print(f"{'='*80}\n")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Testar imagem específica
        test_image_detailed(sys.argv[1])
    else:
        # Testar todas as imagens da pasta
        folder_path = r"C:\Users\cpd.44\Pictures\Carros"
        folder = Path(folder_path)
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
        image_files = []
        for ext in image_extensions:
            image_files.extend(folder.glob(f'*{ext}'))
            image_files.extend(folder.glob(f'*{ext.upper()}'))
        
        # Remover duplicatas
        image_files = list(set(image_files))
        
        print(f"Testando {len(image_files)} imagens...")
        for img_file in image_files:
            test_image_detailed(str(img_file), save_debug=True)

