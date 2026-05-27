import type {
  JobListDTO,
  JobDetailDTO,
  PageData,
  UserProfile,
  DeliveryRecordDTO,
  CollectionDTO,
  LoginResponse,
} from "./api";

// ─── Mock Jobs ───────────────────────────────────────────────────────────────

const COMPANIES = [
  { name: "字节跳动", logo: null, city: "北京", description: "字节跳动是全球领先的移动互联网科技公司，旗下产品包括今日头条、抖音、TikTok等。公司致力于用技术连接人与信息，创造持续价值。" },
  { name: "阿里巴巴", logo: null, city: "杭州", description: "阿里巴巴集团是全球领先的电子商务和科技公司，业务涵盖电商、云计算、数字媒体与娱乐等多个领域。" },
  { name: "腾讯科技", logo: null, city: "深圳", description: "腾讯是一家世界领先的互联网科技公司，旗下拥有微信、QQ等国民级社交平台，以及丰富的数字娱乐生态。" },
  { name: "美团", logo: null, city: "北京", description: "美团是中国领先的生活服务电子商务平台，致力于用科技连接消费者和商家，提供优质便捷的生活服务。" },
  { name: "小红书", logo: null, city: "上海", description: "小红书是中国领先的生活方式社区平台，月活用户超3亿，致力于让每个人都能发现美好生活。" },
  { name: "蚂蚁集团", logo: null, city: "杭州", description: "蚂蚁集团是全球领先的金融科技公司，旗下拥有支付宝等产品，致力于为小微企业和个人消费者提供普惠金融服务。" },
  { name: "拼多多", logo: null, city: "上海", description: "拼多多是中国领先的新电商平台，通过创新的社交拼团模式，为用户提供高性价比的购物体验。" },
  { name: "华为技术", logo: null, city: "深圳", description: "华为是全球领先的ICT基础设施和智能终端提供商，致力于把数字世界带入每个人、每个家庭、每个组织。" },
  { name: "京东集团", logo: null, city: "北京", description: "京东是中国领先的技术驱动型电商和零售基础设施服务商，拥有完整的自建物流体系。" },
  { name: "蔚来汽车", logo: null, city: "上海", description: "蔚来是一家全球化的智能电动汽车公司，致力于通过提供高性能的智能电动汽车与极致用户体验，创造愉悦的生活方式。" },
  { name: "米哈游", logo: null, city: "上海", description: "米哈游是中国领先的游戏开发公司，旗下拥有《原神》《崩坏》系列等全球知名游戏作品。" },
  { name: "SHEIN", logo: null, city: "广州", description: "SHEIN是全球领先的时尚和生活方式在线零售商，业务覆盖全球150多个国家和地区。" },
];

const JOB_TITLES: Record<string, string[]> = {
  "全部": [],
  "Flutter": ["Flutter 开发工程师", "Flutter 高级开发工程师", "Flutter 技术专家", "移动端开发工程师(Flutter)"],
  "Java": ["Java 后端开发", "Java 高级工程师", "Java 架构师", "Java 技术专家"],
  "前端": ["前端开发工程师", "React 前端开发", "高级前端工程师", "前端架构师"],
  "Android": ["Android 开发工程师", "Android 高级工程师", "Android 架构师"],
  "iOS": ["iOS 开发工程师", "iOS 高级工程师", "iOS 技术专家"],
  "算法": ["算法工程师", "推荐算法专家", "NLP 算法工程师", "CV 算法工程师"],
  "运维": ["运维工程师", "DevOps 工程师", "SRE 工程师", "云原生运维专家"],
};

const SALARIES = ["15K-25K", "20K-35K", "25K-45K", "30K-50K", "35K-60K", "40K-70K", "50K-80K", "面议"];
const EDUCATION = ["大专及以上", "本科及以上", "硕士及以上", "学历不限"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateJobs(): JobListDTO[] {
  const jobs: JobListDTO[] = [];
  const now = Date.now();

  // Generate jobs for each category
  const categories = ["Flutter", "Java", "前端", "Android", "iOS", "算法", "运维"];
  categories.forEach((cat) => {
    const titles = JOB_TITLES[cat] || [];
    titles.forEach((title, idx) => {
      const company = pick(COMPANIES);
      jobs.push({
        id: jobs.length + 1,
        title,
        companyName: company.name,
        companyLogo: company.logo,
        city: company.city,
        salary: pick([SALARIES[Math.min(idx, SALARIES.length - 1)], pick(SALARIES)]),
        educationRequirement: pick(EDUCATION),
        createTime: new Date(now - Math.random() * 30 * 86400000).toISOString(),
        viewCount: Math.floor(Math.random() * 500) + 50,
      });
    });
  });

  // Add some general jobs
  ["产品经理", "UI/UX 设计师", "数据分析师", "测试工程师", "运营经理"].forEach((title, i) => {
    const company = pick(COMPANIES);
    jobs.push({
      id: jobs.length + 1,
      title,
      companyName: company.name,
      companyLogo: company.logo,
      city: company.city,
      salary: pick(SALARIES),
      educationRequirement: pick(EDUCATION),
      createTime: new Date(now - Math.random() * 15 * 86400000).toISOString(),
      viewCount: Math.floor(Math.random() * 400) + 20,
    });
  });

  return jobs;
}

const ALL_JOBS = generateJobs();

// ─── Mock Job Details ────────────────────────────────────────────────────────

function buildJobDetail(id: number): JobDetailDTO {
  const job = ALL_JOBS.find((j) => j.id === id) || ALL_JOBS[0];
  const company = COMPANIES.find((c) => c.name === job.companyName) || COMPANIES[0];
  return {
    ...job,
    description: `岗位职责：
1. 负责${job.title}相关模块的设计、开发与维护工作
2. 参与技术方案评审、代码审查，保障代码质量和系统稳定性
3. 与产品、测试团队紧密协作，推动功能快速迭代
4. 持续优化产品性能，提升用户体验
5. 跟踪前沿技术发展，推动技术升级和创新

任职要求：
1. 计算机相关专业，${job.educationRequirement}
2. 熟练掌握相关开发语言和框架，具备良好的编码习惯
3. 具备较强的逻辑思维能力和问题解决能力
4. 有良好的沟通协作能力，具备团队合作精神
5. 有大型互联网项目经验者优先`,
    companyInfo: company.description,
    hrContact: `${pick(["张", "李", "王", "刘", "陈", "赵", "周"])}${pick(["经理", "HR", "招聘官"])}`,
    collected: false,
    delivered: false,
  };
}

const JOB_DETAILS = new Map<number, JobDetailDTO>();
function getJobDetailCache(id: number): JobDetailDTO {
  if (!JOB_DETAILS.has(id)) {
    JOB_DETAILS.set(id, buildJobDetail(id));
  }
  return JOB_DETAILS.get(id)!;
}

// ─── Mock User ───────────────────────────────────────────────────────────────

const MOCK_USER: UserProfile = {
  id: 1,
  phone: "138****8888",
  name: "张三",
  avatar: null,
  expectedPosition: "高级前端工程师",
  city: "北京",
  salaryExpectation: "30K-50K",
  createTime: "2025-01-15T10:30:00",
  educations: [
    {
      id: 1,
      school: "清华大学",
      major: "计算机科学与技术",
      degree: "硕士",
      startDate: "2019-09",
      endDate: "2022-06",
    },
    {
      id: 2,
      school: "浙江大学",
      major: "软件工程",
      degree: "本科",
      startDate: "2015-09",
      endDate: "2019-06",
    },
  ],
  works: [
    {
      id: 1,
      company: "字节跳动",
      position: "高级前端工程师",
      description: "负责抖音Web版核心功能开发，主导前端架构升级，优化首屏加载性能40%",
      startDate: "2022-07",
      endDate: "至今",
    },
    {
      id: 2,
      company: "阿里巴巴",
      position: "前端开发工程师",
      description: "参与淘宝商家后台前端开发，负责订单管理、商品管理等核心模块",
      startDate: "2019-07",
      endDate: "2022-05",
    },
  ],
};

// ─── Mock Collections & Deliveries ───────────────────────────────────────────

const MOCK_COLLECTIONS: CollectionDTO[] = ALL_JOBS.slice(0, 5).map((job, i) => ({
  id: i + 1,
  jobId: job.id,
  jobTitle: job.title,
  companyName: job.companyName,
  companyLogo: job.companyLogo,
  city: job.city,
  salary: job.salary,
  createTime: new Date(Date.now() - (5 - i) * 86400000).toISOString(),
}));

const MOCK_DELIVERIES: DeliveryRecordDTO[] = ALL_JOBS.slice(2, 7).map((job, i) => ({
  id: i + 1,
  jobId: job.id,
  jobTitle: job.title,
  companyName: job.companyName,
  companyLogo: job.companyLogo,
  city: job.city,
  salary: job.salary,
  status: [0, 0, 1, 0, 2][i] as number,
  createTime: new Date(Date.now() - (7 - i) * 86400000).toISOString(),
}));

// ─── Stateful mock helpers ───────────────────────────────────────────────────

let mockCollections = new Set(MOCK_COLLECTIONS.map((c) => c.jobId));
let mockDeliveries = new Set(MOCK_DELIVERIES.map((d) => d.jobId));
let mockDeliveriesList = [...MOCK_DELIVERIES];
let mockCollectionsList = [...MOCK_COLLECTIONS];

function paginate<T>(items: T[], page: number, size: number): PageData<T> {
  const start = page * size;
  const content = items.slice(start, start + size);
  return {
    content,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    number: page,
    size,
    first: page === 0,
    last: start + size >= items.length,
    empty: content.length === 0,
  };
}

// ─── Mock API implementations ────────────────────────────────────────────────

export const mockApi = {
  login(phone: string, _password: string): LoginResponse {
    return {
      token: "mock-token-xxx",
      userId: 1,
      name: "张三",
      phone,
    };
  },

  register(_phone: string, _password: string, _name: string): void {
    // No-op, always succeeds
  },

  getJobs(page = 0, size = 20): PageData<JobListDTO> {
    return paginate(ALL_JOBS, page, size);
  },

  searchJobs(params: { keyword?: string; city?: string; education?: string; page?: number; size?: number }): PageData<JobListDTO> {
    let filtered = [...ALL_JOBS];
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(kw) ||
          j.companyName.toLowerCase().includes(kw) ||
          j.city.toLowerCase().includes(kw),
      );
    }
    if (params.city) {
      filtered = filtered.filter((j) => j.city === params.city);
    }
    if (params.education) {
      filtered = filtered.filter((j) => j.educationRequirement === params.education);
    }
    return paginate(filtered, params.page ?? 0, params.size ?? 20);
  },

  getJobDetail(id: number): JobDetailDTO {
    const detail = getJobDetailCache(id);
    return {
      ...detail,
      collected: mockCollections.has(id),
      delivered: mockDeliveries.has(id),
    };
  },

  getHotJobs(): JobListDTO[] {
    return [...ALL_JOBS].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
  },

  getUserProfile(): UserProfile {
    return MOCK_USER;
  },

  updateUserProfile(_data: Record<string, string>): void {
    // No-op
  },

  addCollection(jobId: number): void {
    mockCollections.add(jobId);
    const job = ALL_JOBS.find((j) => j.id === jobId);
    if (job && !mockCollectionsList.find((c) => c.jobId === jobId)) {
      mockCollectionsList.unshift({
        id: mockCollectionsList.length + 1,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        city: job.city,
        salary: job.salary,
        createTime: new Date().toISOString(),
      });
    }
  },

  removeCollection(jobId: number): void {
    mockCollections.delete(jobId);
    mockCollectionsList = mockCollectionsList.filter((c) => c.jobId !== jobId);
  },

  getCollections(page = 0, size = 20): PageData<CollectionDTO> {
    return paginate(mockCollectionsList, page, size);
  },

  deliverJob(jobId: number): void {
    mockDeliveries.add(jobId);
    const job = ALL_JOBS.find((j) => j.id === jobId);
    if (job && !mockDeliveriesList.find((d) => d.jobId === jobId)) {
      mockDeliveriesList.unshift({
        id: mockDeliveriesList.length + 1,
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        companyLogo: job.companyLogo,
        city: job.city,
        salary: job.salary,
        status: 0,
        createTime: new Date().toISOString(),
      });
    }
  },

  getDeliveries(page = 0, size = 20): PageData<DeliveryRecordDTO> {
    return paginate(mockDeliveriesList, page, size);
  },
};
