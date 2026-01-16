'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, FileJson, Check, Copy, FileText, AlertCircle, Edit3, Save } from 'lucide-react';
import { extractTextFromPDF, convertToStructuredJson } from '@/lib/PDFProcessor';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setFileName(file.name);

      const rawData = await extractTextFromPDF(file);
      const structuredJson = convertToStructuredJson(rawData);
      const jsonString = JSON.stringify(structuredJson, null, 2);

      setJsonOutput(jsonString);
      setEditValue(jsonString);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to extract text from the PDF. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonOutput);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.pdf$/i, '') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    try {
      JSON.parse(editValue); // Validate JSON
      setJsonOutput(editValue);
      setIsEditing(false);
      setError(null);
    } catch (e) {
      setError('Invalid JSON format. Please check your edits.');
    }
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '0s' }}>
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400 mb-4">
          PDF to JSON Extractor
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Securely extract structured data from your PDF documents offline in your browser.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Upload Zone */}
        {!jsonOutput && !isProcessing && (
          <div
            className={`glass-card p-16 text-center animate-fade-in cursor-pointer ${isDragging ? 'border-sky-400 bg-sky-400/5' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            style={{ animationDelay: '0.2s' }}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={onFileChange}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 mb-2">
                <Upload size={32} />
              </div>
              <h3 className="text-2xl font-semibold">Drop your PDF here</h3>
              <p className="text-slate-400">or click to browse your files</p>
              <div className="mt-4 px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-500 uppercase tracking-widest font-bold">
                Privacy Guaranteed: No files leave your device
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="glass-card p-24 text-center animate-fade-in">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-sky-400/20 border-t-sky-400 rounded-full animate-spin"></div>
              <h3 className="text-xl font-medium">Extracting text...</h3>
              <p className="text-slate-400">Analyzing document structure and content</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3 text-red-400 animate-fade-in">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Result State */}
        {jsonOutput && !isProcessing && (
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileJson size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{fileName}</h3>
                  <p className="text-xs text-slate-500">Extraction Complete</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`btn-secondary text-sm px-4 py-2 ${isEditing ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : ''}`}
                >
                  <Edit3 size={16} />
                  {isEditing ? 'Editing...' : 'Edit JSON'}
                </button>
                <button onClick={copyToClipboard} className="btn-secondary text-sm px-4 py-2">
                  {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={downloadJson} className="btn-primary text-sm px-4 py-2">
                  <Download size={16} />
                  Download JSON
                </button>
                <button onClick={() => { setJsonOutput(''); setError(null); }} className="btn-secondary text-sm px-4 py-2 ml-4">
                  New File
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              {isEditing ? (
                <div className="flex flex-col">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full h-[600px] p-6 bg-transparent text-sky-100 font-mono text-sm focus:outline-none resize-none"
                    spellCheck={false}
                  />
                  <div className="p-4 border-t border-glass-border flex justify-end gap-2 bg-glass-highlight">
                    <button onClick={() => { setIsEditing(false); setEditValue(jsonOutput); }} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">
                      Cancel
                    </button>
                    <button onClick={handleSaveEdit} className="btn-primary text-sm px-6 py-2">
                      <Save size={16} />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="p-6 h-[600px] overflow-auto text-sm text-sky-100/90 [scrollbar-gutter:stable]">
                  <code>{jsonOutput}</code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .container {
          max-width: 1000px;
        }
      `}</style>
    </main>
  );
}
