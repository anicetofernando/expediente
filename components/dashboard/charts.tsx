"use client";

import * as React from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { CHART_CATEGORICAL, CHART_GRID, CHART_AXIS, CHART_MUTED_TEXT, CHART_STATUS } from "@/lib/chart-colors";
import {
  statusDistribution, typeDistribution, sectorDistribution, monthlyTrend, stageAvgTime, deadlineCompliance,
  productivityByUser,
} from "@/lib/dashboard-metrics";

const axisStyle = { fontSize: 11, fill: CHART_MUTED_TEXT };
const tickLine = false;
const axisLine = { stroke: CHART_AXIS };

function ChartTooltip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-graphite-200 bg-white px-3 py-2 text-[12px] shadow-popover">
      {label && <p className="mb-1 font-medium text-graphite-800">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-1.5 text-graphite-600">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color ?? p.payload?.color }} />
          {p.name}: <span className="font-medium tabular-nums text-graphite-900">{p.value}{suffix}</span>
        </p>
      ))}
    </div>
  );
}

export function StatusDistributionChart({ height = 220 }: { height?: number }) {
  const data = statusDistribution();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="#fff" strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 12, color: "#3d4653", lineHeight: "20px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TypeDistributionChart({ height = 220 }: { height?: number }) {
  const data = typeDistribution();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID} />
        <XAxis type="number" tick={axisStyle} tickLine={tickLine} axisLine={axisLine} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={tickLine} axisLine={false} width={128} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(38,79,140,0.06)" }} />
        <Bar dataKey="value" name="Processos" fill={CHART_CATEGORICAL[0]} radius={[0, 3, 3, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SectorDistributionChart({ height = 220 }: { height?: number }) {
  const data = sectorDistribution();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID} />
        <XAxis type="number" tick={axisStyle} tickLine={tickLine} axisLine={axisLine} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={tickLine} axisLine={false} width={168} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(38,79,140,0.06)" }} />
        <Bar dataKey="value" name="Processos" fill={CHART_STATUS.navy} radius={[0, 3, 3, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendChart({ height = 220 }: { height?: number }) {
  const data = monthlyTrend();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRecebidos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_CATEGORICAL[0]} stopOpacity={0.22} />
            <stop offset="100%" stopColor={CHART_CATEGORICAL[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={tickLine} axisLine={axisLine} />
        <YAxis tick={axisStyle} tickLine={tickLine} axisLine={false} width={30} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#3d4653" }} />
        <Area type="monotone" dataKey="recebidos" name="Recebidos" stroke={CHART_CATEGORICAL[0]} strokeWidth={2} fill="url(#gradRecebidos)" dot={false} />
        <Line type="monotone" dataKey="concluidos" name="Concluídos" stroke={CHART_CATEGORICAL[2]} strokeWidth={2} dot={{ r: 2.5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StageAvgTimeChart({ height = 220 }: { height?: number }) {
  const data = stageAvgTime();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 4, bottom: 0 }} barCategoryGap={16}>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={tickLine} axisLine={axisLine} />
        <YAxis tick={axisStyle} tickLine={tickLine} axisLine={false} width={30} />
        <Tooltip content={<ChartTooltip suffix=" dias" />} cursor={{ fill: "rgba(38,79,140,0.06)" }} />
        <Bar dataKey="dias" name="Dias em média" fill={CHART_STATUS.navy} radius={[3, 3, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DeadlineComplianceChart({ height = 220 }: { height?: number }) {
  const data = deadlineCompliance();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 4, bottom: 0 }} barCategoryGap={14}>
        <CartesianGrid vertical={false} stroke={CHART_GRID} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={tickLine} axisLine={axisLine} />
        <YAxis tick={axisStyle} tickLine={tickLine} axisLine={false} width={30} unit="%" />
        <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ fill: "rgba(38,79,140,0.06)" }} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, color: "#3d4653" }} />
        <Bar dataKey="noPrazo" name="Dentro do prazo" stackId="a" fill={CHART_STATUS.success} radius={[0, 0, 0, 0]} maxBarSize={28} />
        <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill={CHART_STATUS.crimson} radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopProductivityChart({ height = 220 }: { height?: number }) {
  const data = productivityByUser()
    .slice(0, 6)
    .map((u) => ({ name: u.nome, value: u.concluidos }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={10}>
        <CartesianGrid horizontal={false} stroke={CHART_GRID} />
        <XAxis type="number" tick={axisStyle} tickLine={tickLine} axisLine={axisLine} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={tickLine} axisLine={false} width={128} />
        <Tooltip content={<ChartTooltip suffix=" processos" />} cursor={{ fill: "rgba(38,79,140,0.06)" }} />
        <Bar dataKey="value" name="Concluídos" fill={CHART_STATUS.navy} radius={[0, 3, 3, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
