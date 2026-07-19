const axios = require('axios');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Gunakan POST.' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL TikTok tidak boleh kosong!' });
    }

    try {
        // Form data parameters required by TikWM API
        const params = new URLSearchParams();
        params.append('url', url);
        params.append('hd', '1');

        const response = await axios.post('https://www.tikwm.com/api/', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const resData = response.data;

        if (resData.code !== 0 || !resData.data) {
            return res.status(400).json({
                error: "Gagal mengambil data. Pastikan URL valid, akun tidak privat, dan coba lagi."
            });
        }

        const data = resData.data;

        // Structure metadata neatly
        const result = {
            uploader: {
                username: data.author.unique_id,
                nama: data.author.nickname,
                avatar: data.author.avatar
            },
            deskripsi: data.title || "Tidak ada deskripsi.",
            thumbnail: data.cover,
            statistik: {
                like: data.digg_count || 0,
                komentar: data.comment_count || 0,
                share: data.share_count || 0,
                play: data.play_count || 0
            },
            media: {
                video_regular: data.play || null,
                video_hd: data.hdplay || null,
                sound_url: data.music || null,
                foto_urls: data.images || null
            }
        };

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ error: `Server Error: ${error.message}` });
    }
};
