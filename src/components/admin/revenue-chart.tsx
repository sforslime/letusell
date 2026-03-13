"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNGN } from "@/lib/utils/currency";

export interface RevenueDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-gray-400">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brand-500, #f97316)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-brand-500, #f97316)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v: number) =>
            v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`
          }
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            name === "revenue" ? formatNGN(value) : value,
            name === "revenue" ? "Revenue" : "Orders",
          ]}
          labelStyle={{ fontSize: 12, color: "#374151", fontWeight: 600 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 12,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-brand-500, #f97316)"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
