// database.js - IndexedDB 数据存储层
// 基于 Dexie.js 封装，提供类型安全的数据库操作

class CareerAssistantDB {
    constructor() {
        this.dbName = 'CareerAssistant';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 表1: profiles（个人档案）
                if (!db.objectStoreNames.contains('profiles')) {
                    const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
                    profileStore.createIndex('profile_url', 'profile_url', { unique: true });
                    profileStore.createIndex('scraped_at', 'scraped_at');
                    profileStore.createIndex('accessed_at', 'accessed_at');
                }
                
                // 表2: companies（公司档案）
                if (!db.objectStoreNames.contains('companies')) {
                    const companyStore = db.createObjectStore('companies', { keyPath: 'id' });
                    companyStore.createIndex('company_name', 'company_name');
                    companyStore.createIndex('website_url', 'website_url');
                    companyStore.createIndex('scraped_at', 'scraped_at');
                }
                
                // 表3: user_settings（用户配置）
                if (!db.objectStoreNames.contains('user_settings')) {
                    const settingsStore = db.createObjectStore('user_settings', { keyPath: 'key' });
                    settingsStore.createIndex('updated_at', 'updated_at');
                }
                
                // 表4: cost_tracking（成本追踪）
                if (!db.objectStoreNames.contains('cost_tracking')) {
                    const costStore = db.createObjectStore('cost_tracking', { keyPath: 'id', autoIncrement: true });
                    costStore.createIndex('timestamp', 'timestamp');
                    costStore.createIndex('task_type', 'task_type');
                }
                
                // 表5: workflows（自定义工作流）
                if (!db.objectStoreNames.contains('workflows')) {
                    const workflowStore = db.createObjectStore('workflows', { keyPath: 'id' });
                    workflowStore.createIndex('name', 'name');
                    workflowStore.createIndex('created_at', 'created_at');
                }
            };
        });
    }

    // 生成URL的hash作为ID
    generateId(url) {
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString();
    }

    // 检查数据是否过期
    isExpired(item) {
        if (!item.ttl) return false;
        return Date.now() > item.ttl;
    }

    // Profile 操作
    async saveProfile(profileData) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        
        const profile = {
            id: this.generateId(profileData.profile_url),
            profile_url: profileData.profile_url,
            raw_data: profileData.raw_data,
            analyzed_data: profileData.analyzed_data,
            scraped_at: Date.now(),
            accessed_at: Date.now(),
            ttl: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(profile);
            request.onsuccess = () => resolve(profile);
            request.onerror = () => reject(request.error);
        });
    }

    async getProfile(profileUrl) {
        const transaction = this.db.transaction(['profiles'], 'readonly');
        const store = transaction.objectStore('profiles');
        const id = this.generateId(profileUrl);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                const result = request.result;
                if (result && !this.isExpired(result)) {
                    // 更新访问时间
                    this.updateProfileAccessTime(id);
                    resolve(result);
                } else {
                    // 过期或不存在
                    if (result) this.deleteProfile(profileUrl);
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateProfileAccessTime(id) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const profile = getRequest.result;
            if (profile) {
                profile.accessed_at = Date.now();
                store.put(profile);
            }
        };
    }

    async deleteProfile(profileUrl) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        const id = this.generateId(profileUrl);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Company 操作
    async saveCompany(companyData) {
        const transaction = this.db.transaction(['companies'], 'readwrite');
        const store = transaction.objectStore('companies');
        
        const company = {
            id: this.generateId(companyData.website_url || companyData.company_name),
            company_name: companyData.company_name,
            website_url: companyData.website_url,
            raw_data: companyData.raw_data,
            analyzed_data: companyData.analyzed_data,
            scraped_at: Date.now(),
            ttl: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天过期
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(company);
            request.onsuccess = () => resolve(company);
            request.onerror = () => reject(request.error);
        });
    }

    async getCompany(identifier) {
        const transaction = this.db.transaction(['companies'], 'readonly');
        const store = transaction.objectStore('companies');
        const id = this.generateId(identifier);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => {
                const result = request.result;
                if (result && !this.isExpired(result)) {
                    resolve(result);
                } else {
                    if (result) this.deleteCompany(identifier);
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCompany(identifier) {
        const transaction = this.db.transaction(['companies'], 'readwrite');
        const store = transaction.objectStore('companies');
        const id = this.generateId(identifier);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Settings 操作
    async saveSetting(key, value) {
        const transaction = this.db.transaction(['user_settings'], 'readwrite');
        const store = transaction.objectStore('user_settings');
        
        const setting = {
            key: key,
            value: value,
            updated_at: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(setting);
            request.onsuccess = () => resolve(setting);
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key, defaultValue = null) {
        const transaction = this.db.transaction(['user_settings'], 'readonly');
        const store = transaction.objectStore('user_settings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Cost Tracking 操作
    async addCostRecord(taskType, tokensUsed, costUsd) {
        const transaction = this.db.transaction(['cost_tracking'], 'readwrite');
        const store = transaction.objectStore('cost_tracking');
        
        const record = {
            timestamp: Date.now(),
            task_type: taskType,
            tokens_used: tokensUsed,
            cost_usd: costUsd
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    }

    async getCostSummary(days = 30) {
        const transaction = this.db.transaction(['cost_tracking'], 'readonly');
        const store = transaction.objectStore('cost_tracking');
        const index = store.index('timestamp');
        
        const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const range = IDBKeyRange.lowerBound(startTime);
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(range);
            request.onsuccess = () => {
                const records = request.result;
                const summary = {
                    total_cost: 0,
                    total_tokens: 0,
                    task_breakdown: {},
                    daily_costs: {}
                };
                
                records.forEach(record => {
                    summary.total_cost += record.cost_usd;
                    summary.total_tokens += record.tokens_used;
                    
                    // 按任务类型统计
                    if (!summary.task_breakdown[record.task_type]) {
                        summary.task_breakdown[record.task_type] = {
                            cost: 0,
                            tokens: 0,
                            count: 0
                        };
                    }
                    summary.task_breakdown[record.task_type].cost += record.cost_usd;
                    summary.task_breakdown[record.task_type].tokens += record.tokens_used;
                    summary.task_breakdown[record.task_type].count += 1;
                    
                    // 按日期统计
                    const date = new Date(record.timestamp).toDateString();
                    if (!summary.daily_costs[date]) {
                        summary.daily_costs[date] = 0;
                    }
                    summary.daily_costs[date] += record.cost_usd;
                });
                
                resolve(summary);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Workflow 操作
    async saveWorkflow(name, dagJson) {
        const transaction = this.db.transaction(['workflows'], 'readwrite');
        const store = transaction.objectStore('workflows');
        
        const workflow = {
            id: this.generateId(name + Date.now()),
            name: name,
            dag_json: dagJson,
            created_at: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.put(workflow);
            request.onsuccess = () => resolve(workflow);
            request.onerror = () => reject(request.error);
        });
    }

    async getWorkflows() {
        const transaction = this.db.transaction(['workflows'], 'readonly');
        const store = transaction.objectStore('workflows');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 清理过期数据
    async cleanupExpiredData() {
        const now = Date.now();
        
        // 清理过期的profiles
        const profileTransaction = this.db.transaction(['profiles'], 'readwrite');
        const profileStore = profileTransaction.objectStore('profiles');
        const profileRequest = profileStore.getAll();
        
        profileRequest.onsuccess = () => {
            const profiles = profileRequest.result;
            profiles.forEach(profile => {
                if (this.isExpired(profile)) {
                    profileStore.delete(profile.id);
                }
            });
        };
        
        // 清理过期的companies
        const companyTransaction = this.db.transaction(['companies'], 'readwrite');
        const companyStore = companyTransaction.objectStore('companies');
        const companyRequest = companyStore.getAll();
        
        companyRequest.onsuccess = () => {
            const companies = companyRequest.result;
            companies.forEach(company => {
                if (this.isExpired(company)) {
                    companyStore.delete(company.id);
                }
            });
        };
    }

    // 清空所有数据
    async clearAllData() {
        const stores = ['profiles', 'companies', 'user_settings', 'cost_tracking', 'workflows'];
        const transaction = this.db.transaction(stores, 'readwrite');
        
        const promises = stores.map(storeName => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
        
        return Promise.all(promises);
    }

    // 导出数据
    async exportData() {
        const stores = ['profiles', 'companies', 'user_settings', 'cost_tracking', 'workflows'];
        const transaction = this.db.transaction(stores, 'readonly');
        const exportData = {};
        
        const promises = stores.map(storeName => {
            return new Promise((resolve, reject) => {
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => {
                    exportData[storeName] = request.result;
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        });
        
        await Promise.all(promises);
        return exportData;
    }
}

// 单例模式
let dbInstance = null;

export async function getDatabase() {
    if (!dbInstance) {
        dbInstance = new CareerAssistantDB();
        await dbInstance.init();
    }
    return dbInstance;
}

// 导出常用操作的快捷方法
export const db = {
    async saveProfile(profileData) {
        const database = await getDatabase();
        return database.saveProfile(profileData);
    },
    
    async getProfile(profileUrl) {
        const database = await getDatabase();
        return database.getProfile(profileUrl);
    },
    
    async saveCompany(companyData) {
        const database = await getDatabase();
        return database.saveCompany(companyData);
    },
    
    async getCompany(identifier) {
        const database = await getDatabase();
        return database.getCompany(identifier);
    },
    
    async saveSetting(key, value) {
        const database = await getDatabase();
        return database.saveSetting(key, value);
    },
    
    async getSetting(key, defaultValue = null) {
        const database = await getDatabase();
        return database.getSetting(key, defaultValue);
    },
    
    async addCostRecord(taskType, tokensUsed, costUsd) {
        const database = await getDatabase();
        return database.addCostRecord(taskType, tokensUsed, costUsd);
    },
    
    async getCostSummary(days = 30) {
        const database = await getDatabase();
        return database.getCostSummary(days);
    },
    
    async cleanupExpiredData() {
        const database = await getDatabase();
        return database.cleanupExpiredData();
    },
    
    async clearAllData() {
        const database = await getDatabase();
        return database.clearAllData();
    },
    
    async exportData() {
        const database = await getDatabase();
        return database.exportData();
    }
};
