"""
Testes unitários para o sistema de reconhecimento de placas veiculares.

Este módulo contém testes para validar:
- Pré-processamento de imagens
- Extração de texto via OCR
- Validação de formatos de placas brasileiras
- Correção de erros de OCR
- Detecção de placas em imagens
"""

import unittest
import numpy as np
import cv2
import os
import sys
from pathlib import Path

# Adicionar diretório pai ao path para importar módulos
sys.path.insert(0, str(Path(__file__).parent))

from license_plate_recognition import LicensePlateRecognizer


class TestLicensePlateRecognition(unittest.TestCase):
    """Classe de testes para o reconhecedor de placas."""
    
    @classmethod
    def setUpClass(cls):
        """Configuração inicial para todos os testes."""
        cls.recognizer = LicensePlateRecognizer()
        cls.test_images_dir = Path(__file__).parent / "test_images"
        cls.test_images_dir.mkdir(exist_ok=True)
    
    def setUp(self):
        """Configuração antes de cada teste."""
        pass
    
    def test_preprocess_image(self):
        """Testa o pré-processamento de imagens."""
        # Criar imagem de teste
        test_image = np.random.randint(0, 255, (100, 300, 3), dtype=np.uint8)
        
        # Testar pré-processamento
        processed = self.recognizer.preprocess_image(test_image, method='all')
        
        # Verificar que retorna lista de imagens
        self.assertIsInstance(processed, list)
        self.assertGreater(len(processed), 0)
        
        # Verificar que todas as imagens são numpy arrays
        for img in processed:
            self.assertIsInstance(img, np.ndarray)
            self.assertEqual(len(img.shape), 2)  # Deve ser grayscale
    
    def test_clean_plate_text(self):
        """Testa a limpeza de texto de placas."""
        # Teste 1: Texto normal
        text = "ABC1234"
        cleaned = self.recognizer.clean_plate_text(text)
        self.assertEqual(cleaned, "ABC1234")
        
        # Teste 2: Texto com espaços
        text = "ABC 1234"
        cleaned = self.recognizer.clean_plate_text(text)
        self.assertEqual(cleaned, "ABC1234")
        
        # Teste 3: Texto com caracteres especiais
        text = "ABC-1234"
        cleaned = self.recognizer.clean_plate_text(text)
        self.assertEqual(cleaned, "ABC1234")
        
        # Teste 4: Texto em minúsculas
        text = "abc1234"
        cleaned = self.recognizer.clean_plate_text(text)
        self.assertEqual(cleaned, "ABC1234")
        
        # Teste 5: Texto muito longo
        text = "ABC123456789"
        cleaned = self.recognizer.clean_plate_text(text)
        self.assertEqual(len(cleaned), 7)
        
        # Teste 6: Texto vazio
        text = ""
        cleaned = self.recognizer.clean_plate_text(text)
        self.assertEqual(cleaned, "")
    
    def test_validate_plate_format_mercosul(self):
        """Testa validação de placas Mercosul."""
        # Placas Mercosul válidas
        valid_mercosul = [
            "ABC1D23",
            "XYZ9A45",
            "DEF2B78",
            "GHI5C90"
        ]
        
        for plate in valid_mercosul:
            with self.subTest(plate=plate):
                self.assertTrue(
                    self.recognizer.validate_plate_format(plate),
                    f"Placa Mercosul {plate} deveria ser válida"
                )
    
    def test_validate_plate_format_antigo(self):
        """Testa validação de placas antigas."""
        # Placas antigas válidas
        valid_antigo = [
            "ABC1234",
            "XYZ9876",
            "DEF5678",
            "GHI9012"
        ]
        
        for plate in valid_antigo:
            with self.subTest(plate=plate):
                self.assertTrue(
                    self.recognizer.validate_plate_format(plate),
                    f"Placa antiga {plate} deveria ser válida"
                )
    
    def test_validate_plate_format_invalid(self):
        """Testa validação de placas inválidas."""
        # Placas inválidas
        invalid_plates = [
            "ABC123",      # Muito curta
            "ABC12345",    # Muito longa
            "123ABC4",     # Formato errado
            "ABC1D2",      # Muito curta
            "ABCD1234",    # 4 letras
            "ABC12D34",    # Formato errado
            "",            # Vazia
            "ABC",         # Muito curta
        ]
        
        for plate in invalid_plates:
            with self.subTest(plate=plate):
                self.assertFalse(
                    self.recognizer.validate_plate_format(plate),
                    f"Placa {plate} deveria ser inválida"
                )
    
    def test_get_plate_type(self):
        """Testa identificação do tipo de placa."""
        # Teste Mercosul
        mercosul_plate = "ABC1D23"
        plate_type = self.recognizer.get_plate_type(mercosul_plate)
        self.assertEqual(plate_type, "mercosul")
        
        # Teste antigo
        antigo_plate = "ABC1234"
        plate_type = self.recognizer.get_plate_type(antigo_plate)
        self.assertEqual(plate_type, "antigo")
        
        # Teste inválido
        invalid_plate = "ABC123"
        plate_type = self.recognizer.get_plate_type(invalid_plate)
        self.assertIsNone(plate_type)
    
    def test_correct_ocr_errors(self):
        """Testa correção de erros comuns de OCR."""
        # Nota: Este teste pode não funcionar perfeitamente sem contexto real
        # mas valida que a função existe e retorna algo válido ou None
        
        # Teste com texto válido (não deve alterar)
        valid_text = "ABC1D23"
        corrected = self.recognizer.correct_ocr_errors(valid_text)
        self.assertIsNotNone(corrected)
        
        # Teste com texto muito curto
        short_text = "ABC"
        corrected = self.recognizer.correct_ocr_errors(short_text)
        self.assertIsNone(corrected)
    
    def test_detect_plates(self):
        """Testa detecção de placas em imagem."""
        # Criar imagem de teste simples
        test_image = np.zeros((200, 400, 3), dtype=np.uint8)
        
        # Adicionar retângulo simulando placa
        cv2.rectangle(test_image, (50, 80), (250, 120), (255, 255, 255), -1)
        
        # Detectar placas
        plates = self.recognizer.detect_plates(test_image)
        
        # Verificar que retorna lista
        self.assertIsInstance(plates, list)
    
    def test_merge_boxes(self):
        """Testa mesclagem de caixas sobrepostas."""
        # Caixas sobrepostas
        boxes = [
            (10, 10, 100, 30),
            (50, 15, 100, 30),  # Sobreposta com a primeira
            (200, 200, 100, 30)  # Não sobreposta
        ]
        
        merged = self.recognizer.merge_boxes(boxes, thr=0.3)
        
        # Deve ter menos ou igual número de caixas
        self.assertLessEqual(len(merged), len(boxes))
        self.assertIsInstance(merged, list)
    
    def test_iou(self):
        """Testa cálculo de Intersection over Union."""
        # Caixas idênticas
        box1 = (10, 10, 100, 50)
        box2 = (10, 10, 100, 50)
        iou = self.recognizer.iou(box1, box2)
        self.assertAlmostEqual(iou, 1.0, places=2)
        
        # Caixas não sobrepostas
        box3 = (200, 200, 100, 50)
        iou = self.recognizer.iou(box1, box3)
        self.assertEqual(iou, 0.0)
        
        # Caixas parcialmente sobrepostas
        box4 = (50, 10, 100, 50)
        iou = self.recognizer.iou(box1, box4)
        self.assertGreater(iou, 0.0)
        self.assertLess(iou, 1.0)
    
    def test_recognize_from_image_invalid_path(self):
        """Testa reconhecimento com caminho inválido."""
        invalid_path = "arquivo_inexistente_12345.jpg"
        results = self.recognizer.recognize_from_image(invalid_path)
        self.assertEqual(results, [])
    
    def test_recognize_from_image_empty_image(self):
        """Testa reconhecimento com imagem vazia."""
        # Criar imagem de teste muito pequena
        test_image_path = self.test_images_dir / "test_empty.jpg"
        empty_image = np.zeros((10, 10, 3), dtype=np.uint8)
        cv2.imwrite(str(test_image_path), empty_image)
        
        try:
            results = self.recognizer.recognize_from_image(str(test_image_path))
            # Deve retornar lista vazia ou lista com resultados vazios
            self.assertIsInstance(results, list)
        finally:
            # Limpar arquivo de teste
            if test_image_path.exists():
                test_image_path.unlink()
    
    def test_find_repeated_vehicles(self):
        """Testa identificação de veículos repetidos."""
        # Criar resultados de teste
        results = [
            {'plate_number': 'ABC1234', 'bbox': {'x': 10, 'y': 10, 'width': 100, 'height': 30}},
            {'plate_number': 'ABC1234', 'bbox': {'x': 20, 'y': 20, 'width': 100, 'height': 30}},
            {'plate_number': 'XYZ9876', 'bbox': {'x': 200, 'y': 200, 'width': 100, 'height': 30}},
        ]
        
        repeated = self.recognizer.find_repeated_vehicles(results)
        
        # ABC1234 aparece 2 vezes, deve estar nos repetidos
        self.assertIn('ABC1234', repeated)
        self.assertEqual(len(repeated['ABC1234']), 2)
        
        # XYZ9876 aparece 1 vez, não deve estar nos repetidos
        self.assertNotIn('XYZ9876', repeated)
    
    def test_recognize_from_video_invalid_path(self):
        """Testa reconhecimento de vídeo com caminho inválido."""
        invalid_path = "video_inexistente_12345.mp4"
        results = self.recognizer.recognize_from_video(invalid_path)
        self.assertEqual(results, [])


class TestPlateFormatValidation(unittest.TestCase):
    """Testes específicos para validação de formatos de placas."""
    
    @classmethod
    def setUpClass(cls):
        """Configuração inicial."""
        cls.recognizer = LicensePlateRecognizer()
    
    def test_mercosul_with_spaces(self):
        """Testa placas Mercosul com espaços."""
        plates = [
            "ABC 1D 23",
            "ABC 1 D 23",
            "ABC1D23"
        ]
        
        for plate in plates:
            with self.subTest(plate=plate):
                self.assertTrue(
                    self.recognizer.validate_plate_format(plate),
                    f"Placa {plate} deveria ser válida"
                )
    
    def test_antigo_with_spaces(self):
        """Testa placas antigas com espaços."""
        plates = [
            "ABC 1234",
            "ABC1234"
        ]
        
        for plate in plates:
            with self.subTest(plate=plate):
                self.assertTrue(
                    self.recognizer.validate_plate_format(plate),
                    f"Placa {plate} deveria ser válida"
                )
    
    def test_mercosul_with_hyphen(self):
        """Testa placas Mercosul com hífen."""
        plates = [
            "ABC-1D23",
            "ABC1D23"
        ]
        
        for plate in plates:
            with self.subTest(plate=plate):
                self.assertTrue(
                    self.recognizer.validate_plate_format(plate),
                    f"Placa {plate} deveria ser válida"
                )


def create_test_image_with_plate(plate_text: str, output_path: str):
    """
    Cria uma imagem de teste com texto de placa simulado.
    
    Args:
        plate_text: Texto da placa
        output_path: Caminho para salvar a imagem
    """
    # Criar imagem branca
    img = np.ones((100, 300, 3), dtype=np.uint8) * 255
    
    # Adicionar retângulo preto simulando placa
    cv2.rectangle(img, (20, 30), (280, 70), (0, 0, 0), -1)
    
    # Adicionar texto branco
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 1.5
    thickness = 2
    text_size = cv2.getTextSize(plate_text, font, font_scale, thickness)[0]
    text_x = (300 - text_size[0]) // 2
    text_y = 60
    cv2.putText(img, plate_text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)
    
    cv2.imwrite(output_path, img)


if __name__ == '__main__':
    # Criar diretório de imagens de teste se não existir
    test_dir = Path(__file__).parent / "test_images"
    test_dir.mkdir(exist_ok=True)
    
    # Executar testes
    unittest.main(verbosity=2)

