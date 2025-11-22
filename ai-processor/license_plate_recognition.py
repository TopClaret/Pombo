"""
Sistema de Reconhecimento de Placas Veiculares Brasileiras

Este módulo implementa um sistema completo de reconhecimento de placas veiculares
com suporte para os formatos brasileiros (Mercosul e antigo).

Características principais:
- Pré-processamento avançado de imagens com múltiplas técnicas
- OCR otimizado com múltiplas estratégias e correção de erros
- Validação robusta de formatos de placas brasileiras
- Detecção de placas usando múltiplos métodos (YOLO, Ultralytics, Roboflow, contornos)
- Tratamento robusto de erros e casos extremos
- Suporte para imagens e vídeos

Autor: Sistema Pombo
Versão: 2.0.0
"""

import cv2
import numpy as np
import pytesseract
import re
from typing import List, Dict, Optional, Tuple
import logging
import os
from pathlib import Path
from yolo_detector import YOLODetector
from ultra_detector import UltraDetector
from roboflow_client import RoboflowClient

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LicensePlateRecognizer:
    """
    Sistema de reconhecimento de placas veiculares brasileiras.
    
    Suporta os formatos:
    - Mercosul: ABC1D23 (3 letras, 1 dígito, 1 letra, 2 dígitos)
    - Antigo: ABC1234 (3 letras, 4 dígitos)
    
    O sistema utiliza múltiplas técnicas de detecção e reconhecimento:
    - Detecção: YOLO, Ultralytics, Roboflow, contornos tradicionais, MSER
    - OCR: Tesseract com múltiplas configurações de pré-processamento
    - Validação: Regex e validação estrutural
    
    Exemplo de uso:
        >>> recognizer = LicensePlateRecognizer()
        >>> results = recognizer.recognize_from_image("placa.jpg")
        >>> for result in results:
        ...     print(f"Placa: {result['plate_number']}, Tipo: {result['plate_type']}")
    """
    
    def __init__(self, use_easyocr: bool = True):
        # Configurar caminho do Tesseract OCR via variável de ambiente, com fallback
        tess_cmd = os.getenv('TESSERACT_CMD', r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe')
        pytesseract.pytesseract.tesseract_cmd = tess_cmd
        
        # Verificar disponibilidade do EasyOCR
        self.easyocr_available = False
        self.easyocr_reader = None
        if use_easyocr or os.getenv('USE_EASYOCR', '').lower() == 'true':
            try:
                import easyocr
                # Inicializar EasyOCR (pode demorar na primeira vez)
                # Usar apenas inglês para placas brasileiras (caracteres alfanuméricos)
                try:
                    self.easyocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                    self.easyocr_available = True
                    logger.info("EasyOCR inicializado com sucesso")
                except Exception as init_error:
                    # Tentar novamente sem verbose
                    try:
                        self.easyocr_reader = easyocr.Reader(['en'], gpu=False)
                        self.easyocr_available = True
                        logger.info("EasyOCR inicializado com sucesso (segunda tentativa)")
                    except Exception:
                        logger.warning(f"Erro ao inicializar EasyOCR: {init_error}")
            except ImportError:
                logger.warning("EasyOCR não está instalado. Use: pip install easyocr")
            except Exception as e:
                logger.warning(f"Erro ao inicializar EasyOCR: {e}")
        
        self.yolo = YOLODetector()
        self.yolo_available = False
        yolo_path = os.getenv('PLATE_DETECTOR_ONNX_PATH', '')
        if yolo_path:
            res = self.yolo.load(yolo_path)
            self.yolo_available = bool(res.get('loaded'))
        self.ultra = UltraDetector()
        self.ultra_available = False
        ultra_path = os.getenv('ULTRALYTICS_MODEL_PATH', '')
        if ultra_path:
            ures = self.ultra.load(ultra_path)
            self.ultra_available = bool(ures.get('loaded'))
        self.rf = RoboflowClient()
        self.rf_available = False
        if os.getenv('ROBOFLOW_API_KEY', '') and os.getenv('ROBOFLOW_MODEL_ID', ''):
            rres = self.rf.load(os.getenv('ROBOFLOW_API_URL', ''), os.getenv('ROBOFLOW_API_KEY', ''), os.getenv('ROBOFLOW_MODEL_ID', ''))
            self.rf_available = bool(rres.get('loaded'))
        
        # Padrões de placas brasileiras (Mercosul e antigos)
        self.plate_patterns = [
            # Formato Mercosul: ABC1D23 (padrão completo)
            re.compile(r'^[A-Z]{3}[0-9][A-Z][0-9]{2}$'),
            # Formato antigo: ABC1234 (padrão completo)
            re.compile(r'^[A-Z]{3}[0-9]{4}$'),
            # Formato Mercosul com espaçamento: ABC 1D 23
            re.compile(r'^[A-Z]{3}\s?[0-9]\s?[A-Z]\s?[0-9]{2}$'),
            # Formato antigo com espaçamento: ABC 1234
            re.compile(r'^[A-Z]{3}\s?[0-9]{4}$'),
            # Formato Mercosul com hífen: ABC-1D23
            re.compile(r'^[A-Z]{3}-?[0-9][A-Z][0-9]{2}$'),
            # Formato antigo com hífen: ABC-1234
            re.compile(r'^[A-Z]{3}-?[0-9]{4}$'),
        ]
        
        # Mapeamento de correções comuns de OCR
        self.ocr_corrections = {
            '0': 'O',  # Zero confundido com O (menos comum em placas)
            'O': '0',  # O confundido com zero (mais comum)
            '1': 'I',  # Um confundido com I
            'I': '1',  # I confundido com um
            '5': 'S',  # Cinco confundido com S
            'S': '5',  # S confundido com cinco
            '8': 'B',  # Oito confundido com B
            'B': '8',  # B confundido com oito
            'Z': '2',  # Z confundido com dois
            '2': 'Z',  # Dois confundido com Z
            'G': '6',  # G confundido com seis
            '6': 'G',  # Seis confundido com G
        }
    
    def preprocess_image(self, image: np.ndarray, method: str = 'adaptive') -> List[np.ndarray]:
        """
        Pré-processa a imagem para melhorar o reconhecimento OCR usando múltiplas técnicas.
        
        Args:
            image: Imagem de entrada (BGR ou grayscale)
            method: Método de pré-processamento ('adaptive', 'otsu', 'morphology', 'all')
        
        Returns:
            Lista de imagens pré-processadas para tentativas múltiplas de OCR
        """
        processed_images = []
        
        try:
            # Converter para escala de cinza se necessário
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Garantir tamanho mínimo para processamento eficaz (aumentado para melhor OCR)
            min_height, min_width = 50, 200
            if gray.shape[0] < min_height or gray.shape[1] < min_width:
                scale = max(min_height / gray.shape[0], min_width / gray.shape[1])
                new_width = int(gray.shape[1] * scale)
                new_height = int(gray.shape[0] * scale)
                gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            # Método 1: Binarização adaptativa (melhor para iluminação variável)
            if method in ('adaptive', 'all'):
                # Reduzir ruído com filtro bilateral
                denoised = cv2.bilateralFilter(gray, 9, 75, 75)
                
                # Equalização de histograma CLAHE (melhor que equalizeHist)
                # Aumentar clipLimit para melhor contraste
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
                equalized = clahe.apply(denoised)
                
                # Binarização adaptativa com diferentes parâmetros
                binary1 = cv2.adaptiveThreshold(
                    equalized, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                    cv2.THRESH_BINARY, 11, 2
                )
                processed_images.append(binary1)
                
                # Variação com parâmetros diferentes
                binary2 = cv2.adaptiveThreshold(
                    equalized, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                    cv2.THRESH_BINARY, 15, 3
                )
                processed_images.append(binary2)
            
            # Método 2: Otsu thresholding (melhor para imagens com histograma bimodal)
            if method in ('otsu', 'all'):
                blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                _, binary_otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                processed_images.append(binary_otsu)
            
            # Método 3: Morfologia avançada
            if method in ('morphology', 'all'):
                # Aplicar filtro de mediana para remover ruído
                median = cv2.medianBlur(gray, 3)
                
                # Equalização
                clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
                equalized = clahe.apply(median)
                
                # Binarização
                _, binary = cv2.threshold(equalized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                
                # Operações morfológicas para melhorar caracteres
                kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
                kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
                
                # Fechar buracos nos caracteres
                closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close)
                # Remover ruído pequeno
                opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open)
                
                processed_images.append(opened)
            
            # Se nenhum método funcionou, retornar pelo menos a imagem em escala de cinza processada
            if not processed_images:
                # Fallback: imagem em escala de cinza com contraste melhorado
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                enhanced = clahe.apply(gray)
                processed_images.append(enhanced)
            
            return processed_images
            
        except Exception as e:
            logger.error(f"Erro no pré-processamento: {e}")
            # Retornar imagem original em escala de cinza como fallback
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            return [gray]
    
    def detect_plates(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detecta regiões que podem conter placas veiculares
        """
        # Converter para escala de cinza
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.bilateralFilter(gray, 9, 75, 75)
        equalized = cv2.equalizeHist(blurred)
        edged = cv2.Canny(equalized, 50, 150)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
        
        plate_regions = []
        
        for contour in contours:
            # Aproximar contorno
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            
            # Se o contorno tem 4 vértices, pode ser uma placa
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = w / float(h)
                area = w * h
                rect_area = cv2.contourArea(approx)
                rect_fill = rect_area / float(area) if area > 0 else 0
                if 1.5 < aspect_ratio < 6.0 and w > 60 and h > 20 and rect_fill > 0.5:
                    plate_regions.append((x, y, w, h))
        
        return plate_regions

    def detect_plates_mser(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            mser = cv2.MSER_create(_delta=5, _min_area=200, _max_area=8000)
            regions, _ = mser.detectRegions(gray)
            boxes = []
            for p in regions:
                x, y, w, h = cv2.boundingRect(p.reshape(-1, 1, 2))
                ar = w / float(h)
                if 1.5 < ar < 6.5 and w > 50 and h > 18:
                    boxes.append((x, y, w, h))
            return boxes
        except Exception:
            return []

    def detect_plates_yolo(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        if not self.yolo_available:
            return []
        result = self.yolo.infer(image)
        if not result.get('success'):
            return []
        dets = result.get('detections', [])
        plates = []
        for d in dets:
            name = str(d.get('class_name', '')).lower()
            if name in ('license_plate', 'plate', 'placa'):
                bbox = d['bbox']
                plates.append((bbox['x'], bbox['y'], bbox['width'], bbox['height']))
        if plates:
            return plates
        car_like = []
        for d in dets:
            name = str(d.get('class_name', '')).lower()
            if name in ('car', 'truck', 'bus', 'motorcycle'):
                bbox = d['bbox']
                car_like.append((bbox['x'], bbox['y'], bbox['width'], bbox['height']))
        boxes = []
        for x, y, w, h in car_like:
            pad_x = int(w * 0.05)
            pad_y = int(h * 0.15)
            x0 = max(0, x + pad_x)
            y0 = max(0, y + h // 2)
            x1 = min(image.shape[1], x + w - pad_x)
            y1 = min(image.shape[0], y + h - pad_y)
            region = image[y0:y1, x0:x1]
            local = self.detect_plates(region)
            if not local:
                local = self.detect_plates_mser(region)
            for lx, ly, lw, lh in local:
                boxes.append((x0 + lx, y0 + ly, lw, lh))
        return self.merge_boxes(boxes, thr=0.3) if boxes else []

    def detect_plates_ultra(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        if not self.ultra_available:
            return []
        result = self.ultra.infer(image)
        if not result.get('success'):
            return []
        dets = result.get('detections', [])
        plates = []
        for d in dets:
            name = str(d.get('class_name', '')).lower()
            if name in ('license_plate', 'plate', 'placa'):
                bbox = d['bbox']
                plates.append((bbox['x'], bbox['y'], bbox['width'], bbox['height']))
        return self.merge_boxes(plates, thr=0.3) if plates else []

    def detect_plates_roboflow(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        if not self.rf_available:
            return []
        dets = self.rf.infer_image(image)
        plates = []
        for d in dets:
            name = str(d.get('class', '')).lower()
            if name in ('license_plate', 'plate', 'placa'):
                b = d['bbox']
                plates.append((b['x'], b['y'], b['width'], b['height']))
        return self.merge_boxes(plates, thr=0.3) if plates else []

    def iou(self, a: Tuple[int, int, int, int], b: Tuple[int, int, int, int]) -> float:
        ax, ay, aw, ah = a
        bx, by, bw, bh = b
        x1 = max(ax, bx)
        y1 = max(ay, by)
        x2 = min(ax + aw, bx + bw)
        y2 = min(ay + ah, by + bh)
        iw = max(0, x2 - x1)
        ih = max(0, y2 - y1)
        inter = iw * ih
        uni = aw * ah + bw * bh - inter
        return inter / uni if uni > 0 else 0.0

    def merge_boxes(self, boxes: List[Tuple[int, int, int, int]], thr: float = 0.3) -> List[Tuple[int, int, int, int]]:
        merged = []
        for box in boxes:
            keep = True
            for i, mb in enumerate(merged):
                if self.iou(box, mb) > thr:
                    x = min(box[0], mb[0])
                    y = min(box[1], mb[1])
                    r = max(box[0] + box[2], mb[0] + mb[2])
                    b = max(box[1] + box[3], mb[1] + mb[3])
                    merged[i] = (x, y, r - x, b - y)
                    keep = False
                    break
            if keep:
                merged.append(box)
        return merged
    
    def extract_plate_text(self, plate_region: np.ndarray) -> Optional[str]:
        """
        Extrai texto da região da placa usando OCR otimizado com múltiplas estratégias.
        
        Args:
            plate_region: Região da imagem contendo a placa
        
        Returns:
            Texto da placa reconhecido e validado, ou None se não encontrado
        """
        if plate_region is None or plate_region.size == 0:
            logger.warning("Região da placa vazia ou inválida")
            return None
        
        try:
            # Redimensionar para melhorar qualidade do OCR (mínimo recomendado: 300 DPI)
            h, w = plate_region.shape[:2]
            # Aumentar tamanho mínimo para melhor qualidade de OCR
            min_height = 100  # Aumentado de 60 para 100
            min_width = 300  # Largura mínima para placas
            
            scale_h = max(1.0, min_height / h) if h > 0 else 1.0
            scale_w = max(1.0, min_width / w) if w > 0 else 1.0
            scale_factor = max(scale_h, scale_w)
            
            # Limitar escala máxima para evitar imagens muito grandes
            scale_factor = min(scale_factor, 4.0)
            
            if scale_factor > 1.0:
                new_width = int(w * scale_factor)
                new_height = int(h * scale_factor)
                region = cv2.resize(
                    plate_region, 
                    (new_width, new_height), 
                    interpolation=cv2.INTER_CUBIC
                )
            else:
                region = plate_region.copy()
            
            # Obter múltiplas versões pré-processadas
            processed_images = self.preprocess_image(region, method='all')
            
            # Configurações PSM (Page Segmentation Mode) para OCR
            # PSM 7: Tratar imagem como uma única linha de texto
            # PSM 8: Tratar imagem como uma única palavra
            # PSM 11: Tratar imagem como texto esparso
            # PSM 13: Tratar imagem como linha bruta (sem OCR)
            psm_modes = [7, 8, 11, 6]  # Adicionado PSM 6 (bloco uniforme)
            
            # Whitelist de caracteres permitidos em placas brasileiras
            char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            
            best_result = None
            best_confidence = 0.0
            
            # Tentar múltiplas combinações de pré-processamento e PSM
            for processed_img in processed_images:
                for psm in psm_modes:
                    try:
                        # Configuração do Tesseract
                        custom_config = (
                            f'--oem 3 '  # Engine mode 3: padrão
                            f'--psm {psm} '
                            f'-c tessedit_char_whitelist={char_whitelist}'
                        )
                        
                        # Extrair texto com confiança
                        ocr_data = pytesseract.image_to_data(
                            processed_img, 
                            config=custom_config,
                            output_type=pytesseract.Output.DICT
                        )
                        
                        # Processar resultados do OCR
                        texts = []
                        confidences = []
                        
                        for i in range(len(ocr_data['text'])):
                            text = ocr_data['text'][i].strip()
                            conf = int(ocr_data['conf'][i]) if ocr_data['conf'][i] != -1 else 0
                            
                            if text and conf > 0:
                                texts.append(text)
                                confidences.append(conf)
                        
                        # Combinar textos reconhecidos
                        combined_text = ' '.join(texts).strip()
                        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                        
                        # Limpar e corrigir texto
                        cleaned = self.clean_plate_text(combined_text)
                        
                        # Tentar correções se necessário
                        if cleaned and not self.validate_plate_format(cleaned):
                            corrected = self.correct_ocr_errors(cleaned)
                            if corrected and self.validate_plate_format(corrected):
                                cleaned = corrected
                        
                        # Validar formato
                        if cleaned and self.validate_plate_format(cleaned):
                            # Se encontrou resultado válido, verificar se é melhor que o anterior
                            if avg_confidence > best_confidence:
                                best_result = cleaned
                                best_confidence = avg_confidence
                        
                    except Exception as e:
                        logger.debug(f"Erro ao processar com PSM {psm}: {e}")
                        continue
            
            # Se encontrou resultado válido, retornar
            if best_result:
                logger.info(f"Placa reconhecida (Tesseract): {best_result} (confiança: {best_confidence:.1f}%)")
                return best_result
            
            # Tentar EasyOCR se disponível e Tesseract não funcionou
            if self.easyocr_available:
                logger.debug("Tentando EasyOCR como alternativa")
                easyocr_result = self._extract_text_easyocr(region)
                if easyocr_result:
                    logger.info(f"Placa reconhecida (EasyOCR): {easyocr_result}")
                    return easyocr_result
            
            # Última tentativa: usar método mais permissivo
            logger.debug("Tentando método alternativo de OCR")
            return self._extract_text_fallback(region)
            
        except Exception as e:
            logger.error(f"Erro ao extrair texto da placa: {e}", exc_info=True)
            return None
    
    def _extract_text_easyocr(self, region: np.ndarray) -> Optional[str]:
        """
        Extrai texto usando EasyOCR como alternativa ao Tesseract.
        
        Args:
            region: Região da imagem contendo a placa
        
        Returns:
            Texto da placa reconhecido e validado, ou None se não encontrado
        """
        if not self.easyocr_available or self.easyocr_reader is None:
            return None
        
        try:
            # EasyOCR espera imagem BGR (OpenCV padrão)
            if len(region.shape) == 2:
                # Converter grayscale para BGR
                region = cv2.cvtColor(region, cv2.COLOR_GRAY2BGR)
            
            # Processar com EasyOCR
            results = self.easyocr_reader.readtext(region)
            
            # Combinar todos os textos encontrados
            texts = []
            confidences = []
            
            for (bbox, text, conf) in results:
                # Filtrar apenas textos com confiança razoável
                if conf > 0.3:
                    texts.append(text.strip())
                    confidences.append(conf)
            
            if not texts:
                return None
            
            # Combinar textos
            combined_text = ' '.join(texts).strip()
            
            # Limpar texto
            cleaned = self.clean_plate_text(combined_text)
            
            # Tentar correções se necessário
            if cleaned and not self.validate_plate_format(cleaned):
                corrected = self.correct_ocr_errors(cleaned)
                if corrected and self.validate_plate_format(corrected):
                    cleaned = corrected
            
            # Validar formato
            if cleaned and self.validate_plate_format(cleaned):
                avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
                logger.debug(f"EasyOCR reconheceu: {cleaned} (confiança média: {avg_confidence:.2%})")
                return cleaned
            
            return None
            
        except Exception as e:
            logger.debug(f"Erro ao usar EasyOCR: {e}")
            return None
    
    def _extract_text_fallback(self, region: np.ndarray) -> Optional[str]:
        """
        Método alternativo de extração de texto quando métodos principais falham.
        """
        try:
            # Usar apenas escala de cinza com contraste
            if len(region.shape) == 3:
                gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
            else:
                gray = region.copy()
            
            # Aumentar contraste
            clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # Tentar OCR com configuração mais permissiva
            config = '--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            text = pytesseract.image_to_string(enhanced, config=config)
            cleaned = self.clean_plate_text(text)
            
            if cleaned and self.validate_plate_format(cleaned):
                return cleaned
            
            return None
        except Exception:
            return None
    
    def correct_ocr_errors(self, text: str) -> Optional[str]:
        """
        Corrige erros comuns de OCR baseado em padrões de placas brasileiras.
        
        Args:
            text: Texto reconhecido pelo OCR
        
        Returns:
            Texto corrigido ou None se não for possível corrigir
        """
        if not text or len(text) < 6:
            return None
        
        # Tentar correções posicionais baseadas no formato
        corrected = text.upper()
        
        # Para formato Mercosul (ABC1D23) ou antigo (ABC1234)
        if len(corrected) == 7:
            # Primeiros 3 caracteres devem ser letras
            for i in range(3):
                if corrected[i].isdigit():
                    # Tentar corrigir baseado em contexto
                    if corrected[i] in self.ocr_corrections:
                        corrected = corrected[:i] + self.ocr_corrections[corrected[i]] + corrected[i+1:]
            
            # Para Mercosul: posição 4 é dígito, posição 5 é letra
            if len(corrected) >= 5:
                # Se posição 4 (índice 3) é letra quando deveria ser dígito
                if corrected[3].isalpha() and corrected[3] in self.ocr_corrections:
                    corrected = corrected[:3] + self.ocr_corrections[corrected[3]] + corrected[4:]
                # Se posição 5 (índice 4) é dígito quando deveria ser letra (Mercosul)
                if corrected[4].isdigit() and corrected[4] in self.ocr_corrections:
                    corrected = corrected[:4] + self.ocr_corrections[corrected[4]] + corrected[5:]
        
        # Validar após correção
        if self.validate_plate_format(corrected):
            return corrected
        
        return None

    def detect_vehicle_color(self, image: np.ndarray, bbox: Optional[Dict] = None) -> Tuple[str, float]:
        """
        Detecta cor dominante do veículo usando espaço HSV.
        Se bbox fornecido, analisa região ao redor da placa com margem.
        Retorna (cor, confiança).
        """
        try:
            region = image
            if bbox:
                x = bbox.get('x', 0)
                y = bbox.get('y', 0)
                w = bbox.get('width', image.shape[1])
                h = bbox.get('height', image.shape[0])
                pad_w = int(w * 0.5)
                pad_h = int(h * 0.8)
                x0 = max(0, x - pad_w)
                y0 = max(0, y - pad_h)
                x1 = min(image.shape[1], x + w + pad_w)
                y1 = min(image.shape[0], y + h + pad_h)
                region = image[y0:y1, x0:x1]

            hsv = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
            # Máscaras de cores básicas em HSV
            masks = []
            color_defs = {
                'black': [(0, 0, 0), (180, 255, 50)],
                'white': [(0, 0, 200), (180, 40, 255)],
                'gray': [(0, 0, 50), (180, 40, 200)],
                'red': [((0, 50, 50), (10, 255, 255)), ((170, 50, 50), (180, 255, 255))],
                'yellow': [((20, 50, 50), (35, 255, 255))],
                'green': [((35, 50, 50), (85, 255, 255))],
                'blue': [((90, 50, 50), (130, 255, 255))],
                'orange': [((10, 50, 50), (20, 255, 255))],
                'brown': [((10, 50, 20), (20, 255, 150))],
                'purple': [((130, 50, 50), (160, 255, 255))]
            }

            totals = {}
            total_pixels = hsv.shape[0] * hsv.shape[1]
            for color, ranges in color_defs.items():
                if not isinstance(ranges, list):
                    ranges = [ranges]
                mask_total = 0
                for range_item in ranges:
                    # range_item pode ser uma tupla (lo, hi) ou uma lista de tuplas
                    if isinstance(range_item, (list, tuple)) and len(range_item) == 2:
                        lo, hi = range_item
                        # Verificar se lo e hi são tuplas (HSV)
                        if isinstance(lo, (list, tuple)) and isinstance(hi, (list, tuple)):
                            mask = cv2.inRange(hsv, np.array(lo), np.array(hi))
                            mask_total += int(mask.sum() // 255)
                totals[color] = mask_total

            # Escolher cor com maior proporção
            best_color = max(totals, key=totals.get) if totals else 'unknown'
            proportion = (totals.get(best_color, 0) / total_pixels) if total_pixels > 0 else 0.0
            confidence = float(min(1.0, max(0.0, proportion)))
            return best_color, confidence
        except Exception as e:
            logger.error(f"Erro ao detectar cor do veículo: {e}")
            return 'unknown', 0.0

    def detect_vehicle_color_global(self, image_path: str) -> Tuple[str, float]:
        """
        Estima cor dominante do veículo na imagem inteira.
        """
        try:
            image = cv2.imread(image_path)
            if image is None:
                return 'unknown', 0.0
            color, conf = self.detect_vehicle_color(image, None)
            return color, conf
        except Exception:
            return 'unknown', 0.0
    
    def clean_plate_text(self, text: str) -> str:
        """
        Limpa e formata o texto reconhecido removendo caracteres inválidos.
        
        Args:
            text: Texto bruto do OCR
        
        Returns:
            Texto limpo contendo apenas letras maiúsculas e números
        """
        if not text:
            return ""
        
        # Converter para maiúsculas
        text = text.upper().strip()
        
        # Remover caracteres especiais, espaços e manter apenas alfanuméricos
        cleaned = re.sub(r'[^A-Z0-9]', '', text)
        
        # Remover caracteres inválidos comuns em OCR
        # Substituir caracteres que não existem em placas brasileiras
        invalid_chars = ['@', '#', '$', '%', '&', '*', '(', ')', '[', ']', '{', '}', 
                        '|', '\\', '/', '<', '>', '?', '!', '.', ',', ';', ':', 
                        '"', "'", '`', '~', '^', '_', '-', '=', '+']
        for char in invalid_chars:
            cleaned = cleaned.replace(char, '')
        
        # Limitar tamanho (placas brasileiras têm 7 caracteres)
        if len(cleaned) > 7:
            # Tentar extrair sequência mais provável de 7 caracteres
            # Priorizar início da string
            cleaned = cleaned[:7]
        elif len(cleaned) < 6:
            # Se muito curto, pode ser ruído
            return ""
        
        return cleaned
    
    def validate_plate_format(self, text: str) -> bool:
        """
        Valida se o texto segue o formato de placa brasileira (Mercosul ou antigo).
        
        Formatos aceitos:
        - Mercosul: ABC1D23 (3 letras, 1 dígito, 1 letra, 2 dígitos)
        - Antigo: ABC1234 (3 letras, 4 dígitos)
        
        Args:
            text: Texto a ser validado
        
        Returns:
            True se o formato é válido, False caso contrário
        """
        if not text:
            return False
        
        # Remover espaços e hífens para validação
        cleaned = re.sub(r'[\s\-]', '', text.upper())
        
        # Verificar comprimento
        if len(cleaned) != 7:
            return False
        
        # Verificar se corresponde a algum padrão
        for pattern in self.plate_patterns:
            if pattern.match(cleaned):
                return True
        
        # Validação adicional: verificar estrutura manualmente
        # Primeiros 3 caracteres devem ser letras
        if not all(c.isalpha() for c in cleaned[:3]):
            return False
        
        # Verificar formato Mercosul: ABC1D23
        if (cleaned[3].isdigit() and 
            cleaned[4].isalpha() and 
            cleaned[5].isdigit() and 
            cleaned[6].isdigit()):
            return True
        
        # Verificar formato antigo: ABC1234
        if all(c.isdigit() for c in cleaned[3:]):
            return True
        
        return False
    
    def get_plate_type(self, text: str) -> Optional[str]:
        """
        Identifica o tipo de placa (Mercosul ou antigo).
        
        Args:
            text: Texto da placa validado
        
        Returns:
            'mercosul', 'antigo' ou None se inválido
        """
        if not self.validate_plate_format(text):
            return None
        
        cleaned = re.sub(r'[\s\-]', '', text.upper())
        
        # Mercosul: ABC1D23 (posição 4 é letra)
        if len(cleaned) == 7 and cleaned[4].isalpha():
            return 'mercosul'
        
        # Antigo: ABC1234 (últimos 4 são dígitos)
        if len(cleaned) == 7 and all(c.isdigit() for c in cleaned[3:]):
            return 'antigo'
        
        return None
    
    def recognize_from_image(self, image_path: str) -> List[Dict]:
        """
        Reconhece placas a partir de uma imagem com tratamento robusto de erros.
        
        Args:
            image_path: Caminho para o arquivo de imagem
        
        Returns:
            Lista de dicionários contendo informações sobre placas detectadas
        """
        if not image_path or not os.path.exists(image_path):
            logger.error(f"Arquivo de imagem não encontrado: {image_path}")
            return []
        
        try:
            # Carregar imagem
            image = cv2.imread(image_path)
            if image is None:
                logger.error(f"Não foi possível carregar a imagem: {image_path}")
                return []
            
            # Verificar dimensões mínimas
            if image.shape[0] < 50 or image.shape[1] < 50:
                logger.warning(f"Imagem muito pequena: {image.shape}")
                return []
            
            logger.info(f"Processando imagem: {image_path} ({image.shape[1]}x{image.shape[0]})")
            
            # Detectar placas usando múltiplos métodos (cascata de fallback)
            plate_regions = []
            
            try:
                # Método 1: Ultralytics (mais preciso se disponível)
                ultra_boxes = self.detect_plates_ultra(image)
                if ultra_boxes:
                    plate_regions = ultra_boxes
                    logger.debug(f"Detectadas {len(ultra_boxes)} placas via Ultralytics")
            except Exception as e:
                logger.debug(f"Erro na detecção Ultralytics: {e}")
            
            if not plate_regions:
                try:
                    # Método 2: Roboflow
                    rf_boxes = self.detect_plates_roboflow(image)
                    if rf_boxes:
                        plate_regions = rf_boxes
                        logger.debug(f"Detectadas {len(rf_boxes)} placas via Roboflow")
                except Exception as e:
                    logger.debug(f"Erro na detecção Roboflow: {e}")
            
            if not plate_regions:
                try:
                    # Método 3: YOLO
                    yolo_boxes = self.detect_plates_yolo(image)
                    if yolo_boxes:
                        plate_regions = yolo_boxes
                        logger.debug(f"Detectadas {len(yolo_boxes)} placas via YOLO")
                except Exception as e:
                    logger.debug(f"Erro na detecção YOLO: {e}")
            
            if not plate_regions:
                try:
                    # Método 4: Detecção tradicional por contornos
                    plate_regions = self.detect_plates(image)
                    logger.debug(f"Detectadas {len(plate_regions)} placas via contornos")
                except Exception as e:
                    logger.debug(f"Erro na detecção por contornos: {e}")
            
            # Método secundário: MSER (se nenhum método principal encontrou placas)
            if not plate_regions:
                try:
                    mser_boxes = self.detect_plates_mser(image)
                    if mser_boxes:
                        plate_regions = mser_boxes
                        logger.debug(f"Detectadas {len(mser_boxes)} placas via MSER")
                except Exception as e:
                    logger.debug(f"Erro na detecção MSER: {e}")
            
            # Mesclar regiões sobrepostas
            if plate_regions:
                plate_regions = self.merge_boxes(plate_regions, thr=0.3)
                logger.info(f"Total de {len(plate_regions)} região(ões) de placa(s) detectada(s)")
            
            results = []
            
            # Processar cada região detectada
            for i, (x, y, w, h) in enumerate(plate_regions):
                try:
                    # Validar dimensões da região
                    if w < 30 or h < 10:
                        logger.warning(f"Região {i} muito pequena: {w}x{h}, ignorando")
                        continue
                    
                    # Extrair região da placa com padding
                    pad_x = max(5, int(w * 0.08))
                    pad_y = max(5, int(h * 0.12))
                    x0 = max(0, x - pad_x)
                    y0 = max(0, y - pad_y)
                    x1 = min(image.shape[1], x + w + pad_x)
                    y1 = min(image.shape[0], y + h + pad_y)
                    
                    plate_region = image[y0:y1, x0:x1]
                    
                    if plate_region.size == 0:
                        logger.warning(f"Região {i} vazia após extração")
                        continue
                    
                    # Reconhecer texto da placa
                    plate_text = self.extract_plate_text(plate_region)
                    
                    # Detectar cor do veículo
                    bbox = {'x': x, 'y': y, 'width': w, 'height': h}
                    try:
                        color, color_conf = self.detect_vehicle_color(image, bbox)
                    except Exception as e:
                        logger.debug(f"Erro ao detectar cor do veículo: {e}")
                        color, color_conf = 'unknown', 0.0
                    
                    # Identificar tipo de placa
                    plate_type = None
                    if plate_text:
                        plate_type = self.get_plate_type(plate_text)
                    
                    # Calcular confiança baseada na validação
                    confidence = 0.9 if plate_text and self.validate_plate_format(plate_text) else 0.5
                    
                    result = {
                        'plate_number': plate_text,
                        'plate_type': plate_type,
                        'bbox': bbox,
                        'confidence': confidence,
                        'image_path': image_path,
                        'vehicle_color': color,
                        'vehicle_color_confidence': color_conf,
                        'vehicle_model': None,
                        'region_index': i
                    }
                    
                    results.append(result)
                    
                except Exception as e:
                    logger.error(f"Erro ao processar região {i}: {e}", exc_info=True)
                    continue
            
            logger.info(f"Processamento concluído: {len(results)} placa(s) reconhecida(s)")
            return results
            
        except Exception as e:
            logger.error(f"Erro no processamento da imagem {image_path}: {e}", exc_info=True)
            return []
    
    def recognize_from_video(self, video_path: str, frame_interval: int = 30) -> List[Dict]:
        """
        Reconhece placas a partir de um vídeo com tratamento robusto de erros.
        
        Args:
            video_path: Caminho para o arquivo de vídeo
            frame_interval: Intervalo entre frames a serem processados (padrão: 30)
        
        Returns:
            Lista de dicionários contendo informações sobre placas detectadas
        """
        if not video_path or not os.path.exists(video_path):
            logger.error(f"Arquivo de vídeo não encontrado: {video_path}")
            return []
        
        cap = None
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                logger.error(f"Não foi possível abrir o vídeo: {video_path}")
                return []
            
            # Obter informações do vídeo
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            logger.info(f"Processando vídeo: {video_path} ({width}x{height}, {fps:.2f} FPS, {total_frames} frames)")
            
            results = []
            frame_count = 0
            processed_frames = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Processar apenas a cada N frames para melhor performance
                if frame_count % frame_interval == 0:
                    try:
                        # Usar o mesmo método de detecção da imagem
                        plate_regions = []
                        
                        # Tentar métodos de detecção em cascata
                        try:
                            ultra_boxes = self.detect_plates_ultra(frame)
                            if ultra_boxes:
                                plate_regions = ultra_boxes
                        except Exception:
                            pass
                        
                        if not plate_regions:
                            try:
                                rf_boxes = self.detect_plates_roboflow(frame)
                                if rf_boxes:
                                    plate_regions = rf_boxes
                            except Exception:
                                pass
                        
                        if not plate_regions:
                            try:
                                yolo_boxes = self.detect_plates_yolo(frame)
                                if yolo_boxes:
                                    plate_regions = yolo_boxes
                            except Exception:
                                pass
                        
                        if not plate_regions:
                            plate_regions = self.detect_plates(frame)
                        
                        # Mesclar regiões sobrepostas
                        if plate_regions:
                            plate_regions = self.merge_boxes(plate_regions, thr=0.3)
                        
                        # Processar cada região detectada
                        for x, y, w, h in plate_regions:
                            try:
                                # Validar dimensões
                                if w < 30 or h < 10:
                                    continue
                                
                                # Extrair região com padding
                                pad_x = max(5, int(w * 0.08))
                                pad_y = max(5, int(h * 0.12))
                                x0 = max(0, x - pad_x)
                                y0 = max(0, y - pad_y)
                                x1 = min(frame.shape[1], x + w + pad_x)
                                y1 = min(frame.shape[0], y + h + pad_y)
                                
                                plate_region = frame[y0:y1, x0:x1]
                                
                                if plate_region.size == 0:
                                    continue
                                
                                # Reconhecer texto
                                plate_text = self.extract_plate_text(plate_region)
                                
                                # Detectar cor
                                bbox = {'x': x, 'y': y, 'width': w, 'height': h}
                                try:
                                    color, color_conf = self.detect_vehicle_color(frame, bbox)
                                except Exception:
                                    color, color_conf = 'unknown', 0.0
                                
                                # Identificar tipo
                                plate_type = None
                                if plate_text:
                                    plate_type = self.get_plate_type(plate_text)
                                
                                # Calcular confiança
                                confidence = 0.9 if plate_text and self.validate_plate_format(plate_text) else 0.5
                                
                                result = {
                                    'plate_number': plate_text,
                                    'plate_type': plate_type,
                                    'bbox': bbox,
                                    'confidence': confidence,
                                    'video_path': video_path,
                                    'frame_number': frame_count,
                                    'timestamp': frame_count / fps if fps > 0 else 0.0,
                                    'vehicle_color': color,
                                    'vehicle_color_confidence': color_conf,
                                    'vehicle_model': None
                                }
                                
                                results.append(result)
                                
                            except Exception as e:
                                logger.debug(f"Erro ao processar região no frame {frame_count}: {e}")
                                continue
                        
                        processed_frames += 1
                        
                    except Exception as e:
                        logger.debug(f"Erro ao processar frame {frame_count}: {e}")
                        continue
                
                frame_count += 1
                
                # Log de progresso a cada 1000 frames
                if frame_count % 1000 == 0:
                    logger.info(f"Processados {frame_count}/{total_frames} frames ({processed_frames} analisados)")
            
            logger.info(f"Processamento de vídeo concluído: {len(results)} detecção(ões) em {processed_frames} frames")
            return results
            
        except Exception as e:
            logger.error(f"Erro no processamento do vídeo {video_path}: {e}", exc_info=True)
            return []
        finally:
            if cap is not None:
                cap.release()
    
    def find_repeated_vehicles(self, recognition_results: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Identifica veículos que se repetem nos resultados
        """
        vehicle_counts = {}
        
        for result in recognition_results:
            plate = result['plate_number']
            
            if plate not in vehicle_counts:
                vehicle_counts[plate] = []
            
            vehicle_counts[plate].append(result)
        
        # Filtrar apenas veículos que aparecem mais de uma vez
        repeated_vehicles = {
            plate: occurrences 
            for plate, occurrences in vehicle_counts.items() 
            if len(occurrences) > 1
        }
        
        return repeated_vehicles

# Função principal para uso externo
def process_media_file(file_path: str, is_video: bool = False) -> Dict:
    """
    Processa um arquivo de mídia e retorna resultados do reconhecimento
    """
    recognizer = LicensePlateRecognizer()
    
    if is_video:
        results = recognizer.recognize_from_video(file_path)
    else:
        results = recognizer.recognize_from_image(file_path)
    
    repeated_vehicles = recognizer.find_repeated_vehicles(results)
    
    overall_color, overall_color_conf = recognizer.detect_vehicle_color_global(file_path) if not is_video else ('unknown', 0.0)

    return {
        'total_detections': len(results),
        'unique_vehicles': len(set(r['plate_number'] for r in results)),
        'repeated_vehicles': repeated_vehicles,
        'all_detections': results,
        'detected_plates': results,
        'file_path': file_path,
        'overall_vehicle_color': overall_color,
        'overall_vehicle_color_confidence': overall_color_conf
    }

if __name__ == "__main__":
    # Exemplo de uso
    recognizer = LicensePlateRecognizer()
    
    # Processar imagem de exemplo
    image_result = recognizer.recognize_from_image("exemplo_placa.jpg")
    print(f"Resultados imagem: {image_result}")
    
    # Encontrar veículos repetidos
    repeated = recognizer.find_repeated_vehicles(image_result)
    print(f"Veículos repetidos: {repeated}")