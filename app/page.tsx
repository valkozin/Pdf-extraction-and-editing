'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, FileJson, Check, Copy, FileText, AlertCircle, Edit3, Save, ChevronRight, Share2, Plus } from 'lucide-react';
import Editor from '@monaco-editor/react';
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

  const getActiveJson = () => {
    return isEditing ? editValue : jsonOutput;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getActiveJson());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadJson = () => {
    const content = getActiveJson();
    const blob = new Blob([content], { type: 'application/json' });
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
    <main className="container mx-auto px-6 py-16 max-w-6xl">
      <div className="flex flex-col items-center text-center mb-20 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
          <FileText size={16} />
          <span>Local PDF Extraction</span>
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-sky-200 to-indigo-400">
            PDF to Structured Data
          </span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl leading-relaxed">
          Transform documents into clean JSON instantly. <span className="text-slate-200">Private, secure, and entirely client-side.</span>
        </p>
      </div>

      <div className="grid gap-10">
        {/* Upload Zone */}
        {!jsonOutput && !isProcessing && (
          <div
            className={`glass-card p-20 text-center animate-fade-in group relative overflow-hidden ${isDragging ? 'border-sky-400/50 bg-sky-400/5' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="shimmer absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={onFileChange}
            />
            <div className="flex flex-col items-center gap-6 relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-400/20 to-indigo-500/20 flex items-center justify-center text-sky-400 shadow-2xl transition-transform group-hover:scale-110 duration-500">
                <Upload size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">Start with a PDF</h3>
                <p className="text-slate-400 text-lg">Drag & drop or click to browse files</p>
              </div>
              <div className="mt-8 flex items-center gap-8 py-4 px-8 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tighter text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  No Server Uploads
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-tighter text-slate-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Real-time Parsing
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="glass-card p-32 text-center animate-fade-in">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-sky-400/10 border-t-sky-400 rounded-full animate-spin"></div>
                <FileJson className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Analyzing Document</h3>
                <p className="text-slate-400">Our local engine is mapping coordinates and text blocks...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card border-red-500/20 bg-red-500/5 p-6 flex items-center gap-4 text-red-400 animate-fade-in shadow-red-500/10 shadow-lg">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle size={20} />
            </div>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Result State */}
        {jsonOutput && !isProcessing && (
          <div className="animate-fade-in space-y-6" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-2">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-inner">
                  <FileJson size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-2xl tracking-tight leading-tight">{fileName}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Check size={14} className="text-green-500" />
                    <span>Extraction Complete</span>
                    <span className="mx-2 opacity-20">|</span>
                    <span>Ready for export</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`btn-secondary text-sm px-5 py-2.5 ${isEditing ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : ''}`}
                >
                  <Edit3 size={18} />
                  {isEditing ? 'View Editor' : 'Edit JSON'}
                </button>
                <button onClick={copyToClipboard} className="btn-secondary text-sm px-5 py-2.5">
                  {isCopied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
                <div className="w-px h-8 bg-white/5 mx-1 hidden sm:block" />
                <button onClick={downloadJson} className="btn-primary text-sm px-6 py-2.5">
                  <Download size={18} />
                  Download
                </button>
                <button
                  onClick={() => { setJsonOutput(''); setError(null); }}
                  className="p-2.5 rounded-16 border border-white/5 bg-white/5 text-slate-400 hover:text-white transition-colors"
                  title="Upload New"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="glass-card overflow-hidden transition-all duration-500 border-white/10">
              {isEditing ? (
                <div className="flex flex-col">
                  <div className="bg-slate-900/50 border-b border-white/5 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 pl-4">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      Editor Mode
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setIsEditing(false); setEditValue(jsonOutput); }} className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleSaveEdit} className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                        <Save size={14} />
                        Apply Edits
                      </button>
                    </div>
                  </div>
                  <div className="p-1">
                    <Editor
                      height="600px"
                      defaultLanguage="json"
                      value={editValue}
                      theme="vs-dark"
                      onChange={(value) => setEditValue(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        automaticLayout: true,
                        padding: { top: 20, bottom: 20 },
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: 'all',
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <div className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Read Only Mode
                    </div>
                  </div>
                  <pre className="p-8 h-[600px] overflow-auto text-sm text-sky-100/80 [scrollbar-gutter:stable] leading-relaxed selection:bg-sky-500/30">
                    <code>{jsonOutput}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 pt-10 border-t border-white/5 text-center flex flex-col items-center gap-4">
        <p className="text-slate-500 text-sm">
          Built with security in mind. Your data never touches any external servers.
        </p>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-600">
          <span>AES-256 Extraction</span>
          <span className="w-1 h-1 rounded-full bg-slate-800" />
          <span>Client-side Processing</span>
        </div>
      </footer>
    </main>
  );
}
