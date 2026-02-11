
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Baby, 
  Activity, 
  ChevronRight, 
  Plus, 
  History, 
  LineChart as ChartIcon, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  BrainCircuit,
  Pencil,
  Trash2,
  Calendar,
  User
} from 'lucide-react';
import { ChildProfile, GrowthRecord, MilestoneCategory, AnalysisResult } from './types';
import { getDevelopmentalAnalysis } from './geminiService';
import { MILESTONE_TEMPLATES } from './constants';

const App: React.FC = () => {
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [milestones, setMilestones] = useState<MilestoneCategory[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(true);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Refs for navigation
  const historyRef = useRef<HTMLElement>(null);

  // Form State for Adding/Editing
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [hc, setHc] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);

  // Profile Form State
  const [tempProfile, setTempProfile] = useState({ name: '', birthDate: '', gender: 'Laki-laki' as const });

  const calculateAgeInMonths = (birthDate: string, targetDate?: string) => {
    const birth = new Date(birthDate);
    const target = targetDate ? new Date(targetDate) : new Date();
    const months = (target.getFullYear() - birth.getFullYear()) * 12 + (target.getMonth() - birth.getMonth());
    return Math.max(0, months);
  };

  const currentAgeInMonths = profile ? calculateAgeInMonths(profile.birthDate) : 0;

  useEffect(() => {
    if (profile) {
      const age = calculateAgeInMonths(profile.birthDate);
      let templateKey = 6;
      if (age >= 24) templateKey = 24;
      else if (age >= 12) templateKey = 12;

      const template = MILESTONE_TEMPLATES[templateKey] || MILESTONE_TEMPLATES[6];
      setMilestones(template.map(cat => ({
        category: cat.category,
        items: cat.items.map(text => ({ id: Math.random().toString(36).substr(2, 9), text, isAchieved: false }))
      })));
    }
  }, [profile?.birthDate]);

  const handleSaveProfile = () => {
    if (tempProfile.name && tempProfile.birthDate) {
      setProfile(tempProfile);
      setIsEditingProfile(false);
    }
  };

  const handleAddRecord = () => {
    if (weight && height && profile) {
      const age = calculateAgeInMonths(profile.birthDate, recordDate);
      const newRecord: GrowthRecord = {
        id: Date.now().toString(),
        date: recordDate,
        weight: parseFloat(weight),
        height: parseFloat(height),
        headCircumference: hc ? parseFloat(hc) : undefined,
        ageInMonths: age
      };
      setRecords(prev => [...prev, newRecord].sort((a, b) => a.ageInMonths - b.ageInMonths));
      closeModals();
    }
  };

  const handleUpdateRecord = () => {
    if (editingRecord && weight && height && profile) {
      const age = calculateAgeInMonths(profile.birthDate, recordDate);
      setRecords(prev => prev.map(r => 
        r.id === editingRecord.id 
          ? { ...r, weight: parseFloat(weight), height: parseFloat(height), headCircumference: hc ? parseFloat(hc) : undefined, date: recordDate, ageInMonths: age }
          : r
      ).sort((a, b) => a.ageInMonths - b.ageInMonths));
      closeModals();
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Hapus data pertumbuhan ini?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
      closeModals();
    }
  };

  const openEditModal = (record: GrowthRecord) => {
    setEditingRecord(record);
    setWeight(record.weight.toString());
    setHeight(record.height.toString());
    setHc(record.headCircumference?.toString() || '');
    setRecordDate(record.date);
  };

  const closeModals = () => {
    setIsAddingRecord(false);
    setEditingRecord(null);
    setWeight('');
    setHeight('');
    setHc('');
    setRecordDate(new Date().toISOString().split('T')[0]);
  };

  const toggleMilestone = (catIndex: number, itemIndex: number) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[catIndex].items[itemIndex].isAchieved = !updated[catIndex].items[itemIndex].isAchieved;
      return updated;
    });
  };

  const handleAnalyze = async () => {
    if (!profile || records.length === 0) return;
    setIsLoadingAnalysis(true);
    try {
      const result = await getDevelopmentalAnalysis(profile, records, milestones);
      setAnalysis(result);
    } catch (error) {
      alert("Gagal melakukan analisis. Silakan coba lagi.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isEditingProfile) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Baby className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Profil Buah Hati</h1>
            <p className="text-gray-500 text-center mt-2">Masukkan data dasar untuk memulai pemantauan tumbuh kembang.</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan</label>
              <input 
                type="text" 
                value={tempProfile.name}
                onChange={e => setTempProfile(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Contoh: Budi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input 
                type="date" 
                value={tempProfile.birthDate}
                onChange={e => setTempProfile(p => ({ ...p, birthDate: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTempProfile(p => ({ ...p, gender: 'Laki-laki' }))}
                  className={`py-3 rounded-xl border font-medium transition-all ${tempProfile.gender === 'Laki-laki' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  Laki-laki
                </button>
                <button 
                  onClick={() => setTempProfile(p => ({ ...p, gender: 'Perempuan' }))}
                  className={`py-3 rounded-xl border font-medium transition-all ${tempProfile.gender === 'Perempuan' ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  Perempuan
                </button>
              </div>
            </div>
            <button 
              onClick={handleSaveProfile}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors mt-4 shadow-lg shadow-indigo-200"
            >
              Simpan & Lanjutkan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Baby className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight">TumbuhKembangKu</h1>
            <p className="text-xs text-indigo-600 font-medium">{profile?.name} • {currentAgeInMonths} Bulan</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={scrollToHistory}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors font-bold text-sm"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Riwayat</span>
          </button>
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all"
            title="Edit Profil"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Statistics Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-100 p-3 rounded-2xl mb-3 text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Berat Terakhir</p>
            <p className="text-2xl font-bold text-gray-800">{records.length > 0 ? records[records.length-1].weight : '--'} <span className="text-sm">kg</span></p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="bg-green-100 p-3 rounded-2xl mb-3 text-green-600">
              <ChartIcon className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Tinggi Terakhir</p>
            <p className="text-2xl font-bold text-gray-800">{records.length > 0 ? records[records.length-1].height : '--'} <span className="text-sm">cm</span></p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
            <div className="bg-purple-100 p-3 rounded-2xl mb-3 text-purple-600">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Milestone Dicapai</p>
            <p className="text-2xl font-bold text-gray-800">
              {milestones.reduce((acc, cat) => acc + cat.items.filter(i => i.isAchieved).length, 0)} / {milestones.reduce((acc, cat) => acc + cat.items.length, 0)}
            </p>
          </div>
        </section>

        {/* Growth Tracking Section */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <ChartIcon className="w-5 h-5 text-indigo-600" />
              Grafik Pertumbuhan
            </h2>
            <button 
              onClick={() => setIsAddingRecord(true)}
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Input Baru
            </button>
          </div>
          <div className="p-6 h-[300px]">
            {records.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={records}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="ageInMonths" label={{ value: 'Umur (Bulan)', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" name="Berat (kg)" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="height" name="Tinggi (cm)" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Belum cukup data untuk menampilkan grafik.</p>
                <p className="text-xs">Masukkan setidaknya 2 data pertumbuhan.</p>
              </div>
            )}
          </div>
        </section>

        {/* Growth History List */}
        <section ref={historyRef} className="space-y-4 scroll-mt-24">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2 px-2">
            <History className="w-5 h-5 text-indigo-600" />
            Riwayat Pertumbuhan
          </h2>
          <div className="space-y-3">
            {[...records].reverse().map(record => (
              <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{record.ageInMonths} Bulan</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
                    <div className="flex flex-col items-end">
                      <span className="text-gray-400 text-[10px] uppercase">Berat</span>
                      <span className="text-gray-700">{record.weight} kg</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-400 text-[10px] uppercase">Tinggi</span>
                      <span className="text-gray-700">{record.height} cm</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => openEditModal(record)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {records.length === 0 && (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                <p className="text-gray-400">Belum ada riwayat data pertumbuhan.</p>
              </div>
            )}
          </div>
        </section>

        {/* Milestones Checklist */}
        <section className="space-y-4">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2 px-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Checklist Perkembangan ({currentAgeInMonths} Bulan)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {milestones.map((category, catIdx) => (
              <div key={category.category} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider text-indigo-600">{category.category}</h3>
                <ul className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <li 
                      key={item.id}
                      onClick={() => toggleMilestone(catIdx, itemIdx)}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${item.isAchieved ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300 group-hover:border-indigo-400'}`}>
                        {item.isAchieved && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm leading-tight ${item.isAchieved ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AI Analysis Button & Result */}
        <section className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Analisis AI Standar WHO</h2>
            <p className="text-indigo-100 mb-6">Dapatkan saran medis pintar berdasarkan data pertumbuhan dan perkembangan buah hati Anda.</p>
            
            {!analysis && (
              <button 
                onClick={handleAnalyze}
                disabled={isLoadingAnalysis || records.length === 0}
                className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-900/20"
              >
                {isLoadingAnalysis ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menganalisis...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-5 h-5" />
                    Lihat Analisis Tumbuh Kembang
                  </>
                )}
              </button>
            )}
          </div>
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500/20 rounded-full" />
          <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-indigo-700/30 rounded-full" />
        </section>

        {analysis && (
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className={`p-6 border-b flex items-center justify-between ${
              analysis.status === 'Normal' ? 'bg-green-50 text-green-700' : 
              analysis.status === 'Risiko' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-lg">Status: {analysis.status}</h3>
              </div>
              <button onClick={() => setAnalysis(null)} className="text-sm font-bold underline opacity-70">Tutup</button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Ringkasan Medis</h4>
                <p className="text-gray-600 leading-relaxed">{analysis.summary}</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-4">Solusi & Rekomendasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                      <div className="bg-indigo-100 text-indigo-600 p-1 rounded-full mt-1">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl">
                  ⚠️ <strong>Disclaimer:</strong> {analysis.disclaimer} Selalu konsultasikan kondisi anak ke dokter spesialis anak (DSA).
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Modal for Adding/Editing Record */}
      {(isAddingRecord || editingRecord) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingRecord ? 'Edit Data Pertumbuhan' : 'Tambah Data Pertumbuhan'}</h2>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Data</label>
                <input 
                  type="date" 
                  value={recordDate}
                  onChange={e => setRecordDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Berat (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tinggi (cm)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lingkar Kepala (cm) - Opsional</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={hc}
                  onChange={e => setHc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.0"
                />
              </div>
              
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  {editingRecord ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>
                {editingRecord && (
                  <button 
                    onClick={() => handleDeleteRecord(editingRecord.id)}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Simulation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-3 px-6 md:hidden">
        <button className="flex flex-col items-center gap-1 text-indigo-600">
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-bold">Pantau</span>
        </button>
        <button onClick={scrollToHistory} className="flex flex-col items-center gap-1 text-gray-400">
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold">Riwayat</span>
        </button>
        <button onClick={() => setIsEditingProfile(true)} className="flex flex-col items-center gap-1 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
