import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { getApiErrorMessage } from '@/api/client';
import {
  useOwnerServicePlans,
  useUpdateOwnerServicePlan,
} from '@/api/owner/servicePlans';
import { useLang, useToast } from '@/app/providers';
import { formatNumber } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { localized } from '@/lib/localized';
import { useNoIndexMeta } from '@/features/ownerAuth';
import { Badge, Button, Card, Input, Select, Skeleton, Switch } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/shared';
import { ServicePlanFormModal } from '@/features/ownerServicePlans/ServicePlanFormModal';
import { DeleteServicePlanDialog } from '@/features/ownerServicePlans/DeleteServicePlanDialog';

export default function OwnerServicePlansPage() {
  const { t } = useTranslation(['ownerServicePlans', 'common']);
  const { lang } = useLang();
  const toast = useToast();

  useNoIndexMeta();

  const [selectedGroup, setSelectedGroup] = useState('');
  const [search, setSearch] = useState('');
  const [formState, setFormState] = useState({ open: false, plan: null });
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    document.title = t('ownerServicePlans:pageTitle');
  }, [t, lang]);

  // Fetch all plans to know available groups, and pass ?group= when selected
  const { data: allPlansForGroups = [] } = useOwnerServicePlans({});
  const {
    data: plans = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOwnerServicePlans(selectedGroup ? { group: selectedGroup } : {});

  const updateMutation = useUpdateOwnerServicePlan();

  const availableGroups = useMemo(() => {
    const set = new Set();
    for (const p of allPlansForGroups) {
      if (p?.group) set.add(p.group);
    }
    if (selectedGroup) set.add(selectedGroup);
    return Array.from(set).sort();
  }, [allPlansForGroups, selectedGroup]);

  const filteredPlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        p.name?.ar?.toLowerCase().includes(q) ||
        p.name?.en?.toLowerCase().includes(q) ||
        p.description?.ar?.toLowerCase().includes(q) ||
        p.description?.en?.toLowerCase().includes(q) ||
        p.group?.toLowerCase().includes(q)
    );
  }, [plans, search]);

  const hasFilters = Boolean(selectedGroup || search.trim());

  const handleToggleActive = async (plan) => {
    setTogglingId(plan.id);
    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        isActive: !plan.isActive,
      });
      toast.success(t('ownerServicePlans:toasts.updated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              id="service-plans-page-heading"
              className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight"
            >
              {t('ownerServicePlans:heading')}
            </h1>
            <Badge variant="primary" size="sm" className="font-mono">
              {t('ownerServicePlans:totalBadge', { count: formatNumber(plans.length) })}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            {t('ownerServicePlans:subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            loading={isFetching && !isLoading}
            iconLeading={<span className="material-symbols-outlined text-[18px]">refresh</span>}
          >
            {t('ownerServicePlans:refresh')}
          </Button>
          <Button
            variant="primary-gradient"
            size="sm"
            onClick={() => setFormState({ open: true, plan: null })}
            iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
          >
            {t('ownerServicePlans:addPlan')}
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card padding="sm" className="bg-surface-container-low">
        <search aria-label={t('ownerServicePlans:filters.regionLabel')}>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="sp-search-input" className="visually-hidden">
                {t('ownerServicePlans:filters.searchLabel')}
              </label>
              <Input
                id="sp-search-input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('ownerServicePlans:filters.searchPlaceholder')}
                iconLeading={<span className="material-symbols-outlined text-[20px]">search</span>}
              />
            </div>

            <div className="w-full md:w-56 shrink-0">
              <label htmlFor="sp-group-filter" className="visually-hidden">
                {t('ownerServicePlans:filters.groupLabel')}
              </label>
              <Select
                id="sp-group-filter"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">{t('ownerServicePlans:filters.allGroups')}</option>
                {availableGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
              </Select>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearch('');
                  setSelectedGroup('');
                }}
                iconLeading={<span className="material-symbols-outlined text-[18px]">filter_alt_off</span>}
              >
                {t('ownerServicePlans:filters.reset')}
              </Button>
            )}
          </div>
        </search>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card padding="md" className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/5" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </Card>
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon="design_services"
          title={t('ownerServicePlans:empty.title')}
          description={
            hasFilters
              ? t('ownerServicePlans:empty.filteredDescription')
              : t('ownerServicePlans:empty.description')
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedGroup('');
                }}
              >
                {t('ownerServicePlans:filters.reset')}
              </Button>
            ) : (
              <Button
                variant="primary-gradient"
                size="sm"
                onClick={() => setFormState({ open: true, plan: null })}
                iconLeading={<span className="material-symbols-outlined text-[18px]">add</span>}
              >
                {t('ownerServicePlans:addPlan')}
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <Card padding="none" className="hidden lg:block overflow-hidden">
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="service-plans-page-heading"
              className="overflow-x-auto"
            >
              <table className="w-full text-start border-collapse text-sm">
                <caption className="visually-hidden">
                  {t('ownerServicePlans:table.caption')}
                </caption>
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/80 text-on-surface-variant text-xs font-semibold">
                    <th scope="col" className="py-3.5 px-4 text-start">
                      {t('ownerServicePlans:table.plan')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start">
                      {t('ownerServicePlans:table.group')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-start">
                      {t('ownerServicePlans:table.startingPrice')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      {t('ownerServicePlans:table.deliveryDays')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      {t('ownerServicePlans:table.featuresCount')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      {t('ownerServicePlans:table.sortOrder')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-center">
                      {t('ownerServicePlans:table.status')}
                    </th>
                    <th scope="col" className="py-3.5 px-4 text-end">
                      {t('ownerServicePlans:table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="hover:bg-surface-container-high/40 transition-colors"
                    >
                      <th scope="row" className="py-3.5 px-4 text-start max-w-xs">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-on-surface break-words">
                                {localized(plan.name, lang)}
                              </span>
                              {plan.isPopular && (
                                <Badge variant="primary" size="sm">
                                  {t('ownerServicePlans:status.popular')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-on-surface-variant mt-0.5 truncate">
                              {lang === 'ar' ? (
                                <bdi dir="ltr">{plan.name?.en}</bdi>
                              ) : (
                                plan.name?.ar
                              )}
                            </div>
                          </div>
                        </div>
                      </th>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-mono text-xs">
                          <bdi dir="ltr">{plan.group}</bdi>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-primary whitespace-nowrap">
                        {formatMoney(plan.startingPrice, lang)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-on-surface-variant whitespace-nowrap">
                        {t('ownerServicePlans:table.daysValue', {
                          days: formatNumber(plan.deliveryDays),
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center text-on-surface-variant whitespace-nowrap">
                        {t('ownerServicePlans:table.featuresValue', {
                          count: formatNumber(plan.features?.length || 0),
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-on-surface-variant">
                        {formatNumber(plan.sortOrder ?? 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2.5">
                          <Badge
                            variant={plan.isActive ? 'success' : 'neutral'}
                            dot
                            size="sm"
                          >
                            {plan.isActive
                              ? t('ownerServicePlans:status.active')
                              : t('ownerServicePlans:status.inactive')}
                          </Badge>
                          <Switch
                            checked={Boolean(plan.isActive)}
                            disabled={togglingId === plan.id}
                            onChange={() => handleToggleActive(plan)}
                            aria-label={t('ownerServicePlans:actions.toggleActive')}
                            className="!py-0 !min-h-[44px]"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('ownerServicePlans:actions.edit')}
                            title={t('ownerServicePlans:actions.edit')}
                            onClick={() => setFormState({ open: true, plan })}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('ownerServicePlans:actions.delete')}
                            title={t('ownerServicePlans:actions.delete')}
                            onClick={() => setDeletingPlan(plan)}
                            className="hover:text-error hover:bg-error/10"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile & Tablet Stacked Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} padding="sm" className="space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[11px]">
                          <bdi dir="ltr">{plan.group}</bdi>
                        </span>
                        {plan.isPopular && (
                          <Badge variant="primary" size="sm">
                            {t('ownerServicePlans:status.popular')}
                          </Badge>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-on-surface mt-1.5 break-words">
                        {localized(plan.name, lang)}
                      </h2>
                      <p className="text-xs text-on-surface-variant break-words">
                        {lang === 'ar' ? (
                          <bdi dir="ltr">{plan.name?.en}</bdi>
                        ) : (
                          plan.name?.ar
                        )}
                      </p>
                    </div>
                    <Badge variant={plan.isActive ? 'success' : 'neutral'} dot size="sm">
                      {plan.isActive
                        ? t('ownerServicePlans:status.active')
                        : t('ownerServicePlans:status.inactive')}
                    </Badge>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {localized(plan.description, lang)}
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs pt-1 flex-wrap">
                    <span className="text-sm font-bold text-primary">
                      {formatMoney(plan.startingPrice, lang)}
                    </span>
                    <span className="text-on-surface-variant font-mono">
                      {t('ownerServicePlans:table.daysValue', {
                        days: formatNumber(plan.deliveryDays),
                      })}{' '}
                      •{' '}
                      {t('ownerServicePlans:table.featuresValue', {
                        count: formatNumber(plan.features?.length || 0),
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                  <Switch
                    checked={Boolean(plan.isActive)}
                    disabled={togglingId === plan.id}
                    onChange={() => handleToggleActive(plan)}
                    label={t('ownerServicePlans:actions.toggleActive')}
                    className={clsx('!py-0 flex-1')}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="secondary"
                      size="icon-sm"
                      aria-label={t('ownerServicePlans:actions.edit')}
                      onClick={() => setFormState({ open: true, plan })}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('ownerServicePlans:actions.delete')}
                      onClick={() => setDeletingPlan(plan)}
                      className="text-error hover:bg-error/10"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      <ServicePlanFormModal
        isOpen={formState.open}
        plan={formState.plan}
        onClose={() => setFormState({ open: false, plan: null })}
      />

      {/* Delete Confirmation */}
      <DeleteServicePlanDialog
        plan={deletingPlan}
        onClose={() => setDeletingPlan(null)}
      />
    </div>
  );
}
