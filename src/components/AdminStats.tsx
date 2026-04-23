"use client";

import { GraduationCap, Users, Database, FileCheck } from 'lucide-react';
import StatCard from './StatCard';

interface AdminStatsProps {
  stats: {
    faculty: number;
    students: number;
    exams: number;
    submissions: number;
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCard title="Total Faculty" value={stats.faculty} icon={GraduationCap} color="bg-indigo-600" />
      <StatCard title="Total Students" value={stats.students} icon={Users} color="bg-emerald-600" />
      <StatCard title="Total Assessments" value={stats.exams} icon={Database} color="bg-amber-600" />
      <StatCard title="Total Submissions" value={stats.submissions} icon={FileCheck} color="bg-rose-600" />
    </div>
  );
}