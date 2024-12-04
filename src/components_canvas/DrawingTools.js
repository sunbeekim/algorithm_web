// src/components_canvas/DrawingTools.js

import React from 'react';
import { BsPencilFill, BsFillEraserFill } from 'react-icons/bs';
import { MdClear, MdDelete, MdAddBox } from 'react-icons/md';
import './DrawingTools.css';

function DrawingTools({
    color,
    brushSize,
    isEraser,
    onColorChange,
    onBrushSizeChange,
    onEraserToggle,
    onClear,
    onAddCanvas,
    onDeleteCanvas,
    canvasId,
    activeCanvasId
}) {
    return (
        <div className="tools">
            <input 
                type="color" 
                value={color} 
                onChange={(e) => onColorChange(e.target.value)}
                className="color-picker"
                disabled={isEraser}
            />
            <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushSize} 
                onChange={(e) => onBrushSizeChange(e.target.value)}
                className="brush-size"
            />
            <button 
                onClick={onEraserToggle} 
                className={`eraser-button ${isEraser ? 'active' : ''}`}
                title={isEraser ? '펜' : '지우개'}
            >
                {isEraser ? <BsPencilFill /> : <BsFillEraserFill />}
            </button>
            <button 
                onClick={() => onClear(activeCanvasId)} 
                className="clear-button"
                title="현재 캔버스 지우기"
            >
                <MdClear />
            </button>
            <button 
                onClick={() => onDeleteCanvas(canvasId)} 
                className="delete-button"
                title="캔버스 삭제"
            >
                <MdDelete />
            </button>
            <button 
                onClick={onAddCanvas} 
                className="add-canvas-button"
                title="캔버스 추가"
            >
                <MdAddBox />
            </button>
        </div>
    );
}

export default DrawingTools;