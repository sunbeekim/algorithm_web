// src/pages/Coding.js
import React, { Component } from 'react';
import Content from '../components/VerticalContent';
import './Coding.css';
import { FaPlay, FaSpinner } from 'react-icons/fa';
import VerticalContent from '../components/VerticalContent';

class Coding extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            language: 'javascript',
            code: this.getDefaultCode('javascript'),
            output: '',
            error: '',
            loading: false
        };
    }

    getDefaultCode(language) {
        switch(language) {
            case 'javascript':
                return 'console.log("Hello, JavaScript!");';
            case 'python':
                return 'print("Hello, Python!")';
            case 'java':
                return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`;
            default:
                return '';
        }
    }

    handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        this.setState({ 
            language: newLanguage,
            code: this.getDefaultCode(newLanguage)
        });
    };

    handleCodeChange = (e) => {
        this.setState({ code: e.target.value });
    };

    executeCode = async () => {
        this.setState({ loading: true, error: '', output: '' });

        try {
            const response = await fetch('http://183.105.171.41:8090/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({
                    language: this.state.language,
                    code: this.state.code
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.setState({ output: data.output });
            } else {
                this.setState({ error: data.error });
            }
        } catch (err) {
            this.setState({ 
                error: '코드 실행 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.' 
            });
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { language, code, output, error, loading } = this.state;

        return (
            <VerticalContent>
                <div className="coding-container">
                    <div className="coding-header">
                        <h1>코딩 연습장</h1>
                        <select 
                            value={language} 
                            onChange={this.handleLanguageChange}
                            className="language-select"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                    </div>

                    <div className="coding-editor">
                        <textarea
                            value={code}
                            onChange={this.handleCodeChange}
                            placeholder="여기에 코드를 입력하세요..."
                            className="code-input"
                            spellCheck="false"
                        />
                    </div>

                    <div className="coding-controls">
                        <button 
                            onClick={this.executeCode}
                            disabled={loading}
                            className="execute-button"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="fa-spin" />
                                    실행 중...
                                </>
                            ) : (
                                <>
                                    <FaPlay />
                                    실행
                                </>
                            )}
                        </button>
                    </div>

                    <div className="output-container">
                        <h3>실행 결과</h3>
                        {error && (
                            <div className="error-output">
                                {error}
                            </div>
                        )}
                        {output && (
                            <div className="success-output">
                                {output}
                            </div>
                        )}
                    </div>
                </div>
            </VerticalContent>
        );
    }
}

export default Coding;