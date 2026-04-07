"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const lineData = [
  { month: "Jan", leads: 45 },
  { month: "Fev", leads: 72 },
  { month: "Mar", leads: 58 },
  { month: "Abr", leads: 110 },
  { month: "Mai", leads: 89 },
  { month: "Jun", leads: 134 },
];

const pieData = [
  { name: "WordPress", value: 45, color: "#465FFF" },
  { name: "WhatsApp", value: 30, color: "#12B76A" },
  { name: "Landing Page", value: 15, color: "#F79009" },
  { name: "Outros", value: 10, color: "#98A2B3" },
];

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Area Chart */}
      <div className="col-span-12 xl:col-span-7 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Leads por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={lineData}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#465FFF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#465FFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#667085" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 13 }} />
            <Area type="monotone" dataKey="leads" stroke="#465FFF" strokeWidth={2} fill="url(#colorLeads)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="col-span-12 xl:col-span-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Leads por Fonte</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
              formatter={(value: string) => <span className="text-sm text-gray-700 dark:text-gray-400 ml-1">{value}</span>} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
