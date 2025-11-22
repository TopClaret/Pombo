import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { UploadCloud, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadAPI } from '../services/api';

const UploadContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
`;

const Dropzone = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed ${props => props.isDragActive ? '#1976d2' : '#ccc'};
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: ${props => props.isDragActive ? '#f0f8ff' : '#fafafa'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 30px;
  
  &:hover {
    border-color: #1976d2;
    background: #f0f8ff;
  }
`;

const DropzoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const DropzoneIcon = styled.div`
  color: #666;
  
  svg {
    width: 48px;
    height: 48px;
  }
`;

const DropzoneText = styled.div`
  color: #666;
  
  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  
  p {
    font-size: 0.9rem;
  }
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: #666;
  }
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
`;

const FileStatus = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => props.status === 'success' && `
    color: #2e7d32;
  `}
  
  ${props => props.status === 'error' && `
    color: #d32f2f;
  `}
  
  ${props => props.status === 'uploading' && `
    color: #f57c00;
  `}
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #666;
  
  &:hover {
    color: #d32f2f;
    background: #ffebee;
  }
`;

const UploadButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  transition: background-color 0.2s;
  
  &:hover:not(:disabled) {
    background: #1565c0;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    background: #1976d2;
    width: ${props => props.progress}%;
    transition: width 0.3s ease;
  }
`;

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const Upload: React.FC = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.warning('Selecione pelo menos um arquivo para upload');
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    files.forEach((fileObj, index) => {
      if (fileObj.status === 'pending') {
        formData.append('files', fileObj.file);
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'uploading', progress: 0 } : f
        ));
      }
    });

    try {
      const response = await uploadAPI.uploadFiles(formData);
      toast.success('Arquivos enviados com sucesso!');
      
      // Atualizar status dos arquivos
      setFiles(prev => prev.map(file => ({
        ...file,
        status: 'success',
        progress: 100
      })));
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar arquivos');
      
      setFiles(prev => prev.map(file => ({
        ...file,
        status: file.status === 'uploading' ? 'error' : file.status,
        error: 'Falha no upload'
      })));
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      case 'uploading':
        return <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #f3f3f3', borderTop: '2px solid #f57c00', borderRadius: '50%' }} />;
      default:
        return null;
    }
  };

  const hasPendingFiles = files.some(f => f.status === 'pending');

  return (
    <UploadContainer>
      <Title>Upload de Arquivos</Title>
      
      <Dropzone {...getRootProps()} isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <DropzoneContent>
          <DropzoneIcon>
            <UploadCloud />
          </DropzoneIcon>
          <DropzoneText>
            <h3>
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </h3>
            <p>
              Suporte para imagens (JPEG, PNG, GIF) e vídeos (MP4, AVI, MOV).
              Tamanho máximo: 100MB por arquivo.
            </p>
          </DropzoneText>
        </DropzoneContent>
      </Dropzone>

      {files.length > 0 && (
        <>
          <FileList>
            {files.map((fileObj, index) => (
              <FileItem key={index}>
                <FileIcon>
                  <File size={20} />
                </FileIcon>
                <FileInfo>
                  <FileName>{fileObj.file.name}</FileName>
                  <FileSize>{formatFileSize(fileObj.file.size)}</FileSize>
                  {fileObj.status !== 'pending' && (
                    <>
                      <FileStatus status={fileObj.status}>
                        {getStatusIcon(fileObj.status)}
                        {fileObj.status === 'uploading' && 'Enviando...'}
                        {fileObj.status === 'success' && 'Concluído'}
                        {fileObj.status === 'error' && 'Erro'}
                      </FileStatus>
                      <ProgressBar progress={fileObj.progress} />
                    </>
                  )}
                </FileInfo>
                <RemoveButton onClick={() => removeFile(index)}>
                  <X size={16} />
                </RemoveButton>
              </FileItem>
            ))}
          </FileList>
          
          <UploadButton 
            onClick={uploadFiles} 
            disabled={isUploading || !hasPendingFiles}
          >
            <UploadCloud size={20} />
            {isUploading ? 'Enviando...' : 'Iniciar Upload'}
          </UploadButton>
        </>
      )}
    </UploadContainer>
  );
};

export default Upload;