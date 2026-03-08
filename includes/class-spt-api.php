<?php
/**
 * REST API Endpoints Definition
 */

if (!defined('ABSPATH')) {
    exit;
}

class SPT_API
{

    /**
     * API実行権限のチェック（新規追加）
     */
    public static function check_permission()
    {
        // ログインしているユーザーのみ許可する
        return is_user_logged_in();
    }

    public static function register_routes()
    {
        $namespace = 'spt/v1';

        // 子供関連のエンドポイント
        register_rest_route($namespace, '/children', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [__CLASS__, 'get_children'],
                'permission_callback' => [__CLASS__, 'check_permission'], // 今回は公開ページ前提としてtrue。必要に応じ権限チェック
            ],
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [__CLASS__, 'add_child'],
                'permission_callback' => [__CLASS__, 'check_permission'],
            ]
        ]);

        // 進捗(タスク)関連のエンドポイント (GET時はchild_idを指定)
        register_rest_route($namespace, '/progress/child/(?P<child_id>\d+)', [
            [
                'methods' => WP_REST_Server::READABLE,
                'callback' => [__CLASS__, 'get_progress'],
                'permission_callback' => [__CLASS__, 'check_permission'],
            ],
        ]);

        // 新規タスク作成
        register_rest_route($namespace, '/progress', [
            [
                'methods' => WP_REST_Server::CREATABLE,
                'callback' => [__CLASS__, 'add_progress'],
                'permission_callback' => [__CLASS__, 'check_permission'],
            ]
        ]);

        // タスク更新・削除
        register_rest_route($namespace, '/progress/(?P<id>\d+)', [
            [
                'methods' => WP_REST_Server::EDITABLE,
                'callback' => [__CLASS__, 'update_progress'],
                'permission_callback' => [__CLASS__, 'check_permission'],
            ],
            [
                'methods' => WP_REST_Server::DELETABLE,
                'callback' => [__CLASS__, 'delete_progress'],
                'permission_callback' => [__CLASS__, 'check_permission'],
            ],
        ]);
    }

    /**
     * 子供一覧取得コールバック
     */
    public static function get_children($request)
    {
        $children = SPT_DB::get_children();
        return rest_ensure_response($children);
    }

    /**
     * 子供追加コールバック
     */
    public static function add_child($request)
    {
        $params = $request->get_json_params();
        if (empty($params['name'])) {
            return new WP_Error('missing_name', 'Name is required', ['status' => 400]);
        }

        $child = SPT_DB::add_child($params);
        if (!$child) {
            return new WP_Error('db_error', 'Failed to insert data', ['status' => 500]);
        }

        return rest_ensure_response($child);
    }

    /**
     * 進捗取得コールバック
     */
    public static function get_progress($request)
    {
        $child_id = $request->get_param('child_id');
        $progress = SPT_DB::get_progress($child_id);
        return rest_ensure_response($progress);
    }

    /**
     * 進捗追加コールバック
     */
    public static function add_progress($request)
    {
        $params = $request->get_json_params();
        if (empty($params['child_id']) || empty($params['subject']) || empty($params['milestone'])) {
            return new WP_Error('missing_fields', 'Child ID, Subject, and Milestone are required', ['status' => 400]);
        }

        $progress = SPT_DB::add_progress($params);
        if (!$progress) {
            return new WP_Error('db_error', 'Failed to insert progress', ['status' => 500]);
        }

        return rest_ensure_response($progress);
    }

    /**
     * 進捗更新コールバック
     */
    public static function update_progress($request)
    {
        $id = $request->get_param('id');
        $params = $request->get_json_params();

        $progress = SPT_DB::update_progress($id, $params);
        if (!$progress) {
            return new WP_Error('db_error', 'Failed to update progress', ['status' => 500]);
        }

        return rest_ensure_response($progress);
    }

    /**
     * 進捗削除コールバック
     */
    public static function delete_progress($request)
    {
        $id = $request->get_param('id');
        $deleted = SPT_DB::delete_progress($id);

        if ($deleted === false) {
            return new WP_Error('db_error', 'Failed to delete progress', ['status' => 500]);
        }

        return rest_ensure_response(['deleted' => true, 'id' => $id]);
    }
}
