"""
Script de diagnóstico para analisar imagens e tentar detecções mais permissivas.
"""

import sys
from pathlib import Path
import cv2
import numpy as np
from license_plate_recognition import LicensePlateRecognizer

def diagnose_image(image_path: str):
    """
    Diagnostica uma imagem e tenta detecções mais permissivas.
    """
    recognizer = LicensePlateRecognizer()
    
    img_path = Path(image_path)
    if not img_path.exists():
        print(f"[ERRO] Imagem nao encontrada: {image_path}")
        return
    
    print(f"\n{'='*80}")
    print(f"DIAGNOSTICO: {img_path.name}")
    print(f"{'='*80}")
    
    # Carregar imagem
    image = cv2.imread(str(img_path))
    if image is None:
        print(f"[ERRO] Nao foi possivel carregar a imagem")
        return
    
    h, w = image.shape[:2]
    print(f"Dimensoes: {w}x{h} pixels")
    print(f"Area total: {w*h:,} pixels")
    
    # Análise básica da imagem
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    std_brightness = np.std(gray)
    print(f"Brilho medio: {mean_brightness:.1f}")
    print(f"Contraste (desvio padrao): {std_brightness:.1f}")
    
    # Tentar detecção mais permissiva de contornos
    print(f"\n--- Deteccao Permissiva de Contornos ---")
    try:
        # Converter para escala de cinza
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Aplicar filtros
        blurred = cv2.bilateralFilter(gray, 9, 75, 75)
        equalized = cv2.equalizeHist(blurred)
        
        # Canny com thresholds mais baixos
        edged = cv2.Canny(equalized, 30, 100)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:20]
        
        print(f"Total de contornos encontrados: {len(contours)}")
        
        plate_candidates = []
        for i, contour in enumerate(contours):
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h) if h > 0 else 0
            area = w * h
            rect_area = cv2.contourArea(approx)
            rect_fill = rect_area / float(area) if area > 0 else 0
            
            # Critérios mais permissivos
            if (1.0 < aspect_ratio < 8.0 and  # Aspect ratio mais amplo
                w > 40 and h > 15 and  # Tamanho mínimo menor
                rect_fill > 0.3):  # Preenchimento menor
                plate_candidates.append({
                    'index': i,
                    'x': x, 'y': y, 'w': w, 'h': h,
                    'aspect_ratio': aspect_ratio,
                    'area': area,
                    'rect_fill': rect_fill
                })
        
        print(f"Candidatos encontrados: {len(plate_candidates)}")
        for i, cand in enumerate(plate_candidates[:5], 1):  # Mostrar top 5
            print(f"  Candidato {i}: x={cand['x']}, y={cand['y']}, "
                  f"w={cand['w']}, h={cand['h']}, "
                  f"aspect={cand['aspect_ratio']:.2f}, "
                  f"area={cand['area']}")
        
        # Tentar OCR nas regiões candidatas
        if plate_candidates:
            print(f"\n--- Tentando OCR nas Regioes Candidatas ---")
            for i, cand in enumerate(plate_candidates[:3], 1):  # Top 3
                x, y, w, h = cand['x'], cand['y'], cand['w'], cand['h']
                
                # Extrair região com padding
                pad = 5
                x0 = max(0, x - pad)
                y0 = max(0, y - pad)
                x1 = min(image.shape[1], x + w + pad)
                y1 = min(image.shape[0], y + h + pad)
                
                region = image[y0:y1, x0:x1]
                
                if region.size > 0:
                    # Tentar reconhecer texto
                    text = recognizer.extract_plate_text(region)
                    if text:
                        print(f"  Candidato {i}: Texto reconhecido = '{text}'")
                    else:
                        print(f"  Candidato {i}: Nenhum texto reconhecido")
        
    except Exception as e:
        print(f"Erro na deteccao permissiva: {e}")
        import traceback
        traceback.print_exc()
    
    # Tentar detecção de texto direto na imagem inteira (método alternativo)
    print(f"\n--- OCR Direto na Imagem Inteira ---")
    try:
        # Redimensionar se muito pequena
        if h < 200 or w < 400:
            scale = max(200 / h, 400 / w)
            new_w = int(w * scale)
            new_h = int(h * scale)
            resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        else:
            resized = image.copy()
        
        # Tentar OCR
        text = recognizer.extract_plate_text(resized)
        if text:
            print(f"Texto encontrado na imagem inteira: '{text}'")
        else:
            print("Nenhum texto encontrado na imagem inteira")
    except Exception as e:
        print(f"Erro no OCR direto: {e}")
    
    # Salvar imagem com candidatos marcados
    debug_dir = img_path.parent / "debug"
    debug_dir.mkdir(exist_ok=True)
    
    debug_img = image.copy()
    for i, cand in enumerate(plate_candidates[:10], 1):  # Top 10
        x, y, w, h = cand['x'], cand['y'], cand['w'], cand['h']
        cv2.rectangle(debug_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(debug_img, f"C{i}", (x, y-5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
    
    debug_file = debug_dir / f"{img_path.stem}_diagnostic.jpg"
    cv2.imwrite(str(debug_file), debug_img)
    print(f"\nImagem de diagnostico salva em: {debug_file}")
    
    print(f"{'='*80}\n")


if __name__ == "__main__":
    folder_path = r"C:\Users\cpd.44\Pictures\Carros"
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"[ERRO] Pasta nao encontrada: {folder_path}")
        sys.exit(1)
    
    # Encontrar imagens
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'}
    image_files = []
    for ext in image_extensions:
        image_files.extend(folder.glob(f'*{ext}'))
        image_files.extend(folder.glob(f'*{ext.upper()}'))
    
    # Remover duplicatas
    image_files = list(set(image_files))
    
    print(f"Diagnosticando {len(image_files)} imagens...")
    for img_file in image_files:
        diagnose_image(str(img_file))

