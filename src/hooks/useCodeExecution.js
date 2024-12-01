// src/hooks/useCodeExecution.js
import { useState } from 'react';

export const useCodeExecution = () => {
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const executeCode = async (language, code) => {
        setLoading(true);
        setError('');
        setOutput('');

        try {
            const response = await fetch('http://localhost:8080/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ language, code }),
            });

            const data = await response.json();

            if (data.success) {
                setOutput(data.output);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('코드 실행 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return { output, error, loading, executeCode };
};

export default useCodeExecution;
