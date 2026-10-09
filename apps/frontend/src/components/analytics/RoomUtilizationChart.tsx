'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mapRoomUtilizationChartData } from '@/features/analytics/display';
import { RoomUtilization } from '@/features/analytics/types';

interface RoomUtilizationChartProps {
  roomUtilization: RoomUtilization[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function RoomUtilizationChart({ roomUtilization }: RoomUtilizationChartProps) {
  const data = mapRoomUtilizationChartData(roomUtilization);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Room Utilization (%)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No rooms to report for this date range.
          </div>
        ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Utilization']}
              />
              <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
