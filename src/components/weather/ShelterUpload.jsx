import React, { useState } from 'react';
import axios from 'axios';

const ShelterUpload = () => {
    const [file, setfile] = useState(null);
    const [message, setMessage] = useState('');
    const [inUploading, setIsUploading] = useState(false);

    const API_BASE_URL = 'https://openddm.store';

    const handleFileChange = (e) => {
        setfile(e.target.files[0]);
        setMessage('');
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        setMessage('업로드 중');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/shelter/upload/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage(response.data.message || '업로드가 성공적으로 완료되었습니다.');
        } catch (error) {
            console.error('업로드 실패:', error);
            setMessage('업로드에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <h2>📥 CSV 업로드</h2>
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={isUploading} style={{ marginLeft: '10px' }}>
                {isUploading ? '업로드 중...' : '업로드'}
            </button>
            {message && <p style={{ marginTop: '10px', color: isUploading ? 'gray' : 'green' }}>{message}</p>}
        </div>
    );
};

export default ShelterUpload;
