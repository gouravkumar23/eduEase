"use client";

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  X, 
  Loader2, 
  Check, 
  ShieldCheck,
  Calendar,
  Users,
  Building2
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { License, LicenseService } from '../../services/LicenseService';
import { Institution } from '../../repositories/InstitutionRepository';
import { Plan } from '../../services/PlanService';

export default function DevLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form States
  const [selectedInst, setSelectedInst] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [licenseType, setLicenseType] = useState<License['licenseType']>('yearly');
  const [adminLimit, setAdminLimit] = useState(5);
  const [clientLimit, setClientLimit] = useState(1000);
  const [durationDays, setDurationDays] = useState(365);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licSnap, instSnap, planSnap] = await Promise.all([
        getDocs(collection(db, 'licenses')),
        getDocs(collection(db, 'institutions')),
        getDocs(collection(db, 'plans'))
      ]);

      setLicenses(licSnap.docs.map(d => d.data() as License));
      setInstitutions(instSnap.docs.map(d => d.data() as Institution));
      setPlans(planSnap.docs.map(d => d.data() as Plan));
    } catch (error) {
      console.error('Error fetching licenses data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setSubmitting(true);

    try {
      await LicenseService.createLicense(
        selectedInst,
        licenseType,
        adminLimit,
        clientLimit,
        durationDays
      );
      alert('License created successfully!');
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating license:', error);
      alert('Failed to create license.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedInst('');
    setSelectedPlan('');
    setLicenseType('yearly');
    setAdminLimit(5);
    setClientLimit(1000);
    setDurationDays(365);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Licenses</h2>
          <p className="text-slate-400 text-sm">Issue and manage enterprise activation keys.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Create License
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : licenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No licenses issued yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">License ID</th>
                  <th className="px-6 py-4">Institution</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Limits</th>
                  <th className="px-6 py-4">Expiry</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {licenses.map(lic => {
                  const inst = institutions.find(i => i.institutionId === lic.institutionId);
                  return (
                    <tr key={lic.licenseId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-indigo-400">{lic.licenseId.substring(0, 8)}...</td>
                      <td className="px-6 py-4 font-bold text-white">{inst?.institutionName || lic.institutionId}</td>
                      <td className="px-6 py-4 capitalize">{lic.licenseType}</td>
                      <td className="px-6 py-4 text-xs">
                        Admins: {lic.adminLimit} | Clients: {lic.clientLimit}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {new Date(lic.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          lic.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {lic.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">Issue Enterprise License</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign Institution</label>
                <select 
                  value={selectedInst} 
                  onChange={(e) => setSelectedInst(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  required
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.institutionId} value={inst.institutionId}>{inst.institutionName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">License Type</label>
                <select 
                  value={licenseType} 
                  onChange={(e) => setLicenseType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="trial">Trial</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Admin Limit</label>
                  <input 
                    type="number" 
                    value={adminLimit} 
                    onChange={(e) => setAdminLimit(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Client Limit</label>
                  <input 
                    type="number" 
                    value={clientLimit} 
                    onChange={(e) => setClientLimit(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Duration (Days)</label>
                <input 
                  type="number" 
                  value={durationDays} 
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Issue License
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}