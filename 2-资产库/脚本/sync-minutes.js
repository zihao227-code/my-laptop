#!/usr/bin/env node
/**
 * 飞书妙记同步脚本
 * 将飞书妙记的文字内容同步到本地 inbox/ 目录
 *
 * 使用方式：
 *   首次使用：node scripts/sync-minutes.js --login
 *   定时同步：node scripts/sync-minutes.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");
const { exec } = require("child_process");

// ===== 配置 =====
const CONFIG = {
  appId: "cli_aac19cf6bc391bc6",
  appSecret: "LCYdyHp2IohAEQn21byrI0iYaallIQqC",
  baseUrl: "https://open.feishu.cn",
  inboxDir: path.join(__dirname, "..", "inbox"),
  tokenFile: path.join(__dirname, ".feishu_token.json"),
  // 妙记列表页大小
  pageSize: 20,
};

// ===== 工具函数 =====
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function apiRequest(method, urlPath, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.baseUrl + urlPath);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// 获取 Tenant Access Token
async function getTenantToken() {
  const res = await apiRequest("POST", "/open-apis/auth/v3/tenant_access_token/internal", null, {
    app_id: CONFIG.appId,
    app_secret: CONFIG.appSecret,
  });
  if (res.code !== 0) throw new Error(`Tenant token error: ${res.msg}`);
  return res.tenant_access_token;
}

// 获取 User Access Token (通过刷新令牌)
function getStoredToken() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG.tokenFile, "utf-8"));
  } catch {
    return null;
  }
}

function saveToken(tokenData) {
  fs.writeFileSync(CONFIG.tokenFile, JSON.stringify(tokenData, null, 2));
}

// OAuth PKCE 登录
async function login() {
  // Step 1: 获取 tenant token
  const tenantToken = await getTenantToken();
  console.log("✅ Tenant token obtained");

  // Step 2: 使用 lark-mcp login 进行 OAuth
  console.log("🔐 Starting OAuth login...");
  console.log("   浏览器将打开授权页面，请授权后回来\n");

  return new Promise((resolve) => {
    const child = exec(
      `lark-mcp login --app-id "${CONFIG.appId}" --app-secret "${CONFIG.appSecret}"`,
      { env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" } },
      (err, stdout) => {
        if (err && !stdout.includes("Successfully logged in")) {
          console.error("Login error:", err.message);
          resolve(false);
          return;
        }
        console.log("✅ OAuth login successful");
        resolve(true);
      }
    );

    // 打开授权页面
    setTimeout(() => {
      exec('start "http://localhost:3000/authorize?client_id=client_id_for_local_auth&response_type=code&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&state=reauthorize"');
    }, 2000);
  });
}

// 列出妙记
async function listMinutes(userToken, pageToken) {
  const params = [`page_size=${CONFIG.pageSize}`];
  if (pageToken) params.push(`page_token=${pageToken}`);

  const res = await apiRequest(
    "GET",
    `/open-apis/minutes/v1/minutes?${params.join("&")}`,
    userToken
  );

  if (res.code !== 0) {
    throw new Error(`List minutes error: ${res.msg}`);
  }
  return res.data;
}

// 获取妙记详情（包含逐字稿）
async function getMinuteDetail(userToken, minuteToken) {
  const res = await apiRequest(
    "GET",
    `/open-apis/minutes/v1/minutes/${minuteToken}`,
    userToken
  );

  if (res.code !== 0) {
    throw new Error(`Get minute error: ${res.msg}`);
  }
  return res.data;
}

// 获取妙记转录文本
async function getTranscript(userToken, minuteToken, options = {}) {
  const params = new URLSearchParams({
    need_speaker_info: options.needSpeaker || false,
    need_timestamp: options.needTimestamp || false,
    file_format: "txt",
  });

  const res = await apiRequest(
    "GET",
    `/open-apis/minutes/v1/minutes/${minuteToken}/transcript?${params}`,
    userToken
  );

  if (res.code !== 0) {
    throw new Error(`Transcript error: ${res.msg}`);
  }
  return res.data;
}

// 获取妙记基础信息（包括AI总结、章节等）
async function getMinuteBasicInfo(userToken, minuteToken) {
  const res = await apiRequest(
    "GET",
    `/open-apis/minutes/v1/minutes/${minuteToken}/basic_info`,
    userToken
  );

  if (res.code !== 0) {
    throw new Error(`Basic info error: ${res.msg}`);
  }
  return res.data;
}

// 格式化妙记为 Markdown
function formatMinutesToMarkdown(detail, transcript, basicInfo) {
  const lines = [];

  lines.push(`# ${detail.title || "未命名妙记"}`);
  lines.push("");
  lines.push(`- 日期: ${detail.create_time ? new Date(detail.create_time).toISOString().split("T")[0] : "未知"}`);
  lines.push(`- 时长: ${Math.floor((detail.duration || 0) / 60)} 分钟`);
  lines.push(`- 参会人数: ${detail.participant_count || 0}`);
  lines.push("");

  if (basicInfo && basicInfo.chapters && basicInfo.chapters.length > 0) {
    lines.push("## 会议章节");
    lines.push("");
    basicInfo.chapters.forEach((ch) => {
      lines.push(`- ${ch.title}`);
    });
    lines.push("");
  }

  if (basicInfo && basicInfo.summary) {
    lines.push("## AI 总结");
    lines.push("");
    lines.push(basicInfo.summary);
    lines.push("");
  }

  if (basicInfo && basicInfo.todos && basicInfo.todos.length > 0) {
    lines.push("## 待办事项");
    lines.push("");
    basicInfo.todos.forEach((todo) => {
      lines.push(`- [ ] ${todo.content} (@${todo.assignee_name || "待指派"})`);
    });
    lines.push("");
  }

  if (transcript) {
    lines.push("## 逐字稿");
    lines.push("");
    lines.push("```");
    lines.push(transcript);
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

// ===== 主流程 =====
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--login") || args.includes("-l")) {
    await login();
    console.log("\n✅ 登录完成！现在可以运行同步：");
    console.log("   node scripts/sync-minutes.js");
    return;
  }

  // 获取用户令牌
  const stored = getStoredToken();
  let userToken = stored?.user_access_token;

  if (!userToken) {
    console.log("❌ 未找到登录信息，请先运行：");
    console.log("   node scripts/sync-minutes.js --login");
    return;
  }

  // 检查令牌是否过期
  if (stored.expires_at && Date.now() > stored.expires_at * 1000) {
    // 尝试刷新令牌
    if (stored.refresh_token) {
      const refreshRes = await apiRequest(
        "POST",
        "/open-apis/authen/v1/refresh_access_token",
        null,
        { refresh_token: stored.refresh_token, grant_type: "refresh_token" }
      );
      if (refreshRes.code === 0) {
        userToken = refreshRes.data.access_token;
        saveToken({
          user_access_token: userToken,
          refresh_token: refreshRes.data.refresh_token,
          expires_at: Math.floor(Date.now() / 1000) + refreshRes.data.expires_in,
        });
        console.log("🔄 Token refreshed");
      }
    }
  }

  try {
    // 确保目录存在
    if (!fs.existsSync(CONFIG.inboxDir)) {
      fs.mkdirSync(CONFIG.inboxDir, { recursive: true });
    }

    console.log("📋 获取妙记列表...");
    const listData = await listMinutes(userToken);
    const minutes = listData.minutes || [];

    if (minutes.length === 0) {
      console.log("📭 没有找到妙记");
      return;
    }

    console.log(`📄 找到 ${minutes.length} 个妙记\n`);

    // 获取已同步的文件列表
    const syncedFiles = new Set(
      fs.existsSync(CONFIG.inboxDir)
        ? fs.readdirSync(CONFIG.inboxDir).filter((f) => f.endsWith(".md"))
        : []
    );

    let syncedCount = 0;
    for (const minute of minutes) {
      const fileName = `${minute.create_time}_${minute.title || minute.minute_token}.md`
        .replace(/[/\\?%*:|"<>]/g, "-");

      if (syncedFiles.has(fileName)) {
        continue; // 已同步
      }

      console.log(`  ⬇ ${minute.title || minute.minute_token}`);

      try {
        // 获取详情
        const detail = await getMinuteDetail(userToken, minute.minute_token);

        // 获取基础信息（AI总结等）
        let basicInfo = null;
        try {
          basicInfo = await getMinuteBasicInfo(userToken, minute.minute_token);
        } catch (e) {
          // basic_info 可能不可用
        }

        // 获取逐字稿
        let transcript = null;
        try {
          const transcriptData = await getTranscript(userToken, minute.minute_token, {
            needSpeaker: false,
            needTimestamp: false,
          });
          transcript = transcriptData?.transcript || null;
        } catch (e) {
          // 转录可能还在处理中
        }

        const markdown = formatMinutesToMarkdown(detail, transcript, basicInfo);

        const filePath = path.join(CONFIG.inboxDir, fileName);
        fs.writeFileSync(filePath, markdown, "utf-8");
        syncedCount++;
      } catch (e) {
        console.log(`    ⚠ Error: ${e.message}`);
      }
    }

    console.log(`\n✅ 同步完成！新增 ${syncedCount} 个妙记 → inbox/`);
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
  }
}

main();
