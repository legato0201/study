<?php
/**
 * Shortcode & Asset Enqueuing
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
        // SPA起動用のCSS/JSをここでエンキューする
        wp_enqueue_style('spt-app-style', SPT_PLUGIN_URL . 'assets/css/app.css', [], SPT_VERSION);

        // JSはES Moduleとして読み込むフィルタを追加する前提、またはブラウザネイティブサポートを期待。
        // WordPressコアはまだ type="module" を標準サポートしていないため、フィルターで追加する
        add_filter('script_loader_tag', [__CLASS__, 'add_type_module'], 10, 3);
        wp_enqueue_script('spt-app-script', SPT_PLUGIN_URL . 'assets/js/app.js', [], SPT_VERSION, true);

        // REST APIのURLとNonce（セキュリティ用）をJSに渡す
        wp_localize_script('spt-app-script', 'sptConfig', [
            'apiUrl' => esc_url_raw(rest_url('spt/v1/')),
            'nonce' => wp_create_nonce('wp_rest')
        ]);

        // SPAがマウントされる空のコンテナを返す
        return '<div id="spt-app-root"><div class="spt-loading">読み込み中...</div></div>';
    }

    /**
     * 特定のスクリプトに type="module" を追加する
     */
    public static function add_type_module($tag, $handle, $src)
    {
        if ('spt-app-script' !== $handle) {
            return $tag;
        }
        // Change the script tag by adding type="module"
        $tag = '<script type="module" src="' . esc_url($src) . '" id="' . esc_attr($handle) . '-js"></script>';
        return $tag;
    }
}
