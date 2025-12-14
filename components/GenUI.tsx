import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface GenUIProps {
  type: 'line-chart' | 'bar-chart' | 'area-chart' | string;
  data: any[];
  config?: any;
}

export function GenUI({ type, data, config }: GenUIProps) {
  const xKey = config?.xKey || 'name';
  const yKey = config?.yKey || 'value';
  const color = config?.color || '#8884d8';

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[300px] mt-4 p-4 bg-neutral-900/50 rounded-xl border border-white/5 animate-in fade-in zoom-in-95 duration-500">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line-chart' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xKey} stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={{ fill: color }} />
          </LineChart>
        ) : type === 'bar-chart' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xKey} stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
             <Tooltip 
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
                <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey={xKey} stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey={yKey} stroke={color} fillOpacity={1} fill="url(#colorY)" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}