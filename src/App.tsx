/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight, 
  BrainCircuit, 
  ClipboardList, 
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  School,
  BookOpen,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateExam, generateImage, ExamIdentity, QuestionSection } from './services/geminiService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Menu = 'identitas' | 'teknis' | 'laporan';
type Tab = 'naskah' | 'kunci' | 'kisi' | 'download';

// --- Components ---

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'dwyne' && password === '123') {
      onLogin();
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/d/1pEReBH8au0iPpuuwuFyoAkaJM0Sox9js")' }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark w-full max-w-md p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 mb-4">
            <BrainCircuit className="w-10 h-10 text-indigo-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Penyusunan Soal</h1>
          <p className="text-slate-400 mt-2">Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full mt-4">
            Masuk ke Aplikasi
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState<Menu>('identitas');
  const [activeTab, setActiveTab] = useState<Tab>('naskah');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  // --- State: Identitas Soal ---
  const [identity, setIdentity] = useState<ExamIdentity>({
    teacher: '',
    school: '',
    level: 'SD',
    phase: 'A',
    className: '1',
    subject: '',
    topic: ''
  });

  // --- State: Teknis Soal ---
  const [sections, setSections] = useState<QuestionSection[]>([]);
  
  // --- State: Laporan ---
  const [examResult, setExamResult] = useState<{
    naskahSoal: string;
    kunciJawaban: string;
    kisiKisi: string;
  } | null>(null);

  const addSection = () => {
    const newSection: QuestionSection = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Pilihan Ganda',
      count: 5,
      hasImages: false,
      difficulty: { easy: 2, medium: 2, hard: 1 },
      cognitiveDimensions: ['C1-Mengingat']
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<QuestionSection>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleGenerate = async () => {
    if (!identity.subject || !identity.topic || sections.length === 0) {
      alert("Mohon lengkapi identitas dan tambahkan minimal satu bagian soal.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateExam(identity, sections);
      
      let finalNaskah = result.naskahSoal;
      
      if (result.imagePrompts && result.imagePrompts.length > 0) {
        setIsGeneratingImages(true);
        const imageMap: Record<string, string> = {};
        
        for (const imgPrompt of result.imagePrompts) {
          const imageUrl = await generateImage(imgPrompt.prompt);
          if (imageUrl) {
            imageMap[imgPrompt.id] = imageUrl;
          }
        }
        
        // Replace placeholders with markdown images
        Object.entries(imageMap).forEach(([id, url]) => {
          finalNaskah = finalNaskah.replace(new RegExp(`{{${id}}}`, 'g'), `\n\n![Stimulus Gambar](${url})\n\n`);
        });
        
        setIsGeneratingImages(false);
      }

      setExamResult({
        ...result,
        naskahSoal: finalNaskah
      });
      setActiveMenu('laporan');
      setActiveTab('naskah');
    } catch (error: any) {
      console.error("Generation error:", error);
      alert(`Gagal membuat soal: ${error.message || "Terjadi kesalahan tidak dikenal"}. Silakan periksa koneksi atau API Key Anda.`);
    } finally {
      setIsLoading(false);
      setIsGeneratingImages(false);
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center z-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/d/1pEReBH8au0iPpuuwuFyoAkaJM0Sox9js")' }}
      />

      {/* Sidebar */}
      <aside className="w-72 glass-dark border-r border-white/5 flex flex-col z-10">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight">AI Penyusunan</h1>
              <p className="text-xs text-slate-400">Versi 2.5 Flash</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveMenu('identitas')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeMenu === 'identitas' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-white/5 text-slate-400"
            )}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">Identitas Soal</span>
          </button>
          <button 
            onClick={() => setActiveMenu('teknis')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeMenu === 'teknis' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-white/5 text-slate-400"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Teknis Soal</span>
          </button>
          <button 
            onClick={() => setActiveMenu('laporan')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              activeMenu === 'laporan' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "hover:bg-white/5 text-slate-400"
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Laporan</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 sticky top-0 bg-slate-950/50 backdrop-blur-md z-20">
          <h2 className="text-xl font-semibold text-white">
            {activeMenu === 'identitas' && 'Identitas Penyusunan Soal'}
            {activeMenu === 'teknis' && 'Pengaturan Teknis Soal'}
            {activeMenu === 'laporan' && 'Hasil Laporan & Naskah'}
          </h2>
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isGeneratingImages ? 'Sedang membuat gambar AI...' : 'Sedang menyusun soal...'}
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">dwyne</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {activeMenu === 'identitas' && (
              <motion.div 
                key="identitas"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <User className="w-4 h-4" /> Nama Guru / Penyusun
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Contoh: Dwyne Wijayanto, S.Pd"
                      value={identity.teacher}
                      onChange={(e) => setIdentity({...identity, teacher: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <School className="w-4 h-4" /> Nama Satuan Pendidikan
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Contoh: SMP Negeri 1 Jakarta"
                      value={identity.school}
                      onChange={(e) => setIdentity({...identity, school: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <Layers className="w-4 h-4" /> Jenjang Pendidikan
                    </label>
                    <select 
                      className="input-field"
                      value={identity.level}
                      onChange={(e) => setIdentity({...identity, level: e.target.value as any})}
                    >
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <Layers className="w-4 h-4" /> Fase Pembelajaran
                    </label>
                    <select 
                      className="input-field"
                      value={identity.phase}
                      onChange={(e) => setIdentity({...identity, phase: e.target.value})}
                    >
                      {identity.level === 'SD' ? (
                        <>
                          <option value="A">Fase A (Kelas 1-2)</option>
                          <option value="B">Fase B (Kelas 3-4)</option>
                          <option value="C">Fase C (Kelas 5-6)</option>
                        </>
                      ) : (
                        <option value="D">Fase D (Kelas 7-9)</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <Layers className="w-4 h-4" /> Kelas
                    </label>
                    <select 
                      className="input-field"
                      value={identity.className}
                      onChange={(e) => setIdentity({...identity, className: e.target.value})}
                    >
                      {identity.level === 'SD' ? (
                        ['1','2','3','4','5','6'].map(c => <option key={c} value={c}>Kelas {c}</option>)
                      ) : (
                        ['7','8','9'].map(c => <option key={c} value={c}>Kelas {c}</option>)
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <BookOpen className="w-4 h-4" /> Mata Pelajaran
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Contoh: Matematika"
                      value={identity.subject}
                      onChange={(e) => setIdentity({...identity, subject: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    <ClipboardList className="w-4 h-4" /> Topik / Lingkup Materi
                  </label>
                  <textarea 
                    className="input-field min-h-[100px]" 
                    placeholder="Masukkan topik atau lingkup materi yang akan diujikan..."
                    value={identity.topic}
                    onChange={(e) => setIdentity({...identity, topic: e.target.value})}
                  />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setActiveMenu('teknis')} className="btn-primary flex items-center gap-2">
                    Lanjut ke Teknis <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeMenu === 'teknis' && (
              <motion.div 
                key="teknis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Struktur Bagian Soal</h3>
                  <button onClick={addSection} className="btn-secondary flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Tambah Bagian
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div className="text-center py-20 glass rounded-3xl border-dashed border-2 border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400">Belum ada bagian soal. Klik "Tambah Bagian" untuk memulai.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sections.map((section, index) => (
                      <motion.div 
                        key={section.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-6 rounded-3xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Bagian {index + 1}</span>
                            <h4 className="text-xl font-bold text-white mt-1">Input Bagian {index + 1} Soal</h4>
                          </div>
                          <button 
                            onClick={() => removeSection(section.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Bagian 1: Teknis Dasar */}
                          <div className="space-y-4">
                            <h5 className="text-sm font-semibold text-slate-300 border-b border-white/5 pb-2">Teknis Dasar</h5>
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-slate-400">Bentuk Soal</label>
                              <select 
                                className="input-field text-sm"
                                value={section.type}
                                onChange={(e) => updateSection(section.id, { type: e.target.value as any })}
                              >
                                <option value="Pilihan Ganda">Pilihan Ganda</option>
                                <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
                                <option value="Benar Salah">Benar Salah</option>
                                <option value="Isian Singkat">Isian Singkat</option>
                                <option value="Uraian/Essai">Uraian/Essai</option>
                              </select>
                            </div>
                            
                            {section.type === 'Pilihan Ganda' && (
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-slate-400">Jumlah Soal (3-10)</label>
                                <input 
                                  type="range" min="3" max="10" step="1"
                                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                  value={section.count}
                                  onChange={(e) => updateSection(section.id, { count: parseInt(e.target.value) })}
                                />
                                <div className="text-center text-sm font-bold text-indigo-400">{section.count} Soal</div>
                              </div>
                            )}

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                              <input 
                                type="checkbox" 
                                id={`img-${section.id}`}
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500"
                                checked={section.hasImages}
                                onChange={(e) => updateSection(section.id, { hasImages: e.target.checked })}
                              />
                              <label htmlFor={`img-${section.id}`} className="text-sm text-slate-300 cursor-pointer">Tambah Gambar di naskah soal</label>
                            </div>

                            <div className="space-y-3">
                              <label className="text-xs font-medium text-slate-400">Tingkat Kesulitan</label>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase">Mudah</span>
                                  <input 
                                    type="number" className="input-field text-sm py-1.5" 
                                    value={section.difficulty.easy}
                                    onChange={(e) => updateSection(section.id, { difficulty: { ...section.difficulty, easy: parseInt(e.target.value) || 0 } })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase">Sedang</span>
                                  <input 
                                    type="number" className="input-field text-sm py-1.5" 
                                    value={section.difficulty.medium}
                                    onChange={(e) => updateSection(section.id, { difficulty: { ...section.difficulty, medium: parseInt(e.target.value) || 0 } })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 uppercase">Sulit</span>
                                  <input 
                                    type="number" className="input-field text-sm py-1.5" 
                                    value={section.difficulty.hard}
                                    onChange={(e) => updateSection(section.id, { difficulty: { ...section.difficulty, hard: parseInt(e.target.value) || 0 } })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bagian 2: Dimensi Kognitif */}
                          <div className="space-y-4">
                            <h5 className="text-sm font-semibold text-slate-300 border-b border-white/5 pb-2">Input Bagian 2: Dimensi Kognitif</h5>
                            <div className="grid grid-cols-1 gap-2">
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">LOTS (Low Order Thinking Skills)</p>
                              {['C1-Mengingat', 'C2-Memahami', 'C3-Menerapkan'].map(dim => (
                                <label key={dim} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500"
                                    checked={section.cognitiveDimensions.includes(dim)}
                                    onChange={(e) => {
                                      const dims = e.target.checked 
                                        ? [...section.cognitiveDimensions, dim]
                                        : section.cognitiveDimensions.filter(d => d !== dim);
                                      updateSection(section.id, { cognitiveDimensions: dims });
                                    }}
                                  />
                                  <span className="text-sm text-slate-300">{dim}</span>
                                </label>
                              ))}
                              
                              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-4 mb-1">HOTS (High Order Thinking Skills)</p>
                              {['C4-Menganalisa', 'C5-Mengevaluasi', 'C6-Mencipta'].map(dim => (
                                <label key={dim} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500"
                                    checked={section.cognitiveDimensions.includes(dim)}
                                    onChange={(e) => {
                                      const dims = e.target.checked 
                                        ? [...section.cognitiveDimensions, dim]
                                        : section.cognitiveDimensions.filter(d => d !== dim);
                                      updateSection(section.id, { cognitiveDimensions: dims });
                                    }}
                                  />
                                  <span className="text-sm text-slate-300">{dim}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Sub Menu Struktur Soal */}
                <div className="glass p-8 rounded-3xl border-indigo-500/30">
                  <h4 className="text-xl font-bold text-white mb-4">Struktur Paket Soal</h4>
                  <div className="space-y-3 mb-8">
                    {sections.map((s, i) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{s.type}</p>
                            <p className="text-xs text-slate-500">{s.cognitiveDimensions.length} Dimensi Kognitif Terpilih</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{s.count} Soal</p>
                          <p className="text-[10px] text-slate-500 uppercase">Total Bagian</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={isLoading || sections.length === 0}
                    className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/40"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Sedang Memproses AI...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-6 h-6" />
                        Buat Naskah Soal
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {activeMenu === 'laporan' && (
              <motion.div 
                key="laporan"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!examResult ? (
                  <div className="text-center py-20 glass rounded-3xl">
                    <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Belum ada naskah soal yang dibuat. Silakan buat di menu Teknis Soal.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
                      {[
                        { id: 'naskah', label: 'Naskah Soal', icon: FileText },
                        { id: 'kunci', label: 'Kunci Jawaban', icon: CheckCircle2 },
                        { id: 'kisi', label: 'Kisi-Kisi', icon: ClipboardList },
                        { id: 'download', label: 'Download Doc', icon: Download },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as Tab)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                            activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                          )}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="glass p-8 rounded-3xl min-h-[600px] prose prose-invert max-w-none">
                      {activeTab === 'naskah' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="mb-8 p-6 border-2 border-white/10 rounded-2xl bg-white/5">
                            <h2 className="text-center text-xl font-bold uppercase mb-4 border-b border-white/10 pb-4">Naskah Soal Ujian</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <p><strong>Mata Pelajaran:</strong> {identity.subject}</p>
                              <p><strong>Satuan Pendidikan:</strong> {identity.school}</p>
                              <p><strong>Kelas / Jenjang:</strong> {identity.className} / {identity.level}</p>
                              <p><strong>Penyusun:</strong> {identity.teacher}</p>
                            </div>
                          </div>
                          <ReactMarkdown
                            components={{
                              img: ({ node, ...props }) => {
                                if (!props.src) return null;
                                return <img {...props} referrerPolicy="no-referrer" />;
                              }
                            }}
                          >
                            {examResult.naskahSoal}
                          </ReactMarkdown>
                        </motion.div>
                      )}
                      {activeTab === 'kunci' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <ReactMarkdown
                            components={{
                              img: ({ node, ...props }) => {
                                if (!props.src) return null;
                                return <img {...props} referrerPolicy="no-referrer" />;
                              }
                            }}
                          >
                            {examResult.kunciJawaban}
                          </ReactMarkdown>
                        </motion.div>
                      )}
                      {activeTab === 'kisi' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <ReactMarkdown
                            components={{
                              img: ({ node, ...props }) => {
                                if (!props.src) return null;
                                return <img {...props} referrerPolicy="no-referrer" />;
                              }
                            }}
                          >
                            {examResult.kisiKisi}
                          </ReactMarkdown>
                        </motion.div>
                      )}
                      {activeTab === 'download' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6">
                            <Download className="w-10 h-10 text-indigo-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Siap untuk Diunduh</h3>
                          <p className="text-slate-400 mb-8 max-w-md">Data soal telah disinkronkan. Anda dapat mengunduh dokumen atau menyimpannya ke database sekolah.</p>
                          <div className="flex gap-4">
                            <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
                              <Download className="w-4 h-4" /> Cetak PDF
                            </button>
                            <button className="btn-secondary flex items-center gap-2">
                              <ClipboardList className="w-4 h-4" /> Simpan ke Spreadsheet
                            </button>
                          </div>
                          
                          <div className="mt-12 p-6 glass-dark rounded-2xl text-left w-full max-w-2xl">
                            <h4 className="text-sm font-bold text-indigo-400 uppercase mb-4">Petunjuk Integrasi Google Apps Script</h4>
                            <p className="text-xs text-slate-400 mb-4">Salin kode berikut ke Google Apps Script Anda untuk integrasi otomatis dengan Google Sheets:</p>
                            <pre className="bg-black/50 p-4 rounded-xl text-[10px] font-mono overflow-x-auto text-slate-300">
{`function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DataSoal") || ss.insertSheet("DataSoal");
  sheet.appendRow(["Tanggal", "Guru", "Sekolah", "Mapel", "Topik", "Naskah"]);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("DataSoal");
  sheet.appendRow([new Date(), data.teacher, data.school, data.subject, data.topic, data.naskah]);
  return ContentService.createTextOutput("Success");
}`}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
