'use client';

export interface Forum {
  id: string;
  company_id: string;
  name: string;
  experience_id: string;
  created_at: string;
  who_can_post?: string;
  is_synced_only?: boolean;
}

interface ForumSelectorProps {
  forums: Forum[];
  value: string;
  onChange: (experienceId: string) => void;
  placeholder?: string;
}

export default function ForumSelector({ forums, value, onChange, placeholder = 'Select forum' }: ForumSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer rounded-lg border border-[#DCE8FF] bg-white px-3 py-[9px] text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <option value="">{placeholder}</option>
      {forums.map((f) => (
        <option key={f.id} value={f.experience_id}>
          {f.name}
          {f.who_can_post === 'admins' ? ' (admins only)' : ''}
        </option>
      ))}
    </select>
  );
}
