"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, CreditCard as Edit2, Trash2, Eye, X, Loader2, Check, Upload, AlertCircle, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { db } from '../../../core/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Institution } from '../../repositories/InstitutionRepository';

export default function DevInstitutions() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<Institution | null>(null);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  
  // Form States
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<'university' | 'college' | 'school' | 'corporate' | 'other'>('university');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logo, setLogo] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'pending'>('active');
  const [domain, setDomain] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'institutions'));
      const data = snap.docs.map(d => d.data() as Institution);
      setInstitutions(data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setLogo(data.secure_url);
    } catch (error) {
      alert('Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const instId = editingInst ? editingInst.institutionId : domain.replace(/\./g, '-');

    const instData: Institution = {
      institutionId: instId,
      institutionName: name,
      institutionType: type,
      website,
      address,
      city,
      state,
      country,
      postalCode: pincode,
      contactEmail,
      contactPhone,
      logo,
      status,
      domain: domain.toLowerCase().trim(),
      createdAt: editingInst ? editingInst.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: editingInst ? editingInst.settings : {
        secureBrowserRequired: false,
        aiEnabled: true,
        maxUsers: 1000
      }
    };

    try {
      await setDoc(doc(db, 'institutions', instId), instData, { merge: true });
      alert(editingInst ? 'Institution updated successfully!' : 'Institution created successfully!');
      resetForm();
      fetchInstitutions();
    } catch (error) {
      console.error('Error saving institution:', error);
      alert('Failed to save institution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (inst: Institution) => {
    setEditingInst(inst);
    setName(inst.institutionName);
    setType(inst.institutionType);
    setWebsite(inst.website || '');
    setAddress(inst.address || '');
    setCity(inst.city || '');
    setState(inst.state || '');
    setCountry(inst.country || '');
    setPincode(inst.postalCode || '');
    setContactEmail(inst.contactEmail);
    setContactPhone(inst.contactPhone || '');
    setLogo(inst.logo || '');
    setStatus(inst.status);
    setDomain(inst.domain);
    setStep(1);
    setShowCreateModal(true);
  };

  const handleDeactivate = async (inst: Institution) => {
    const newStatus = inst.status === 'suspended' ? 'active' : 'suspended';
    if (!confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'deactivate' : 'activate'} ${inst.institutionName}?`)) return;

    try {
      await updateDoc(doc(db, 'institutions', inst.institutionId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      alert(`Institution status updated to ${newStatus}.`);
      fetchInstitutions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (inst: Institution) => {
    if (!confirm(`Are you sure you want to soft-delete ${inst.institutionName}? This will mark it as suspended.`)) return;

    try {
      await updateDoc(doc(db, 'institutions', inst.institutionId), {
        status: 'suspended',
        isDeleted: true,
        updatedAt: new Date().toISOString()
      });
      alert('Institution soft-deleted successfully.');
      fetchInstitutions();
    } catch (error) {
      console.error('Error deleting institution:', error);
    }
  };

  const resetForm = () => {
    setEditingInst(null);
    setName('');
    setType('university');
    setWebsite('');
    setAddress('');
    setCity('');
    setState('');
    setCountry('');
    setPincode('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setLogo('');
    setStatus('active');
    setDomain('');
    setStep(1);
    setShowCreateModal(false);
  };

  const filtered = institutions.filter(inst => {
    const matchesSearch = inst.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inst.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || inst.institutionType === filterType;
    const matchesStatus = filterStatus === 'all' || inst.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Institutions</h2>
          <p className="text-slate-400 text-sm">Manage enterprise tenants and configurations.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Create Institution
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or domain..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">All Types</option>
          <option value="university">University</option>
          <option value="college">College</option>
          <option value="school">School</option>
          <option value="corporate">Corporate</option>
          <option value="other">Other</option>
        </select>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No institutions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Logo</th>
                  <th className="px-6 py-4">Name & Domain</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((inst) => (
                  <tr key={inst.institutionId} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      {inst.logo ? (
                        <img src={inst.logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover border border-slate-800" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                          <Building2 size={20} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{inst.institutionName}</div>
                      <div className="text-xs text-slate-500">{inst.domain}</div>
                    </td>
                    <td className="px-6 py-4 capitalize">{inst.institutionType}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        inst.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inst.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setShowDetailsModal(inst)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleEdit(inst)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeactivate(inst)}
                          className={`p-2 rounded-lg transition-all ${
                            inst.status === 'suspended' ? 'text-emerald-400 hover:bg-slate-800' : 'text-amber-400 hover:bg-slate-800'
                          }`}
                          title={inst.status === 'suspended' ? 'Activate' : 'Deactivate'}
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(inst)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Soft Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">
                {editingInst ? 'Edit Institution' : 'Create Institution'} - Step {step} of 3
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 overflow-y-auto flex-1 space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Institution Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="e.g. Stanford University"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Institution Type</label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      <option value="university">University</option>
                      <option value="college">College</option>
                      <option value="school">School</option>
                      <option value="corporate">Corporate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Domain</label>
                    <input 
                      type="text" 
                      value={domain} 
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="e.g. stanford.edu"
                      disabled={!!editingInst}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Website</label>
                    <input 
                      type="url" 
                      value={website} 
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="e.g. https://stanford.edu"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Address</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Street Address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">City</label>
                      <input 
                        type="text" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">State</label>
                      <input 
                        type="text" 
                        value={state} 
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="State"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Country</label>
                      <input 
                        type="text" 
                        value={country} 
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Country"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pincode</label>
                      <input 
                        type="text" 
                        value={pincode} 
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contact Person</label>
                    <input 
                      type="text" 
                      value={contactPerson} 
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Contact Person Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contact Email</label>
                      <input 
                        type="email" 
                        value={contactEmail} 
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Contact Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Contact Phone</label>
                      <input 
                        type="tel" 
                        value={contactPhone} 
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        placeholder="Contact Phone"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Logo Upload</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors text-sm font-medium text-white">
                        {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {logo ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                      </label>
                      {logo && (
                        <img src={logo} alt="Logo Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-800" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label>
                    <select 
                      value={status} 
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-800">
                {step > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button 
                    type="button" 
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={submitting || uploading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    {editingInst ? 'Update' : 'Create'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">Institution Details</h3>
              <button onClick={() => setShowDetailsModal(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                {showDetailsModal.logo ? (
                  <img src={showDetailsModal.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-slate-800" />
                ) : (
                  <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                    <Building2 size={32} />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-white text-lg">{showDetailsModal.institutionName}</h4>
                  <p className="text-xs text-slate-500">{showDetailsModal.domain}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-indigo-400" />
                  <a href={showDetailsModal.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-400">
                    {showDetailsModal.website || 'No website provided'}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-indigo-400" />
                  <span>{showDetailsModal.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-indigo-400" />
                  <span>{showDetailsModal.contactPhone || 'No phone provided'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    {showDetailsModal.address ? `${showDetailsModal.address}, ` : ''}
                    {showDetailsModal.city ? `${showDetailsModal.city}, ` : ''}
                    {showDetailsModal.state ? `${showDetailsModal.state}, ` : ''}
                    {showDetailsModal.country ? `${showDetailsModal.country} ` : ''}
                    {showDetailsModal.postalCode ? `(${showDetailsModal.postalCode})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}