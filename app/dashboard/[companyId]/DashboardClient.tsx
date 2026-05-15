"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AppPage = "dashboard" | "generate" | "calendar" | "analytics" | "settings";
type OnboardingStep = 1 | 2 | 3 | 4 | 5;
type GenerateMode = "single" | "multiple";
type CalendarMode = "week" | "month";

type Forum = {
  id?: string;
  name?: string;
  description?: string | null;
  experience_id?: string | null;
  company_id?: string | null;
  member_count?: number | null;
  topics?: string[] | null;
  is_private?: boolean | null;
};

type ScheduledPost = {
  id: string;
  title: string;
  content: string;
  forum_id?: string | null;
  forum_name?: string | null;
  scheduled_at: string;
  status: string;
  published_at?: string | null;
  whop_post_url?: string | null;
  comment_count?: number | null;
  like_count?: number | null;
};

type DraftPost = {
  title: string;
  content: string;
  scheduled_at?: string;
  forum_id?: string;
  draftId?: string | null;
  free_regeneration_used?: boolean;
};

type ProductContext = {
  whop_company?: string | null;
  whop_products?: string | null;
  product_link?: string | null;
  tagline?: string | null;
  who_its_for?: string | null;
  what_it_does?: string | null;
  key_benefits?: string | null;
  price?: string | null;
  promo_code?: string | null;
  promo_details?: string | null;
  buyer_pain?: string | null;
  desired_outcome?: string | null;
  biggest_objection?: string | null;
  proof_points?: string | null;
  cta_preference?: string | null;
  target_keywords?: string | null;
  posting_mode?: string | null;
  signature_enabled_default?: boolean | null;
  signature_template?: string | null;
  default_forum_id?: string | null;
  brand_voice?: string | null;
  posting_goal?: string | null;
  posting_frequency?: string | null;
  onboarding_completed?: boolean | null;
};

type WhopUserAuth = {
  connected: boolean;
  userId?: string;
  name?: string;
  username?: string;
  businessName?: string;
};

type AnalyticsRow = {
  id?: string;
  title?: string;
  published_at?: string | null;
  created_at?: string | null;
  comment_count?: number | null;
  like_count?: number | null;
  engagement_rate?: number | null;
};

type DashboardData = {
  forums?: Forum[];
  postableForums?: Forum[];
  scheduledPosts?: ScheduledPost[];
  productContext?: ProductContext | null;
  usage?: UsageSummary | null;
  postingIdentity?: {
    connected?: boolean;
    whop_user_id?: string | null;
    whop_username?: string | null;
    whop_name?: string | null;
    whop_company_name?: string | null;
  } | null;
};

type UsageSummary = {
  plan: "free" | "starter";
  subscription_status: string;
  free_generation_limit: number;
  free_generations_used: number;
  free_available: number;
  monthly_generation_limit: number;
  monthly_generations_used: number;
  monthly_available: number;
  monthly_usage_period_start?: string | null;
  monthly_usage_period_end?: string | null;
  can_generate: boolean;
  upgrade_required: boolean;
  limit_reached: boolean;
  whop_manage_url?: string | null;
  checkout_url?: string;
};

type ActionResponse<T = unknown> = T & {
  error?: string;
  productContext?: ProductContext;
  forums?: Forum[];
  post?: ScheduledPost;
};

const BRAND_VOICES = ["Professional", "Casual", "Educational", "Hype"];
const POSTING_GOALS = ["Engagement", "Announcements", "Retention"];
const FREQUENCIES = ["3 posts/week", "5 posts/week", "Daily"];

const API_HEADERS: Record<string, string> = { "Content-Type": "application/json" };
const DEFAULT_USAGE: UsageSummary = {
  plan: "free",
  subscription_status: "free",
  free_generation_limit: 7,
  free_generations_used: 0,
  free_available: 7,
  monthly_generation_limit: 300,
  monthly_generations_used: 0,
  monthly_available: 300,
  monthly_usage_period_start: null,
  monthly_usage_period_end: null,
  can_generate: true,
  upgrade_required: false,
  limit_reached: false,
  whop_manage_url: null,
  checkout_url: "",
};

type IconProps = { className?: string };

function IconBase({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const Rocket = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M5 14 4 20l6-1 9-9c2-2 2-5 1-7-2-1-5-1-7 1l-9 9Z" />
    <path d="M15 5l4 4" />
    <path d="M9 15l-4 4" />
  </IconBase>
);
const Sparkles = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
  </IconBase>
);
const CalendarDays = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </IconBase>
);
const FileText = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6M8 13h8M8 17h6" />
  </IconBase>
);
const BarChart3 = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </IconBase>
);
const CheckCircle2 = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
    <path d="m9 11 3 3L22 4" />
  </IconBase>
);
const ChevronRight = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m9 18 6-6-6-6" />
  </IconBase>
);
const ChevronLeft = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="m15 18-6-6 6-6" />
  </IconBase>
);
const ExternalLink = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </IconBase>
);
const Loader2 = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </IconBase>
);
const LogOut = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </IconBase>
);
const MessageSquareText = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    <path d="M8 9h8M8 13h6" />
  </IconBase>
);
const PenLine = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </IconBase>
);
const RefreshCw = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12A9 9 0 0 1 18.5 5.8L21 8" />
    <path d="M3 21v-5h5M21 3v5h-5" />
  </IconBase>
);
const Settings = ({ className }: IconProps) => (
  <IconBase className={className}>
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 18l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </IconBase>
);

async function postAction<T = ActionResponse>(companyId: string, body: Record<string, unknown>) {
  const response = await fetch("/api/dashboard-action", {
    method: "POST",
    headers: API_HEADERS,
    body: JSON.stringify({ companyId, ...body }),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok || data.error) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "not scheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatDay(value: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(value);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateTimeLocalValue(value?: string | null) {
  const date = value ? new Date(value) : addDays(new Date(), 1);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function dateTimeLocalToIso(value?: string | null) {
  if (!value) return addDays(new Date(), 1).toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? addDays(new Date(), 1).toISOString() : date.toISOString();
}

function resolveSignature(template: string | null | undefined, businessName: string) {
  const fallback = "- Posted by PostPilot for [BUSINESS_NAME]";
  return (template || fallback).replace(/\[BUSINESS_NAME\]/g, businessName || "your Whop business");
}

function appendSignature(content: string, enabled: boolean, template: string | null | undefined, businessName: string) {
  if (!enabled) return content;
  const signature = resolveSignature(template, businessName);
  if (content.includes(signature)) return content;
  return `${content.trim()}\n\n${signature}`;
}

function normalizeContext(context?: ProductContext | null): ProductContext {
  return {
    whop_company: context?.whop_company || "",
    whop_products: context?.whop_products || "",
    product_link: context?.product_link || "",
    tagline: context?.tagline || "",
    who_its_for: context?.who_its_for || "",
    what_it_does: context?.what_it_does || "",
    key_benefits: context?.key_benefits || "",
    price: context?.price || "",
    promo_code: context?.promo_code || "",
    promo_details: context?.promo_details || "",
    buyer_pain: context?.buyer_pain || "",
    desired_outcome: context?.desired_outcome || "",
    biggest_objection: context?.biggest_objection || "",
    proof_points: context?.proof_points || "",
    cta_preference: context?.cta_preference || "",
    target_keywords: context?.target_keywords || "",
    posting_mode: context?.posting_mode || "approval",
    signature_enabled_default: context?.signature_enabled_default === true ? true : false,
    signature_template: context?.signature_template || "- Posted by PostPilot for [BUSINESS_NAME]",
    default_forum_id: context?.default_forum_id || "",
    brand_voice: context?.brand_voice || "Professional",
    posting_goal: context?.posting_goal || "Engagement",
    posting_frequency: context?.posting_frequency || "5 posts/week",
    onboarding_completed: context?.onboarding_completed ?? false,
  };
}

function getForumKey(forum: Forum) {
  return forum.experience_id || forum.id || forum.name || "";
}

function getForumName(forum?: Forum | null) {
  return forum?.name || forum?.id || "Whop forum";
}

function getBusinessName(context: ProductContext, auth: WhopUserAuth) {
  return context.whop_company || auth.businessName || auth.name || auth.username || "your Whop business";
}

function inferOnboardingStep(hasForum: boolean, hasBrand: boolean, hasContent: boolean): OnboardingStep {
  if (!hasForum) return 2;
  if (!hasBrand) return 3;
  if (!hasContent) return 4;
  return 5;
}

function buildSeedPrompt(context: ProductContext, selectedForum?: Forum | null) {
  const parts = [
    `Create a useful Whop forum post for ${context.whop_company || "my Whop business"}.`,
    context.tagline ? `Positioning: ${context.tagline}.` : "",
    context.what_it_does ? `What it does: ${context.what_it_does}.` : "",
    selectedForum ? `Forum: ${getForumName(selectedForum)}.` : "",
    `Brand voice: ${context.brand_voice || "Professional"}.`,
    `Goal: ${context.posting_goal || "Engagement"}.`,
    "Make it specific, practical, and community-first.",
  ];
  return parts.filter(Boolean).join("\n");
}

function normalizeTone(context: ProductContext) {
  const goal = String(context.posting_goal || "").toLowerCase();
  const voice = String(context.brand_voice || "").toLowerCase();
  if (goal.includes("engagement")) return "Engagement";
  if (goal.includes("announcement")) return "Informative";
  if (voice.includes("hype")) return "Promotional";
  if (voice.includes("casual")) return "Story";
  return "Informative";
}

function postTypesForGoal(context: ProductContext) {
  const goal = String(context.posting_goal || "").toLowerCase();
  if (goal.includes("announcement")) {
    return ["Announcement", "Product update", "Feature spotlight", "Welcome post", "Community reminder"];
  }
  if (goal.includes("retention")) {
    return ["Retention prompt", "Member success habit", "Resource reminder", "Weekly check-in", "Onboarding post"];
  }
  return ["Engagement prompt", "Educational post", "Resource spotlight", "Community question", "Action step"];
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const variants = {
    primary: "bg-[#2563EB] text-white shadow-sm shadow-blue-200 hover:bg-blue-700",
    secondary: "border border-[#DCE8FF] bg-white text-blue-700 hover:bg-blue-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "border border-red-100 bg-white text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`rounded-[20px] border border-[#DCE8FF] bg-white p-6 shadow-[0_16px_50px_rgba(15,30,70,0.06)] ${className}`}>{children}</section>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-slate-700">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#DCE8FF] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full resize-none rounded-2xl border border-[#DCE8FF] bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
    />
  );
}

function OptionGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            value === option
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-blue-100 bg-white text-slate-600 hover:bg-blue-50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F1E46]">{value}</p>
          {helper ? <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-blue-50 p-3 text-[#2563EB]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function PostPilotLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="overflow-hidden rounded-2xl shadow-lg shadow-blue-200">
        <Image src="/postpilot-logo.png" alt="PostPilot logo" width={44} height={44} className="h-11 w-11 object-cover" priority />
      </div>
      <span className="text-xl font-black tracking-tight text-slate-950">PostPilot</span>
    </div>
  );
}

export default function DashboardClient({ companyId, verifiedUserId }: { companyId: string; verifiedUserId: string }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [showContextModal, setShowContextModal] = useState(false);
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(2);
  const [forums, setForums] = useState<Forum[]>([]);
  const [postableForums, setPostableForums] = useState<Forum[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [productContext, setProductContext] = useState<ProductContext>(() => normalizeContext());
  const [usage, setUsage] = useState<UsageSummary>(DEFAULT_USAGE);
  const [whopUserAuth, setWhopUserAuth] = useState<WhopUserAuth>({ connected: true, userId: verifiedUserId });
  const [selectedForumId, setSelectedForumId] = useState("");
  const [generateMode, setGenerateMode] = useState<GenerateMode>("single");
  const [selectedPostType, setSelectedPostType] = useState("");
  const [selectedPostTypes, setSelectedPostTypes] = useState<string[]>([]);
  const [singleScheduledAt, setSingleScheduledAt] = useState(() => toDateTimeLocalValue(addDays(new Date(), 1).toISOString()));
  const [improvingField, setImprovingField] = useState("");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [calendarAnchor, setCalendarAnchor] = useState(() => startOfDay(new Date()));
  const [prompt, setPrompt] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [draftPosts, setDraftPosts] = useState<DraftPost[]>([]);
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const requestRef = useRef(0);
  const onboardingWasAlreadyCompleteRef = useRef(false);

  const businessName = useMemo(() => getBusinessName(productContext, whopUserAuth), [productContext, whopUserAuth]);
  const availableForums = forums.length > 0 ? forums : postableForums;
  const selectedForum = useMemo(
    () => availableForums.find((forum) => getForumKey(forum) === selectedForumId) || availableForums[0],
    [availableForums, selectedForumId],
  );
  const hasSelectedForum = Boolean(selectedForumId || productContext.default_forum_id);
  const hasBrandSetup = Boolean(productContext.brand_voice && productContext.posting_goal && productContext.posting_frequency);
  const hasProductDetails = Boolean(productContext.whop_company || productContext.tagline || productContext.what_it_does);
  const onboardingComplete = Boolean(productContext.onboarding_completed);
  const crucialContextMissing = !productContext.whop_products || !productContext.what_it_does || !productContext.who_its_for;
  const shouldShowOnboardingLanding = !onboardingComplete && !showOnboardingFlow;
  const shouldShowOnboardingFlow = !onboardingComplete && showOnboardingFlow;
  const scheduledOnly = scheduledPosts.filter((post) => post.status === "scheduled");
  const publishedOnly = scheduledPosts.filter((post) => post.status === "posted" || post.status === "published");
  const postsThisWeek = useMemo(() => {
    const start = startOfDay(new Date());
    const end = addDays(start, 7);
    return scheduledPosts.filter((post) => {
      const date = new Date(post.scheduled_at || post.published_at || "");
      return date >= start && date < end;
    }).length;
  }, [scheduledPosts]);

  const analytics = useMemo(() => {
    const rows: AnalyticsRow[] = analyticsRows.length
      ? analyticsRows
      : publishedOnly.map((post) => ({
          id: post.id,
          title: post.title,
          published_at: post.published_at || post.scheduled_at,
          comment_count: post.comment_count,
          like_count: post.like_count,
        }));
    const comments = rows.reduce((sum, row) => sum + Number(row.comment_count || 0), 0);
    const likes = rows.reduce((sum, row) => sum + Number(row.like_count || 0), 0);
    const engagementRate = rows.length ? ((comments + likes) / rows.length).toFixed(1) : "0.0";
    const hourScores = new Map<number, number>();
    rows.forEach((row) => {
      const date = new Date(row.published_at || row.created_at || "");
      if (!Number.isNaN(date.getTime())) {
        hourScores.set(date.getHours(), (hourScores.get(date.getHours()) || 0) + Number(row.comment_count || 0) + Number(row.like_count || 0));
      }
    });
    const bestHour = Array.from(hourScores.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      rows,
      comments,
      likes,
      engagementRate,
      bestTime: typeof bestHour === "number" ? `${bestHour % 12 || 12}:00 ${bestHour >= 12 ? "PM" : "AM"}` : "Not enough data",
    };
  }, [analyticsRows, publishedOnly]);

  const dashboardPrompt = useMemo(() => buildSeedPrompt(productContext, selectedForum), [productContext, selectedForum]);

  const setContextField = useCallback((key: keyof ProductContext, value: unknown) => {
    setProductContext((current) => ({ ...current, [key]: value }));
  }, []);

  const loadDashboardData = useCallback(async () => {
    const id = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard-data?companyId=${encodeURIComponent(companyId)}&ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as DashboardData & { error?: string };
      if (!response.ok || data.error) throw new Error(data.error || "Unable to load dashboard data");
      if (id !== requestRef.current) return;
      const normalized = normalizeContext(data.productContext);
      if (normalized.onboarding_completed) onboardingWasAlreadyCompleteRef.current = true;
      const nextForums = data.forums || [];
      const nextPostable = data.postableForums || [];
      setForums(nextForums);
      setPostableForums(nextPostable);
      setScheduledPosts(data.scheduledPosts || []);
      setProductContext(normalized);
      setUsage(data.usage || DEFAULT_USAGE);
      const identity = data.postingIdentity;
      setWhopUserAuth({
        connected: true,
        userId: identity?.whop_user_id || verifiedUserId,
        username: identity?.whop_username || undefined,
        name: identity?.whop_name || undefined,
        businessName: identity?.whop_company_name || normalized.whop_company || undefined,
      });
      const defaultForum = normalized.default_forum_id || getForumKey(nextPostable[0] || nextForums[0] || {});
      setSelectedForumId(defaultForum);
      setPrompt((current) => current || buildSeedPrompt(normalized, nextPostable[0] || nextForums[0]));
      if (normalized.onboarding_completed) {
        setShowOnboardingFlow(false);
        setOnboardingStep(5);
      } else {
        setOnboardingStep(
          inferOnboardingStep(
            Boolean(defaultForum),
            Boolean(normalized.brand_voice && normalized.posting_goal && normalized.posting_frequency),
            Boolean(normalized.whop_company || normalized.tagline || normalized.what_it_does),
          ),
        );
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  }, [companyId]);

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics?companyId=${encodeURIComponent(companyId)}&ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok) {
        setAnalyticsRows(Array.isArray(data.posts) ? data.posts : Array.isArray(data.rows) ? data.rows : []);
      }
    } catch {
      setAnalyticsRows([]);
    }
  }, [companyId]);

  useEffect(() => {
    loadDashboardData();
    loadAnalytics();
  }, [loadAnalytics, loadDashboardData]);

  useEffect(() => {
    if (!prompt || prompt === dashboardPrompt) {
      setPrompt(dashboardPrompt);
    }
  }, [dashboardPrompt, prompt]);

  useEffect(() => {
    if (loading || !onboardingComplete) return;
    if (!onboardingWasAlreadyCompleteRef.current) return;
    if (!crucialContextMissing) return;
    const key = `postpilot_ctx_modal_${companyId}`;
    if (sessionStorage.getItem(key)) return;
    setShowContextModal(true);
  }, [loading, onboardingComplete, crucialContextMissing, companyId]);

  async function saveContext(overrides: Partial<ProductContext> = {}) {
    const payload = { ...productContext, ...overrides };
    const data = await postAction<ActionResponse>(companyId, {
      action: "saveProductContext",
      ...payload,
    });
    const next = normalizeContext(data.productContext || payload);
    setProductContext(next);
    return next;
  }

  async function pullForums() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await postAction<ActionResponse>(companyId, { action: "pullForums" });
      const pulledForums = data.forums || [];
      setForums(pulledForums);
      setPostableForums(pulledForums);
      if (pulledForums[0] && !selectedForumId) setSelectedForumId(getForumKey(pulledForums[0]));
      setMessage(pulledForums.length ? "Forums pulled successfully." : "No postable forums were returned for this business.");
      if (pulledForums.length === 0) {
        await loadDashboardData();
      }
    } catch (pullError) {
      setError(pullError instanceof Error ? pullError.message : "Unable to pull forums");
    } finally {
      setBusy(false);
    }
  }

  async function deleteForum(forum: Forum) {
    const forumId = getForumKey(forum);
    const rowId = forum.id || forumId;
    if (!rowId) return;
    setBusy(true);
    setError("");
    try {
      await postAction(companyId, { action: "deleteForum", id: rowId });
      setForums((current) => current.filter((item) => getForumKey(item) !== forumId));
      setPostableForums((current) => current.filter((item) => getForumKey(item) !== forumId));
      if (selectedForumId === forumId) {
        const next = availableForums.find((item) => getForumKey(item) !== forumId);
        setSelectedForumId(next ? getForumKey(next) : "");
      }
      setMessage("Forum removed from PostPilot.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete forum");
    } finally {
      setBusy(false);
    }
  }

  async function generateSingle() {
    if (!selectedPostType) {
      setError("Choose a post type before generating so PostPilot has the right context.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setGenerateMode("single");
    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          companyId,
          forumId: selectedForumId,
          topic: `${prompt}\n\nPost type: ${selectedPostType}`,
          tone: normalizeTone(productContext),
          length: "medium",
          productContext: prompt,
        }),
      });
      const data = await response.json();
      if (data.usage) setUsage(data.usage);
      if (!response.ok || data.error) throw new Error(data.error || "Unable to generate post");
      setGeneratedTitle(data.title || `${productContext.posting_goal || "Community"} post`);
      setGeneratedContent(data.content || data.post || "");
      if (data.draft?.id) {
        setDraftPosts([{ title: data.draft.title || `${productContext.posting_goal || "Community"} post`, content: data.draft.content || data.content || "", draftId: data.draft.id, free_regeneration_used: false, scheduled_at: singleScheduledAt, forum_id: selectedForumId }]);
      }
      setMessage("Post generated. Review it before publishing or scheduling.");
      if (data.usage) setUsage(data.usage);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate post");
    } finally {
      setBusy(false);
    }
  }

  async function generateMultiple(count = 7) {
    if (selectedPostTypes.length === 0) {
      setError("Choose at least two post types before generating a 7-post week.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    setGenerateMode("multiple");
    try {
      const response = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          companyId,
          forumId: selectedForumId,
          count,
          topic: `${prompt}\n\nPost type mix: ${selectedPostTypes.join(", ")}`,
          tone: normalizeTone(productContext),
          postTypes: selectedPostTypes,
        }),
      });
      const data = await response.json();
      if (data.usage) setUsage(data.usage);
      if (!response.ok || data.error) throw new Error(data.error || "Unable to generate posts");
      const posts = Array.isArray(data.posts) ? data.posts : Array.isArray(data.schedule) ? data.schedule : [];
      setDraftPosts(
        posts.map((post: Record<string, unknown>, index: number) => ({
          title: String(post.title || post.postType || `Community post ${index + 1}`),
          content: String(post.content || post.post || ""),
          scheduled_at: toDateTimeLocalValue(
            typeof post.scheduled_at === "string" ? post.scheduled_at : addDays(new Date(), index + 1).toISOString()
          ),
          forum_id: selectedForumId,
          draftId: typeof post.draftId === "string" ? post.draftId : null,
          free_regeneration_used: Boolean(post.free_regeneration_used),
        })),
      );
      setMessage(`${posts.length || count} posts generated. Schedule included posts when ready.`);
      if (data.usage) setUsage(data.usage);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Unable to generate posts");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateDraft(index: number) {
    const draft = draftPosts[index];
    if (!draft?.draftId) {
      setError("Generate a draft first before regenerating.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/regenerate-post", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          companyId,
          draftId: draft.draftId,
          title: draft.title,
          content: draft.content,
          topicHint:
            generateMode === "single"
              ? `${prompt}\n\nPost type: ${selectedPostType}`
              : `${prompt}\n\nRegenerate this draft as a fresh variation for the same forum and business.`,
        }),
      });
      const data = await response.json();
      if (data.usage) setUsage(data.usage);
      if (!response.ok || data.error) throw new Error(data.error || "Unable to regenerate post");

      const nextDraft: DraftPost = {
        ...draft,
        title: data.draft?.title || data.title || draft.title,
        content: data.draft?.content || data.content || draft.content,
        draftId: data.draft?.id || draft.draftId,
        free_regeneration_used: true,
      };

      setDraftPosts((current) => {
        const next = [...current];
        next[index] = nextDraft;
        return next;
      });

      if (generateMode === "single" && index === 0) {
        setGeneratedTitle(nextDraft.title);
        setGeneratedContent(nextDraft.content);
      }

      setMessage(data.used_credit ? "Draft regenerated. 1 AI post credit was used." : "Draft regenerated. Your first regeneration for this draft was free.");
    } catch (regenerateError) {
      setError(regenerateError instanceof Error ? regenerateError.message : "Unable to regenerate post");
    } finally {
      setBusy(false);
    }
  }

  async function publishNow(title: string, content: string) {
    if (!selectedForumId) {
      setError("Select a Whop forum before publishing.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await postAction(companyId, {
        action: "postNowCustom",
        title,
        content: appendSignature(content, Boolean(productContext.signature_enabled_default), productContext.signature_template, businessName),
        forumId: selectedForumId,
      });
      setMessage("Published by your PostPilot agent on behalf of your Whop business.");
      await loadDashboardData();
      await loadAnalytics();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Unable to publish post");
    } finally {
      setBusy(false);
    }
  }

  async function schedulePosts(posts: Array<{ title: string; content: string; scheduled_at?: string; forum_id?: string; draftId?: string | null }>) {
    if (!selectedForumId) {
      setError("Select a Whop forum before scheduling.");
      return;
    }
    if (!posts.length) {
      setError("Generate at least one post before scheduling.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const batch = posts.map((post, index) => ({
        ...post,
        forum_id: post.forum_id || selectedForumId,
        draftId: post.draftId || null,
        scheduled_at: dateTimeLocalToIso(post.scheduled_at || addDays(new Date(), index + 1).toISOString()),
        content: appendSignature(post.content, Boolean(productContext.signature_enabled_default), productContext.signature_template, businessName),
      }));
      const response = await fetch("/api/schedule-batch", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ companyId, posts: batch }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Unable to schedule posts");
      setMessage("Included posts were scheduled and added to the calendar.");
      setDraftPosts([]);
      await loadDashboardData();
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : "Unable to schedule posts");
    } finally {
      setBusy(false);
    }
  }

  async function cancelScheduledPost(post: ScheduledPost) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/scheduled-posts/${encodeURIComponent(post.id)}?companyId=${encodeURIComponent(companyId)}`, {
        method: "DELETE",
        headers: API_HEADERS,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) throw new Error(data.error || "Unable to delete scheduled post");
      setScheduledPosts((current) => current.filter((item) => item.id !== post.id));
      setMessage("Scheduled post removed.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete scheduled post");
    } finally {
      setBusy(false);
    }
  }

  async function completeOnboarding() {
    setBusy(true);
    setError("");
    try {
      await saveContext({
        default_forum_id: selectedForumId || productContext.default_forum_id,
        onboarding_completed: true,
      });
      setShowOnboardingFlow(false);
      setOnboardingStep(5);
      setActivePage("dashboard");
      setMessage("Onboarding complete. Welcome to PostPilot.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to finish onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings() {
    setBusy(true);
    setError("");
    try {
      await saveContext({ default_forum_id: selectedForumId });
      setMessage("Settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings");
    } finally {
      setBusy(false);
    }
  }

  async function improveProductField(field: keyof ProductContext) {
    setImprovingField(String(field));
    setError("");
    try {
      const response = await fetch("/api/improve-product-context", {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({
          companyId,
          field,
          currentValue: productContext[field] || "",
          context: productContext,
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Unable to improve field");
      setContextField(field, data.value || "");
      setMessage("AI improved the product context field. Review and save settings.");
    } catch (improveError) {
      setError(improveError instanceof Error ? improveError.message : "Unable to improve field");
    } finally {
      setImprovingField("");
    }
  }

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(calendarAnchor, index)), [calendarAnchor]);
  const monthDays = useMemo(() => {
    const first = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 35 }, (_, index) => addDays(start, index));
  }, [calendarAnchor]);

  function postsForDay(day: Date) {
    const target = toDateInputValue(day);
    return scheduledPosts.filter((post) => toDateInputValue(new Date(post.scheduled_at || post.published_at || "")) === target);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading PostPilot...
        </div>
      </main>
    );
  }

  if (shouldShowOnboardingLanding) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(180deg,#ffffff,#f6f9ff)] px-6 py-8 text-slate-950">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[420px_1fr]">
          <aside className="space-y-8">
            <PostPilotLogo />
            <div>
              <h1 className="text-6xl font-black leading-tight tracking-tight text-blue-950">Your AI community manager for Whop</h1>
              <p className="mt-7 text-xl leading-9 text-slate-600">
                Generate, schedule, and publish community content for your Whop forums in minutes.
              </p>
              <Button
                className="mt-8 w-full py-4 text-base"
                onClick={() => {
                  setOnboardingStep(inferOnboardingStep(hasSelectedForum, hasBrandSetup, hasProductDetails));
                  setShowOnboardingFlow(true);
                }}
              >
                Start setup
                <ChevronRight className="h-4 w-4" />
              </Button>
              <p className="mt-5 text-base font-bold text-blue-700">Start with 7 free AI-generated posts. Then continue with Starter for $19/month.</p>
            </div>
            <div className="space-y-5 pt-4">
              {[
                { label: "AI post generation", Icon: Sparkles },
                { label: "Whop forum scheduling", Icon: CalendarDays },
                { label: "Community content calendar", Icon: FileText },
                { label: "Simple analytics", Icon: BarChart3 },
              ].map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-4 text-base font-semibold text-blue-950">
                  <span className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </aside>

          <section className="hidden items-center lg:flex">
            <Card className="w-full p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Next</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-blue-950">Clear 5-step setup. First post generated within minutes.</h2>
              <div className="mt-8 grid gap-4">
                {["Connect Whop", "Select forum", "Brand setup", "Generate first content", "Review schedule"].map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-slate-50 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">{index + 1}</span>
                    <span className="font-black text-blue-950">{step}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </main>
    );
  }

  if (shouldShowOnboardingFlow) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(180deg,#ffffff,#f6f9ff)] px-6 py-8 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <section className="space-y-6">
            <div className="text-center">
              <PostPilotLogo />
              <p className="text-2xl font-black tracking-tight text-blue-950">4-step setup. First post generated within minutes.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {["Select forum", "Brand setup", "Generate first content", "Review schedule"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setOnboardingStep((index + 2) as OnboardingStep)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                      onboardingStep === index + 2 ? "border-blue-500 bg-blue-600 text-white" : "border-blue-100 bg-white text-blue-950 hover:bg-blue-50"
                    }`}
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-current text-xs">
                      <span className={onboardingStep === index + 2 ? "text-blue-600" : "text-white"}>{index + 1}</span>
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ToastNotice error={error} message={message} onClose={() => { setError(""); setMessage(""); }} />

            {onboardingStep === 2 ? (
              <Card>
                <ProgressLabel step={2} />
                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-blue-950">Select your Whop forum</h2>
                    <p className="mt-2 text-slate-600">Choose where your PostPilot agent will publish community content.</p>
                  </div>
                  <Button variant="secondary" onClick={pullForums} disabled={busy}>
                    <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                    Refresh forums
                  </Button>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-3">
                    {availableForums.length ? (
                      availableForums.map((forum) => {
                        const key = getForumKey(forum);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedForumId(key)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              selectedForumId === key ? "border-blue-500 bg-blue-50" : "border-blue-100 bg-white hover:bg-blue-50/70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-black text-blue-950">{getForumName(forum)}</p>
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{forum.description || "Postable Whop forum"}</p>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                                {forum.member_count ? `${forum.member_count.toLocaleString()} members` : "Forum"}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
                        <p className="font-bold text-blue-950">No forums loaded yet.</p>
                        <p className="mt-2 text-sm text-slate-600">Use refresh forums after connecting Whop.</p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-3xl border border-blue-100 bg-slate-50 p-5">
                    <p className="text-sm font-bold text-slate-500">Forum details</p>
                    <h3 className="mt-4 text-2xl font-black text-blue-950">{getForumName(selectedForum)}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{selectedForum?.description || "This is where scheduled PostPilot content will be published."}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(selectedForum?.topics || ["Community", "Engagement", "Updates"]).slice(0, 4).map((topic) => (
                        <span key={topic} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
                          {topic}
                        </span>
                      ))}
                    </div>
                    <Button
                      className="mt-8 w-full"
                      disabled={!selectedForumId}
                      onClick={async () => {
                        await saveContext({ default_forum_id: selectedForumId });
                        setOnboardingStep(3);
                      }}
                    >
                      Use this forum
                    </Button>
                  </div>
                </div>
              </Card>
            ) : null}

            {onboardingStep === 3 ? (
              <Card>
                <ProgressLabel step={3} />
                <div className="mt-6">
                  <h2 className="text-3xl font-black text-blue-950">Set your brand voice</h2>
                  <p className="mt-2 text-slate-600">Give PostPilot enough context to create content that sounds intentional, not generic.</p>
                </div>
                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <FieldLabel>Brand voice</FieldLabel>
                      <OptionGroup options={BRAND_VOICES} value={productContext.brand_voice || "Professional"} onChange={(value) => setContextField("brand_voice", value)} />
                    </div>
                    <div className="space-y-3">
                      <FieldLabel>Posting goal</FieldLabel>
                      <OptionGroup options={POSTING_GOALS} value={productContext.posting_goal || "Engagement"} onChange={(value) => setContextField("posting_goal", value)} />
                    </div>
                    <div className="space-y-3">
                      <FieldLabel>Posting frequency</FieldLabel>
                      <OptionGroup options={FREQUENCIES} value={productContext.posting_frequency || "5 posts/week"} onChange={(value) => setContextField("posting_frequency", value)} />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <FieldLabel>Business name</FieldLabel>
                        <TextInput value={productContext.whop_company || ""} onChange={(value) => setContextField("whop_company", value)} placeholder="your-whop-slug" />
                      </div>
                      <div className="space-y-2">
                        <FieldLabel>Product link</FieldLabel>
                        <TextInput value={productContext.product_link || ""} onChange={(value) => setContextField("product_link", value)} placeholder="https://whop.com/..." />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>What does your community help members do?</FieldLabel>
                      <TextArea value={productContext.what_it_does || ""} onChange={(value) => setContextField("what_it_does", value)} rows={4} />
                    </div>
                    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-blue-950">Add a signature to every post</p>
                          <p className="mt-1 text-sm text-slate-600">Make the app-agent identity clear and intentional.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setContextField("signature_enabled_default", !productContext.signature_enabled_default)}
                          className={`h-7 w-12 rounded-full p-1 transition ${productContext.signature_enabled_default ? "bg-blue-600" : "bg-slate-300"}`}
                        >
                          <span className={`block h-5 w-5 rounded-full bg-white transition ${productContext.signature_enabled_default ? "translate-x-5" : ""}`} />
                        </button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <FieldLabel>Signature preview</FieldLabel>
                        <TextInput value={productContext.signature_template || ""} onChange={(value) => setContextField("signature_template", value)} />
                        <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-blue-950">{resolveSignature(productContext.signature_template, businessName)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={async () => {
                      await saveContext();
                      setOnboardingStep(4);
                    }}
                    disabled={busy}
                  >
                    Continue to generate
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : null}

            {onboardingStep === 4 ? (
              <Card>
                <ProgressLabel step={4} />
                <div className="mt-6">
                  <h2 className="text-3xl font-black text-blue-950">Generate your first content</h2>
                  <p className="mt-2 text-slate-600">Create a single post or a 7-day content set for your selected Whop forum.</p>
                </div>
                  <GeneratorPanel
                  businessName={businessName}
                  busy={busy}
                  context={productContext}
                  draftPosts={draftPosts}
                  generatedContent={generatedContent}
                  generatedTitle={generatedTitle}
                  generateMode={generateMode}
                  prompt={prompt}
                  selectedForum={selectedForum}
                  selectedForumId={selectedForumId}
                  selectedPostType={selectedPostType}
                  selectedPostTypes={selectedPostTypes}
                  singleScheduledAt={singleScheduledAt}
                  setDraftPosts={setDraftPosts}
                  setGeneratedContent={setGeneratedContent}
                  setGeneratedTitle={setGeneratedTitle}
                  setGenerateMode={setGenerateMode}
                  setPrompt={setPrompt}
                  setSelectedPostType={setSelectedPostType}
                    setSelectedPostTypes={setSelectedPostTypes}
                    setSingleScheduledAt={setSingleScheduledAt}
                    onGenerateSingle={generateSingle}
                    onGenerateMultiple={(count?: number) => generateMultiple(count || 7)}
                    onRegenerateDraft={regenerateDraft}
                    onPublishNow={publishNow}
                    onSchedule={(posts) => schedulePosts(posts)}
                    usage={usage}
                  />
                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" onClick={() => setOnboardingStep(5)}>
                    Review schedule
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : null}

            {onboardingStep === 5 ? (
              <Card>
                <ProgressLabel step={5} />
                <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-blue-950">Review your schedule</h2>
                    <p className="mt-2 text-slate-600">Make sure your first posts are ready for your PostPilot agent.</p>
                  </div>
                  <Button onClick={completeOnboarding} disabled={busy}>
                    Finish onboarding
                    <Rocket className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
                  <CalendarPreview days={weekDays} postsForDay={postsForDay} />
                  <UpcomingList posts={scheduledOnly.slice(0, 5)} emptyText="Schedule your first generated posts to fill this queue." companyId={companyId} />
                </div>
                <p className="mt-6 text-center text-sm text-slate-500">You can change these anytime in Settings.</p>
              </Card>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFF] text-[#0B163F]">
      <div className="grid min-h-screen lg:grid-cols-[248px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#0F1E46] p-5 text-white lg:flex lg:flex-col">
          <PostPilotLogoSidebar />
          <nav className="mt-9 space-y-1.5">
            {[
              { key: "dashboard" as AppPage, label: "Dashboard", Icon: Rocket },
              { key: "generate" as AppPage, label: "Generate", Icon: PenLine },
              { key: "calendar" as AppPage, label: "Calendar", Icon: CalendarDays },
              { key: "analytics" as AppPage, label: "Analytics", Icon: BarChart3 },
              { key: "settings" as AppPage, label: "Settings", Icon: Settings },
            ].map(({ key, label, Icon }) => {
              const IconComponent = Icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePage(key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                    activePage === key ? "bg-white/12 text-white ring-1 ring-white/10" : "text-blue-100/80 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Agent active
            </div>
            <p className="truncate text-sm font-bold">{businessName}</p>
            <p className="mt-1 text-xs leading-5 text-blue-100/75">Posting on behalf of your Whop business.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-blue-100/80">
              <Link href="/support" className="hover:text-white">Support</Link>
              <span>/</span>
              <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
              <span>/</span>
              <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            </div>
          </div>
        </aside>

        <section className="px-5 py-6 lg:px-10">
          <div className="mx-auto max-w-[1180px] space-y-6">
            <header className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/70 md:flex-row md:items-center md:justify-between lg:hidden">
              <PostPilotLogo />
              <div className="flex flex-wrap gap-2">
                {(["dashboard", "generate", "calendar", "analytics", "settings"] as AppPage[]).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setActivePage(page)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold capitalize ${activePage === page ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </header>

            <ToastNotice error={error} message={message} onClose={() => { setError(""); setMessage(""); }} />

            {activePage === "dashboard" ? (
                <DashboardPage
                businessName={businessName}
                usage={usage}
                analytics={analytics}
                postsThisWeek={postsThisWeek}
                publishedCount={publishedOnly.length}
                scheduledCount={scheduledOnly.length}
                scheduledPosts={scheduledOnly}
                setActivePage={setActivePage}
                onGenerateSeven={() => {
                  setActivePage("generate");
                  setGenerateMode("multiple");
                  generateMultiple(7);
                }}
              />
            ) : null}

            {activePage === "generate" ? (
              <PageShell
                eyebrow="Content Studio"
                title="Generate community content"
                subtitle="Turn product context into polished Whop forum drafts your PostPilot agent can schedule or publish."
              >
                  <GeneratorPanel
                  businessName={businessName}
                  busy={busy}
                  context={productContext}
                  draftPosts={draftPosts}
                  generatedContent={generatedContent}
                  generatedTitle={generatedTitle}
                  generateMode={generateMode}
                  prompt={prompt}
                  selectedForum={selectedForum}
                  selectedForumId={selectedForumId}
                  selectedPostType={selectedPostType}
                  selectedPostTypes={selectedPostTypes}
                  singleScheduledAt={singleScheduledAt}
                  setDraftPosts={setDraftPosts}
                  setGeneratedContent={setGeneratedContent}
                  setGeneratedTitle={setGeneratedTitle}
                  setGenerateMode={setGenerateMode}
                  setPrompt={setPrompt}
                  setSelectedPostType={setSelectedPostType}
                    setSelectedPostTypes={setSelectedPostTypes}
                    setSingleScheduledAt={setSingleScheduledAt}
                    onGenerateSingle={generateSingle}
                    onGenerateMultiple={(count?: number) => generateMultiple(count || 7)}
                    onRegenerateDraft={regenerateDraft}
                    onPublishNow={publishNow}
                    onSchedule={(posts) => schedulePosts(posts)}
                    usage={usage}
                  />
              </PageShell>
            ) : null}

            {activePage === "calendar" ? (
              <PageShell eyebrow="Calendar" title="Community content calendar" subtitle="Review what is queued, where it will go live, and what needs your attention.">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-2">
                    <Button variant={calendarMode === "week" ? "primary" : "secondary"} onClick={() => setCalendarMode("week")}>Week</Button>
                    <Button variant={calendarMode === "month" ? "primary" : "secondary"} onClick={() => setCalendarMode("month")}>Month</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setCalendarAnchor(addDays(calendarAnchor, calendarMode === "week" ? -7 : -30))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" onClick={() => setCalendarAnchor(startOfDay(new Date()))}>Today</Button>
                    <Button variant="secondary" onClick={() => setCalendarAnchor(addDays(calendarAnchor, calendarMode === "week" ? 7 : 30))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                  {calendarMode === "week" ? <CalendarPreview days={weekDays} postsForDay={postsForDay} onDelete={cancelScheduledPost} /> : <MonthCalendar days={monthDays} postsForDay={postsForDay} onDelete={cancelScheduledPost} />}
                  <UpcomingList posts={scheduledOnly.slice(0, 8)} emptyText="No scheduled posts yet." companyId={companyId} onDelete={cancelScheduledPost} onSaved={loadDashboardData} />
                </div>
              </PageShell>
            ) : null}

            {activePage === "analytics" ? (
              <PageShell eyebrow="Analytics" title="Community signal" subtitle="Honest performance tracking for content published by your PostPilot agent.">
                <AnalyticsPage analytics={analytics} scheduledCount={scheduledOnly.length} />
              </PageShell>
            ) : null}

            {activePage === "settings" ? (
              <PageShell eyebrow="Settings" title="Agent settings" subtitle="Keep your Whop connection, posting defaults, brand voice, and signature organized.">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">1. Whop connection</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[#0F1E46]">Connected business</h3>
                    <p className="mt-2 text-sm text-slate-600">Posts are published by your PostPilot agent on behalf of your Whop business.</p>
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-bold">Connected via Whop platform</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-[#0F1E46]">{businessName}</p>
                      <p className="mt-1 text-xs text-slate-500">{whopUserAuth.username || whopUserAuth.userId || ""}</p>
                    </div>
                  </Card>
                  <Card>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">5. Billing summary</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[#0F1E46]">{usage.plan === "starter" ? "Starter plan" : "Free plan"}</h3>
                    <div className="mt-5 rounded-3xl border border-[#DCE8FF] bg-[#F8FAFF] p-5">
                      <p className="text-sm font-bold text-blue-700">{usage.plan === "starter" ? "Starter" : "Free"}</p>
                      <p className="mt-2 text-3xl font-extrabold text-[#0F1E46]">{usage.plan === "starter" ? "$19/month" : `${usage.free_generations_used} / ${usage.free_generation_limit}`}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {usage.plan === "starter"
                          ? `${usage.monthly_generations_used} / ${usage.monthly_generation_limit} AI-generated posts used this month. Resets on ${formatDate(usage.monthly_usage_period_end)}.`
                          : `${usage.free_available} free AI-generated posts available. Starter includes 300 AI-generated posts per month.`}
                      </p>
                      {usage.plan === "starter" ? <p className="mt-2 text-sm font-semibold text-slate-600">Status: Active</p> : <p className="mt-2 text-sm font-semibold text-slate-600">Available: {usage.free_available}</p>}
                      {usage.plan === "starter" && usage.whop_manage_url ? (
                        <a href={usage.whop_manage_url} className="mt-5 inline-flex rounded-xl border border-[#DCE8FF] bg-white px-4 py-2.5 text-sm font-bold text-blue-700">
                          Manage billing
                        </a>
                      ) : usage.plan === "free" ? (
                        <a href={usage.checkout_url || "#"} className="mt-5 inline-flex rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white">
                          Upgrade to Starter — $19/month
                        </a>
                      ) : null}
                    </div>
                  </Card>
                  <Card>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">2. Posting defaults</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[#0F1E46]">Where your agent publishes</h3>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <FieldLabel>Default forum</FieldLabel>
                        <select
                          value={selectedForumId}
                          onChange={(event) => setSelectedForumId(event.target.value)}
                          className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        >
                          {availableForums.map((forum) => (
                            <option key={getForumKey(forum)} value={getForumKey(forum)}>
                              {getForumName(forum)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <FieldLabel>Business name</FieldLabel>
                        <TextInput value={productContext.whop_company || ""} onChange={(value) => setContextField("whop_company", value)} />
                      </div>
                      <div className="space-y-3">
                        <FieldLabel>Posting frequency</FieldLabel>
                        <OptionGroup options={FREQUENCIES} value={productContext.posting_frequency || "5 posts/week"} onChange={(value) => setContextField("posting_frequency", value)} />
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">3. Brand voice</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[#0F1E46]">How content should sound</h3>
                    <div className="mt-6 grid gap-5">
                      <div className="space-y-3">
                        <FieldLabel>Brand voice</FieldLabel>
                        <OptionGroup options={BRAND_VOICES} value={productContext.brand_voice || "Professional"} onChange={(value) => setContextField("brand_voice", value)} />
                      </div>
                      <div className="space-y-3">
                        <FieldLabel>Posting goal</FieldLabel>
                        <OptionGroup options={POSTING_GOALS} value={productContext.posting_goal || "Engagement"} onChange={(value) => setContextField("posting_goal", value)} />
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">4. Signature</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[#0F1E46]">Agent attribution</h3>
                    <p className="mt-2 text-sm text-slate-600">This appears inside post bodies so the PostPilot agent identity feels intentional.</p>
                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-blue-950">Add a signature to every post</p>
                          <p className="mt-1 text-sm text-slate-600">Make the app-agent identity clear and intentional.</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const next = !productContext.signature_enabled_default;
                            setContextField("signature_enabled_default", next);
                            await saveContext({ signature_enabled_default: next });
                            setMessage(next ? "Signature enabled." : "Signature disabled.");
                          }}
                          className={`h-7 w-12 rounded-full p-1 transition ${productContext.signature_enabled_default ? "bg-blue-600" : "bg-slate-300"}`}
                        >
                          <span className={`block h-5 w-5 rounded-full bg-white transition ${productContext.signature_enabled_default ? "translate-x-5" : ""}`} />
                        </button>
                      </div>
                      {productContext.signature_enabled_default ? (
                        <div className="space-y-2">
                          <FieldLabel>Default signature</FieldLabel>
                          <TextInput value={productContext.signature_template || ""} onChange={(value) => setContextField("signature_template", value)} />
                          <p className="rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-4 text-sm font-semibold text-[#0F1E46]">{resolveSignature(productContext.signature_template, businessName)}</p>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                  <Card>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Product context</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[#0F1E46]">What PostPilot should understand</h3>
                    <p className="mt-2 text-sm text-slate-600">This is the full product context saved in Supabase. Use Improve with AI to make individual fields more specific.</p>
                    <div className="mt-5 grid gap-4">
                      <ProductContextField label="Product / offer name" field="whop_products" value={productContext.whop_products || ""} onChange={setContextField} placeholder="Example: The Trading Blueprint, Fitness Accelerator, Content Creator Bootcamp" />
                      <ProductContextField label="Tagline" field="tagline" value={productContext.tagline || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: The step-by-step system to help you reach your goal faster with less guesswork." />
                      <ProductContextField label="What it does" field="what_it_does" value={productContext.what_it_does || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} rows={4} placeholder="Example: Gives members a clear roadmap, step-by-step lessons, templates, and direct access to the community and creator." />
                      <ProductContextField label="Who it's for" field="who_its_for" value={productContext.who_its_for || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: Beginners who are motivated but overwhelmed and need a clear starting point and ongoing support." />
                      <ProductContextField label="Key benefits" field="key_benefits" value={productContext.key_benefits || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} rows={4} placeholder={"Example:\n- Step-by-step curriculum\n- Done-for-you templates\n- Private community access\n- Live Q&A sessions"} />
                      <ProductContextField label="Buyer pain" field="buyer_pain" value={productContext.buyer_pain || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: They know what they want but feel stuck, lack clarity on next steps, or have tried before without results." />
                      <ProductContextField label="Desired outcome" field="desired_outcome" value={productContext.desired_outcome || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: Gain the clarity, skills, and confidence to achieve a specific outcome within a defined timeframe." />
                      <ProductContextField label="Biggest objection" field="biggest_objection" value={productContext.biggest_objection || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: I do not have time, I have tried before and failed, or I am not sure this will work for my situation." />
                      <ProductContextField label="Proof / results" field="proof_points" value={productContext.proof_points || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} rows={3} placeholder="Example: Only include real proof here — member wins, case studies, specific results, or your own verified experience." />
                      <ProductContextField label="CTA preference" field="cta_preference" value={productContext.cta_preference || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: Invite readers to join the community, explore the curriculum, or book a free call." />
                      <ProductContextField label="Target keywords" field="target_keywords" value={productContext.target_keywords || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} placeholder="Example: community, coaching, results, strategy, templates, accountability, growth" />
                      <div className="grid gap-4 sm:grid-cols-3">
                        <ProductContextField label="Price" field="price" value={productContext.price || ""} onChange={setContextField} compact placeholder="Example: $49/month" />
                        <ProductContextField label="Promo code" field="promo_code" value={productContext.promo_code || ""} onChange={setContextField} compact placeholder="Example: LAUNCH20" />
                        <ProductContextField label="Promo details" field="promo_details" value={productContext.promo_details || ""} onChange={setContextField} onImprove={improveProductField} improvingField={improvingField} compact placeholder="Example: 20% off the first month for new members" />
                      </div>
                    </div>
                  </Card>
                  <div className="flex justify-end lg:col-span-2">
                    <Button onClick={saveSettings} disabled={busy}>Save settings</Button>
                  </div>
                </div>
              </PageShell>
            ) : null}
          </div>
        </section>
      </div>

      {showContextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 shadow-2xl shadow-blue-200/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[#0F1E46]">Help PostPilot write better posts</h2>
            <p className="mt-2 text-sm text-slate-600">
              Three fields are missing that the AI needs to generate relevant, specific content for your community.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                { label: "Product / offer name", filled: Boolean(productContext.whop_products) },
                { label: "What it does", filled: Boolean(productContext.what_it_does) },
                { label: "Who it's for", filled: Boolean(productContext.who_its_for) },
              ].map(({ label, filled }) => (
                <li key={label} className="flex items-center gap-3 text-sm font-semibold">
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs ${filled ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"}`}>
                    {filled ? "✓" : "!"}
                  </span>
                  <span className={filled ? "text-slate-400 line-through" : "text-slate-800"}>{label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(`postpilot_ctx_modal_${companyId}`, "1");
                  setShowContextModal(false);
                  setActivePage("settings");
                }}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Go to Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(`postpilot_ctx_modal_${companyId}`, "1");
                  setShowContextModal(false);
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ToastNotice({ error, message, onClose }: { error: string; message: string; onClose: () => void }) {
  if (!error && !message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-md rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl ${error ? "border-red-200 bg-white text-red-700" : "border-emerald-200 bg-white text-emerald-700"}`}>
      <div className="flex items-start gap-4">
        <p className="leading-6">{error || message}</p>
        <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-black text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          X
        </button>
      </div>
    </div>
  );
}

function ProductContextField({
  label,
  field,
  value,
  onChange,
  onImprove,
  improvingField,
  rows = 2,
  compact = false,
  placeholder,
}: {
  label: string;
  field: keyof ProductContext;
  value: string;
  onChange: (key: keyof ProductContext, value: unknown) => void;
  onImprove?: (field: keyof ProductContext) => void;
  improvingField?: string;
  rows?: number;
  compact?: boolean;
  placeholder?: string;
}) {
  const improving = improvingField === field;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        {onImprove ? (
          <button
            type="button"
            onClick={() => onImprove(field)}
            disabled={improving}
            className="rounded-full border border-[#DCE8FF] bg-white px-3 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
          >
            {improving ? "Improving..." : "Improve with AI"}
          </button>
        ) : null}
      </div>
      {compact ? (
        <TextInput value={value} onChange={(next) => onChange(field, next)} placeholder={placeholder} />
      ) : (
        <TextArea value={value} onChange={(next) => onChange(field, next)} rows={rows} placeholder={placeholder} />
      )}
    </div>
  );
}

function ProgressLabel({ step }: { step: number }) {
  return (
    <div>
      <p className="text-center text-sm font-bold text-slate-500">Step {step} of 5</p>
      <div className="mx-auto mt-4 flex max-w-xs justify-center gap-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <span key={item} className={`h-3 w-3 rounded-full ${item <= step ? "bg-blue-600" : "bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}

function PostPilotLogoSidebar() {
  return (
    <div className="flex items-center gap-3">
      <div className="overflow-hidden rounded-xl shadow-lg shadow-blue-950/20">
        <Image src="/postpilot-logo.png" alt="PostPilot logo" width={40} height={40} className="h-10 w-10 object-cover" />
      </div>
      <div>
        <span className="block text-lg font-black tracking-tight">PostPilot</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/60">Whop agent</span>
      </div>
    </div>
  );
}

function PageShell({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p> : null}
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F1E46]">{title}</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function DashboardPage({
  businessName,
  usage,
  analytics,
  postsThisWeek,
  publishedCount,
  scheduledCount,
  scheduledPosts,
  setActivePage,
  onGenerateSeven,
}: {
  businessName: string;
  usage: UsageSummary;
  analytics: { engagementRate: string; comments: number; bestTime: string };
  postsThisWeek: number;
  publishedCount: number;
  scheduledCount: number;
  scheduledPosts: ScheduledPost[];
  setActivePage: (page: AppPage) => void;
  onGenerateSeven: () => void;
}) {
  const nextPost = scheduledPosts[0];
  const nextPostTime = nextPost ? formatDateTime(nextPost.scheduled_at) : "Nothing queued yet";
  return (
    <PageShell
      eyebrow="Command Center"
      title={`Good morning, ${businessName}`}
      subtitle="Your PostPilot agent is keeping your Whop forum cadence visible, queued, and ready to publish."
    >
      <UsageBanner usage={usage} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="rounded-2xl border border-[#DCE8FF] bg-white px-5 py-3 text-sm font-semibold text-[#0F1E46] shadow-sm">
          Posts are published by your PostPilot agent on behalf of your Whop business.
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setActivePage("generate")}>Generate post</Button>
          <Button onClick={onGenerateSeven}>Schedule week</Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
        <Card className="relative overflow-hidden border-[#DCE8FF] bg-gradient-to-br from-[#0F1E46] to-[#1D4ED8] text-white">
          <div className="absolute right-[-80px] top-[-80px] h-48 w-48 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-black text-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
                Active
              </div>
              <h2 className="mt-5 text-2xl font-extrabold">PostPilot agent is active</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-blue-50/85">
                {scheduledCount} post{scheduledCount === 1 ? " is" : "s are"} queued, {publishedCount} posts have been published, and your next post is scheduled for {nextPostTime}.
              </p>
            </div>
            <div className="hidden rounded-3xl bg-white/12 p-4 text-white md:block">
              <Rocket className="h-8 w-8" />
            </div>
          </div>
        </Card>

        <Card className="border-[#DCE8FF]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Next scheduled post</p>
              <h2 className="mt-3 text-2xl font-extrabold text-[#0F1E46]">{nextPost?.title || "No post queued yet"}</h2>
            </div>
            <StatusPill label={nextPost ? "Scheduled" : "Empty queue"} tone={nextPost ? "blue" : "slate"} />
          </div>
          {nextPost ? (
            <div className="mt-5 space-y-4">
              <p className="line-clamp-3 text-sm leading-7 text-slate-600">{nextPost.content}</p>
              <div className="flex flex-wrap gap-2">
                <StatusPill label={formatDateTime(nextPost.scheduled_at)} tone="slate" />
                <StatusPill label={nextPost.forum_name || "Default forum"} tone="blue" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setActivePage("generate")}>Edit</Button>
                <Button variant="ghost" onClick={() => setActivePage("calendar")}>View calendar</Button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#DCE8FF] bg-[#F8FAFF] p-5">
              <p className="text-sm leading-6 text-slate-600">Generate a week of community content to give your agent a queue to manage.</p>
              <Button className="mt-4" onClick={onGenerateSeven}>Generate 7 posts</Button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Posts this week" value={postsThisWeek} helper="Queued or published" icon={CalendarDays} />
        <MetricCard label="Scheduled" value={scheduledCount} helper="Ready for your agent" icon={FileText} />
        <MetricCard label="Published" value={publishedCount} helper="Sent to Whop" icon={CheckCircle2} />
        <MetricCard label="Comments tracked" value={analytics.comments} helper={publishedCount ? "From published posts" : "Waiting for posts"} icon={BarChart3} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-blue-950">Upcoming posts</h2>
            <Button variant="ghost" onClick={() => setActivePage("calendar")}>View calendar</Button>
          </div>
          {scheduledPosts.length ? (
            <div className="mt-5 space-y-3">
              {scheduledPosts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-4">
                  <div>
                    <p className="font-bold text-[#0F1E46]">{post.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDateTime(post.scheduled_at)} - {post.forum_name || "Default forum"}</p>
                  </div>
                  <StatusPill label="Scheduled" tone="blue" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
              <h3 className="text-xl font-black text-blue-950">Generate your first 7 days of posts in one click.</h3>
              <p className="mt-2 text-sm text-slate-600">Start with a full week of content, then edit or schedule anything you want.</p>
              <Button className="mt-5" onClick={onGenerateSeven}>Generate 7 posts</Button>
            </div>
          )}
        </Card>
        <Card>
          <h2 className="text-xl font-black text-blue-950">Quick actions</h2>
          <div className="mt-5 grid gap-3">
            <ActionButton icon={PenLine} title="Generate single post" subtitle="Create one post now" onClick={() => setActivePage("generate")} />
            <ActionButton icon={Sparkles} title="Generate 7 posts" subtitle="Create a week of content" onClick={onGenerateSeven} />
            <ActionButton icon={CalendarDays} title="View calendar" subtitle="See all scheduled posts" onClick={() => setActivePage("calendar")} />
            <ActionButton icon={BarChart3} title="View analytics" subtitle="Track performance" onClick={() => setActivePage("analytics")} />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function StatusPill({ label, tone = "blue" }: { label: string; tone?: "blue" | "green" | "slate" | "amber" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${tones[tone]}`}>{label}</span>;
}

function UsageBanner({ usage }: { usage: UsageSummary }) {
  const checkoutUrl = usage.checkout_url || process.env.NEXT_PUBLIC_POSTPILOT_CHECKOUT_URL || "";
  const isStarter = usage.plan === "starter";
  const available = isStarter ? usage.monthly_available : usage.free_available;
  const limit = isStarter ? usage.monthly_generation_limit : usage.free_generation_limit;
  const text = isStarter
    ? available > 0
      ? `You have ${available} of ${limit} AI-generated posts remaining this month.`
      : `You have reached your monthly AI generation limit. Your credits reset on ${formatDate(usage.monthly_usage_period_end)}.`
    : available > 0
      ? `You have ${available} free AI-generated posts remaining.`
      : "You've used your 7 free AI-generated posts.";

  return (
    <div className="rounded-2xl border border-[#DCE8FF] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#0F1E46]">{text}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {isStarter
              ? `Credits reset on ${formatDate(usage.monthly_usage_period_end)}.`
              : available > 0
                ? "Start with 7 free AI-generated posts. Then continue with PostPilot Starter for $19/month."
                : "Upgrade to PostPilot Starter for $19/month to keep generating Whop content."}
          </p>
          </div>
          {!isStarter ? (
            <a href={checkoutUrl || "#"} className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-sm">
              Upgrade to Starter — $19/month
            </a>
          ) : available <= 0 ? (
          <Link href="/support" className="text-sm font-bold text-slate-500 hover:text-blue-700">Need more? Contact support.</Link>
          ) : null}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-4 rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-4 text-left transition hover:border-blue-300 hover:bg-white hover:shadow-sm">
      <span className="rounded-2xl bg-white p-3 text-[#2563EB] shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-extrabold text-[#0F1E46]">{title}</span>
        <span className="mt-1 block text-sm text-slate-500">{subtitle}</span>
      </span>
    </button>
  );
}

function GeneratorPanel({
  businessName,
  busy,
  context,
  draftPosts,
  generatedContent,
  generatedTitle,
  generateMode,
  prompt,
  selectedForum,
  selectedPostType,
  selectedPostTypes,
  singleScheduledAt,
  setDraftPosts,
  setGeneratedContent,
  setGeneratedTitle,
  setGenerateMode,
  setPrompt,
  setSelectedPostType,
  setSelectedPostTypes,
  setSingleScheduledAt,
  onGenerateSingle,
  onGenerateMultiple,
  onRegenerateDraft,
  onPublishNow,
  onSchedule,
  usage,
}: {
  businessName: string;
  busy: boolean;
  context: ProductContext;
  draftPosts: DraftPost[];
  generatedContent: string;
  generatedTitle: string;
  generateMode: GenerateMode;
  prompt: string;
  selectedForum?: Forum;
  selectedForumId: string;
  selectedPostType: string;
  selectedPostTypes: string[];
  singleScheduledAt: string;
  setDraftPosts: (posts: DraftPost[]) => void;
  setGeneratedContent: (content: string) => void;
  setGeneratedTitle: (title: string) => void;
  setGenerateMode: (mode: GenerateMode) => void;
  setPrompt: (prompt: string) => void;
  setSelectedPostType: (postType: string) => void;
  setSelectedPostTypes: (postTypes: string[]) => void;
  setSingleScheduledAt: (value: string) => void;
  onGenerateSingle: () => void;
  onGenerateMultiple: (count?: number) => void;
  onRegenerateDraft: (index: number) => void;
  onPublishNow: (title: string, content: string) => void;
  onSchedule: (posts: Array<{ title: string; content: string; scheduled_at?: string; forum_id?: string; draftId?: string | null }>) => void;
  usage: UsageSummary;
}) {
  const previewContent = appendSignature(generatedContent || "Generated content will appear here.", Boolean(context.signature_enabled_default), context.signature_template, businessName);
  const postTypes = ["Engagement question", "Announcement", "Value post", "Motivation", "Weekly recap", "Product reminder"];
  const generationAvailable = usage.plan === "starter" ? usage.monthly_available : usage.free_available;
  const weeklyCount = usage.plan === "free" && generationAvailable < 7 ? generationAvailable : 7;
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[390px_1fr]">
      <Card>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Content settings</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#0F1E46]">Shape the next draft</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Choose the angle, then let PostPilot turn your context into community content.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#EFF5FF] p-1">
          <button type="button" onClick={() => setGenerateMode("single")} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${generateMode === "single" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-blue-700"}`}>
            Single post
          </button>
          <button type="button" onClick={() => setGenerateMode("multiple")} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${generateMode === "multiple" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-blue-700"}`}>
            7-post week
          </button>
        </div>
        <div className="mt-5 rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-4">
          <p className="text-sm font-extrabold text-[#0F1E46]">
            {usage.plan === "starter"
              ? `AI posts remaining this month: ${usage.monthly_available} / ${usage.monthly_generation_limit}`
              : `Free AI posts remaining: ${usage.free_available} / ${usage.free_generation_limit}`}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Edit, schedule, and publish generated posts without extra credits.</p>
        </div>
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Selected forum</p>
            <p className="mt-2 font-extrabold text-[#0F1E46]">{getForumName(selectedForum)}</p>
            <p className="mt-1 text-sm text-slate-500">Whop forum scheduling by your PostPilot agent.</p>
          </div>
          <div className="space-y-3">
            <FieldLabel>{generateMode === "single" ? "Post type" : "Post type mix"} <span className="text-red-500">*</span></FieldLabel>
            <div className="flex flex-wrap gap-2">
              {postTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    if (generateMode === "single") {
                      setSelectedPostType(type);
                      return;
                    }
                    setSelectedPostTypes(
                      selectedPostTypes.includes(type)
                        ? selectedPostTypes.filter((item) => item !== type)
                        : [...selectedPostTypes, type],
                    );
                  }}
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                    (generateMode === "single" ? selectedPostType === type : selectedPostTypes.includes(type))
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-[#DCE8FF] bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {generateMode === "single" && !selectedPostType ? <p className="text-xs font-semibold text-amber-600">Choose one so the AI knows what kind of community content to write.</p> : null}
            {generateMode === "multiple" && selectedPostTypes.length === 0 ? <p className="text-xs font-semibold text-amber-600">Choose several post types so the 7-post week has variety.</p> : null}
            {generateMode === "multiple" && selectedPostTypes.length > 0 ? <p className="text-xs font-semibold text-slate-500">{selectedPostTypes.length} type{selectedPostTypes.length === 1 ? "" : "s"} selected for this week.</p> : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-[#DCE8FF] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Brand voice</p>
              <p className="mt-2 font-bold text-[#0F1E46]">{context.brand_voice || "Professional"}</p>
            </div>
            <div className="rounded-2xl border border-[#DCE8FF] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Posting goal</p>
              <p className="mt-2 font-bold text-[#0F1E46]">{context.posting_goal || "Engagement"}</p>
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Prompt/context</FieldLabel>
            <TextArea value={prompt} onChange={setPrompt} rows={8} />
          </div>
          <div>
            {generateMode === "single" ? <Button className="w-full" disabled={busy || !selectedPostType} onClick={onGenerateSingle}>
              {busy && generateMode === "single" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate post
            </Button> : <Button className="w-full" variant="secondary" disabled={busy || selectedPostTypes.length === 0 || weeklyCount <= 0} onClick={() => onGenerateMultiple(weeklyCount)}>
              {weeklyCount < 7 ? `Generate ${weeklyCount} remaining posts` : "Generate 7 posts"}
            </Button>}
          </div>
          {usage.plan === "free" && usage.free_available < 7 && generateMode === "multiple" ? (
            <p className="text-xs font-semibold text-amber-600">
              You only have {usage.free_available} free AI-generated posts remaining. Generate {usage.free_available} posts or upgrade to Starter.
            </p>
          ) : null}
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Draft previews</p>
            <h3 className="mt-2 text-2xl font-extrabold text-[#0F1E46]">Review before your agent publishes</h3>
            <p className="mt-2 text-sm text-slate-600">This content will be published by your PostPilot agent on behalf of your Whop business.</p>
          </div>
          <StatusPill label={generateMode === "single" ? "Single draft" : "Weekly batch"} tone="blue" />
        </div>
        {generateMode === "single" ? (
          <div className="mt-5 space-y-4">
            <TextInput value={generatedTitle} onChange={setGeneratedTitle} placeholder="Post title" />
            <TextArea value={generatedContent} onChange={setGeneratedContent} rows={10} placeholder="Generate or write your post content..." />
            <div className="space-y-2">
              <FieldLabel>Schedule date and time</FieldLabel>
              <input
                type="datetime-local"
                value={singleScheduledAt}
                onChange={(event) => setSingleScheduledAt(event.target.value)}
                className="w-full rounded-2xl border border-[#DCE8FF] bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="rounded-3xl border border-[#DCE8FF] bg-[#F8FAFF] p-5">
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusPill label={getForumName(selectedForum)} tone="blue" />
                <StatusPill label={context.brand_voice || "Professional"} tone="slate" />
                <StatusPill label={context.posting_goal || "Engagement"} tone="green" />
              </div>
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{previewContent}</p>
            </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" disabled={!draftPosts[0]?.draftId || busy} onClick={() => onRegenerateDraft(0)}>
                  <RefreshCw className="h-4 w-4" />
                  {draftPosts[0]?.free_regeneration_used ? "Regenerate (uses 1 AI post credit)" : "Regenerate free"}
                </Button>
                <Button variant="secondary" disabled={!generatedContent} onClick={() => onSchedule([{ title: generatedTitle || "Community update", content: generatedContent, scheduled_at: singleScheduledAt, draftId: draftPosts[0]?.draftId || null }])}>Schedule</Button>
                <Button disabled={!generatedContent} onClick={() => onPublishNow(generatedTitle || "Community update", generatedContent)}>Publish now</Button>
              </div>
            </div>
        ) : (
          <div className="mt-5 space-y-4">
            {draftPosts.length ? (
              draftPosts.map((post, index) => (
                <div key={`${post.title}-${index}`} className="rounded-3xl border border-[#DCE8FF] bg-[#F8FAFF] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <input
                        value={post.title}
                        onChange={(event) => {
                          const next = [...draftPosts];
                          next[index] = { ...post, title: event.target.value };
                          setDraftPosts(next);
                        }}
                        className="w-full rounded-xl border border-transparent bg-transparent px-0 py-1 font-extrabold text-[#0F1E46] outline-none focus:border-[#DCE8FF] focus:bg-white focus:px-3"
                      />
                        <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          type="datetime-local"
                          value={toDateTimeLocalValue(post.scheduled_at)}
                          onChange={(event) => {
                            const next = [...draftPosts];
                            next[index] = { ...post, scheduled_at: event.target.value };
                            setDraftPosts(next);
                          }}
                          className="rounded-full border border-[#DCE8FF] bg-white px-3 py-1 text-xs font-bold text-slate-600 outline-none"
                        />
                          <StatusPill label={getForumName(selectedForum)} tone="blue" />
                          <StatusPill label={post.free_regeneration_used ? "Regenerate uses 1 AI post credit" : "Free regeneration available"} tone={post.free_regeneration_used ? "amber" : "green"} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" disabled={busy} onClick={() => onRegenerateDraft(index)} className="px-3 py-2 text-xs">
                          <RefreshCw className="h-4 w-4" />
                          {post.free_regeneration_used ? "Regenerate" : "Regenerate free"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDraftPosts(draftPosts.filter((_, itemIndex) => itemIndex !== index))}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  <TextArea
                    value={post.content}
                    onChange={(value) => {
                      const next = [...draftPosts];
                      next[index] = { ...post, content: value };
                      setDraftPosts(next);
                    }}
                    rows={5}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[#DCE8FF] bg-[#F8FAFF] p-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-blue-500" />
                <p className="mt-4 font-bold text-[#0F1E46]">Your generated drafts will appear here.</p>
                <p className="mt-2 text-sm text-slate-500">Generate one post or a 7-post week to review, approve, and schedule.</p>
              </div>
            )}
            <Button disabled={!draftPosts.length} onClick={() => onSchedule(draftPosts)}>
              Schedule included posts
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function CalendarPreview({
  days,
  postsForDay,
  onDelete,
}: {
  days: Date[];
  postsForDay: (day: Date) => ScheduledPost[];
  onDelete?: (post: ScheduledPost) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Week view</p>
          <h3 className="mt-1 text-xl font-extrabold text-[#0F1E46]">Scheduled by your agent</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(140px, 1fr))", gap: "12px", minWidth: "980px" }}>
          {days.map((day) => {
            const posts = postsForDay(day);
            return (
              <div key={day.toISOString()} className="min-h-[190px] rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-3">
                <p className="text-sm font-extrabold text-[#0F1E46]">{formatDay(day)}</p>
                <div className="mt-3 space-y-2">
                  {posts.length ? (
                    posts.map((post) => (
                      <div key={post.id} className="rounded-xl bg-white p-3 text-[#0F1E46] shadow-sm ring-1 ring-[#DCE8FF]">
                        <p className="line-clamp-2 text-xs font-bold">{post.title || new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(post.scheduled_at))}</p>
                        <p className="mt-1 text-[11px] font-semibold text-blue-600">{formatDateTime(post.scheduled_at)}</p>
                        <StatusPill label={post.status || "scheduled"} tone="blue" />
                        {onDelete ? (
                          <button type="button" onClick={() => onDelete(post)} className="mt-2 block text-[11px] font-bold text-red-600 hover:underline">
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <button type="button" className="mt-8 w-full rounded-xl border border-dashed border-[#DCE8FF] px-3 py-4 text-xs font-bold text-slate-400 transition hover:border-blue-300 hover:text-blue-600">
                      + Add post
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function MonthCalendar({
  days,
  postsForDay,
  onDelete,
}: {
  days: Date[];
  postsForDay: (day: Date) => ScheduledPost[];
  onDelete: (post: ScheduledPost) => void;
}) {
  const todayStr = toDateInputValue(new Date());
  const currentMonth = days[15]?.getMonth();
  const DOW_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <Card>
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Month view</p>
        <h3 className="mt-1 text-xl font-extrabold text-[#0F1E46]">Content cadence</h3>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {DOW_HEADERS.map((label) => (
          <div key={label} className="pb-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</div>
        ))}
        {days.map((day) => {
          const posts = postsForDay(day);
          const isToday = toDateInputValue(day) === todayStr;
          const isCurrentMonth = day.getMonth() === currentMonth;
          const extra = posts.length - 3;
          return (
            <div
              key={day.toISOString()}
              className={`min-h-28 rounded-2xl border p-2 ${isToday ? "border-blue-500 bg-blue-50 ring-2 ring-blue-400" : isCurrentMonth ? "border-[#DCE8FF] bg-[#F8FAFF]" : "border-slate-100 bg-slate-50/50"}`}
            >
              <p className={`text-xs font-black ${isToday ? "text-blue-600" : isCurrentMonth ? "text-[#0F1E46]" : "text-slate-400"}`}>{day.getDate()}</p>
              <div className="mt-1 space-y-1">
                {posts.slice(0, 3).map((post) => (
                  <button key={post.id} type="button" onClick={() => onDelete(post)} className="block w-full rounded-lg bg-white px-2 py-1 text-left text-[11px] font-bold text-blue-700 ring-1 ring-[#DCE8FF]">
                    {post.title || new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(post.scheduled_at))}
                  </button>
                ))}
                {extra > 0 ? <p className="text-[11px] font-semibold text-slate-500">+{extra} more</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function UpcomingListItem({
  post,
  companyId,
  onDelete,
  onSaved,
}: {
  post: ScheduledPost;
  companyId: string;
  onDelete?: (post: ScheduledPost) => void;
  onSaved?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [editScheduledAt, setEditScheduledAt] = useState(() => toDateTimeLocalValue(post.scheduled_at));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/scheduled-posts/${encodeURIComponent(post.id)}?companyId=${encodeURIComponent(companyId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, scheduled_at: dateTimeLocalToIso(editScheduledAt) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");
      setEditing(false);
      onSaved?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#DCE8FF] bg-[#F8FAFF] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-500">{formatDateTime(post.scheduled_at)} · {post.forum_name || "Default forum"}</p>
          <div className="mt-1">
            <StatusPill label={post.status || "scheduled"} tone="blue" />
          </div>
          {!editing ? (
            <>
              <p className={`mt-2 text-sm text-[#0F1E46] ${expanded ? "" : "line-clamp-3"}`}>{post.content}</p>
              {(post.content || "").length > 200 ? (
                <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-bold text-blue-600 hover:underline">
                  {expanded ? "Show less" : "Show more"}
                </button>
              ) : null}
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-[#DCE8FF] bg-white p-3 text-sm text-[#0F1E46] outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="datetime-local"
                value={editScheduledAt}
                onChange={(e) => setEditScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-[#DCE8FF] bg-white p-3 text-sm text-[#0F1E46] outline-none focus:ring-2 focus:ring-blue-400"
              />
              {saveError ? <p className="text-xs text-red-600">{saveError}</p> : null}
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button variant="ghost" onClick={() => { setEditing(false); setEditContent(post.content || ""); setEditScheduledAt(toDateTimeLocalValue(post.scheduled_at)); setSaveError(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
        {post.whop_post_url ? (
          <a href={post.whop_post_url} target="_blank" rel="noreferrer" className="text-blue-600">
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
      {!editing ? (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          {onDelete ? (
            <Button variant="danger" onClick={() => onDelete(post)}>Delete</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function UpcomingList({
  posts,
  emptyText,
  companyId,
  onDelete,
  onSaved,
}: {
  posts: ScheduledPost[];
  emptyText: string;
  companyId: string;
  onDelete?: (post: ScheduledPost) => void;
  onSaved?: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Queue</p>
          <h3 className="mt-1 text-xl font-extrabold text-[#0F1E46]">Upcoming posts</h3>
        </div>
        <StatusPill label={`${posts.length} queued`} tone={posts.length ? "green" : "slate"} />
      </div>
      <div className="mt-5 space-y-3">
        {posts.length ? (
          posts.map((post) => (
            <UpcomingListItem key={post.id} post={post} companyId={companyId} onDelete={onDelete} onSaved={onSaved} />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-5 text-sm text-slate-600">{emptyText}</p>
        )}
      </div>
    </Card>
  );
}

function AnalyticsPage({
  analytics,
  scheduledCount,
}: {
  analytics: {
    rows: AnalyticsRow[];
    comments: number;
    likes: number;
    engagementRate: string;
    bestTime: string;
  };
  scheduledCount: number;
}) {
  const realRows = analytics.rows.filter((row) => row.title && row.title !== "Published post");
  const enoughData = realRows.length >= 5;
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const byDay = dayLabels.map((label, index) => {
    const score = realRows
      .filter((row) => {
        const date = new Date(row.published_at || row.created_at || "");
        return !Number.isNaN(date.getTime()) && ((date.getDay() + 6) % 7) === index;
      })
      .reduce((sum, row) => sum + Number(row.comment_count || 0) + Number(row.like_count || 0), 0);
    return { label, score };
  });
  const maxScore = Math.max(1, ...byDay.map((item) => item.score));
  const topPosts = [...realRows]
    .sort((a, b) => Number(b.comment_count || 0) + Number(b.like_count || 0) - (Number(a.comment_count || 0) + Number(a.like_count || 0)))
    .slice(0, 5);
  const postingDays = new Set(realRows.map((row) => (row.published_at || row.created_at || "").slice(0, 10)).filter(Boolean));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Posts published" value={realRows.length} helper="Parsed from real post data" icon={FileText} />
        <MetricCard label="Scheduled posts" value={scheduledCount} helper="Queued by your agent" icon={CalendarDays} />
        <MetricCard label="Comments tracked" value={analytics.comments} helper={`${analytics.likes} likes tracked`} icon={MessageSquareText} />
        <MetricCard label="Posting streak" value={postingDays.size} helper="Unique posting days" icon={BarChart3} />
      </div>
      {!enoughData ? (
        <Card className="border-[#DCE8FF] bg-gradient-to-br from-white to-[#F8FAFF]">
          <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Learning state</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#0F1E46]">You are still building your data.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Publish at least 5 posts with tracked engagement to unlock reliable trends. Until then, PostPilot will show basic real metrics instead of fake chart movement.
              </p>
            </div>
            <div className="rounded-3xl border border-dashed border-[#DCE8FF] bg-white p-6 text-center">
              <p className="text-4xl font-extrabold text-blue-600">{Math.min(realRows.length, 5)}/5</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">posts needed for trends</p>
            </div>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-extrabold text-[#0F1E46]">Engagement by day</h3>
          {enoughData ? (
            <div className="mt-6 flex h-64 items-end gap-4">
              {byDay.map((item) => (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-52 w-full items-end rounded-xl bg-blue-50 px-2">
                    <div className="w-full rounded-t-xl bg-blue-600" style={{ height: `${Math.max(8, (item.score / maxScore) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState text="Engagement by day will appear after more posts are published." />
          )}
        </Card>
        <Card>
          <h3 className="text-xl font-extrabold text-[#0F1E46]">Engagement over time</h3>
          <div className="mt-6 space-y-3">
            {enoughData ? realRows.slice(0, 7).map((row, index) => {
              const score = Number(row.comment_count || 0) + Number(row.like_count || 0);
              return (
                <div key={`${row.id || row.title}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-4 text-sm font-bold text-blue-950">
                    <span className="line-clamp-1">{row.title}</span>
                    <span>{score}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-blue-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(6, score * 8))}%` }} />
                  </div>
                </div>
              );
            }) : <EmptyChartState text="Trend lines unlock after 5 tracked posts." />}
          </div>
        </Card>
      </div>
      <Card>
        <h3 className="text-xl font-extrabold text-[#0F1E46]">Top performing posts</h3>
        <div className="mt-5 overflow-x-auto">
          {topPosts.length ? <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3">Post</th>
                <th className="py-3">Published</th>
                <th className="py-3">Comments</th>
                <th className="py-3">Likes</th>
                <th className="py-3">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((row, index) => (
                <tr key={`${row.id || row.title}-${index}`} className="border-t border-blue-100">
                  <td className="py-4 font-bold text-blue-950">{row.title}</td>
                  <td className="py-4 text-slate-500">{formatDateTime(row.published_at || row.created_at)}</td>
                  <td className="py-4 text-slate-700">{row.comment_count || 0}</td>
                  <td className="py-4 text-slate-700">{row.like_count || 0}</td>
                  <td className="py-4 text-slate-700">{row.engagement_rate || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table> : <p className="rounded-2xl border border-dashed border-[#DCE8FF] bg-[#F8FAFF] p-5 text-sm text-slate-600">Top posts will appear after real published post data is available.</p>}
        </div>
      </Card>
    </div>
  );
}

function EmptyChartState({ text }: { text: string }) {
  return (
    <div className="mt-6 flex h-64 items-center justify-center rounded-3xl border border-dashed border-[#DCE8FF] bg-[#F8FAFF] p-8 text-center">
      <div>
        <BarChart3 className="mx-auto h-8 w-8 text-blue-500" />
        <p className="mt-3 text-sm font-semibold text-slate-500">{text}</p>
      </div>
    </div>
  );
}
