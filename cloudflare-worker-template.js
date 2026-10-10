/**
 * =========================================================================
 * CLOUDFLARE WORKER PROXY CHO DISCORD WEBHOOK (HOÀN TOÀN MIỄN PHÍ & BẢO MẬT)
 * =========================================================================
 * 
 * Hướng dẫn cài đặt trong 2 phút:
 * 1. Truy cập: https://dash.cloudflare.com/ (đăng ký/đăng nhập miễn phí)
 * 2. Vào mục "Workers & Pages" -> Nhấn "Create Application" -> "Create Worker"
 * 3. Đặt tên worker (ví dụ: discord-booking-proxy) -> Nhấn "Deploy"
 * 4. Nhấn "Edit code", dán toàn bộ nội dung file này vào và nhấn "Deploy"
 * 5. Vào mục "Settings" của Worker -> "Variables and Secrets":
 *    - Thêm Secret có tên: DISCORD_WEBHOOK_URL
 *    - Value: Dán link Discord Webhook thật của bạn vào đây (Bảo mật 100%, không ai xem được)
 * 6. Copy link Worker (ví dụ: https://discord-booking-proxy.yourname.workers.dev)
 *    và dán vào biến `BOOKING_API_ENDPOINT` trong file source/js/Home.js!
 */

export default {
  async fetch(request, env, ctx) {
    // Cấu hình CORS để cho phép website của bạn gọi tới
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Hoặc điền domain web của bạn ví dụ: 'https://hoangdeptrai1010.github.io'
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Xử lý Preflight Request (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const data = await request.json();
      const { name, contact, activity, date, message } = data;

      if (!name || !contact) {
        return new Response(JSON.stringify({ error: 'Thiếu thông tin bắt buộc' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Lấy webhook URL từ Secret Environment Variable của Cloudflare
      const webhookUrl = env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        return new Response(JSON.stringify({ error: 'Chưa cấu hình DISCORD_WEBHOOK_URL trong Cloudflare Secrets' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Tạo Discord Embed payload
      const discordPayload = {
        username: "Lịch Hẹn Của Bạn",
        avatar_url: "https://raw.githubusercontent.com/hoangdeptrai1010/RANDOM_IDEA_WEB/main/assets/cat/white_idle.png",
        embeds: [{
          title: "💖 Có Lời Hẹn Mới",
          color: 3432616, // Màu xanh (#3464a8)
          fields: [
            { name: "👤 Tên khách", value: String(name).slice(0, 100), inline: true },
            { name: "📞 Liên lạc", value: String(contact).slice(0, 100), inline: true },
            { name: "🙏 Hoạt động", value: String(activity || 'Không rõ').slice(0, 100), inline: true },
            { name: "📅 Ngày hẹn", value: String(date || 'Chưa chọn').slice(0, 100), inline: true },
            { name: "💬 Lời nhắn", value: String(message || '—').slice(0, 1000) }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      // Gửi sang Discord
      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });

      if (!discordRes.ok) {
        return new Response(JSON.stringify({ error: 'Discord webhook error' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Đã gửi lịch hẹn thành công!' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
