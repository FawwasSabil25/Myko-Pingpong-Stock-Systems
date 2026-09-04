"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUpIcon, type LucideIcon } from "lucide-react";

export type ChannelSplit = {
  channel: string;
  value: string;
};

export type SalesMetric = {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  channels: ChannelSplit[];
};

type SalesMetricCardProps = {
  metric: SalesMetric;
  icon: LucideIcon;
  index: number;
};

const easing = [0.23, 1, 0.32, 1] as const;

export function SalesMetricCard({
  metric,
  icon: Icon,
  index
}: SalesMetricCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easing, delay: index * 0.05 }}
      className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-white to-brand-100 p-5 shadow-card"
      aria-label={metric.label}
    >
      <p className="flex items-center gap-2 text-sm font-bold text-brand-700">
        <Icon className="h-5 w-5 text-brand-600" strokeWidth={2.2} aria-hidden="true" />
        {metric.label}
      </p>

      <p className="mt-2 text-4xl font-extrabold tracking-tight text-brand-900">{metric.value}</p>

      {metric.channels && metric.channels.length > 0 && (
        <dl className="mt-4 space-y-1.5 border-t border-brand-100 pt-3">
          {metric.channels.map((split, splitIndex) => (
            <div key={split.channel} className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span aria-hidden="true" className={['h-2 w-2 rounded-full', splitIndex === 0 ? 'bg-gradient-to-br from-brand-500 to-brand-900' : 'bg-gradient-to-br from-brand-200 to-brand-400'].join(' ')} />
                {split.channel}
              </dt>
              <dd className="text-sm font-bold text-brand-900">{split.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {metric.delta !== undefined && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-positive-50 to-brand-100 px-3 py-1 text-xs font-bold text-positive-600">
          <TrendingUpIcon className="h-3.5 w-3.5" aria-hidden="true" />+{metric.delta}%{' '}
          {metric.deltaLabel || 'dari periode sebelumnya'}
        </p>
      )}
    </motion.section>
  );
}
