import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useLang, useTheme } from '../../app/providers';
import { Card } from '../../components/ui';
import { EmptyState } from '../../components/shared';
import { formatMoney, piastersToEgp } from '../../lib/money';
import { formatNumber } from '../../lib/format';

function buildTwelveMonthSeries(revenueByMonth = [], lang = 'ar') {
  const lookup = new Map();
  for (const item of revenueByMonth) {
    if (!item?.year || !item?.month) continue;
    lookup.set(`${item.year}-${item.month}`, {
      revenuePiasters: Number(item.revenue) || 0,
      ordersCount: Number(item.ordersCount) || 0,
    });
  }

  const locale = lang === 'en' ? 'en-US' : 'ar-EG-u-nu-latn';
  const shortMonthFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
  });
  const fullMonthFormatter = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  });

  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth(); // 0-indexed

  const series = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(baseYear, baseMonth - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const match = lookup.get(`${year}-${month}`);
    const revenuePiasters = match?.revenuePiasters ?? 0;

    series.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      shortLabel: shortMonthFormatter.format(date),
      fullLabel: fullMonthFormatter.format(date),
      revenuePiasters,
      revenueEgp: piastersToEgp(revenuePiasters),
      ordersCount: match?.ordersCount ?? 0,
    });
  }

  return series;
}

function CustomRevenueTooltip({ active, payload, lang, dir, t }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      dir={dir}
      className="rounded-xl border border-card-border bg-card px-3.5 py-2.5 shadow-card-hover text-xs min-w-[160px]"
    >
      <div className="font-semibold text-on-surface mb-1.5">
        {point.fullLabel}
      </div>
      <div className="flex items-center justify-between gap-4 text-on-surface-variant">
        <span>{t('charts.revenueSeries')}</span>
        <span className="font-mono font-bold text-primary">
          {formatMoney(point.revenuePiasters, lang)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-on-surface-variant mt-1">
        <span>{t('charts.ordersSeries')}</span>
        <span className="font-mono font-semibold text-on-surface">
          {formatNumber(point.ordersCount)}
        </span>
      </div>
    </div>
  );
}

export function RevenueTrendChart({ revenueByMonth = [] }) {
  const { t } = useTranslation('ownerDashboard');
  const { lang, dir } = useLang();
  const { theme } = useTheme();
  const isRtl = dir === 'rtl';
  const isDark = theme === 'dark';

  const series = useMemo(
    () => buildTwelveMonthSeries(revenueByMonth, lang),
    [revenueByMonth, lang]
  );

  const hasData = useMemo(
    () => series.some((item) => item.revenuePiasters > 0 || item.ordersCount > 0),
    [series]
  );

  // Nexus Chart Palettes (Light & Dark)
  const chartColors = isDark
    ? {
        stroke: '#5B9BFF',
        strokeEnd: '#8B7CFF',
        grid: '#222D52',
        tick: '#97A2CB',
        dotFill: '#121B38',
      }
    : {
        stroke: '#2B72CF',
        strokeEnd: '#5443A9',
        grid: '#E6EAF5',
        tick: '#5C6289',
        dotFill: '#FFFFFF',
      };

  const formatCompactEgp = (val) => {
    const num = Number(val);
    if (!Number.isFinite(num) || num === 0) return '0';
    if (num >= 1000) {
      return `${formatNumber(num / 1000, { maximumFractionDigits: 1 })}k`;
    }
    return formatNumber(num);
  };

  return (
    <Card variant="default" className="flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            {t('charts.revenueTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t('charts.revenueSubtitle')}
          </p>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon="show_chart"
          title={t('charts.revenueEmptyTitle')}
          description={t('charts.revenueEmptyDesc')}
          className="min-h-[260px]"
        />
      ) : (
        <div className="w-full h-[280px] sm:h-[300px]" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{
                top: 10,
                right: isRtl ? 4 : 16,
                left: isRtl ? 16 : 4,
                bottom: 4,
              }}
            >
              <defs>
                <linearGradient id="bcRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColors.stroke}
                    stopOpacity={isDark ? 0.36 : 0.26}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColors.strokeEnd}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={chartColors.grid}
              />

              <XAxis
                dataKey="shortLabel"
                reversed={isRtl}
                tick={{ fill: chartColors.tick, fontSize: 12 }}
                axisLine={{ stroke: chartColors.grid }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />

              <YAxis
                orientation={isRtl ? 'right' : 'left'}
                width={56}
                tickFormatter={formatCompactEgp}
                tick={{ fill: chartColors.tick, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip
                content={
                  <CustomRevenueTooltip lang={lang} dir={dir} t={t} />
                }
                cursor={{ stroke: chartColors.stroke, strokeOpacity: 0.35 }}
              />

              <Area
                type="monotone"
                dataKey="revenueEgp"
                stroke={chartColors.stroke}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#bcRevenueGradient)"
                animationDuration={300}
                animationEasing="ease-out"
                activeDot={{
                  r: 5,
                  stroke: chartColors.stroke,
                  strokeWidth: 2,
                  fill: chartColors.dotFill,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
