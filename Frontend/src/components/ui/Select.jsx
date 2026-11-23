import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { useTranslation } from 'react-i18next';

const MOTION_DURATION_MS = 300;
const TYPEAHEAD_RESET_MS = 500;
const MOBILE_QUERY = '(max-width: 639px)';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useIsMobileSheet() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, []);

  return isMobile;
}

function extractNodeText(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (React.isValidElement(node)) return extractNodeText(node.props?.children);
  return '';
}

function parseSelectChildren(children) {
  const blocks = [];
  const options = [];

  function walk(nodes, currentGroup = null, groupDisabled = false) {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;

      if (child.type === React.Fragment) {
        walk(child.props.children, currentGroup, groupDisabled);
        return;
      }

      if (child.type === 'optgroup') {
        const isGrpDisabled = groupDisabled || Boolean(child.props.disabled);
        const groupObj = {
          kind: 'group',
          key: child.key != null ? String(child.key) : `grp-${blocks.length}`,
          label: String(child.props.label ?? ''),
          disabled: isGrpDisabled,
          items: [],
        };
        blocks.push(groupObj);
        walk(child.props.children, groupObj, isGrpDisabled);
        return;
      }

      if (child.type === 'option') {
        const label = extractNodeText(child.props.children).trim() || String(child.props.label ?? '');
        const value =
          child.props.value !== undefined ? String(child.props.value) : label;
        const disabled = groupDisabled || Boolean(child.props.disabled);
        const optionIndex = options.length;
        const optionItem = {
          kind: 'option',
          key: child.key != null ? String(child.key) : `opt-${optionIndex}`,
          optionIndex,
          value,
          label,
          disabled,
        };
        options.push(optionItem);
        if (currentGroup) {
          currentGroup.items.push(optionItem);
        } else {
          blocks.push(optionItem);
        }
      }
    });
  }

  walk(children);
  return { blocks, options };
}

function normalizeSearchText(text) {
  return String(text || '')
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي');
}

function resolveAssociatedLabel(triggerEl, explicitLabel, ariaLabel, placeholder) {
  if (explicitLabel && typeof explicitLabel === 'string') {
    return explicitLabel.trim();
  }
  if (typeof document !== 'undefined' && triggerEl?.id) {
    const labelEl = document.querySelector(`label[for="${CSS.escape(triggerEl.id)}"]`);
    if (labelEl) {
      const clone = labelEl.cloneNode(true);
      clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
      const cleaned = clone.textContent.replace(/\s+/g, ' ').replace(/[:*]\s*$/, '').trim();
      if (cleaned) return cleaned;
    }
  }
  if (ariaLabel && typeof ariaLabel === 'string') {
    return ariaLabel.trim();
  }
  if (placeholder && typeof placeholder === 'string') {
    return placeholder.trim();
  }
  return '';
}

function findNextEnabledIndex(options, startIndex, direction) {
  if (!options.length) return -1;
  let idx = startIndex;
  for (let steps = 0; steps < options.length; steps += 1) {
    idx += direction;
    if (idx < 0 || idx >= options.length) return -1;
    if (!options[idx].disabled) return idx;
  }
  return -1;
}

function findEdgeEnabledIndex(options, fromEnd = false) {
  if (!options.length) return -1;
  if (fromEnd) {
    for (let i = options.length - 1; i >= 0; i -= 1) {
      if (!options[i].disabled) return i;
    }
    return -1;
  }
  for (let i = 0; i < options.length; i += 1) {
    if (!options[i].disabled) return i;
  }
  return -1;
}

export const Select = forwardRef(function Select(
  {
    children,
    className = '',
    error = false,
    disabled = false,
    iconLeading,
    placeholder,
    emptyText,
    label,
    id,
    name,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    required,
    autoComplete,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...restProps
  },
  forwardedRef
) {
  const { t } = useTranslation('common');
  const fallbackId = useId();
  const resolvedId = id || fallbackId;
  const listboxId = `${resolvedId}-listbox`;
  const sheetTitleId = `${resolvedId}-sheet-title`;

  const isMobile = useIsMobileSheet();
  const isControlled = value !== undefined;

  const { blocks, options } = useMemo(() => parseSelectChildren(children), [children]);
  const optionsSignature = useMemo(
    () => options.map((o) => `${o.value}\u0000${o.disabled ? 1 : 0}`).join('\u0001'),
    [options]
  );
  const hasEmptyOption = useMemo(() => options.some((o) => o.value === ''), [options]);

  const nativeSelectRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);
  const closeTimerRef = useRef(null);
  const openRafRef = useRef(null);
  const typeAheadBufferRef = useRef('');
  const typeAheadTimerRef = useRef(null);
  const pendingProgrammaticRef = useRef(null);

  const [internalValue, setInternalValue] = useState(() => {
    if (isControlled) return String(value ?? '');
    if (defaultValue !== undefined) return String(defaultValue ?? '');
    if (placeholder && !hasEmptyOption) return '';
    const firstEnabled = options.find((o) => !o.disabled);
    return firstEnabled ? firstEnabled.value : options[0]?.value ?? '';
  });

  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;

  const internalValueRef = useRef(internalValue);
  internalValueRef.current = internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [sheetTitle, setSheetTitle] = useState('');

  const selectedValue = isControlled ? String(value ?? '') : internalValue;
  const selectedIndex = useMemo(
    () => options.findIndex((opt) => opt.value === selectedValue),
    [options, selectedValue]
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const { refs, floatingStyles, placement, isPositioned } = useFloating({
    open: !isMobile && isRendered,
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({
        padding: 8,
        fallbackPlacements: ['top-start'],
      }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, availableHeight, elements }) {
          const innerMax = Math.max(120, Math.min(280, Math.floor(availableHeight - 16)));
          const viewportCap = Math.max(
            200,
            (typeof window !== 'undefined' ? window.innerWidth : 600) - 16
          );
          const maxW = Math.min(viewportCap, Math.max(rects.reference.width, 360));
          elements.floating.style.minWidth = `${rects.reference.width}px`;
          elements.floating.style.maxWidth = `${maxW}px`;
          elements.floating.style.setProperty('--bc-select-max-h', `${innerMax}px`);
        },
      }),
    ],
  });

  const setTriggerRef = useCallback(
    (node) => {
      triggerRef.current = node;
      refs.setReference(node);
    },
    [refs]
  );

  const setFloatingPanelRef = useCallback(
    (node) => {
      panelRef.current = node;
      refs.setFloating(node);
    },
    [refs]
  );

  const setSelectRef = useCallback(
    (node) => {
      nativeSelectRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef && typeof forwardedRef === 'object') {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

  // Intercept native <select>.value setter & .focus() so react-hook-form reset(),
  // setValue(), defaultValues, autofill, and shouldFocusError keep custom UI synced.
  useLayoutEffect(() => {
    const el = nativeSelectRef.current;
    if (!el) return undefined;

    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (!desc?.get || !desc?.set) return undefined;

    Object.defineProperty(el, 'value', {
      configurable: true,
      enumerable: desc.enumerable,
      get() {
        return desc.get.call(this);
      },
      set(next) {
        const strNext = next == null ? '' : String(next);
        desc.set.call(this, strNext);
        const actual = desc.get.call(this);
        if (strNext !== '' && actual !== strNext) {
          pendingProgrammaticRef.current = strNext;
        } else {
          pendingProgrammaticRef.current = null;
        }
        if (!isControlledRef.current && actual !== internalValueRef.current) {
          setInternalValue(actual);
        }
      },
    });

    el.focus = (opts) => {
      triggerRef.current?.focus(opts);
    };

    const form = el.form;
    const handleFormReset = () => {
      queueMicrotask(() => {
        if (!nativeSelectRef.current) return;
        pendingProgrammaticRef.current = null;
        const resetVal = desc.get.call(nativeSelectRef.current);
        if (!isControlledRef.current) {
          setInternalValue(resetVal);
        }
      });
    };

    form?.addEventListener('reset', handleFormReset);

    // Sync initial value (including RHF defaultValues set inside ref callback)
    const initialVal = desc.get.call(el);
    if (!isControlledRef.current && initialVal !== internalValueRef.current) {
      setInternalValue(initialVal);
    }

    return () => {
      form?.removeEventListener('reset', handleFormReset);
      delete el.value;
      delete el.focus;
    };
  }, []);

  // Re-sync when options arrive asynchronously (e.g., edit modal loading categories)
  useLayoutEffect(() => {
    const el = nativeSelectRef.current;
    if (!el) return;
    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    if (!desc?.get || !desc?.set) return;

    if (isControlled) {
      const targetVal = String(value ?? '');
      if (desc.get.call(el) !== targetVal) {
        desc.set.call(el, targetVal);
      }
      pendingProgrammaticRef.current = null;
      return;
    }

    if (pendingProgrammaticRef.current !== null) {
      desc.set.call(el, pendingProgrammaticRef.current);
      const resolved = desc.get.call(el);
      if (resolved === pendingProgrammaticRef.current) {
        pendingProgrammaticRef.current = null;
      }
      if (resolved !== internalValueRef.current) {
        setInternalValue(resolved);
      }
      return;
    }

    const domVal = desc.get.call(el);
    if (domVal !== internalValueRef.current) {
      setInternalValue(domVal);
    }
  }, [optionsSignature, isControlled, value]);

  const clearMotionTimers = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (openRafRef.current) {
      cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }
  }, []);

  const clearTypeAhead = useCallback(() => {
    typeAheadBufferRef.current = '';
    if (typeAheadTimerRef.current) {
      clearTimeout(typeAheadTimerRef.current);
      typeAheadTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearMotionTimers();
    clearTypeAhead();
  }, [clearMotionTimers, clearTypeAhead]);

  const closePanel = useCallback(
    ({ returnFocus = false, immediate = false } = {}) => {
      clearMotionTimers();
      clearTypeAhead();
      setIsOpen(false);
      setIsAnimatedIn(false);

      if (returnFocus) {
        triggerRef.current?.focus();
      }

      if (immediate || prefersReducedMotion()) {
        setIsRendered(false);
      } else {
        closeTimerRef.current = setTimeout(() => {
          setIsRendered(false);
          closeTimerRef.current = null;
        }, MOTION_DURATION_MS);
      }
    },
    [clearMotionTimers]
  );

  const openPanel = useCallback(
    (initialActiveIdx) => {
      if (disabled) return;
      clearMotionTimers();
      setSheetTitle(resolveAssociatedLabel(triggerRef.current, label, ariaLabel, placeholder));

      let targetIdx = initialActiveIdx;
      if (targetIdx === undefined || targetIdx < 0) {
        if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
          targetIdx = selectedIndex;
        } else {
          targetIdx = findEdgeEnabledIndex(options, false);
        }
      }
      setActiveIndex(targetIdx);
      setIsRendered(true);
      setIsOpen(true);

      if (isMobile || prefersReducedMotion()) {
        if (prefersReducedMotion()) {
          setIsAnimatedIn(true);
        } else {
          openRafRef.current = requestAnimationFrame(() => {
            setIsAnimatedIn(true);
            openRafRef.current = null;
          });
        }
      }
    },
    [disabled, clearMotionTimers, label, ariaLabel, placeholder, selectedIndex, options, isMobile]
  );

  // Trigger desktop entrance animation only once Floating UI resolves coordinates
  useEffect(() => {
    if (!isOpen || !isRendered || isMobile) return undefined;
    if (!isPositioned) return undefined;

    if (prefersReducedMotion()) {
      setIsAnimatedIn(true);
      return undefined;
    }

    openRafRef.current = requestAnimationFrame(() => {
      setIsAnimatedIn(true);
      openRafRef.current = null;
    });

    return () => {
      if (openRafRef.current) {
        cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, [isOpen, isRendered, isMobile, isPositioned]);

  // Close immediately if disabled dynamically while open
  useEffect(() => {
    if (disabled && isOpen) {
      closePanel({ immediate: true });
    }
  }, [disabled, isOpen, closePanel]);

  // Scroll active/selected option into view cleanly inside .bc-scroll
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const optEl = optionRefs.current[activeIndex];
    if (optEl && typeof optEl.scrollIntoView === 'function') {
      optEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, activeIndex]);

  // Body scroll lock when mobile bottom sheet is open outside a native <dialog>
  useEffect(() => {
    if (!isOpen || !isMobile) return undefined;
    const insideDialog = Boolean(triggerRef.current?.closest('dialog'));
    if (insideDialog) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isMobile]);

  const emitBlur = useCallback(() => {
    const el = nativeSelectRef.current;
    if (!onBlur || !el) return;
    onBlur({
      target: el,
      currentTarget: el,
      type: 'blur',
    });
  }, [onBlur]);

  // Click outside + Escape inside native <dialog> protection
  useEffect(() => {
    if (!isOpen) return undefined;

    const dialog = triggerRef.current?.closest('dialog');

    const handlePointerDownOutside = (e) => {
      const target = e.target;
      if (
        (triggerRef.current && triggerRef.current.contains(target)) ||
        (panelRef.current && panelRef.current.contains(target))
      ) {
        return;
      }
      closePanel({ returnFocus: false });
      emitBlur();
    };

    const handleKeyDownCapture = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closePanel({ returnFocus: true });
      }
    };

    const handleDialogCancel = (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      closePanel({ returnFocus: true });
    };

    if (!isMobile) {
      document.addEventListener('pointerdown', handlePointerDownOutside, true);
    }
    window.addEventListener('keydown', handleKeyDownCapture, true);
    dialog?.addEventListener('cancel', handleDialogCancel, true);

    return () => {
      if (!isMobile) {
        document.removeEventListener('pointerdown', handlePointerDownOutside, true);
      }
      window.removeEventListener('keydown', handleKeyDownCapture, true);
      dialog?.removeEventListener('cancel', handleDialogCancel, true);
    };
  }, [isOpen, isMobile, closePanel, emitBlur]);

  const commitSelection = useCallback(
    (opt) => {
      if (!opt || opt.disabled) return;
      const el = nativeSelectRef.current;
      const changed = opt.value !== selectedValue;

      if (el && changed) {
        const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
        if (desc?.set && desc?.get) {
          desc.set.call(el, opt.value);
          pendingProgrammaticRef.current = null;
          if (!isControlled) {
            setInternalValue(desc.get.call(el));
          }
        }
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      closePanel({ returnFocus: true });
    },
    [selectedValue, isControlled, closePanel]
  );

  const handleNativeChange = useCallback(
    (e) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    },
    [isControlled, onChange]
  );

  const handleNativeFocus = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  const handleTypeAhead = useCallback(
    (char) => {
      if (!options.length) return;

      if (typeAheadTimerRef.current) {
        clearTimeout(typeAheadTimerRef.current);
      }
      typeAheadTimerRef.current = setTimeout(() => {
        typeAheadBufferRef.current = '';
        typeAheadTimerRef.current = null;
      }, TYPEAHEAD_RESET_MS);

      const normChar = normalizeSearchText(char);
      if (!normChar) return;

      const prevBuffer = typeAheadBufferRef.current;
      const nextBuffer = prevBuffer + normChar;
      typeAheadBufferRef.current = nextBuffer;

      const isRepeatedSingleChar =
        nextBuffer.length > 1 &&
        nextBuffer.split('').every((c) => c === nextBuffer[0]);

      const searchStr = isRepeatedSingleChar ? nextBuffer[0] : nextBuffer;
      const startFrom =
        isRepeatedSingleChar || nextBuffer.length === 1
          ? (activeIndex >= 0 ? activeIndex + 1 : 0)
          : (activeIndex >= 0 ? activeIndex : 0);

      let matchIdx = -1;
      for (let i = 0; i < options.length; i += 1) {
        const candidateIdx = (startFrom + i) % options.length;
        const opt = options[candidateIdx];
        if (opt.disabled) continue;
        if (normalizeSearchText(opt.label).startsWith(searchStr)) {
          matchIdx = candidateIdx;
          break;
        }
      }

      // If multi-char buffer missed, retry with just the new character
      if (matchIdx === -1 && nextBuffer.length > 1 && !isRepeatedSingleChar) {
        typeAheadBufferRef.current = normChar;
        for (let i = 0; i < options.length; i += 1) {
          const candidateIdx = ((activeIndex >= 0 ? activeIndex + 1 : 0) + i) % options.length;
          const opt = options[candidateIdx];
          if (opt.disabled) continue;
          if (normalizeSearchText(opt.label).startsWith(normChar)) {
            matchIdx = candidateIdx;
            break;
          }
        }
      }

      if (!isOpen) {
        openPanel(matchIdx >= 0 ? matchIdx : undefined);
      } else if (matchIdx >= 0) {
        setActiveIndex(matchIdx);
      }
    },
    [options, activeIndex, isOpen, openPanel]
  );

  const handleTriggerKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPanel();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const idx =
            selectedIndex >= 0 && !options[selectedIndex]?.disabled
              ? selectedIndex
              : findEdgeEnabledIndex(options, true);
          openPanel(idx);
          return;
        }
        if (e.key === 'Home') {
          e.preventDefault();
          openPanel(findEdgeEnabledIndex(options, false));
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          openPanel(findEdgeEnabledIndex(options, true));
          return;
        }
        if (e.key.length === 1 && e.key.trim() !== '') {
          e.preventDefault();
          handleTypeAhead(e.key);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIdx =
            activeIndex < 0
              ? findEdgeEnabledIndex(options, false)
              : findNextEnabledIndex(options, activeIndex, 1);
          if (nextIdx >= 0) setActiveIndex(nextIdx);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIdx =
            activeIndex < 0
              ? findEdgeEnabledIndex(options, true)
              : findNextEnabledIndex(options, activeIndex, -1);
          if (prevIdx >= 0) setActiveIndex(prevIdx);
          break;
        }
        case 'Home':
        case 'PageUp': {
          e.preventDefault();
          const firstIdx = findEdgeEnabledIndex(options, false);
          if (firstIdx >= 0) setActiveIndex(firstIdx);
          break;
        }
        case 'End':
        case 'PageDown': {
          e.preventDefault();
          const lastIdx = findEdgeEnabledIndex(options, true);
          if (lastIdx >= 0) setActiveIndex(lastIdx);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && options[activeIndex] && !options[activeIndex].disabled) {
            commitSelection(options[activeIndex]);
          } else {
            closePanel({ returnFocus: true });
          }
          break;
        }
        case ' ': {
          e.preventDefault();
          if (typeAheadBufferRef.current) {
            handleTypeAhead(' ');
          } else if (activeIndex >= 0 && options[activeIndex] && !options[activeIndex].disabled) {
            commitSelection(options[activeIndex]);
          } else {
            closePanel({ returnFocus: true });
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          e.stopPropagation();
          closePanel({ returnFocus: true });
          break;
        }
        case 'Tab': {
          closePanel({ returnFocus: false });
          break;
        }
        default: {
          if (e.key.length === 1) {
            e.preventDefault();
            handleTypeAhead(e.key);
          }
        }
      }
    },
    [
      disabled,
      isOpen,
      openPanel,
      selectedIndex,
      options,
      handleTypeAhead,
      activeIndex,
      commitSelection,
      closePanel,
    ]
  );

  const handleTriggerClick = useCallback(() => {
    if (disabled) return;
    if (isOpen) {
      closePanel({ returnFocus: true });
    } else {
      openPanel();
    }
  }, [disabled, isOpen, closePanel, openPanel]);

  const handleTriggerBlur = useCallback(
    (e) => {
      const nextTarget = e.relatedTarget;
      if (nextTarget && panelRef.current?.contains(nextTarget)) {
        return;
      }
      if (!isOpen) {
        emitBlur();
      }
    },
    [isOpen, emitBlur]
  );

  const activeOptionId =
    activeIndex >= 0 && options[activeIndex]
      ? `${listboxId}-opt-${activeIndex}`
      : undefined;

  const isPlaceholderState =
    !selectedOption ||
    selectedOption.value === '' ||
    Boolean(selectedValue === '' && placeholder);

  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || '';

  const emptyMessage = emptyText || t('select.empty', { defaultValue: 'No options' });
  const resolvedSheetTitle =
    sheetTitle || t('select.choose', { defaultValue: 'Select an option' });

  const hasCustomBg = /\bbg-/.test(className);
  const hasCustomRadius = /\brounded-/.test(className);
  const hasCustomTextSize = /\btext-(xs|sm|base|lg|xl)\b/.test(className);

  const portalContainer =
    typeof document !== 'undefined'
      ? triggerRef.current?.closest('dialog') ?? document.body
      : null;

  const stopPortalPointerPropagation = (e) => {
    e.stopPropagation();
  };

  const renderOptionRow = (opt) => {
    const isSelected = selectedValue === opt.value && selectedIndex === opt.optionIndex;
    const isActive = activeIndex === opt.optionIndex;

    return (
      <div
        key={opt.key}
        ref={(el) => {
          optionRefs.current[opt.optionIndex] = el;
        }}
        id={`${listboxId}-opt-${opt.optionIndex}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={opt.disabled || undefined}
        onMouseDown={(e) => {
          // Keep keyboard focus on the combobox trigger while selecting on desktop
          if (!isMobile) e.preventDefault();
        }}
        onMouseEnter={() => {
          if (!opt.disabled) setActiveIndex(opt.optionIndex);
        }}
        onClick={() => {
          if (!opt.disabled) commitSelection(opt);
        }}
        className={clsx(
          'min-h-[44px] px-3 rounded-[8px] text-start w-full flex items-center justify-between gap-2 select-none transition-colors duration-150',
          opt.disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer',
          isSelected
            ? clsx(
                'bg-badge-green-bg text-badge-green-text font-semibold',
                isActive && 'ring-1 ring-primary/35'
              )
            : isActive && !opt.disabled
              ? 'bg-surface-container-high text-on-surface'
              : 'text-on-surface hover:bg-surface-container-high'
        )}
      >
        <span className="truncate flex-1 min-w-0 text-sm">{opt.label}</span>
        {isSelected && (
          <span
            className="material-symbols-outlined text-[18px] text-primary shrink-0"
            aria-hidden="true"
          >
            check
          </span>
        )}
      </div>
    );
  };

  const listboxContent =
    options.length === 0 ? (
      <div className="min-h-[44px] px-3 flex items-center justify-center text-sm text-muted select-none">
        {emptyMessage}
      </div>
    ) : (
      <div className="flex flex-col gap-0.5">
        {blocks.map((block) => {
          if (block.kind === 'group') {
            const groupHeadingId = `${listboxId}-${block.key}`;
            return (
              <div
                key={block.key}
                role="group"
                aria-labelledby={groupHeadingId}
                className="py-0.5"
              >
                <div
                  id={groupHeadingId}
                  role="presentation"
                  className={clsx(
                    'px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted truncate select-none',
                    block.disabled && 'opacity-50'
                  )}
                >
                  {block.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {block.items.map(renderOptionRow)}
                </div>
              </div>
            );
          }
          return renderOptionRow(block);
        })}
      </div>
    );

  const panelState = isAnimatedIn ? 'open' : 'closed';
  const desktopSide = placement.startsWith('top') ? 'top' : 'bottom';

  const portalNode =
    isRendered && portalContainer
      ? createPortal(
          isMobile ? (
            <div
              data-bc-select-portal="true"
              onPointerDown={stopPortalPointerPropagation}
              onPointerUp={stopPortalPointerPropagation}
              className={clsx(
                'fixed inset-0 z-[70] flex items-end justify-center',
                !isOpen && 'pointer-events-none'
              )}
            >
              <div
                data-state={panelState}
                onClick={() => closePanel({ returnFocus: true })}
                aria-hidden="true"
                className="bc-select-backdrop fixed inset-0 bg-[var(--bc-overlay)] backdrop-blur-[2px]"
              />

              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={sheetTitleId}
                data-state={panelState}
                className="bc-select-sheet relative z-10 w-full rounded-t-[16px] bg-surface dark:bg-surface-container border-t border-outline-variant shadow-card-hover max-h-[60vh] max-h-[60dvh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
              >
                <div
                  className="w-10 h-1 rounded-full bg-outline/30 mx-auto mt-2.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-outline-variant bg-surface dark:bg-surface-container shrink-0">
                  <span
                    id={sheetTitleId}
                    className="text-sm font-bold text-on-surface truncate"
                  >
                    {resolvedSheetTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => closePanel({ returnFocus: true })}
                    aria-label={t('actions.close', { defaultValue: 'Close' })}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] -me-2 rounded-xl inline-flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      close
                    </span>
                  </button>
                </div>

                <div
                  id={listboxId}
                  role="listbox"
                  aria-labelledby={sheetTitleId}
                  className="bc-scroll p-2 flex-1 min-h-0"
                >
                  {listboxContent}
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={setFloatingPanelRef}
              data-bc-select-portal="true"
              style={{ ...floatingStyles, zIndex: 70 }}
              onPointerDown={stopPortalPointerPropagation}
              onPointerUp={stopPortalPointerPropagation}
              className={clsx(!isOpen && 'pointer-events-none')}
            >
              <div
                data-state={panelState}
                data-side={desktopSide}
                className="bc-select-panel rounded-[12px] border border-outline-variant bg-surface dark:bg-surface-container shadow-card-hover overflow-hidden p-[6px]"
              >
                <div
                  id={listboxId}
                  role="listbox"
                  aria-labelledby={ariaLabelledBy}
                  aria-label={!ariaLabelledBy ? sheetTitle || ariaLabel : undefined}
                  style={{ maxHeight: 'min(280px, var(--bc-select-max-h, 280px))' }}
                  className="bc-scroll"
                >
                  {listboxContent}
                </div>
              </div>
            </div>
          ),
          portalContainer
        )
      : null;

  return (
    <div className="relative flex items-center w-full">
      {/* Hidden native <select> as form / react-hook-form / autofill source of truth */}
      <select
        ref={setSelectRef}
        name={name}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        value={value}
        defaultValue={defaultValue}
        onChange={handleNativeChange}
        onFocus={handleNativeFocus}
        aria-hidden="true"
        tabIndex={-1}
        className="visually-hidden pointer-events-none"
      >
        {placeholder && !hasEmptyOption && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>

      {iconLeading && (
        <div
          className={clsx(
            'absolute start-3.5 flex items-center justify-center pointer-events-none text-on-surface-variant z-10',
            disabled && 'opacity-50'
          )}
        >
          {iconLeading}
        </div>
      )}

      <button
        ref={setTriggerRef}
        id={resolvedId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isRendered ? listboxId : undefined}
        aria-activedescendant={isOpen ? activeOptionId : undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-required={required || undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onBlur={handleTriggerBlur}
        onFocus={onFocus}
        className={clsx(
          'relative w-full h-12 flex items-center text-start transition-[color,background-color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'border outline-none focus-visible:ring-2 focus-visible:ring-input-focus focus-visible:border-input-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          !hasCustomBg && 'bg-input',
          !hasCustomRadius && 'rounded-lg',
          !hasCustomTextSize && 'text-sm',
          iconLeading ? 'ps-11' : 'ps-4',
          'pe-10',
          error
            ? clsx(
                'border-error focus-visible:border-error focus-visible:ring-error/20',
                isOpen && 'border-error ring-2 ring-error/20'
              )
            : clsx(
                'border-input-border hover:border-card-hover-border',
                isOpen && 'border-input-focus ring-2 ring-input-focus'
              ),
          className
        )}
        {...restProps}
      >
        <span
          className={clsx(
            'block truncate flex-1 min-w-0 text-start',
            isPlaceholderState ? 'text-muted' : 'text-on-surface'
          )}
        >
          {displayLabel}
        </span>

        <span
          className={clsx(
            'material-symbols-outlined text-[20px] text-on-surface-variant pointer-events-none shrink-0',
            'absolute end-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {portalNode}
    </div>
  );
});
