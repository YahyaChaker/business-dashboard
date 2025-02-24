import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Upload from 'antd/es/upload';
import message from 'antd/es/message';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import axios from 'axios';

const ExcelFileCard = () => {
  const handleDownload = async () => {
    try {
      const response = await axios.get('/api/download-excel', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data as BlobPart]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Project Performance Template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('Failed to download the file');
    }
  };

  const handleUpload = async (file: UploadFile) => {
    const formData = new FormData();
    formData.append('file', file as any);

    try {
      await axios.post('/api/upload-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('File uploaded successfully');
    } catch (error) {
      message.error('Failed to upload the file');
    }
  };

  const customRequest: UploadProps['customRequest'] = ({ file, onSuccess }) => {
    handleUpload(file as UploadFile)
      .then(() => {
        onSuccess?.(null);
      })
      .catch(() => {});
  };

  return (
    <Card title="Excel File Management">
      <Button
        icon={<DownloadOutlined />}
        onClick={handleDownload}
        style={{ marginRight: 16 }}
      >
        Download Template
      </Button>
      <Upload
        accept=".xlsx"
        showUploadList={false}
        customRequest={customRequest}
      >
        <Button icon={<UploadOutlined />}>Upload Updated Template</Button>
      </Upload>
    </Card>
  );
};

export default ExcelFileCard;
