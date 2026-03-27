# Shopify App / 第三方脚本审计执行清单

## 1. 文档用途

这份文档不是分析报告，而是执行手册。  
用途只有一个：

`按顺序在 Shopify 后台完成脚本清理，并确保每一步都可验证、可回滚。`

配套分析文档：

- [shopify-app-third-party-audit-round1.md](d:/work/新建文件夹%20(2)/jovs-shopify-2026/docs/shopify-app-third-party-audit-round1.md)

## 2. 后台排查入口

执行时只需要反复使用下面 4 个后台入口：

### A. Apps

路径：

- `Shopify Admin > Apps`

用途：

- 确认 App 是否仍在使用
- 找到 App 自身设置页
- 看是否有 script inject、pixel、widget、popup、review、subscription 等能力

### B. Theme Editor 的 App embeds / App blocks

路径：

- `Online Store > Themes > Customize`
- 左侧 `App embeds`
- 对应模板中的 `App blocks`

用途：

- 关闭首页或全站可视化注入的 App
- 检查哪些 App block 被放进了首页模板

### C. Customer events / Pixels

路径：

- `Settings > Customer events`

用途：

- 核对 App Pixel / Custom Pixel
- 清理重复广告归因、分析像素、营销像素

### D. Theme code / 主题代码

路径：

- `Online Store > Themes > Edit code`

用途：

- 排查硬编码脚本
- 排查历史遗留 `script` 注入
- 排查 `theme.liquid`、`layout`、`snippets`、`sections` 中的固定埋点

## 3. 执行原则

每一个 App / 脚本都必须回答下面 5 个问题：

1. 这个能力是不是首页必须？
2. 这个能力是不是首屏必须？
3. 这个能力是不是只在某个模板才需要？
4. 这个能力是不是已经被另一套工具重复覆盖？
5. 下线后谁来确认业务没有受影响？

如果第 1、2 个问题都回答“不是”，就不应该继续停留在首页首屏。

## 4. 推荐执行顺序

建议严格按下面顺序推进：

1. 先做像素与追踪去重
2. 再清理首页不必要的 App block
3. 再处理需要改成路由加载的功能 App
4. 最后清理历史遗留和低价值脚本

原因：

- 像素类最容易重复，但对页面业务结构影响最小
- 首页可视化 App block 风险可控，改完容易验证
- 业务功能类 App 往往牵涉 PDP、Cart、Checkout，应该后做

## 5. 可执行清单

下面这张表可以直接照着执行。

| 项目 | 当前证据 | 先去哪里查 | 建议负责人 | 建议动作 | 验证方式 | 回滚方式 |
| --- | --- | --- | --- | --- | --- | --- |
| Facebook Pixel App | 页面有 `facebook-pixel-5` 脚本与配置 | `Settings > Customer events`，同时看 `Apps` | 投放负责人 + Shopify 开发 | 先确认是否与 Shopify Custom Pixel、Meta CAPI、广告平台原生配置重复；重复则保留一套 | 用 Meta Pixel Helper 看 `PageView`、`ViewContent`、`Purchase` 是否重复发送 | 恢复对应 Pixel 或重新打开 App Pixel |
| Google Ads Conversion Code | `Customer events` 中存在自定义项 | `Settings > Customer events` | 投放负责人 | 和 Google channel、主题埋点、第三方 App 做去重，只保留唯一有效链路 | 用 Tag Assistant / Network 看 `page_view`、`purchase` 事件是否单次触发 | 重新启用对应 Custom Pixel |
| Bing Tag | `Customer events` 中存在自定义项 | `Settings > Customer events` | 投放负责人 | 与 Microsoft Ads 现有归因链路去重 | 用 UET Helper 检查 | 重新启用该 Custom Pixel |
| Clarity | 页面内直接插入 `clarity.ms/tag` | `Theme code`，必要时看 `Apps` | 数据分析负责人 + 开发 | 改为 consent 后加载或 idle 加载；若已有 Plerdy，优先做工具二选一 | 首屏 Network 中不应再同步拉起 Clarity；会话采集仍正常 | 恢复原脚本注入 |
| Plerdy | 动态 URL 池中出现 | `Apps`、`Theme code` | 数据分析负责人 | 若与 Clarity 功能重叠，保留一套 | 热图/录屏采样是否仍可用 | 重新启用 App 或恢复注入代码 |
| Omnisend | 首页直接加载 `omnisend-in-shop.js` | `Apps`、`App embeds` | CRM / EDM 负责人 | 改成交互触发或仅营销场景加载，不占首页首屏 | 首页首屏 Network 不再提前拉起，弹窗/订阅功能仍可触发 | 打开原 App embed 或恢复脚本 |
| Zendesk | 页面直接注入 `zdassets` | `Apps`、`Theme code` | 客服负责人 | 改为点击客服按钮后再加载 | 点击客服入口后 widget 能正常出现 | 恢复原 snippet |
| Loox | 首页直接加载评论脚本 | `Apps`、首页模板 `App blocks` | 运营负责人 + 开发 | 如果首页并未直接使用评论模块，就移出首页模板；若要保留，改为评论区进入视口后再加载 | 首页首屏不再请求 Loox；评论展示页仍正常 | 重新加入对应 App block |
| Recharge | 首页直接加载 storefront experiences | `Apps`、`App embeds`、相关模板 | 订阅业务负责人 | 不放首页；改为 PDP、Account、Subscription 相关模板加载 | 首页 Network 不再出现 Recharge，PDP / 订阅入口仍正常 | 恢复相关模板或 App embed |
| Captain Shipping Protection | 首页直接加载 | `Apps`、`App blocks` | 电商运营负责人 | 移出首页，保留在购物车/结账前链路 | 首页不再拉起 Captain，购物车保障组件仍显示 | 恢复该 App block |
| Videowise | 首页直接加载 `vendors.js` 与 `client.js` | `Apps`、首页模板 `App blocks` | 内容运营负责人 | 仅在首页真实使用视频 commerce 组件时保留；否则移出首页 | 检查首页是否仍有对应视频模块；无模块时脚本应消失 | 恢复 App block |
| Elevate A/B Testing | 首页直接加载 | `Apps`、`App embeds` | 增长负责人 | 先确认当前是否真的在跑实验；无实验则停用 | 页面无实验时不应再加载其脚本 | 重新启用实验或 App embed |
| Uppromote Referral | 首页直接加载 `customer-referral` | `Apps`、`App embeds` | 渠道/联盟负责人 | 移出首页，改到账户页或 referral 页面加载 | 首页不再请求 referral 脚本；推荐入口仍能打开 | 恢复 block/embed |
| Essential Countdown Timer | 首页存在 block 与脚本 | 首页模板 `App blocks` | 运营负责人 | 先看业务价值；若确实有活动转化价值则保留，否则考虑删除或改成轻量原生实现 | 活动期保留时，倒计时展示正常；非活动期应关闭 | 重新打开 block |
| Rebuy | 动态 URL 池中出现 3 次 | `Apps`、主题代码 | 电商运营负责人 + 开发 | 如果首页未展示推荐模块，必须移出首页；保留在 PDP / Cart | 首页首屏不再出现 Rebuy 请求 | 恢复页面级接入 |
| Seel / Worry-Free Purchase | 动态 URL 池中出现 | `Apps`、购物车模板 | 电商运营负责人 | 仅在购物车和支付前场景启用 | 首页不再请求，Cart 中仍正常 | 恢复 Cart 接入 |
| Spinwheel | 动态 URL 池中出现 | `Apps`、`App embeds` | 增长负责人 | 默认不进首页首屏，只在活动期、特定市场、特定入口启用 | 首页无活动时脚本不加载 | 恢复 campaign 配置 |
| Free Gift / Cart Upsell | 动态 URL 池中出现 | `Apps`、Cart 相关模板 | 电商运营负责人 | 首页移除，仅保留购物车转化链路 | 首页不再请求，Cart upsell 正常 | 恢复 Cart 模板接入 |
| AWIN Affiliate | 动态 URL 池中出现 | `Apps`、`Customer events`、投放方案 | 渠道负责人 | 与 Google / Meta / Bing /其他 affiliate 归因方案一起核对，避免重复归因 | 下单归因链路仍完整，且不重复 | 恢复 affiliate 脚本 |

## 6. 像素专项处理清单

这部分建议单独开一轮，不和业务功能 App 混做。

### 6.1 必查项

- Facebook Pixel App
- Shopify Custom Pixel
- Google Ads Conversion Code
- Bing Tag
- 其他广告或联盟归因 Pixel

### 6.2 要核对的内容

逐项检查：

- `PageView` 是否重复上报
- `ViewContent` 是否重复上报
- `AddToCart` 是否重复上报
- `BeginCheckout` 是否重复上报
- `Purchase` 是否重复上报

### 6.3 判断标准

- 同一平台同一事件只保留一套主链路
- 如果已迁到 `Customer events`，不要再在主题里硬插一份
- 如果 App Pixel 和 Custom Pixel 都存在，必须明确主从关系

## 7. 首页 App block 专项处理清单

建议在首页模板里重点检查这些 block：

- Videowise
- Elevate A/B Testing
- Uppromote Referral
- Countdown Timer
- Loox
- Recharge
- Captain Shipping Protection

判断规则只有一条：

`这个模块如果不在首页可见，就不应该在首页模板里加载。`

## 8. 验收方法

每处理一个项目，都做同一套验收。

### 8.1 功能验收

- 对应业务功能是否仍可正常使用
- 对应页面是否仍正常展示
- 关键转化链路是否正常

### 8.2 性能验收

在 Chrome DevTools 中记录：

- 首页初始请求数是否下降
- 首屏 JS 请求是否下降
- Main thread 执行是否减少
- 第三方域名请求数是否下降

### 8.3 数据验收

- Meta / Google / Bing / GA / Shopify analytics 事件是否仍正常
- 是否出现事件丢失
- 是否出现重复事件

## 9. 建议分工

为了避免误删，建议按下面角色确认：

- 开发：负责定位接入位置、实施关闭、回滚
- 投放：负责广告归因、像素确认
- 运营：负责首页活动、评论、倒计时、推荐模块确认
- CRM / 客服：负责 Omnisend、Zendesk 等工具确认
- 电商负责人：负责 Cart / Recharge / Shipping Protection 确认

## 10. 一次变更不要做太多

建议一次只动 1 到 3 个对象，不要一口气全关。

推荐批次：

### 批次 1：低风险

- Clarity / Plerdy 二选一
- Zendesk 改为交互加载
- Omnisend 改为延迟加载

### 批次 2：首页非必要 App

- Recharge
- Captain Shipping Protection
- Uppromote Referral

### 批次 3：营销与实验

- Elevate A/B Testing
- Spinwheel
- Countdown Timer

### 批次 4：像素去重

- Facebook Pixel
- Google Ads
- Bing
- 其他 Customer Events

## 11. 最终目标

这轮工作的目标不是“删 App”，而是把当前首页从：

- 全站功能入口页
- 多套追踪叠加页
- 第三方脚本集中加载页

收回到：

- 首页只承载首页真正需要的能力
- 非首页能力改成按模板加载
- 非首屏能力改成延迟或交互加载
- 像素与归因统一到清晰、可控、可审计的体系中
