#!/usr/bin/env python3
"""
Script de inicialização do servidor FastAPI para o processador AI
Este script inicia o servidor na porta 8000
"""

import os
import sys
import subprocess
from pathlib import Path

def check_dependencies():
    """Verifica se todas as dependências estão instaladas"""
    try:
        import fastapi
        import uvicorn
        import cv2
        import pytesseract
        print("✓ Todas as dependências estão instaladas")
        return True
    except ImportError as e:
        print(f"✗ Dependência faltando: {e}")
        print("Instale as dependências com: pip install -r requirements.txt")
        return False

def start_server():
    """Inicia o servidor FastAPI"""
    print("🚀 Iniciando servidor FastAPI do processador AI...")
    print("📡 Endpoint: http://localhost:8000")
    print("📋 Documentação: http://localhost:8000/docs")
    print("⏹️  Pressione Ctrl+C para parar o servidor\n")
    
    try:
        # Executar o servidor
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ], check=True)
    except subprocess.CalledProcessError:
        print("\n❌ Erro ao iniciar o servidor")
        return False
    except KeyboardInterrupt:
        print("\n👋 Servidor parado pelo usuário")
        return True
    
    return True

def main():
    """Função principal"""
    print("=" * 60)
    print("🤖 PROCESSADOR AI - RECONHECIMENTO DE PLACAS VEICULARES")
    print("=" * 60)
    
    # Verificar dependências
    if not check_dependencies():
        sys.exit(1)
    
    # Iniciar servidor
    success = start_server()
    
    if not success:
        print("\n💡 Dica: Verifique se a porta 8000 não está em uso")
        print("   Você pode matar processos na porta com: netstat -ano | findstr :8000")
        sys.exit(1)

if __name__ == "__main__":
    main()