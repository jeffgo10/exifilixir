'use client';

import { useState } from 'react';
import { InboxOutlined, DownloadOutlined, LoadingOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Upload as AntUpload, Button, Card, message, Typography, Space, Alert } from 'antd';
import Image from 'next/image';
import type { UploadFile, UploadProps } from 'antd';
import { getApiEndpoint } from './utils/api';
import { getApiToken } from './utils/auth';

const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedFile, setProcessedFile] = useState<string | null>(null);
  const [processedFileName, setProcessedFileName] = useState<string>('');

  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setProcessing(true);
    setProcessedFile(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file as File);

      // Get the appropriate API endpoint based on environment
      const apiEndpoint = getApiEndpoint();
      const apiToken = getApiToken();

      // Prepare headers with token
      // Note: Don't set Content-Type - let browser set it with boundary for FormData
      const headers: HeadersInit = {};
      if (apiToken) {
        headers['X-API-Token'] = apiToken;
        headers['Authorization'] = `Bearer ${apiToken}`;
      }
      // Explicitly don't set Content-Type - browser will set it with boundary

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process image');
      }

      // Get the processed image as blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setProcessedFile(url);
      setProcessedFileName(`fixed-${(file as File).name}`);
      setFileList([file as UploadFile]);
      
      message.success('Image processed successfully! Ready for Facebook.');
      onSuccess?.(response);
    } catch (error: any) {
      message.error(error.message || 'Failed to process image');
      onError?.(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedFile) {
      const link = document.createElement('a');
      link.href = processedFile;
      link.download = processedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Download started!');
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    fileList,
    customRequest: handleUpload,
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    // Remove beforeUpload to allow immediate processing
    showUploadList: {
      showPreviewIcon: false,
      showRemoveIcon: !processing,
    },
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <style jsx global>{`
        .pp-GUDHT2MCK5UCW {
          text-align: center;
          border: none;
          border-radius: 0.25rem;
          min-width: 11.625rem;
          padding: 0 2rem;
          height: 2.625rem;
          font-weight: bold;
          background-color: #FFD140;
          color: #000000;
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-size: 1rem;
          line-height: 1.25rem;
          cursor: pointer;
        }
      `}</style>
      <Card 
        style={{ 
          maxWidth: '800px', 
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Image
                src="/exifilixir.svg"
                alt="EXIFilixir Logo"
                width={200}
                height={60}
                style={{ maxWidth: '100%', height: 'auto' }}
                priority
              />
            </div>
            <Paragraph style={{ fontSize: '16px', color: '#666' }}>
              Fix EXIF metadata for 360° panorama images
            </Paragraph>
          </div>

          <Alert
            message="How it works"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Fixes aspect ratio to 2:1 (required by Facebook)</li>
                <li>Injects Google Photo Sphere XMP metadata</li>
                <li>Adds camera metadata for better recognition</li>
              </ul>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            style={{ marginBottom: '1rem' }}
          />

          <AntUpload.Dragger 
            {...uploadProps}
            disabled={processing}
            style={{ 
              padding: '3rem 2rem',
              background: processing ? '#f5f5f5' : '#fafafa',
              border: '2px dashed #1890ff'
            }}
          >
            <p className="ant-upload-drag-icon">
              {processing ? (
                <LoadingOutlined style={{ fontSize: '48px', color: '#1890ff' }} spin />
              ) : (
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              )}
            </p>
            <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 500 }}>
              {processing ? 'Processing your image...' : 'Click or drag image to this area to upload'}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: '14px', color: '#999' }}>
              Support for single image upload. Process 360° panoramas from DJI drones.
            </p>
          </AntUpload.Dragger>

          <Card style={{ borderRadius: '8px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>FAQ (Facebook 360°, DJI panos, EXIF)</Text>
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  <Text strong>Why doesn’t my DJI panorama show as a Facebook 360 photo?</Text>
                  <br />
                  Facebook’s 360 viewer expects an <Text strong>equirectangular</Text> image with a <Text strong>2:1</Text> aspect ratio and proper <Text strong>Photo Sphere (XMP‑GPano)</Text> metadata. Many DJI panos are missing the required XMP tags.
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  <Text strong>What does EXIFilixir change?</Text>
                  <br />
                  It keeps your photo intact but ensures the output is <Text strong>2:1</Text> (if needed) and injects <Text strong>XMP‑GPano</Text> tags so platforms like <Text strong>Facebook</Text> recognize it as a 360° panorama.
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  <Text strong>Is my image uploaded/stored?</Text>
                  <br />
                  The image is processed to generate the fixed file and returned to you. It’s not intended to be stored long‑term.
                </Paragraph>
              </div>
            </Space>
          </Card>

          {processedFile && (
            <Card 
              style={{ 
                background: '#f0f9ff',
                border: '1px solid #1890ff',
                borderRadius: '8px'
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                  <Text strong style={{ fontSize: '16px' }}>
                    Image processed successfully!
                  </Text>
                </div>
                <div style={{ 
                  width: '100%', 
                  maxHeight: '400px', 
                  overflow: 'hidden',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9'
                }}>
                  <img 
                    src={processedFile} 
                    alt="Processed" 
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      display: 'block'
                    }} 
                  />
                </div>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  size="large"
                  onClick={handleDownload}
                  block
                  style={{ marginTop: '1rem' }}
                >
                  Download Fixed Image
                </Button>
              </Space>
            </Card>
          )}

          <Card style={{ borderRadius: '8px' }}>
            <Space direction="vertical" size="small" style={{ width: '100%', textAlign: 'center' }}>
              <Text strong>Buy me a coffee ☕️</Text>
              <Text type="secondary" style={{ maxWidth: 560, margin: '0 auto' }}>
                I’m{' '}
                <a href="https://linkedin.com/in/gojeffrey" target="_blank" rel="noreferrer">
                  Jeffrey Go
                </a>
                , a freelance coder. I keep this tool for free. If this has saved you time, a donation is a great way to say thank you! Also, feel free to share this to your 360 fellas!
              </Text>
              <div>
                <form
                  action="https://www.paypal.com/ncp/payment/GUDHT2MCK5UCW"
                  method="post"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-grid',
                    justifyItems: 'center',
                    alignContent: 'start',
                    gap: '0.5rem',
                  }}
                >
                  <input className="pp-GUDHT2MCK5UCW" type="submit" value="Donate" />
                  <img src="https://www.paypalobjects.com/images/Debit_Credit.svg" alt="cards" />
                  <section style={{ fontSize: '0.75rem' }}>
                    Powered by{' '}
                    <img
                      src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg"
                      alt="paypal"
                      style={{ height: '0.875rem', verticalAlign: 'middle' }}
                    />
                  </section>
                </form>
              </div>
            </Space>
          </Card>
        </Space>
      </Card>
    </main>
  );
}
