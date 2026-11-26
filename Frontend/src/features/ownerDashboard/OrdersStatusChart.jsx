import React, { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useLang, useTheme } from '../../app/providers';
import { Card } from '../../components/ui';
import { EmptyState } from '../../components/shared';
import { formatNumber } from '../../lib/format';

// Nexus Dark Chart Palette: #5B9BFF #8B7CFF #8FD0FF #6A5BDB #34D399 #FBBF24 (+ semantic danger/muted)
const STATUS_COLORS_DARK = {
  delivered: '#34D399',
  paid: '#5B9BFF',
  awaiting_review: '#FBBF24',
  pending_payment: '#8B7CFF',
  rejected: '#F87171',
  cancelled: '#97A2CB',
  refunded: '#6A5BDB',
  expired: '#8FD0FF',
};

// Nexus Light Chart Palette: #2B72CF #5443A9 #8FD0FF #6A5BDB #0E9F6E #F59E0B (+ semantic danger/muted)
const STATUS_COLORS_LIGHT = {
  delivered: '#0E9F6E',
  paid: '#2B72CF',
  awaiting_review: '#F59E0B',
  pending_payment: '#5443A9',
  rejected: '#C81E1E',
  cancelled: '#5C6289',
  refunded: '#6A5BDB',
  expired: '#8FD0FF',
};

function StatusTooltip({ active, payload, dir }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0]?.payload;
  if (!entry) return null;

  return (
    <div
      dir={dir}
      className="rounded-xl border border-card-border bg-card px-3 py-2 shadow-card-hover text-xs"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: entry.color }}
        />
        <span className="font-semibold text-on-surface">{entry.label}</span>
        <span className="font-mono font-bold text-primary ms-2">
          {formatNumber(entry.count)}
        </span>
      </div>
    </div>
  );
}

export function OrdersStatusChart({ ordersByStatus = [] }) {
  const { t } = useTranslation(['ownerDashboard', 'common']);
  const { dir } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const palette = isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;

  const { items, totalOrders } = useMemo(() => {
    const valid = (ordersByStatus || []).filter((item) => item?.status && item.count > 0);
    const total = valid.reduce((sum, item) => sum + Number(item.count || 0), 0);
    const mapped = valid.map((item) => ({
      status: item.status,
      count: Number(item.count) || 0,
      label: t(`common:status.order.${item.status}`, {
        defaultValue: item.status,
      }),
      color: palette[item.status] || (isDark ? '#5B9BFF' : '#2B72CF'),
      percent: total > 0 ? Math.round(((Number(item.count) || 0) / total) * 100) : 0,
    }));
    return { items: mapped, totalOrders: total };
  }, [ordersByStatus, palette, isDark, t]);

  return (
    <Card variant="default" className="flex flex-col justify-between h-full">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-bold text-on-surface">
          {t('ownerDashboard:charts.ordersByStatusTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
          {t('ownerDashboard:charts.ordersByStatusSubtitle', {
            count: totalOrders,
          })}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="donut_large"
          title={t('ownerDashboard:charts.ordersEmptyTitle')}
          description={t('ownerDashboard:charts.ordersEmptyDesc')}
          className="min-h-[260px]"
        />
      ) : (
        <div className="flex flex-col gap-5 flex-1 justify-between">
          {/* Donut Chart (decorative visual — full accessible breakdown is provided in the legend list below) */}
          <div className="relative h-[200px] w-full" dir="ltr" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer={false}>
                <Pie
                  data={items}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={items.length > 1 ? 3 : 0}
                  stroke="none"
                  rootTabIndex={-1}
                  animationDuration={300}
                  animationEasing="ease-out"
                >
                  {items.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<StatusTooltip dir={dir} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-on-surface font-mono leading-none">
                {formatNumber(totalOrders)}
              </span>
              <span className="text-[11px] text-on-surface-variant mt-1">
                {t('ownerDashboard:charts.ordersTotalLabel')}
              </span>
            </div>
          </div>

          {/* Accessible Legend List */}
          <ul className="space-y-2">
            {items.map((entry) => (
              <li
                key={entry.status}
                className="flex items-center justify-between gap-2 text-xs py-2 px-3 rounded-lg bg-section-band border border-card-border"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span className="text-on-surface font-medium truncate">
                    {entry.label}
                  </span>
                </span>
                <span className="font-mono text-on-surface-variant shrink-0">
                  <strong className="text-on-surface font-semibold">
                    {formatNumber(entry.count)}
                  </strong>{' '}
                  ({formatNumber(entry.percent)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
