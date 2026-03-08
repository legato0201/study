<?php
/**
 * DB Table Creation & Management
 */

if (!defined('ABSPATH')) {
    exit;
}

class SPT_DB
{

    /**
     * プラグイン有効化時に呼ばれるテーブル作成処理
     */
    public static function activate()
    {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        $table_children = $wpdb->prefix . 'spt_children';
        $table_progress = $wpdb->prefix . 'spt_progress';

        $sql_children = "CREATE TABLE $table_children (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            goal varchar(255) DEFAULT '' NOT NULL,
            grade varchar(50) DEFAULT '' NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        $sql_progress = "CREATE TABLE $table_progress (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            child_id bigint(20) unsigned NOT NULL,
            subject varchar(100) NOT NULL,
            milestone text NOT NULL,
            status varchar(50) DEFAULT 'todo' NOT NULL,
            estimated_time int(11) DEFAULT 0 NOT NULL,
            actual_time int(11) DEFAULT 0 NOT NULL,
            resource_url text NOT NULL, /* ←追加: 教材URL用カラム */
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id),
            KEY child_id (child_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_children);
        dbDelta($sql_progress);
    }

    /**
     * 子供一覧の取得
     */
    public static function get_children()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'spt_children';
        return $wpdb->get_results("SELECT * FROM $table ORDER BY id ASC", ARRAY_A);
    }

    /**
     * 子供の追加
     */
    public static function add_child($data)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'spt_children';
        $inserted = $wpdb->insert(
            $table,
            [
                'name' => $data['name'],
                'goal' => isset($data['goal']) ? $data['goal'] : '',
                'grade' => isset($data['grade']) ? $data['grade'] : '',
            ],
            ['%s', '%s', '%s']
        );

        if ($inserted) {
            return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $wpdb->insert_id), ARRAY_A);
        }
        return false;
    }

    /**
     * 進捗(タスク)一覧の取得
     */
    public static function get_progress($child_id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'spt_progress';
        return $wpdb->get_results($wpdb->prepare("SELECT * FROM $table WHERE child_id = %d ORDER BY id ASC", $child_id), ARRAY_A);
    }

    /**
     * 進捗(タスク)の追加
     */
    public static function add_progress($data)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'spt_progress';
        $inserted = $wpdb->insert(
            $table,
            [
                'child_id' => $data['child_id'],
                'subject' => $data['subject'],
                'milestone' => $data['milestone'],
                'status' => isset($data['status']) ? $data['status'] : 'todo',
                'estimated_time' => isset($data['estimated_time']) ? intval($data['estimated_time']) : 0,
                'actual_time' => isset($data['actual_time']) ? intval($data['actual_time']) : 0,
                'resource_url' => isset($data['resource_url']) ? sanitize_url($data['resource_url']) : '', /* ←追加 */
            ],
            ['%d', '%s', '%s', '%s', '%d', '%d', '%s'] /* ←追加: 末尾に '%s' を足す */
        );

        if ($inserted) {
            return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $wpdb->insert_id), ARRAY_A);
        }
        return false;
    }

    /**
     * 進捗(タスク)の更新
     */
    public static function update_progress($id, $data)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'spt_progress';

        $update_data = [];
        $format = [];

        if (isset($data['subject'])) {
            $update_data['subject'] = $data['subject'];
            $format[] = '%s';
        }
        if (isset($data['milestone'])) {
            $update_data['milestone'] = $data['milestone'];
            $format[] = '%s';
        }
        if (isset($data['status'])) {
            $update_data['status'] = $data['status'];
            $format[] = '%s';
        }
        if (isset($data['estimated_time'])) {
            $update_data['estimated_time'] = intval($data['estimated_time']);
            $format[] = '%d';
        }
        if (isset($data['actual_time'])) {
            $update_data['actual_time'] = intval($data['actual_time']);
            $format[] = '%d';
        }
        // ▼▼ ここから追加 ▼▼
        if (isset($data['resource_url'])) {
            $update_data['resource_url'] = sanitize_url($data['resource_url']);
            $format[] = '%s';
        }
        // ▲▲ ここまで追加 ▲▲

        if (empty($update_data))
            return false;

        $updated = $wpdb->update(
            $table,
            $update_data,
            ['id' => $id],
            $format,
            ['%d']
        );

        if ($updated !== false) {
            return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id), ARRAY_A);
        }
        return false;
    }

    /**
     * 進捗(タスク)の削除
     */
    public static function delete_progress($id)
    {
        global $wpdb;
        $table = $wpdb->prefix . 'spt_progress';
        return $wpdb->delete($table, ['id' => $id], ['%d']);
    }
}
