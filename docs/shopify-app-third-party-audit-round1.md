# Shopify App / 第三方脚本审计（第一轮）

## 1. 文档目的

这份文档用于对当前线上首页快照进行第一轮脚本审计，重点回答 3 个问题：

1. 目前首页到底加载了哪些 Shopify App / 第三方脚本。
2. 哪些脚本属于首页首屏不必要加载。
3. 哪些脚本可以优先进入“延迟加载 / 路由加载 / 下线排查”清单。

说明：

- 本轮结论基于本地快照文件 [hovs.html](d:/work/新建文件夹 (2)/jovs-shopify-2026/hovs.html)。
- 这是“页面侧证据审计”，不是 Shopify Admin 最终配置审计。
- 最终是否下线，仍需结合 Shopify Admin 的 `Apps`、`App embeds`、`Customer events / Pixels` 做二次确认。

## 2. 快照概况

基于当前首页快照，页面侧已经能看到：

- 外链脚本：`48`
- 内联脚本：`66`
- Web Pixels / Customer Events 配置：`19`

这说明当前首页并不是只加载主题本身脚本，而是同时叠加了：

- Shopify 平台脚本
- 主题业务脚本
- Shopify App blocks
- Web Pixels / Customer Events
- 第三方营销、客服、评论、订阅、推荐、A/B 测试脚本

对首页性能来说，当前最大的优化空间已经不是某一段 CSS 或某一个 section，而是：

`首页是否承载了过多与首屏无关的第三方能力`

## 3. 当前发现的主要脚本来源

### 3.1 Shopify 平台与主题层

这部分通常属于保留项，但仍要确认是否存在重复或过量主题脚本。

- Shopify storefront / checkout / perf kit
- 主题脚本：`global.js`、`scripts.js`、`header.js`、`cart.js`、`footer.js`
- 首页组件脚本：`swiper`、`gsap`、`ScrollTrigger`

### 3.2 首页已确认加载的 App / 第三方能力

从页面源码中可直接识别出：

- Videowise
- Elevate A/B Testing
- Shopify Forms
- Uppromote Referral
- Omnisend
- Essential Countdown Timer
- Facebook Pixel App
- Loox
- Recharge
- Captain Shipping Protection
- Zendesk
- Clarity

另外，页面里还存在一组脚本 URL 池配置，说明这些能力至少已接入，且可能被运行时动态加载：

- Rebuy
- Seel
- Spinwheel
- Plerdy
- AWIN
- Free Gift / Cart Upsell

## 4. 第一轮审计清单

下面这份表是本轮最重要的输出。建议直接拿它去对照 Shopify Admin 做逐项确认。

| 能力 / 来源 | 页面侧证据 | 首页必要性判断 | 主要风险 | 第一轮建议动作 |
| --- | --- | --- | --- | --- |
| Shopify 核心脚本 | storefront、load_feature、portable wallets、perf kit | 必要 | 平台基础能力，误删风险高 | 保留，只做重复检查 |
| 主题业务脚本 | `global.js`、`scripts.js`、`header.js`、`cart.js` 等 | 大部分必要 | 可能有历史遗留和全站过载 | 审核是否存在首页未用模块仍全站加载 |
| Web Pixels Manager / Customer Events | 页面内存在 `webPixelsConfigList`，共 `19` 条 | 必要，但应控量 | 像素数量多，容易重复上报和增加执行成本 | 优先做像素去重审计 |
| Facebook Pixel App | 页面存在 app block 和独立脚本 | 非首屏必要 | 容易与 Shopify Custom Pixel、Meta CAPI、Google/Bing 形成重复归因 | 检查是否与现有 Customer Events 重复；优先统一到像素体系 |
| Google Ads / Bing 自定义像素 | `webPixelsConfigList` 中存在 `Google Ads Conversion Code`、`Bing Tag` | 非首屏必要 | 重复埋点、数据污染 | 与广告投放团队确认，仅保留一套有效链路 |
| Omnisend | 首页直接加载 `omnisend-in-shop.js` | 首页通常非必要 | 营销脚本常伴随弹窗、监听、网络请求 | 改为延迟加载或按行为触发 |
| Clarity | 页面内直接注入 `clarity.ms/tag` | 非首屏必要 | 会增加会话采集和行为监听成本 | 改为 idle 或 consent 后加载 |
| Plerdy | 脚本 URL 池内已出现 | 非首屏必要 | 与 Clarity 存在行为分析重叠风险 | 二选一，避免热图工具重复 |
| Zendesk | 页面直接注入 `zdassets` 脚本 | 非首屏必要 | 客服组件常带较高首屏开销 | 改为用户交互后加载 |
| Loox | 首页直接加载 review widget | 首页不一定必要 | 评论组件对首页首屏通常不是刚需 | 若首页未直接展示评论模块，改为对应模板加载 |
| Recharge | 首页直接加载 storefront experiences | 首页通常非必要 | 订阅能力通常更偏 PDP / 账户 / 结账链路 | 改为产品页或订阅相关模板加载 |
| Captain Shipping Protection | 首页直接加载 | 首页通常非必要 | 更接近购物车和结账链路，不应占用首页资源 | 改为购物车或结账相关模板加载 |
| Videowise | 首页直接加载 vendors 与 client | 视首页模块而定 | 体积较大，若首页未展示对应组件则属于纯浪费 | 若首页使用则延迟初始化；若未使用则移出首页 |
| Elevate A/B Testing | 首页直接加载 | 仅在实验运行时必要 | 无实验时属于纯额外负担 | 确认当前是否有活动实验；无实验则停用 |
| Uppromote Referral | 首页直接加载 customer-referral | 首页通常非必要 | 更偏账户、邀请、返利场景 | 改为账户页或 referral 入口页加载 |
| Countdown Timer | 首页可见 app block | 可能必要，但非平台核心 | 业务价值可能有，但要评估首屏收益是否值得 | 若确有转化价值保留，否则考虑主题原生实现 |
| Rebuy | URL 池中出现 3 次 | 首页通常非必要 | 推荐引擎可能引入较多请求和逻辑 | 若首页未展示推荐模块，改为 PDP / Cart 路由加载 |
| Seel / Worry-Free Purchase | URL 池中出现 | 首页通常非必要 | 更偏购买保障场景 | 改为购物车或结账前链路加载 |
| Spinwheel | URL 池中出现 | 首页通常非必要 | 强营销弹窗，干扰体验且增加脚本成本 | 按活动窗口启停，默认不进首页首屏 |
| Free Gift / Cart Upsell | URL 池中出现 | 首页通常非必要 | 更偏购物车转化场景 | 改为购物车页或抽屉加载 |
| AWIN Affiliate | URL 池中出现 | 非首屏必要 | 联盟归因脚本可能和其他投放脚本叠加 | 与投放归因方案统一后保留最小集 |

## 5. 当前最优先处理的对象

如果只做一轮“高收益、低风险”的处理，建议优先检查下面 8 项：

1. `Recharge`
2. `Captain Shipping Protection`
3. `Zendesk`
4. `Omnisend`
5. `Loox`
6. `Elevate A/B Testing`
7. `Facebook Pixel App + Customer Events`
8. `Clarity / Plerdy`

原因很直接：

- 这些脚本都不是 Shopify 首页首屏渲染的基础依赖。
- 它们大多更适合路由加载、交互加载或像素侧统一管理。
- 其中不少还存在“功能重叠”或“归因重复”的可能。

## 6. 建议的执行顺序

### 第一阶段：做完整 Inventory

在 Shopify 后台同步核对以下 4 个入口：

- `Apps`
- `Online Store > Themes > Customize > App embeds`
- `Settings > Customer events / Pixels`
- 当前首页 DevTools 的 `Network` / `Performance`

目标是把“页面侧看到的脚本”与“后台实际启用的 App”一一对应起来。

### 第二阶段：先做像素去重

优先审查：

- Facebook Pixel App
- Google Ads Conversion
- Bing Tag
- Shopify Custom Pixel
- 其他投放 / affiliate / analytics pixel

这一步的目标不是删掉所有像素，而是确认：

- 是否同一事件被多套体系重复发送
- 是否同一平台同时存在 Theme Script、App Pixel、Custom Pixel 三套链路

### 第三阶段：把非首页必要脚本移出首页

优先迁移对象：

- Recharge
- Captain Shipping Protection
- Zendesk
- Uppromote Referral
- Rebuy
- Free Gift / Upsell
- Seel

迁移策略优先级：

1. 路由加载
2. 交互触发加载
3. idle 加载
4. 确认无业务价值后下线

### 第四阶段：清理营销和实验工具重叠

重点核对：

- Clarity vs Plerdy
- Facebook / Google / Bing 多套像素
- Omnisend / Spinwheel / Popup 类工具是否叠加
- A/B Testing 当前是否真的在跑实验

## 7. 审计后的预期收益

如果这轮清理做得规范，首页会获得 4 类直接收益：

- 首屏脚本执行压力下降
- 第三方网络请求数量下降
- 像素和归因链路更清晰，减少重复上报
- 后续主题开发不再被大量 App 的隐式副作用干扰

对甲方来说，更重要的是：

`以后新增活动、像素、营销插件时，会有明确的接入规则，而不是继续把首页堆成脚本入口页。`

## 8. 建议的最终输出物

这轮正式审计建议形成 3 张表：

### 8.1 App / 脚本总表

字段建议：

- 名称
- 来源域名
- 类型
- 功能说明
- 当前加载位置
- 首页是否需要
- 首屏是否需要
- 负责人

### 8.2 动作建议表

字段建议：

- 名称
- 保留 / 延迟 / 路由加载 / 下线
- 原因
- 技术处理方式
- 验证方式

### 8.3 风险与回滚表

字段建议：

- 名称
- 下线风险
- 受影响页面
- 回滚方式
- 验收负责人

## 9. 一句话结论

当前首页的第三方能力已经明显超出“首屏必要加载”范围。  
下一步最值得做的不是继续微调样式，而是把 Shopify App、Customer Events、第三方营销脚本做一次系统梳理，按“首页必须 / 非首页必须 / 仅转化链路需要”重新分层加载。
