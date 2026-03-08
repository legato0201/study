<?php
/**
 * Plugin Name: Study Progress Tracker
 * Description: 複数児童の学習マイルストーンを管理するSPA型プラグイン
 * Version: 1.0.0
 * Author: Professional Developer
 * Text Domain: study-progress-tracker
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'SPT_VERSION', '1.0.0' );
define( 'SPT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SPT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// モジュールの読み込み
require_once SPT_PLUGIN_DIR . 'includes/class-spt-db.php';
require_once SPT_PLUGIN_DIR . 'includes/class-spt-api.php';
require_once SPT_PLUGIN_DIR . 'includes/class-spt-shortcode.php';

// プラグイン有効化時のDB構築
register_activation_hook( __FILE__, [ 'SPT_DB', 'activate' ] );

// 初期化フック
add_action( 'rest_api_init', [ 'SPT_API', 'register_routes' ] );
add_action( 'init', [ 'SPT_Shortcode', 'init' ] );
