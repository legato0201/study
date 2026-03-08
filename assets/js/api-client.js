/**
 * API Client Configuration and Fetch Wrappers
 */

// sptConfig は wp_localize_script を通じてグローバルに注入されています
const { apiUrl, nonce } = window.sptConfig || {};

/**
 * 汎用的なFetchラッパー
 */
async function fetchWrapper(endpoint, options = {}) {
    const url = `${apiUrl}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce,
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        
        // WP REST API は 2xx 以外も返す可能性があるためハンドリング
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}

/**
 * 子供一覧の取得
 */
export async function fetchChildren() {
    return await fetchWrapper('children');
}

/**
 * 子供の新規作成
 */
export async function createChild(data) {
    return await fetchWrapper('children', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 特定の子供のタスク/進捗を取得
 */
export async function fetchProgress(childId) {
    return await fetchWrapper(`progress/${childId}`);
}

/**
 * タスクの新規作成
 */
export async function createProgress(data) {
    return await fetchWrapper('progress', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * タスクの更新
 */
export async function updateProgress(id, data) {
    return await fetchWrapper(`progress/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * タスクの削除
 */
export async function deleteProgress(id) {
    return await fetchWrapper(`progress/${id}`, {
        method: 'DELETE'
    });
}
