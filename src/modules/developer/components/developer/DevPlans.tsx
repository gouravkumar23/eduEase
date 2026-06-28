"use client";

import React, { useState, useEffect } from 'react';
import { Layers, Plus, X, Loader2, Check, CreditCard as Edit2, Trash2, DollarSign } from 'lucide-react';
import { db } from '../../../../core/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PlanService } from '../../../admin/services/PlanService';
import { Plan } from '../../../admin/services/PlanService';

export default function DevPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Form States
  const [planId, setPlanId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [billingCycle, setBillingCycle] = useState<Plan['billingCycle']>('monthly');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await PlanService.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const finalPlanId = editingPlan ? editingPlan.planId : planId.toLowerCase().replace(/\s+/g, '-');

    const planData: Plan = {
      planId: finalPlanId,
      name,
      price,
      billingCycle,
      features,
      status
    };

    try {
      await PlanService.createPlan(planData);
      alert(editingPlan ? 'Plan updated successfully!' : 'Plan created successfully!');
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setBillingCycle(plan.billingCycle);
    setFeatures(plan.features || []);
    setStatus(plan.status);
    setShowCreateModal(true);
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'plans', plan.planId));
      alert('Plan deleted successfully.');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures(prev => [...prev, newFeature.trim()]);
    setNewFeature('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingPlan(null);
    setPlanId('');
    setName('');
    setPrice(0);
    setBillingCycle('monthly');
    setFeatures([]);
    setNewFeature('');
    setStatus('active');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Plans</h2>
          <p className="text-slate-400 text-sm">Configure subscription plans and pricing tiers.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
        >
          <Plus size={18} /> Create Plan
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No plans configured yet.</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.planId} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(plan)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(plan)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {plan.status}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">
                    {plan.billingCycle}
                  </span>
                </div>

                <h3 className="text-xl font-black text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-black text-white mb-6 flex items-baseline">
                  <DollarSign size={20} className="text-slate-500" />
                  {plan.price}
                  <span className="text-xs text-slate-500 font-normal ml-1">/ cycle</span>
                </div>

                <ul className="space-y-2 text-sm text-slate-400 mb-6">
                  {plan.features?.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check size={14} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white text-lg">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {!editingPlan && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Plan ID</label>
                  <input 
                    type="text" 
                    value={planId} 
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="e.g. yearly-enterprise"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Plan Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="e.g. Yearly Enterprise"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Price (USD)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Billing Cycle</label>
                <select 
                  value={billingCycle} 
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="trial">Trial</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Features</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={newFeature} 
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Add feature..."
                  />
                  <button 
                    type="button" 
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {features.map((feat, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs text-slate-300">
                      <span>{feat}</span>
                      <button type="button" onClick={() => handleRemoveFeature(idx)} className="text-rose-400 hover:text-rose-600">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}