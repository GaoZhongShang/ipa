import { useState, useEffect, useCallback } from "react";
import {
  Search, Bell, MapPin, Heart, ArrowLeft, Filter, Home,
  Bookmark, User, Edit3, CheckCircle, Phone, Lock, Shield,
  GraduationCap, Briefcase, Building, Clock, Plus,
  ChevronRight, FileText, Camera, Eye, TrendingUp,
  Zap, Award, Check, Settings, MessageSquare
} from "lucide-react";

import {
  login as apiLogin,
  register as apiRegister,
  getJobs,
  searchJobs,
  getJobDetail,
  getHotJobs,
  getUserProfile,
  getCollections,
  addCollection,
  removeCollection,
  getDeliveries,
  deliverJob,
  setToken,
  setUser,
  clearToken,
  getSavedUser,
  type JobListDTO,
  type JobDetailDTO,
  type PageData,
  type UserProfile,
  type DeliveryRecordDTO,
  type CollectionDTO,
} from "../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────

const COMPANY_PALETTE = [
  { bg: "#EFEFEF", color: "#1A1A1A" },
  { bg: "#FFF8E1", color: "#C07800" },
  { bg: "#FFF3E0", color: "#C05200" },
  { bg: "#E8F0FE", color: "#0050CC" },
  { bg: "#FFF3EE", color: "#FF6319" },
  { bg: "#EEF2FF", color: "#1655F5" },
  { bg: "#E6F7EE", color: "#00B96B" },
  { bg: "#FFEBEE", color: "#B02020" },
];

function getCompanyStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COMPANY_PALETTE[Math.abs(hash) % COMPANY_PALETTE.length];
}

function getInitial(name: string) {
  return name.charAt(0) || "?";
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffHrs < 1) return "刚刚";
  if (diffHrs < 24) return `${diffHrs}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return dateStr.split(" ")[0] || dateStr.split("T")[0];
}

const DELIVERY_STATUS: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "已查看", color: "#1655F5", bg: "#EEF2FF" },
  1: { label: "邀请面试", color: "#00B96B", bg: "#E6F7EE" },
  2: { label: "不合适", color: "#FF3B3B", bg: "#FFF0F0" },
};

const CATEGORY_KEYWORDS = ["全部", "Flutter", "Java", "前端", "Android", "iOS", "算法", "运维"];

// ─── Shared components ────────────────────────────────────────────────────

function LoadingSpinner({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div
        className="w-8 h-8 rounded-full border-[3px] border-muted animate-spin"
        style={{ borderTopColor: "#1655F5" }}
      />
      <span className="text-[13px] text-muted-foreground mt-3">{text}</span>
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "#FFF0F0" }}
      >
        <span className="text-[22px]">!</span>
      </div>
      <p className="text-[14px] text-foreground font-medium mb-1">加载失败</p>
      <p className="text-[12px] text-muted-foreground text-center mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #1243D0, #2A7FFF)" }}
        >
          重试
        </button>
      )}
    </div>
  );
}

function CompanyAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const style = getCompanyStyle(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: style.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: style.color,
        flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans', system-ui",
        letterSpacing: "-0.02em",
      }}
    >
      {getInitial(name)}
    </div>
  );
}

function JobCard({
  job,
  onSelect,
  isFavorited,
  onToggleFavorite,
}: {
  job: JobListDTO;
  onSelect: (j: JobListDTO) => void;
  isFavorited: boolean;
  onToggleFavorite: (id: number) => void;
}) {
  const style = getCompanyStyle(job.companyName);
  const isHot = job.viewCount > 100;

  return (
    <div
      onClick={() => onSelect(job)}
      className="bg-card rounded-2xl p-4 mb-3 cursor-pointer transition-transform active:scale-[0.99]"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-foreground font-semibold text-[15px] leading-snug"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}
            >
              {job.title}
            </span>
            {isHot && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                style={{ background: "#FF6319" }}
              >
                热招
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-[16px] font-bold" style={{ color: "#FF6319" }}>
              {job.salary}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <CompanyAvatar name={job.companyName} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(job.id);
            }}
            className="p-0.5"
          >
            <Heart
              size={16}
              fill={isFavorited ? "#FF6319" : "none"}
              stroke={isFavorited ? "#FF6319" : "#8895A7"}
            />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-3 flex-wrap">
        <span>{job.companyName}</span>
        <span>·</span>
        <MapPin size={11} />
        <span>{job.city}</span>
        <span>·</span>
        <span>{job.educationRequirement}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: "#EEF2FF", color: "#1655F5" }}
        >
          {job.educationRequirement}
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">
          {formatTime(job.createTime)}
        </span>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, user: { userId: number; name: string; phone: string }) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!phone || !password) {
      setError("请填写手机号和密码");
      return;
    }
    if (!agreed) {
      setError("请先同意用户服务协议");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await apiLogin(phone, password);
        setToken(res.token);
        setUser({ userId: res.userId, name: res.name, phone: res.phone });
        onLogin(res.token, { userId: res.userId, name: res.name, phone: res.phone });
      } else {
        if (!name) {
          setError("请填写姓名");
          setLoading(false);
          return;
        }
        await apiRegister(phone, password, name);
        const res = await apiLogin(phone, password);
        setToken(res.token);
        setUser({ userId: res.userId, name: res.name, phone: res.phone });
        onLogin(res.token, { userId: res.userId, name: res.name, phone: res.phone });
      }
    } catch (e: any) {
      setError(e.message || "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand Hero */}
      <div
        className="flex flex-col items-center justify-end pb-10 pt-16 px-6"
        style={{
          background: "linear-gradient(150deg, #1243D0 0%, #1655F5 55%, #2A7FFF 100%)",
          minHeight: "40vh",
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-[18px] bg-white flex items-center justify-center"
            style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.2)" }}
          >
            <Zap size={26} style={{ color: "#1655F5" }} fill="#1655F5" />
          </div>
          <div>
            <span
              className="text-white text-[28px] font-extrabold tracking-tight block"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: "-0.03em" }}
            >
              JobLink
            </span>
            <span className="text-white/60 text-[12px]">直聘·快速匹配</span>
          </div>
        </div>
        <p className="text-white/50 text-[13px] mt-2">与优秀雇主直接沟通，告别中间商</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 bg-card rounded-t-3xl -mt-5 px-6 pt-7 pb-8">
        {/* Mode Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-7">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all ${
                mode === tab ? "bg-card text-foreground" : "text-muted-foreground"
              }`}
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui",
                boxShadow: mode === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab === "login" ? "账号登录" : "注册账号"}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-3 mb-5">
          {mode === "register" && (
            <div className="flex items-center bg-muted rounded-xl px-4 py-3.5 gap-3">
              <User size={17} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                className="flex-1 bg-transparent text-[15px] outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
          <div className="flex items-center bg-muted rounded-xl px-4 py-3.5 gap-3">
            <Phone size={17} className="text-muted-foreground flex-shrink-0" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              className="flex-1 bg-transparent text-[15px] outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center bg-muted rounded-xl px-4 py-3.5 gap-3">
            <Lock size={17} className="text-muted-foreground flex-shrink-0" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "请输入密码" : "设置登录密码（不少于6位）"}
              className="flex-1 bg-transparent text-[15px] outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-[13px] text-center mb-4 p-3 rounded-xl"
            style={{ background: "#FFF0F0", color: "#FF3B3B" }}
          >
            {error}
          </div>
        )}

        {/* Agreement */}
        <div className="flex items-start gap-2.5 mb-6">
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex-shrink-0 mt-0.5 rounded flex items-center justify-center transition-colors"
            style={{
              width: 18,
              height: 18,
              background: agreed ? "#1655F5" : "transparent",
              border: agreed ? "none" : "1.5px solid #CBD5E1",
            }}
          >
            {agreed && <Check size={11} color="white" strokeWidth={3} />}
          </button>
          <span className="text-[12px] text-muted-foreground leading-relaxed">
            我已阅读并同意{" "}
            <span style={{ color: "#1655F5" }}>《用户服务协议》</span>
            {" "}和{" "}
            <span style={{ color: "#1655F5" }}>《隐私政策》</span>
          </span>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-[16px] transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{
            background: loading ? "#8895A7" : "linear-gradient(135deg, #1243D0, #2A7FFF)",
            fontFamily: "'Plus Jakarta Sans', system-ui",
            boxShadow: loading ? "none" : "0 8px 24px rgba(22,85,245,0.4)",
          }}
        >
          {loading ? "处理中..." : mode === "login" ? "立即登录" : "注册并登录"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-muted-foreground">其他方式登录</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social Login */}
        <div className="flex justify-center gap-10">
          {["微信", "QQ", "Apple"].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1.5">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: "#F1F4F9" }}
              >
                <span className="text-[13px] font-medium text-muted-foreground">{s.substring(0, 1)}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────

function HomeScreen({
  onJobSelect,
  favorites,
  onToggleFavorite,
  onJobsLoaded,
}: {
  onJobSelect: (j: JobListDTO) => void;
  favorites: Set<number>;
  onToggleFavorite: (id: number) => void;
  onJobsLoaded?: (jobs: JobListDTO[]) => void;
}) {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<JobListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const keyword = activeCategory === "全部" ? (searchQuery || undefined) : (searchQuery || activeCategory);
      const params: any = { page: 0, size: 20 };
      if (keyword) params.keyword = keyword;

      const data = searchQuery || activeCategory !== "全部"
        ? await searchJobs(params)
        : await getJobs(0, 20);

      setJobs(data.content);
      setTotalCount(data.totalElements);
      onJobsLoaded?.(data.content);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearch = () => {
    fetchJobs();
  };

  return (
    <div>
      {/* Header */}
      <div
        className="px-5 pt-6 pb-5"
        style={{
          background: "linear-gradient(150deg, #1243D0 0%, #1655F5 55%, #2A7FFF 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1 text-white/70 text-[12px] mb-0.5">
              <MapPin size={12} />
              <span>全国</span>
              <ChevronRight size={11} className="opacity-50" />
            </div>
            <h1
              className="text-white font-extrabold text-[21px] leading-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: "-0.02em" }}
            >
              找到理想职位
            </h1>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Bell size={20} color="white" />
            <span
              className="absolute top-2 right-2 w-2 h-2 rounded-full"
              style={{ background: "#FF6319", border: "1.5px solid #1655F5" }}
            />
          </button>
        </div>

        {/* Search Bar */}
        <div
          className="flex items-center bg-white rounded-2xl px-4 py-3 gap-3"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
        >
          <Search size={17} style={{ color: "#8895A7" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索职位名称、公司"
            className="flex-1 text-[14px] outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          <div className="w-px h-4 bg-border" />
          <button onClick={handleSearch} className="flex items-center gap-1 pl-1" style={{ color: "#1655F5" }}>
            <Filter size={15} />
            <span className="text-[12px] font-semibold">搜索</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div
        className="flex gap-2 px-5 py-3.5 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORY_KEYWORDS.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
            style={
              activeCategory === cat
                ? {
                    background: "linear-gradient(135deg, #1655F5, #2A7FFF)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(22,85,245,0.3)",
                    fontFamily: "'Plus Jakarta Sans', system-ui",
                  }
                : {
                    background: "white",
                    color: "#8895A7",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    fontFamily: "'Plus Jakarta Sans', system-ui",
                  }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Job List */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2
            className="font-bold text-[15px] text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}
          >
            {activeCategory === "全部" ? "职位列表" : `${activeCategory}相关`}
            <span className="text-[13px] text-muted-foreground font-normal ml-1.5">
              {totalCount}个
            </span>
          </h2>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorView message={error} onRetry={fetchJobs} />
        ) : jobs.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground">
            <Search size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-[14px]">暂无相关职位</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelect={onJobSelect}
              isFavorited={favorites.has(job.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Job Detail Screen ────────────────────────────────────────────────────

function JobDetailScreen({
  jobId,
  onBack,
  isFavorited,
  onToggleFavorite,
  isApplied,
  onApply,
}: {
  jobId: number;
  onBack: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isApplied: boolean;
  onApply: () => void;
}) {
  const [job, setJob] = useState<JobDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorited, setFavorited] = useState(isFavorited);
  const [applied, setApplied] = useState(isApplied);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getJobDetail(jobId);
        setJob(data);
        setFavorited(data.collected ?? isFavorited);
        setApplied(data.delivered ?? isApplied);
      } catch (e: any) {
        setError(e.message || "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleFavorite = async () => {
    setActionLoading(true);
    try {
      if (favorited) {
        await removeCollection(jobId);
        setFavorited(false);
        onToggleFavorite();
      } else {
        await addCollection(jobId);
        setFavorited(true);
        onToggleFavorite();
      }
    } catch (e: any) {
      showToast(e.message || "操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = async () => {
    if (applied) return;
    setActionLoading(true);
    try {
      await deliverJob(jobId);
      setApplied(true);
      onApply();
      showToast("简历投递成功！");
    } catch (e: any) {
      showToast(e.message || "投递失败");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 pt-5 pb-4 bg-card flex items-center sticky top-0 z-10" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft size={19} />
          </button>
          <span className="font-semibold text-[15px] ml-3">职位详情</span>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 pt-5 pb-4 bg-card flex items-center sticky top-0 z-10" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft size={19} />
          </button>
          <span className="font-semibold text-[15px] ml-3">职位详情</span>
        </div>
        <ErrorView message={error || "职位不存在"} onRetry={onBack} />
      </div>
    );
  }

  const style = getCompanyStyle(job.companyName);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-white text-[13px] font-medium z-50 flex items-center gap-2"
          style={{ background: toast.includes("失败") ? "#FF3B3B" : "#00B96B", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
        >
          <CheckCircle size={15} />
          {toast}
        </div>
      )}

      {/* Sticky Header */}
      <div className="px-5 pt-5 pb-4 bg-card flex items-center justify-between sticky top-0 z-10" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft size={19} />
        </button>
        <span className="font-semibold text-[15px]" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
          职位详情
        </span>
        <button
          onClick={handleFavorite}
          disabled={actionLoading}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <Heart size={18} fill={favorited ? "#FF6319" : "none"} stroke={favorited ? "#FF6319" : "currentColor"} />
        </button>
      </div>

      <div className="overflow-y-auto pb-28">
        {/* Company + Job Info */}
        <div className="bg-card px-5 py-5 mb-2">
          <div className="flex items-center gap-4 mb-4">
            <CompanyAvatar name={job.companyName} size={56} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-[17px] text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
                  {job.companyName}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded flex items-center gap-0.5" style={{ background: "#EEF2FF", color: "#1655F5" }}>
                  <CheckCircle size={10} />
                  已认证
                </span>
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-[22px] text-foreground mb-1 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: "-0.02em" }}>
            {job.title}
          </h2>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[24px] font-bold" style={{ color: "#FF6319" }}>{job.salary}</span>
            {job.viewCount > 100 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#FF6319" }}>
                热招
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { Icon: MapPin, label: job.city },
              { Icon: GraduationCap, label: job.educationRequirement },
              { Icon: Eye, label: `${job.viewCount}次浏览` },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-muted-foreground" style={{ background: "#F1F4F9" }}>
                <Icon size={12} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="bg-card px-5 py-5 mb-2">
            <h3 className="font-bold text-[15px] text-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
              职位描述
            </h3>
            <p className="text-[14px] text-foreground leading-7 whitespace-pre-line">{job.description}</p>
          </div>
        )}

        {/* Company Info */}
        {job.companyInfo && (
          <div className="bg-card px-5 py-5 mb-2">
            <h3 className="font-bold text-[15px] text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
              公司简介
            </h3>
            <p className="text-[14px] text-foreground leading-6">{job.companyInfo}</p>
          </div>
        )}

        {/* HR Contact */}
        {job.hrContact && (
          <div className="bg-card px-5 py-5 mb-2">
            <h3 className="font-bold text-[15px] text-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
              招聘方
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-[14px]" style={{ background: "linear-gradient(135deg, #1655F5, #2A7FFF)" }}>
                HR
              </div>
              <div>
                <span className="font-semibold text-[14px] text-foreground">{job.hrContact}</span>
                <div className="text-[12px] text-muted-foreground">{formatTime(job.createTime)}发布</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card px-5 py-4 flex gap-3" style={{ boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -8px 20px rgba(0,0,0,0.04)" }}>
        <button
          onClick={handleFavorite}
          disabled={actionLoading}
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: favorited ? "#FFF3EE" : "#F1F4F9" }}
        >
          <Heart size={22} fill={favorited ? "#FF6319" : "none"} stroke={favorited ? "#FF6319" : "#8895A7"} />
        </button>
        <button
          onClick={handleApply}
          disabled={applied || actionLoading}
          className="flex-1 h-14 rounded-2xl font-bold text-[16px] text-white transition-transform active:scale-[0.98] disabled:opacity-70"
          style={{
            background: applied ? "#8895A7" : "linear-gradient(135deg, #1243D0, #2A7FFF)",
            fontFamily: "'Plus Jakarta Sans', system-ui",
            boxShadow: applied ? "none" : "0 6px 20px rgba(22,85,245,0.4)",
          }}
        >
          {applied ? "已投递简历" : "立即沟通 / 投递简历"}
        </button>
      </div>
    </div>
  );
}

// ─── Favorites & Applications Screen ──────────────────────────────────────

function ApplicationsScreen({
  favorites,
  jobs,
  onToggleFavorite,
  onJobSelect,
}: {
  favorites: Set<number>;
  jobs: JobListDTO[];
  onToggleFavorite: (id: number) => void;
  onJobSelect: (j: JobListDTO) => void;
}) {
  const [tab, setTab] = useState<"favorites" | "applications">("favorites");
  const [deliveries, setDeliveries] = useState<DeliveryRecordDTO[]>([]);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    if (tab === "applications") {
      (async () => {
        setDelLoading(true);
        try {
          const data = await getDeliveries(0, 50);
          setDeliveries(data.content);
        } catch {
          // ignore
        } finally {
          setDelLoading(false);
        }
      })();
    }
  }, [tab]);

  const favoriteJobs = jobs.filter((j) => favorites.has(j.id));

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-6 pb-0 bg-card" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <h1 className="font-extrabold text-[22px] text-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', system-ui", letterSpacing: "-0.02em" }}>
          收藏 & 投递
        </h1>
        <div className="flex border-b border-border">
          {([
            ["favorites", "我的收藏", favoriteJobs.length],
            ["applications", "投递记录", deliveries.length],
          ] as const).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="pb-3 mr-6 text-[15px] font-semibold border-b-2 transition-colors"
              style={
                tab === id
                  ? { borderBottomColor: "#1655F5", color: "#1655F5" }
                  : { borderBottomColor: "transparent", color: "#8895A7" }
              }
            >
              {label}
              <span className="ml-1.5 text-[12px] opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {tab === "favorites" &&
          (favoriteJobs.length > 0 ? (
            favoriteJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={onJobSelect}
                isFavorited={true}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Heart size={44} className="mx-auto mb-3 opacity-20" />
              <p className="text-[14px]">暂无收藏的职位</p>
              <p className="text-[12px] mt-1 opacity-60">浏览职位时点击收藏即可保存</p>
            </div>
          ))}

        {tab === "applications" &&
          (delLoading ? (
            <LoadingSpinner />
          ) : deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.map((d) => {
                const s = DELIVERY_STATUS[d.status] ?? DELIVERY_STATUS[0];
                return (
                  <div
                    key={d.id}
                    onClick={() => onJobSelect({ id: d.jobId, title: d.jobTitle, companyName: d.companyName, companyLogo: d.companyLogo, city: d.city, salary: d.salary, educationRequirement: "", createTime: d.createTime, viewCount: 0 })}
                    className="bg-card rounded-2xl p-4 cursor-pointer"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={d.companyName} size={40} />
                        <div>
                          <div className="font-semibold text-[14px] text-foreground">{d.jobTitle}</div>
                          <div className="text-[12px] text-muted-foreground">{d.companyName}</div>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <span>{d.salary} · {d.city}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(d.createTime)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <FileText size={44} className="mx-auto mb-3 opacity-20" />
              <p className="text-[14px]">暂无投递记录</p>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────

function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getSavedUser();

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUserProfile();
      setProfile(data);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  return (
    <div>
      {/* Profile Header */}
      <div
        className="px-5 pt-6 pb-8"
        style={{ background: "linear-gradient(150deg, #1243D0 0%, #1655F5 55%, #2A7FFF 100%)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-extrabold text-[20px] text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
            个人中心
          </h1>
          <button className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Settings size={18} color="white" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[22px] font-bold"
              style={{ background: "white", color: "#1655F5", fontFamily: "'Plus Jakarta Sans', system-ui" }}
            >
              {(user?.name || profile?.name || "?").charAt(0)}
            </div>
            <button className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
              <Camera size={11} style={{ color: "#1655F5" }} />
            </button>
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-[20px] text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
              {profile?.name || user?.name || "用户"}
            </div>
            <div className="text-white/70 text-[12px] mt-0.5">
              {profile?.expectedPosition || "未设置"} · {profile?.city || "未设置"}
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-[13px] font-semibold flex items-center gap-1">
            <Edit3 size={13} />
            编辑
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-5 bg-white/10 rounded-2xl p-3.5 flex">
          {[
            { label: "收藏职位", value: "0" },
            { label: "投递次数", value: "0" },
            { label: "面试邀请", value: "0" },
          ].map(({ label, value }, i) => (
            <div key={label} className={`flex-1 text-center ${i < 2 ? "border-r border-white/20" : ""}`}>
              <div className="font-bold text-[22px] text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
                {value}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 -mt-4 relative z-10 space-y-3">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorView message={error} onRetry={fetchProfile} />
        ) : (
          <>
            {/* Job Preferences */}
            <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-3.5">
                <span className="font-bold text-[15px] text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
                  求职意向
                </span>
                <Edit3 size={15} style={{ color: "#8895A7" }} />
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "期望职位", value: profile?.expectedPosition || "未设置" },
                  { label: "工作城市", value: profile?.city || "未设置" },
                  { label: "期望薪资", value: profile?.salaryExpectation || "未设置" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground w-16 flex-shrink-0">{label}</span>
                    <span className="text-[13px] text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GraduationCap size={17} style={{ color: "#1655F5" }} />
                  <span className="font-bold text-[15px] text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
                    教育经历
                  </span>
                </div>
              </div>
              {profile?.educations && profile.educations.length > 0 ? (
                <div className="space-y-4">
                  {profile.educations.map((edu, i) => (
                    <div key={edu.id ?? i} className={i < profile.educations.length - 1 ? "pb-4 border-b border-border" : ""}>
                      <div className="font-semibold text-[14px] text-foreground">{edu.school}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">{edu.major} · {edu.degree}</div>
                      <div className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {edu.startDate} - {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">暂无教育经历</p>
              )}
            </div>

            {/* Work Experience */}
            <div className="bg-card rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase size={17} style={{ color: "#FF6319" }} />
                  <span className="font-bold text-[15px] text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', system-ui" }}>
                    工作经历
                  </span>
                </div>
              </div>
              {profile?.works && profile.works.length > 0 ? (
                <div className="space-y-4">
                  {profile.works.map((w, i) => (
                    <div key={w.id ?? i} className={i < profile.works.length - 1 ? "pb-4 border-b border-border" : ""}>
                      <div className="font-semibold text-[14px] text-foreground">{w.position}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">{w.company}</div>
                      <div className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {w.startDate} - {w.endDate}
                      </div>
                      {w.description && <p className="text-[12px] text-muted-foreground mt-1.5 leading-5">{w.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">暂无工作经历</p>
              )}
            </div>
          </>
        )}

        {/* Settings */}
        <div className="bg-card rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {[
            { Icon: Shield, label: "账号安全", sub: "密码、手机号管理" },
            { Icon: Eye, label: "隐私设置", sub: "谁能看到我的简历" },
            { Icon: Award, label: "会员中心", sub: "解锁更多求职特权", accent: true },
          ].map(({ Icon, label, sub, accent }, i) => (
            <button key={label} className={`w-full flex items-center px-4 py-3.5 gap-3 text-left ${i < 2 ? "border-b border-border" : ""}`}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent ? "#FFF3EE" : "#F1F4F9" }}>
                <Icon size={16} style={{ color: accent ? "#FF6319" : "#637083" }} />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium" style={{ color: accent ? "#FF6319" : "var(--foreground)" }}>{label}</div>
                <div className="text-[12px] text-muted-foreground">{sub}</div>
              </div>
              <ChevronRight size={15} style={{ color: "#C4CAD0" }} />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-center"
          style={{ background: "#FFF0F0", color: "#FF3B3B" }}
        >
          退出登录
        </button>

        <div className="pb-2" />
      </div>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────

function BottomNav({ activeTab, onChange }: { activeTab: string; onChange: (t: string) => void }) {
  const tabs = [
    { id: "home", label: "首页", Icon: Home },
    { id: "favorites", label: "收藏", Icon: Bookmark },
    { id: "profile", label: "我的", Icon: User },
  ];

  return (
    <div className="bg-card border-t border-border flex items-center justify-around px-2 py-2" style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.05)" }}>
      {tabs.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => onChange(id)} className="flex flex-col items-center gap-1 flex-1 py-1">
            <Icon size={22} fill={active ? "#1655F5" : "none"} stroke={active ? "#1655F5" : "#8895A7"} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-semibold" style={{ color: active ? "#1655F5" : "#8895A7" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUserState] = useState(getSavedUser());
  const [isLoggedIn, setIsLoggedIn] = useState(!!getSavedUser() && !!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("home");
  const [selectedJob, setSelectedJob] = useState<JobListDTO | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [jobsCache, setJobsCache] = useState<JobListDTO[]>([]);

  // 登录后加载收藏列表
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      try {
        const data = await getCollections(0, 200);
        const ids = new Set(data.content.map((c) => c.jobId));
        setFavorites(ids);
      } catch {
        // 静默失败
      }
      try {
        const delData = await getDeliveries(0, 200);
        const ids = new Set(delData.content.map((d) => d.jobId));
        setAppliedJobs(ids);
      } catch {
        // 静默失败
      }
    })();
  }, [isLoggedIn]);

  const handleLogin = (_token: string, u: { userId: number; name: string; phone: string }) => {
    setUserState(u);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUserState(null);
    setIsLoggedIn(false);
    setFavorites(new Set());
    setAppliedJobs(new Set());
    setActiveTab("home");
    setSelectedJob(null);
  };

  const toggleFavorite = async (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        removeCollection(id).catch(() => {});
      } else {
        next.add(id);
        addCollection(id).catch(() => {});
      }
      return next;
    });
  };

  const handleApply = (id: number) => {
    setAppliedJobs((prev) => new Set(prev).add(id));
  };

  const outerClass = "flex justify-center min-h-screen";
  const innerStyle = { background: "var(--background)" };

  if (!isLoggedIn) {
    return (
      <div className={outerClass} style={{ background: "#1243D0" }}>
        <div className="w-full max-w-[430px]" style={innerStyle}>
          <LoginScreen onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  if (selectedJob) {
    return (
      <div className={outerClass} style={{ background: "#E8EDF5" }}>
        <div className="w-full max-w-[430px]" style={innerStyle}>
          <JobDetailScreen
            jobId={selectedJob.id}
            onBack={() => setSelectedJob(null)}
            isFavorited={favorites.has(selectedJob.id)}
            onToggleFavorite={() => toggleFavorite(selectedJob.id)}
            isApplied={appliedJobs.has(selectedJob.id)}
            onApply={() => handleApply(selectedJob.id)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={outerClass} style={{ background: "#E8EDF5" }}>
      <div className="w-full max-w-[430px] flex flex-col" style={{ ...innerStyle, height: "100dvh" }}>
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {activeTab === "home" && (
            <HomeScreen
              onJobSelect={setSelectedJob}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onJobsLoaded={setJobsCache}
            />
          )}
          {activeTab === "favorites" && (
            <ApplicationsScreen
              favorites={favorites}
              jobs={jobsCache}
              onToggleFavorite={toggleFavorite}
              onJobSelect={setSelectedJob}
            />
          )}
          {activeTab === "profile" && <ProfileScreen onLogout={handleLogout} />}
        </div>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
}
