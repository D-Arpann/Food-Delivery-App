import { useCallback, useEffect, useRef } from 'react';

const HISTORY_DEPTH_KEY = '__chitoMithoHistoryDepth';

function getHistoryState() {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.history.state || {};
}

function getHistoryDepth(state = getHistoryState()) {
  const depth = Number(state?.[HISTORY_DEPTH_KEY]);
  return Number.isFinite(depth) && depth > 0 ? depth : 0;
}

function replaceCurrentState(nextState) {
  window.history.replaceState(nextState, '', window.location.href);
}

function pushCurrentState(nextState) {
  window.history.pushState(nextState, '', window.location.href);
}

export default function useHistoryNavigation({
  value,
  onChange,
  stateKey,
  fallbackValue,
  isValidValue = Boolean,
  onFallback,
  onNavigate,
}) {
  const valueRef = useRef(value);
  const depthRef = useRef(getHistoryDepth());

  useEffect(() => {
    valueRef.current = value;

    if (typeof window === 'undefined' || !stateKey) {
      return;
    }

    const currentState = getHistoryState();

    if (currentState[stateKey] !== value) {
      replaceCurrentState({
        ...currentState,
        [HISTORY_DEPTH_KEY]: getHistoryDepth(currentState),
        [stateKey]: value,
      });
    }
  }, [stateKey, value]);

  useEffect(() => {
    if (typeof window === 'undefined' || !stateKey) {
      return undefined;
    }

    const currentState = getHistoryState();
    const nextDepth = getHistoryDepth(currentState);

    replaceCurrentState({
      ...currentState,
      [HISTORY_DEPTH_KEY]: nextDepth,
      [stateKey]: valueRef.current,
    });

    depthRef.current = nextDepth;

    const handlePopState = (event) => {
      const nextState = event.state || {};
      const nextValue = nextState[stateKey];
      const nextDepthFromState = getHistoryDepth(nextState);

      depthRef.current = nextDepthFromState;

      if (isValidValue(nextValue) && nextValue !== valueRef.current) {
        valueRef.current = nextValue;
        onNavigate?.(nextValue, { source: 'popstate' });
        onChange(nextValue);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isValidValue, onChange, onNavigate, stateKey]);

  const navigate = useCallback((nextValue, options = {}) => {
    if (!isValidValue(nextValue)) {
      return;
    }

    const { replace = false, resetHistory = false } = options;
    const currentValue = valueRef.current;

    if (currentValue === nextValue && !resetHistory) {
      return;
    }

    if (typeof window !== 'undefined' && stateKey) {
      const currentState = getHistoryState();
      const currentDepth = resetHistory ? 0 : getHistoryDepth(currentState);
      const nextDepth = replace || resetHistory ? currentDepth : currentDepth + 1;
      const nextState = {
        ...currentState,
        [HISTORY_DEPTH_KEY]: nextDepth,
        [stateKey]: nextValue,
      };

      if (replace || resetHistory) {
        replaceCurrentState(nextState);
      } else {
        pushCurrentState(nextState);
      }

      depthRef.current = nextDepth;
    }

    valueRef.current = nextValue;
    onNavigate?.(nextValue, { source: 'navigate' });
    onChange(nextValue);
  }, [isValidValue, onChange, onNavigate, stateKey]);

  const goBack = useCallback(() => {
    const currentDepth = typeof window === 'undefined'
      ? depthRef.current
      : getHistoryDepth();

    if (typeof window !== 'undefined' && (currentDepth > 0 || window.history.length > 1)) {
      window.history.back();
      return true;
    }

    if (fallbackValue !== undefined && valueRef.current !== fallbackValue) {
      navigate(fallbackValue, { replace: true, resetHistory: true });
      return false;
    }

    onFallback?.();
    return false;
  }, [fallbackValue, navigate, onFallback]);

  return {
    goBack,
    navigate,
  };
}
