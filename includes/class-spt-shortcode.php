<?php
/**
 * Shortcode & Asset Enqueuing (Bulletproof Version)
 */

if (!defined('ABSPATH')) {
    exit;
}

class SPT_Shortcode
{
    public static function init()
    {
        add_shortcode('study_tracker', [__CLASS__, 'render_app_root']);
    }

    public static function render_app_root()
    {
        // キャッシュを強制的に無効化するためのタイムスタンプ
        $cache_buster = time();

        $css_url = esc_url(SPT_PLUGIN_URL . 'assets/css/app.css?v=' . SPT_VERSION);
        $js_url = esc_url(SPT_PLUGIN_URL . 'assets/js/app.js?v=' . $cache_buster);
        $api_url = esc_url_raw(rest_url('spt/v1/'));
        $nonce = wp_create_nonce('wp_rest');

        // テーマの仕様（wp_footer等）に依存せず、確実にその場でスクリプトをマウントする
        ob_start();
        ?>
        <link rel="stylesheet" href="<?php echo $css_url; ?>">

        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>     window.sptConfig = {         apiUrl: "<?php echo $api_url; ?>",         nonce: "<?php echo $nonce; ?>"     };     console.log("SPT: Config loaded.");
        </script>

        <script type="module" src="<?php echo $js_url; ?>"></script>

        <div id="spt-app-root">
            <div class="spt-loading">
                読み込み中...<br>
                <small style="font-size:0.8em; color:#999;">※アプリを起動しています</small>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
