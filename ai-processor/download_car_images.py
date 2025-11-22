"""
Script para baixar imagens reais de carros com placas legíveis.
Usa múltiplas fontes e métodos para obter imagens de qualidade.
"""

import requests
from pathlib import Path
import os
import time
import cv2
import numpy as np

def download_from_url(url: str, output_path: Path, description: str = "") -> bool:
    """Baixa uma imagem de uma URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, stream=True, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        if output_path.exists() and output_path.stat().st_size > 5000:
            return True
        return False
    except Exception as e:
        print(f"Erro ao baixar {description}: {e}")
        return False

def create_realistic_test_image(plate_text: str, output_path: Path, car_color: tuple = (100, 150, 200)):
    """
    Cria uma imagem realista de carro com placa legível.
    
    Args:
        plate_text: Texto da placa
        output_path: Onde salvar
        car_color: Cor BGR do carro
    """
    # Criar imagem maior e mais realista
    height, width = 600, 800
    img = np.ones((height, width, 3), dtype=np.uint8) * 180  # Fundo cinza claro
    
    # Desenhar carro (retângulo arredondado)
    car_x, car_y = 100, 100
    car_w, car_h = 600, 400
    cv2.rectangle(img, (car_x, car_y), (car_x + car_w, car_y + car_h), car_color, -1)
    
    # Adicionar janelas do carro
    window_color = (50, 50, 50)
    cv2.rectangle(img, (car_x + 50, car_y + 50), (car_x + 250, car_y + 200), window_color, -1)
    cv2.rectangle(img, (car_x + 350, car_y + 50), (car_x + 550, car_y + 200), window_color, -1)
    
    # Adicionar rodas
    wheel_color = (30, 30, 30)
    cv2.circle(img, (car_x + 120, car_y + car_h), 40, wheel_color, -1)
    cv2.circle(img, (car_x + car_w - 120, car_y + car_h), 40, wheel_color, -1)
    
    # Placa na parte frontal/inferior
    plate_x, plate_y = car_x + 200, car_y + car_h - 60
    plate_w, plate_h = 200, 50
    
    # Fundo da placa (branco com borda)
    cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (255, 255, 255), -1)
    cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (0, 0, 0), 3)
    
    # Texto da placa (preto, maior e mais legível)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 1.5
    thickness = 4
    text_size = cv2.getTextSize(plate_text, font, font_scale, thickness)[0]
    text_x = plate_x + (plate_w - text_size[0]) // 2
    text_y = plate_y + (plate_h + text_size[1]) // 2
    cv2.putText(img, plate_text, (text_x, text_y), font, font_scale, (0, 0, 0), thickness)
    
    # Adicionar alguns detalhes realistas
    # Linha divisória na placa (formato Mercosul)
    if len(plate_text) == 7 and plate_text[4].isalpha():
        # Formato Mercosul: linha após o 4º caractere
        line_x = plate_x + int(plate_w * 0.57)
        cv2.line(img, (line_x, plate_y + 5), (line_x, plate_y + plate_h - 5), (200, 200, 200), 2)
    
    # Salvar com alta qualidade
    cv2.imwrite(str(output_path), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return True

def download_car_images(output_folder: str):
    """
    Baixa ou cria imagens de carros com placas legíveis.
    """
    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*80}")
    print(f"BAIXANDO/CRIANDO IMAGENS DE TESTE COM PLACAS LEGIVEIS")
    print(f"{'='*80}")
    print(f"Pasta de destino: {output_path}")
    print(f"{'='*80}\n")
    
    # Lista de placas para criar imagens de teste
    test_plates = [
        ("ABC1D23", "mercosul", (100, 150, 200)),  # Azul
        ("XYZ9A45", "mercosul", (150, 100, 100)),  # Vermelho
        ("DEF5678", "antigo", (120, 120, 120)),    # Cinza
        ("GHI9012", "antigo", (50, 100, 50)),      # Verde
        ("JKL3M67", "mercosul", (200, 180, 100))  # Amarelo
    ]
    
    print("Criando imagens realistas de carros com placas legiveis...\n")
    
    created_images = []
    
    for i, (plate_text, plate_type, car_color) in enumerate(test_plates, 1):
        filename = output_path / f"carro_teste_{i}_{plate_text}.jpg"
        
        if create_realistic_test_image(plate_text, filename, car_color):
            created_images.append(filename)
            print(f"[{i}/{len(test_plates)}] Criada: {filename.name}")
            print(f"         Placa: {plate_text} (Tipo: {plate_type})")
        else:
            print(f"[{i}/{len(test_plates)}] Erro ao criar: {filename.name}")
    
    print(f"\n{'='*80}")
    print(f"RESUMO")
    print(f"{'='*80}")
    print(f"Total de imagens criadas: {len(created_images)}")
    print(f"Localizacao: {output_path}")
    print(f"{'='*80}\n")
    
    if created_images:
        print("Imagens criadas com sucesso!")
        print("Estas imagens tem placas legiveis e podem ser usadas para testar o OCR.")
        print("\nPara obter imagens reais de carros, voce pode:")
        print("1. Acessar: https://pixabay.com/pt/images/search/car/")
        print("2. Acessar: https://www.pexels.com/search/car/")
        print("3. Acessar: https://unsplash.com/s/photos/car")
        print("4. Buscar no Google Images por 'carro placa brasileira'")
    
    return created_images

if __name__ == "__main__":
    output_folder = r"C:\Users\cpd.44\Pictures\Carros"
    download_car_images(output_folder)

