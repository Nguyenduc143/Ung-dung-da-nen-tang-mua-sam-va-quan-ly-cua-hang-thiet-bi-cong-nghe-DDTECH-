import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { useEffect, useRef } from 'react';

interface SearchInputProps {
  value: string;
  placeholder?: string;
  debounceMs?: number;
  onChange: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
}

export function SearchInput({
  value,
  placeholder = 'Tìm kiếm',
  debounceMs = 350,
  onChange,
  onDebouncedChange,
}: SearchInputProps) {
  const debouncedCallback = useRef(onDebouncedChange);

  useEffect(() => {
    debouncedCallback.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    if (!debouncedCallback.current) return;
    const timer = window.setTimeout(() => debouncedCallback.current?.(value.trim()), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, value]);

  return (
    <Input
      allowClear
      value={value}
      prefix={<SearchOutlined />}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
