'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const getSearchableText = (sub) => [
    sub.full_name,
    sub.company_name,
    sub.division_role,
    sub.email,
    sub.phone_number,
    sub.ur_kritik_saran,
    sub.ur_hal_baik,
    sub.ur_saran_selanjutnya,
    sub.ur_kebutuhan_topik
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/admin/submissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('admin_token');
          router.push('/admin');
          return;
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);
        setFilteredSubmissions(data.submissions || []);
      } catch {
        setError('Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [router]);

  useEffect(() => {
    // Filter submissions based on search term
    if (searchTerm) {
      const normalizedTerm = searchTerm.toLowerCase();
      const filtered = submissions.filter((sub) =>
        getSearchableText(sub).includes(normalizedTerm)
      );
      setFilteredSubmissions(filtered);
    } else {
      setFilteredSubmissions(submissions);
    }
  }, [searchTerm, submissions]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  const exportToExcel = () => {
    // Flatten data for Excel
    const data = filteredSubmissions.map(sub => ({
      'Date': new Date(sub.created_at).toLocaleDateString(),
      'Time': new Date(sub.created_at).toLocaleTimeString(),
      'Nama Peserta': sub.full_name,
      'Perusahaan': sub.company_name,
      'Divisi / Jabatan': sub.division_role,
      'Email': sub.email || '-',
      'No. HP': sub.phone_number || '-',
      'Kesesuaian Materi': sub.opt_materi_kesesuaian,
      'Kemampuan Trainer': sub.opt_trainer_kemampuan,
      'Kualitas Materi': sub.opt_materi_kualitas,
      'Metode Penyampaian': sub.opt_metode_penyampaian,
      'Fasilitas & Media': sub.opt_fasilitas_media,
      'Efektivitas Penyampaian': sub.opt_efektivitas_penyampaian,
      'Tingkat Pemahaman': sub.opt_tingkat_pemahaman,
      'Kepuasan Keseluruhan': sub.opt_kepuasan_keseluruhan,
      'Kebutuhan Layanan': sub.yt_kebutuhan_layanan,
      'Bersedia Menerima Info': sub.yt_bersedia_info,
      'Bersedia Dokumentasi': sub.yt_bersedia_dokumentasi,
      'Kritik & Saran': sub.ur_kritik_saran || '-',
      'Hal yang Sudah Baik': sub.ur_hal_baik || '-',
      'Saran Selanjutnya': sub.ur_saran_selanjutnya || '-',
      'Kebutuhan Topik Selanjutnya': sub.ur_kebutuhan_topik || '-'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");

    // Generate Excel file
    XLSX.writeFile(wb, `training_feedback_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1e28] via-[#20242F] to-[#1a1e28] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1e28] via-[#20242F] to-[#1a1e28] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#2b303b] rounded-2xl shadow-2xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Training Feedback Submissions
              </h1>
              <p className="text-gray-400">
                Total: {filteredSubmissions.length} {searchTerm && `(filtered from ${submissions.length})`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="px-6 py-3 bg-[#67C23A] hover:bg-[#5aaa32] text-white font-semibold rounded-lg 
                     transition-all duration-300 shadow-lg hover:shadow-[#67C23A]/20"
              >
                Export Excel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg 
                     transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search by name, company, division, email, phone, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1e28] border border-gray-700 text-white placeholder-gray-500 
                   focus:outline-none focus:border-[#67C23A] focus:ring-2 focus:ring-[#67C23A]/20 
                   transition-all duration-300"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-[#2b303b] rounded-2xl shadow-2xl border border-gray-700/50">
          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full table-auto">
              <thead className="bg-[#1a1e28] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Division / Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Kepuasan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Kebutuhan Layanan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Info</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Dokumentasi</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Kritik & Saran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-gray-400">
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#1a1e28]/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {sub.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.division_role}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.phone_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[#67C23A]/20 text-[#9fe275]">
                          {sub.opt_kepuasan_keseluruhan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.yt_kebutuhan_layanan}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.yt_bersedia_info}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.yt_bersedia_dokumentasi}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                        {sub.ur_kritik_saran || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
