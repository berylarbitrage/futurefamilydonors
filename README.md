# 卵子 / 精子捐赠者招募网站

Next.js 15（App Router）+ TypeScript + Tailwind v4 + shadcn/ui 风格组件 + Supabase + Resend。
所有品牌/补偿/州等占位符集中在 **`config/site.ts`**，资格规则在 **`config/eligibility.ts`**。

---

## 1. 本地启动

```bash
cd futurefamilydonors
pnpm install
cp .env.example .env.local   # 然后填入下面第 2 节拿到的值
pnpm dev                     # http://localhost:3000
```

不配置 Supabase 也能浏览所有营销页面；提交问卷会返回 503（“暂不可用”）。

常用命令：

| 命令 | 作用 |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | 开发 / 构建 / 生产启动 |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript 检查 |
| `pnpm test` | 单元测试（资格规则、API、CSV、邮件模板等，无需数据库） |
| `pnpm test:rls` | **真实 Supabase** 上的 RLS + 照片签名 URL 集成测试（见第 3 节） |
| `pnpm test:rls:sql` | 在普通 Postgres 上跑迁移 + RLS 断言（无需 Docker） |
| `pnpm email:test you@example.com` | 用 Resend 把三种邮件模板发到指定邮箱 |

---

## 2. 需要你在第三方平台操作的步骤（清单）

> 这些步骤我无法替你完成，请逐项勾选。

### Supabase
- [ ] 在 supabase.com 新建项目（建议区域：US East）
- [ ] Project Settings → API：复制 `Project URL`、`anon` key、`service_role` key 到 `.env.local`
      （`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`）
- [ ] 执行数据库迁移（二选一）：
  - CLI：`npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase db push`
  - 或在 Dashboard → SQL Editor 中**按文件名顺序**粘贴运行 `supabase/migrations/*.sql`
- [ ] Authentication → Providers → Email：保持开启；**关闭 “Allow new users to sign up”**
      （账号只由服务器在申请人预筛合格后创建）
- [ ] Authentication → URL Configuration：Site URL 填 `https://{{DOMAIN}}`；
      Redirect URLs 加入 `https://{{DOMAIN}}/auth/confirm` 和 `http://localhost:3000/auth/confirm`
- [ ] Storage：确认迁移已创建 **private** bucket `donor-photos`（5MB、仅 JPG/PNG）

> 登录邮件由本站通过 Resend 发送（链接指向 `/auth/confirm`），**不需要**修改 Supabase 的邮件模板。

### Resend
- [ ] 注册 resend.com，创建 API Key → `RESEND_API_KEY`
- [ ] 测试模式：不设置 `EMAIL_FROM` 时用 `onboarding@resend.dev` 发信，**只能发给你注册 Resend 的邮箱**
- [ ] 上线前：Domains → 添加并验证 `{{DOMAIN}}`（加 DNS 记录），然后设置
      `EMAIL_FROM="Brand Name <hello@{{DOMAIN}}>"`
- [ ] `ADMIN_NOTIFY_EMAIL` 填接收新申请通知的邮箱

### Cloudflare Turnstile（防刷）
- [ ] Cloudflare Dashboard → Turnstile → Add site（域名填 `{{DOMAIN}}` 和 `localhost`）
- [ ] 复制 Site Key / Secret Key → `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`
- 未配置时会跳过 Turnstile 校验（本地开发方便），生产环境务必配置

### 统计
- [ ] GA4：创建数据流 → Measurement ID（`G-XXXX`）→ `NEXT_PUBLIC_GA_ID`
- [ ] Meta：Events Manager 创建 Pixel → `NEXT_PUBLIC_META_PIXEL_ID`
- 两者只在访客点击 Cookie 横幅 “Accept all” 后才加载；预筛提交成功触发 GA4 `generate_lead` 与 Meta `Lead`

### Vercel 部署
- [ ] vercel.com → Add New Project → 导入此仓库，Root Directory 保持仓库根目录（Framework: Next.js，包管理器 pnpm 自动识别）
- [ ] Settings → Environment Variables：填入 `.env.example` 中的全部变量（`NEXT_PUBLIC_SITE_URL=https://{{DOMAIN}}`）
- [ ] Settings → Domains：添加 `{{DOMAIN}}` 和 `www.{{DOMAIN}}`，按提示在域名商处配置 DNS
- [ ] 部署后按第 5 节做一次全流程验收

---

## 3. 数据库迁移与 RLS 测试

迁移文件：`supabase/migrations/`
- `20261106000000_init.sql`：全部表、触发器、RLS、`donor-photos` 私有 bucket 及其策略
- `20261106000100_admin_stats.sql`：后台统计函数（仅管理员可调用）
- `20261107000000_messages.sql`：协调员与捐赠者之间的消息记录
- `20261108000000_roles.sql`：更多角色（协调员 / 只读员工 / 合作机构 / 准父母）及其权限
- `20261109000000_owner.sql`：超级管理员（Owner），只能有一个

所有迁移文件都可以重复运行（已存在的部分会跳过）。在 Supabase SQL Editor 中按文件名顺序各运行一次即可。

本地 Supabase（需要 Docker）：

```bash
npx supabase init          # 首次：生成 supabase/config.toml（已有 migrations 目录不受影响）
npx supabase start         # 启动后会打印本地 URL / anon key / service_role key
npx supabase db reset      # 应用所有迁移
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... pnpm test:rls
```

`pnpm test:rls` 会验证：申请人 A 读不到/改不了申请人 B 的申请、完整申请、照片和 Storage 文件；
申请人不能改自己的状态和角色；匿名用户不能读写任何表；bucket 不可公开访问；照片签名 URL 有效期正好 600 秒且过期后失效。
**不要对生产库运行**（会创建/删除测试用户）。

不想装 Docker 时，可用任意 Postgres 跑 SQL 版 RLS 断言：
`PGURL=postgres://postgres@localhost:5432/postgres pnpm test:rls:sql`

---

## 4. 创建第一个管理员账号

1. Supabase Dashboard → Authentication → Users → **Add user** → 输入你的邮箱，勾选 Auto Confirm
2. SQL Editor 运行：
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. 打开管理员专用登录页 `/admin/login`，输入邮箱 → 收到登录链接 → 进入 `/admin`
   （申请人用 `/login`。没登录时直接打开 `/admin` 会显示 404，这是为了不暴露后台，请收藏 `/admin/login`）

非管理员（包括未登录者）访问 `/admin` 一律得到 404（`/admin/login` 除外）。

---

## 5. 上线验收清单

- [ ] 先打开 `/setup-check`，确认所有配置项都是绿色
- [ ] 右上角 “Apply Now” → 出现 Egg / Sperm 两个选项；打开 `/apply` 也能选择项目
- [ ] 用**新邮箱**、合格条件提交卵子预筛 → **直接进入** `/portal/application`（顶部显示 “Great news — you pre-qualify!”），不需要先去邮箱
- [ ] 同时收到 “Continue your … donor application” 备份邮件 → 换个浏览器点邮件里的按钮，能回到同一份申请继续填
- [ ] 在完整申请里填几项、停顿 2 秒（显示 “Saved automatically”）→ 刷新页面，内容还在
- [ ] 用**已有账号的邮箱**再提交一次合格预筛（24 小时后）→ 不会自动登录，结果页提示去邮箱点链接继续（安全设计）
- [ ] 国家选非美国（如 Canada）→ State/ZIP 隐藏，显示 State/Province、City、Postal code（选填）；电话可填国际号码；后台详情显示国家/省/城市
- [ ] “Have you donated before?” 选 Yes → 出现追问（次数、时间、取卵数（仅卵子）、是否知道怀孕 Yes/No/Unknown、机构/诊所）；不填无法下一步；后台详情能看到这些回答
- [ ] 完整申请里选 Yes 的问题（用药、手术、过敏、心理治疗、纹身、领养、家族病史、怀孕次数 > 0、性病史等）→ 出现对应追问；改回 No 后追问消失、不再要求填写
- [ ] 精子预筛同样走一遍；`/sperm-donor` 页面是配对流程（8 步），没有 “per month / weekly / 6 months / sperm bank” 等说法
- [ ] 导航和页脚都没有 “Intended Parents” 入口
- [ ] 完成 5 个表单段、上传童年照 + 近照、签名提交 → 状态变为 `full_app_submitted`，管理员收到通知
- [ ] 用不合格条件提交 → 收到感谢邮件（含推荐链接）
- [ ] 同一邮箱 24 小时内再次提交 → 提示已提交
- [ ] `/refer` 生成链接 → 用该链接打开并提交 → 后台该申请显示推荐人
- [ ] 后台：筛选、搜索、改状态（`audit_log` 有记录）、加备注、导出 CSV、删除申请人数据
- [ ] 后台申请详情页 → Messages：发一条消息，申请人收到邮件；申请人在 `/portal` 回复后，后台列表显示 “💬 new”
- [ ] `/sitemap.xml` 不含 `/admin`、`/portal`；`/robots.txt` 禁止抓取它们

---

## 6. 发布流程：先预览，测试通过再上线

一个仓库、两个环境：

| 分支 | Vercel 环境 | 用途 |
|---|---|---|
| `main` | **Production**（正式网站） | 只接收测试通过的改动 |
| 其他分支 | **Preview**（每次推送自动生成预览网址） | 先在这里测试 |

流程：改动推到分支 → GitHub Actions 自动检查（见下）+ Vercel 生成预览网址 → 在预览网址测试 → 合并到 `main` → 自动部署到正式网站。

**自动检查（`.github/workflows/ci.yml`）**，每次推送和每个 PR 都会运行：
- 代码检查（ESLint）、格式检查（Prettier）、类型检查（TypeScript）
- 全部单元测试（Vitest）
- 生产构建（`next build`）
- 数据库：在全新 Postgres 上运行所有迁移文件 + 权限规则（RLS）断言

**建议开启的保护（需要在 GitHub 设置）：** Settings → Branches → Add rule（或 Rulesets）→ 分支 `main`：
- ✅ Require a pull request before merging
- ✅ Require status checks to pass → 选择 `Lint, tests & build` 和 `Database migrations & access rules`
- ✅ Do not allow bypassing the above settings（可选）

**预览环境使用独立的测试数据库（强烈建议）：** 新建一个 Supabase 项目（如 `futurefamilydonors-staging`）并运行全部迁移文件；在 Vercel → Environment Variables 中把 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 分别为 **Production** 和 **Preview** 填不同的值。这样预览测试不会写入真实申请数据。

## 7. 项目结构

```
config/         site.ts（占位符）、eligibility.ts（资格规则）、us-states.ts
content/faq.ts  FAQ 内容（按 general / egg / sperm 分组）
app/(site)/     公开页面、预筛问卷、推荐、登录、申请人门户
app/admin/      后台（layout 中校验管理员，否则 404）
app/api/        apply / refer / contact / portal/* / admin/* / auth/*
lib/            eligibility（纯函数）、schemas（前后端共用 zod）、supabase 客户端、email、rate-limit、audit…
emails/         React Email 模板
supabase/       迁移 + SQL 测试
tests/          Vitest 单元测试；tests/rls/ 为真实 Supabase 集成测试
```

## 8. 合规与安全说明

- 隐私政策与使用条款为**占位文案，需律师审阅**（页面顶部已标注）
- 健康信息不进入邮件、日志和 URL；服务端日志经 `lib/log.ts` 脱敏
- 预筛结果在服务端重新计算；匿名用户无任何表权限，预筛写入走服务端 service role
- 安全头（CSP、HSTS、X-Frame-Options 等）在 `next.config.ts`
- 速率限制为内存实现（每 IP 每分钟 10 次，按实例计）。流量变大后建议换成 Upstash Redis / Vercel KV
- 补偿文案统一为对时间和付出的补偿，不按个人特征区分报价
- SMS：本期未接入短信发送服务；同意状态存于 `applications.sms_consent`，接入时只对 `true` 的号码发送，并在文案中包含 “Reply STOP to opt out”

---

## 登录邮件收不到？排查步骤

登录页无论成功与否都显示 “Check your email”（防止别人借此查出谁申请过），所以要这样查原因：

1. 在 Vercel → Settings → Environment Variables 加 `SETUP_CHECK_TOKEN`（随便一串长随机字符），重新部署
2. 打开 `https://{{DOMAIN}}/setup-check?token=你设的值`
3. 在 **Sign-in link test** 里输入收不到邮件的邮箱，点 Send，页面会直接告诉你原因：
   - **No account**：这个邮箱没有账号。只有预筛合格的申请人、或在 Supabase → Authentication → Users 手动添加的管理员才能登录
   - **Resend refused**：Resend 拒发（最常见：没设 `EMAIL_FROM`，测试发件人只能发给注册 Resend 的邮箱；或域名没在 Resend 验证）
   - **Not configured / Error**：环境变量缺失或数据库迁移没跑
4. 也可以在 Vercel → Logs 搜 `sign-in link`，每次登录请求都会记录结果（不记录邮箱地址）

---

## 角色与登录入口

| 角色 | 登录入口 | 能做什么 |
|---|---|---|
| 申请人 | `/portal/login` | 自己的申请、上传照片、和协调员通信 |
| **Owner 超级管理员** | `/admin/login` | 只有一个。Admin 的全部权限 + 授予/取消 Admin；网站上任何人都改不了它 |
| Admin 管理员 | `/admin/login` | 全部：含导出 CSV、删除申请人数据、团队管理（但不能授予/取消 Admin，不能动 Owner） |
| Coordinator 协调员 | `/admin/login` | 看全部申请（含联系方式）、改状态、写备注、发消息、审核；不能导出/删除/管理团队 |
| Viewer 只读员工 | `/admin/login` | 只读查看全部申请；不能改任何东西 |
| Partner 合作诊所/中介 | `/catalog/login` | 只看匿名捐赠者资料库 |
| Parent 准父母 | `/catalog/login` | 只看匿名捐赠者资料库 |

- 旧地址 `/login` 会自动跳到 `/portal/login`
- 管理员在 `/admin/team` 输入邮箱、选角色即可邀请，对方收到带登录链接的邮件；也可以改角色、移除权限
- **匿名资料库 `/catalog`** 只显示状态为 **Active** 且预筛合格的捐赠者，用捐赠者编号（如 `E-3F9A2C`）代替姓名。
  显示：年龄、所在州、身高体重、学历、完整申请里的背景/外貌/病史/家族病史/生育健康。
  **不显示**：姓名、邮箱、电话、生日、邮编、照片、签名、内部备注。
  ⚠️ 自由填写的文字（性格、捐赠原因、病史说明等）会原样显示，设为 Active 前请检查里面没有能认出本人的信息。
- 资料库的数据只在服务器端读取（准父母/合作机构的账号在数据库层面读不到任何表），每次查看捐赠者详情都记入 audit_log

### 设置超级管理员（Owner）

只能在 Supabase SQL Editor 里设置（网站上没有入口，也就没人能通过网站改它）。运行 `20261109000000_owner.sql` 后，再运行一次（换成你的邮箱）：

```sql
update public.profiles set role = 'owner'
where id = (select id from auth.users where email = 'you@example.com');
```

- 数据库只允许**一个** Owner（唯一索引），第二个会直接报错
- 数据库层面：只有 Owner 的登录会话能改 `profiles.role`；其他 Admin 只能通过网站的 Team 页改，且服务器会拦下涉及 Admin / Owner 的操作
- 要换 Owner：先在 SQL Editor 把旧 Owner 改成 `admin`，再把新的设成 `owner`
