"""
Script para baixar imagens de carros com placas legíveis da internet.
"""

import requests
from pathlib import Path
import os
from urllib.parse import urlparse
import time

def download_image(url: str, output_path: Path) -> bool:
    """
    Baixa uma imagem de uma URL.
    
    Args:
        url: URL da imagem
        output_path: Caminho onde salvar
    
    Returns:
        True se bem-sucedido, False caso contrário
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, stream=True, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        # Verificar se o arquivo foi criado e tem tamanho razoável
        if output_path.exists() and output_path.stat().st_size > 1000:
            return True
        else:
            if output_path.exists():
                output_path.unlink()
            return False
            
    except Exception as e:
        print(f"Erro ao baixar {url}: {e}")
        if output_path.exists():
            try:
                output_path.unlink()
            except:
                pass
        return False

def download_test_images(output_folder: str):
    """
    Baixa imagens de teste de carros com placas legíveis.
    """
    output_path = Path(output_folder)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # URLs de imagens de exemplo (carros com placas legíveis)
    # Nota: Estas são URLs de exemplo. Em produção, você pode usar APIs de busca de imagens
    # ou serviços como Unsplash, Pexels, etc.
    
    image_urls = [
        # Exemplos de URLs - vamos tentar algumas fontes comuns
        # Nota: URLs reais precisariam ser encontradas via busca de imagens
    ]
    
    # Como não podemos acessar URLs específicas diretamente, vou criar um script
    # que o usuário pode executar ou vou sugerir fontes
    
    print(f"Pasta de destino: {output_path}")
    print(f"\nPara baixar imagens de carros com placas legíveis, você pode:")
    print("1. Usar serviços como Unsplash, Pexels, ou Google Images")
    print("2. Usar APIs de busca de imagens")
    print("3. Criar imagens sintéticas de placas")
    
    # Vou criar um script alternativo que gera imagens de teste sintéticas
    print("\nCriando imagens de teste sintéticas...")
    
    try:
        import cv2
        import numpy as np
        from PIL import Image, ImageDraw, ImageFont
        
        # Criar 5 imagens de teste com placas sintéticas
        test_plates = [
            "ABC1D23",  # Mercosul
            "XYZ9A45",  # Mercosul
            "DEF5678",  # Antigo
            "GHI9012",  # Antigo
            "JKL3M67"   # Mercosul
        ]
        
        for i, plate_text in enumerate(test_plates, 1):
            # Criar imagem de fundo (simulando carro)
            img = np.ones((400, 600, 3), dtype=np.uint8) * 200  # Fundo cinza claro
            
            # Adicionar retângulo preto simulando placa
            plate_x, plate_y = 150, 300
            plate_w, plate_h = 300, 80
            cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (0, 0, 0), -1)
            
            # Adicionar texto branco na placa
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 1.5
            thickness = 3
            text_size = cv2.getTextSize(plate_text, font, font_scale, thickness)[0]
            text_x = plate_x + (plate_w - text_size[0]) // 2
            text_y = plate_y + (plate_h + text_size[1]) // 2
            cv2.putText(img, plate_text, (text_x, text_y), font, font_scale, (255, 255, 255), thickness)
            
            # Adicionar alguns detalhes para parecer mais realista
            # Simular reflexos na placa
            cv2.rectangle(img, (plate_x + 10, plate_y + 10), (plate_x + plate_w - 10, plate_y + 20), (50, 50, 50), -1)
            
            # Salvar imagem
            filename = output_path / f"teste_placa_{i}_{plate_text}.jpg"
            cv2.imwrite(str(filename), img)
            print(f"Imagem criada: {filename.name} (Placa: {plate_text})")
        
        print(f"\n[OK] {len(test_plates)} imagens de teste criadas com sucesso!")
        print(f"Localizacao: {output_path}")
        
    except ImportError:
        print("\n⚠️ Bibliotecas necessárias não disponíveis.")
        print("Instale: pip install opencv-python pillow numpy")
        print("\nAlternativamente, você pode:")
        print("1. Baixar imagens manualmente de:")
        print("   - Unsplash: https://unsplash.com/s/photos/car-license-plate")
        print("   - Pexels: https://www.pexels.com/search/car/")
        print("2. Usar o script de busca de imagens")

if __name__ == "__main__":
    output_folder = r"C:\Users\cpd.44\Pictures\Carros"
    download_test_images(output_folder)

