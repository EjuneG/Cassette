/**
 * YesPlayMusic Error Reporter — Cloudflare Worker
 *
 * 客户端 ──带共享密钥──> 这个 Worker ──带 GitHub PAT──> GitHub Issues API
 *
 * ============================================================
 * 部署步骤
 * ============================================================
 * 1. Cloudflare Worker 编辑器里把这一整个文件粘贴进去，点 Deploy
 * 2. 进 Worker → Settings → Variables and Secrets，添加三个变量：
 *      GITHUB_PAT      (Type: Secret)     你刚生成的 fine-grained PAT
 *      GITHUB_REPO     (Type: Text)       EjuneG/YesPlayMusic
 *      SHARED_SECRET   (Type: Secret)     自己随便编一串 32 位以上的随机字符
 * 3. 复制 Worker URL（形如 https://ypm-reporter.xxx.workers.dev）
 * 4. 把 Worker URL + SHARED_SECRET 填到 src/utils/errorReporter.js 顶部
 *
 * GitHub PAT 生成（用 fine-grained 权限最小化）：
 *   GitHub → Settings → Developer settings → Personal access tokens
 *     → Fine-grained tokens → Generate new token
 *   Repository access: Only select repositories → 选 YesPlayMusic
 *   Repository permissions → Issues: Read and write
 *   其它权限全部 No access
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405)
    }

    const secret = request.headers.get('X-YPM-Secret')
    if (!secret || secret !== env.SHARED_SECRET) {
      return json({ error: 'unauthorized' }, 401)
    }

    let payload
    try {
      payload = await request.json()
    } catch {
      return json({ error: 'invalid json' }, 400)
    }

    const { title, body, labels = ['bug', 'auto-reported'] } = payload || {}
    if (!title || !body) {
      return json({ error: 'missing title or body' }, 400)
    }

    const ghResponse = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_PAT}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'YPM-Error-Reporter',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: String(title).slice(0, 200),
          body: String(body).slice(0, 60000),
          labels,
        }),
      }
    )

    const text = await ghResponse.text()
    return new Response(text, {
      status: ghResponse.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    })
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-YPM-Secret',
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}
